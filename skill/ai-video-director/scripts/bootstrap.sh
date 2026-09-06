#!/bin/sh
# Agent entrypoint when Node is missing. Existing compatible Node is reused.
set -eu
avd_script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
avd_data=${AI_VIDEO_DIRECTOR_DATA_DIR:-"$HOME/.local/share/ai-video-director"}
avd_runtime="$avd_data/runtime"
avd_fresh=false
if [ "${1:-}" = "--fresh-node" ]; then avd_fresh=true; shift; fi
if [ "$avd_fresh" = false ]; then
  for avd_node in "$(command -v node || true)" \
    "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" \
    /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node \
    /Applications/Codex.app/Contents/Resources/cua_node/bin/node \
    "$avd_runtime"/node-v*/bin/node; do
    if [ -x "$avd_node" ] && "$avd_node" "$avd_script_dir/check-node.mjs" 2>/dev/null; then
      exec "$avd_node" "$avd_script_dir/setup.mjs" "$@"
    fi
  done
fi
case " $* " in *' --apply '*) ;; *) echo 'Node >=22 is missing. Agent reruns bootstrap with --apply to acquire the pinned runtime.' >&2; exit 1;; esac
case "$(uname -s)" in Darwin) avd_os=darwin;; Linux) avd_os=linux;; *) echo 'Agent must select a supported native Node distribution for this OS.' >&2; exit 1;; esac
case "$(uname -m)" in arm64|aarch64) avd_arch=arm64;; x86_64|amd64) avd_arch=x64;; *) echo 'Unsupported CPU; Agent must review an official Node distribution.' >&2; exit 1;; esac
avd_name="node-v22.23.2-$avd_os-$avd_arch"
avd_archive="$avd_name.tar.gz"
avd_expected=$(awk -v name="$avd_archive" '$1 == name {print $2}' "$avd_script_dir/../references/node-downloads.txt")
[ "${#avd_expected}" = 64 ] || { echo 'Missing pinned Node checksum.' >&2; exit 1; }
mkdir -p "$avd_runtime"
avd_temp=$(mktemp -d "$avd_runtime/node-download.XXXXXX")
trap 'rm -rf -- "$avd_temp"' EXIT HUP INT TERM
curl --fail --location --retry 2 --connect-timeout 20 --max-time 600 "https://nodejs.org/dist/v22.23.2/$avd_archive" -o "$avd_temp/$avd_archive"
if command -v shasum >/dev/null 2>&1; then
  avd_actual=$(shasum -a 256 "$avd_temp/$avd_archive" | awk '{print $1}')
else
  avd_actual=$(sha256sum "$avd_temp/$avd_archive" | awk '{print $1}')
fi
[ "$avd_expected" = "$avd_actual" ] || { echo 'Node checksum mismatch; archive will not run.' >&2; exit 1; }
tar -xzf "$avd_temp/$avd_archive" -C "$avd_temp"
if [ -e "$avd_runtime/$avd_name" ]; then
  echo 'Existing managed Node directory preserved; Agent must inspect it before repair.' >&2; exit 1
fi
mv "$avd_temp/$avd_name" "$avd_runtime/$avd_name"
"$avd_runtime/$avd_name/bin/node" "$avd_script_dir/setup.mjs" "$@"
