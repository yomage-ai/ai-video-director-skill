// File entry avoids PowerShell 5.1's native-command quoting of inline JavaScript.
import {npmCommand} from './lib/setup-runtime.mjs';
process.exit(Number(process.versions.node.split('.')[0]) >= 22 && npmCommand() ? 0 : 1);
