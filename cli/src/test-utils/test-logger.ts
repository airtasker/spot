import chalk from "chalk";

export const TestLogger = {
  error,
  log,
  success,
  warn
};

// tslint:disable:no-console
function error(message: string) {
  console.log(chalk.red(message));
}

function log(message: string) {
  console.log(chalk.dim.white(message));
}

function success(message: string) {
  console.log(chalk.green(message));
}

function warn(message: string) {
  console.log(chalk.yellow(message));
}
// tslint:enable:no-console
