import readline from 'node:readline';

/**
 * Ask a yes/no question. Returns true for yes, false for no.
 *
 * @param {readline.Interface} rl
 * @param {string} question - The question text (without y/n suffix)
 * @param {boolean} [defaultYes=true] - Default answer when user presses Enter
 * @returns {Promise<boolean>}
 */
export function askYesNo(rl, question, defaultYes = true) {
  const suffix = defaultYes ? '(Y/n)' : '(y/N)';
  return new Promise((resolve) => {
    rl.question(`${question} ${suffix} `, (answer) => {
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === '') {
        resolve(defaultYes);
      } else {
        resolve(trimmed === 'y' || trimmed === 'yes');
      }
    });
  });
}

/**
 * Ask for a text input with an optional default.
 *
 * @param {readline.Interface} rl
 * @param {string} question
 * @param {string} [defaultValue='']
 * @returns {Promise<string>}
 */
export function askText(rl, question, defaultValue = '') {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      const trimmed = answer.trim();
      resolve(trimmed || defaultValue);
    });
  });
}

/**
 * Ask a multiple choice question.
 *
 * @param {readline.Interface} rl
 * @param {string} question
 * @param {string[]} choices
 * @param {string} defaultChoice
 * @returns {Promise<string>}
 */
export function askChoice(rl, question, choices, defaultChoice) {
  return new Promise((resolve) => {
    const choiceStr = choices.map(c => c === defaultChoice ? `[${c}]` : c).join(' / ');
    rl.question(`${question} ${choiceStr}: `, (answer) => {
      const trimmed = answer.trim().toLowerCase();
      const match = choices.find(c => c.toLowerCase() === trimmed);
      resolve(match || defaultChoice);
    });
  });
}

/**
 * Create a readline interface for interactive prompts.
 */
export function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}
