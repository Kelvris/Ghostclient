import chalk from 'chalk';

function timestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false });
}

export const logger = {
  info(msg) { console.log(`${chalk.gray(`[${timestamp()}]`)} ${chalk.blue('INFO')}  ${msg}`); },
  warn(msg) { console.log(`${chalk.gray(`[${timestamp()}]`)} ${chalk.yellow('WARN')}  ${msg}`); },
  error(msg) { console.log(`${chalk.gray(`[${timestamp()}]`)} ${chalk.red('ERROR')} ${msg}`); },
  debug(msg) { console.log(`${chalk.gray(`[${timestamp()}]`)} ${chalk.magenta('DEBUG')} ${msg}`); },
  success(msg) { console.log(`${chalk.gray(`[${timestamp()}]`)} ${chalk.green('OK')}    ${msg}`); },
};
