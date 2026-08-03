#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = [
#   "huggingface-hub==1.26.0",
#   "mlx==0.32.0",
#   "mlx-audio==0.4.7",
#   "numpy==2.3.5",
#   "soundfile==0.14.0",
# ]
# ///
"""Generate an authorized, reproducible local Qwen3-TTS voice clone on Apple Silicon."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import platform
import subprocess
import time
from importlib.metadata import version
from pathlib import Path

import mlx.core as mx
import numpy as np
import soundfile as sf
from huggingface_hub import snapshot_download
from mlx_audio.tts.utils import load_model


DEFAULT_MODEL = "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16"
DEFAULT_REVISION = "1eccf1cb2519b5a4e8a95b5f0544f3303568164f"
DEFAULT_SEED = 42


def text_value(literal: str | None, file_path: Path | None) -> str:
    if literal is not None:
        value = literal.strip()
    elif file_path is not None:
        value = file_path.read_text(encoding="utf-8").strip()
    else:
        raise ValueError("text input is required")
    if not value:
        raise ValueError("text input cannot be empty")
    return value


def audio_metrics(audio: np.ndarray, sample_rate: int) -> dict[str, float | int]:
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    rms = float(np.sqrt(np.mean(np.square(audio)))) if audio.size else 0.0
    return {
        "sampleRate": sample_rate,
        "samples": int(audio.size),
        "durationSeconds": round(audio.size / sample_rate, 6),
        "peakLinear": round(peak, 6),
        "rmsLinear": round(rms, 6),
        "rmsDbfs": round(20 * math.log10(max(rms, 1e-12)), 3),
    }


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def repository_root() -> Path | None:
    for candidate in Path(__file__).resolve().parents:
        if (candidate / ".git").exists():
            return candidate
    return None


def normalize_audio(
    source: Path,
    output: Path,
    target_lufs: float,
    sample_rate: int,
) -> None:
    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(source),
        "-af",
        f"loudnorm=I={target_lufs}:TP=-1.5:LRA=11",
        "-ac",
        "1",
        "-ar",
        str(sample_rate),
        "-c:a",
        "pcm_s16le",
        str(output),
    ]
    subprocess.run(command, check=True)


def require_ignored_media_path(output: Path) -> None:
    repo_root = repository_root()
    if repo_root is None:
        return
    try:
        relative_output = output.resolve().relative_to(repo_root)
    except ValueError:
        return
    ignored = subprocess.run(
        ["git", "check-ignore", "--quiet", str(relative_output)],
        cwd=repo_root,
        check=False,
    )
    if ignored.returncode != 0:
        raise SystemExit(
            "Voice output inside this repository must be covered by .gitignore; "
            "use an ignored renders directory or a path outside the repository."
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Clone only a voice you own or are explicitly authorized to use. "
            "The accepted project preset pins Qwen3-TTS, MLX-Audio and seed 42."
        )
    )
    parser.add_argument("--reference", type=Path, required=True)

    reference_group = parser.add_mutually_exclusive_group(required=True)
    reference_group.add_argument("--reference-text")
    reference_group.add_argument("--reference-text-file", type=Path)

    target_group = parser.add_mutually_exclusive_group(required=True)
    target_group.add_argument("--text")
    target_group.add_argument("--text-file", type=Path)

    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--metrics", type=Path)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--revision", default=DEFAULT_REVISION)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--language", default="Chinese")
    parser.add_argument("--target-lufs", type=float, default=-16.0)
    parser.add_argument("--output-sample-rate", type=int, default=48000)
    parser.add_argument("--no-normalize", action="store_true")
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument(
        "--confirm-authorized-reference",
        action="store_true",
        help="required confirmation that the face/voice owner authorized this use",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.confirm_authorized_reference:
        raise SystemExit(
            "Refusing to clone: pass --confirm-authorized-reference only after authorization is recorded."
        )
    if not args.reference.is_file():
        raise SystemExit(f"Reference audio not found: {args.reference}")
    if args.output.suffix.lower() != ".wav":
        raise SystemExit("Output must use the .wav extension")
    if args.output_sample_rate < 8000:
        raise SystemExit("--output-sample-rate must be at least 8000 Hz")
    require_ignored_media_path(args.output)
    if args.output.exists() and not args.overwrite:
        raise SystemExit(f"Output exists; pass --overwrite to replace it: {args.output}")
    if args.model != DEFAULT_MODEL or args.revision != DEFAULT_REVISION:
        raise SystemExit(
            "The requested model/revision is outside the approved preset. Update its governance card first."
        )

    reference_text = text_value(args.reference_text, args.reference_text_file)
    target_text = text_value(args.text, args.text_file)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.metrics:
        args.metrics.parent.mkdir(parents=True, exist_ok=True)

    resolve_started = time.perf_counter()
    model_path = Path(
        snapshot_download(
            repo_id=args.model,
            revision=args.revision,
            local_files_only=args.offline,
            ignore_patterns=["README.md", ".gitattributes"],
        )
    )
    resolve_seconds = time.perf_counter() - resolve_started

    load_started = time.perf_counter()
    model = load_model(model_path)
    load_seconds = time.perf_counter() - load_started
    sample_rate = int(model.sample_rate)

    mx.random.seed(args.seed)
    generation_started = time.perf_counter()
    results = list(
        model.generate(
            text=target_text,
            ref_audio=str(args.reference),
            ref_text=reference_text,
            lang_code=args.language,
            temperature=0.9,
            top_k=50,
            top_p=1.0,
            repetition_penalty=1.5,
            verbose=False,
        )
    )
    generation_seconds = time.perf_counter() - generation_started
    if not results:
        raise RuntimeError("Qwen3-TTS returned no audio")

    parts = [np.asarray(result.audio, dtype=np.float32).reshape(-1) for result in results]
    generated_audio = np.concatenate(parts)
    raw_output = args.output if args.no_normalize else args.output.with_name(
        f".{args.output.stem}.raw.wav"
    )
    sf.write(raw_output, generated_audio, sample_rate, subtype="PCM_16")

    if not args.no_normalize:
        try:
            normalize_audio(
                raw_output,
                args.output,
                args.target_lufs,
                args.output_sample_rate,
            )
        finally:
            raw_output.unlink(missing_ok=True)

    final_audio, final_sample_rate = sf.read(args.output, dtype="float32")
    final_audio = np.asarray(final_audio, dtype=np.float32).reshape(-1)
    metrics = audio_metrics(final_audio, int(final_sample_rate))
    metrics.update(
        {
            "schemaVersion": 1,
            "status": "generated-requires-asr-and-human-listening-qa",
            "model": args.model,
            "revision": args.revision,
            "runtime": f"mlx-audio {version('mlx-audio')}",
            "seed": args.seed,
            "language": args.language,
            "modelResolveWallSeconds": round(resolve_seconds, 3),
            "modelLoadWallSeconds": round(load_seconds, 3),
            "generationWallSeconds": round(generation_seconds, 3),
            "realTimeFactor": round(generation_seconds / metrics["durationSeconds"], 3),
            "normalizedTargetLufs": None if args.no_normalize else args.target_lufs,
            "referenceFile": args.reference.name,
            "outputFile": args.output.name,
            "outputSha256": sha256(args.output),
            "referenceText": reference_text,
            "targetText": target_text,
            "machine": {
                "platform": platform.system(),
                "machine": platform.machine(),
                "processor": platform.processor(),
            },
        }
    )

    if args.metrics:
        args.metrics.write_text(
            json.dumps(metrics, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
