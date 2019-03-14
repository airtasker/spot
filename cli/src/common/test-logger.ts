import chalk from "chalk";

const TestLogger = {
  log,
  success,
  warn,
  error
};

export default TestLogger;

function log(message: string) {
  // tslint:disable-next-line: no-console
  console.log(chalk.white(message));
}

function success(message: string) {
  // tslint:disable-next-line: no-console
  console.log(chalk.green(message));
}

function warn(message: string) {
  // tslint:disable-next-line: no-console
  console.log(chalk.yellow(message));
}

function error(message: string) {
  // tslint:disable-next-line: no-console
  console.log(chalk.red(message));
}
