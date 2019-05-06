import chalk from "chalk";

export const TestLogger = {
  error,
  errorDebug,
  log,
  success,
  warn
};

// tslint:disable:no-console
function error(message: string, opts?: LoggerOpts) {
  console.log(chalk.red(transformMessage(message, opts)));
}

function log(message: string, opts?: LoggerOpts) {
  console.log(chalk.dim.white(transformMessage(message, opts)));
}

function success(message: string, opts?: LoggerOpts) {
  console.log(chalk.green(transformMessage(message, opts)));
}

function warn(message: string, opts?: LoggerOpts) {
  console.log(chalk.yellow(transformMessage(message, opts)));
}
// tslint:enable:no-console

function transformMessage(message: string, customOpts?: LoggerOpts) {
  const opts = {
    indent: customOpts ? customOpts.indent || 0 : 0
  };
  const indents = "\t".repeat(opts.indent);
  return indents + message.replace(/\n/g, `\n${indents}`);
}

interface LoggerOpts {
  indent?: number; // number of tabs
}
