/**
 * Parse CLI arguments into a structured options object.
 *
 * @param {string[]} argv - Arguments after the binary name (process.argv.slice(2))
 * @returns {{ command: string, all: boolean, core: boolean, help: boolean, version: boolean }}
 */
export function parseArgs(argv) {
  const result = {
    command: 'init',
    all: false,
    core: false,
    force: false,
    help: false,
    version: false,
  };

  for (const arg of argv) {
    switch (arg) {
      case 'init':
        result.command = 'init';
        break;
      case 'agents-md':
        result.command = 'agents-md';
        break;
      case 'validate':
        result.command = 'validate';
        break;
      case '--all':
        result.all = true;
        break;
      case '--core':
        result.core = true;
        break;
      case '--force':
      case '-f':
        result.force = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
      case '--version':
      case '-v':
        result.version = true;
        break;
      // Unknown flags are silently ignored
    }
  }

  return result;
}
