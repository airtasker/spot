import chalk from "chalk";

const TestLogger = {
  error,
  log,
  mute,
  success,
  warn
};

export default TestLogger;

function error(message: string) {
  // tslint:disable-next-line: no-console
  console.log(chalk.red(message));
}

function log(message: string) {
  // tslint:disable-next-line: no-console
  console.log(chalk.white(message));
}

function mute(message: string) {
  // tslint:disable-next-line: no-console
  console.log(chalk.grey(message));
}

function success(message: string) {
  // tslint:disable-next-line: no-console
  console.log(chalk.green(message));
}

function warn(message: string) {
  // tslint:disable-next-line: no-console
  console.log(chalk.yellow(message));
}
