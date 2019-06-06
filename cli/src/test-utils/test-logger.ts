import chalk from "chalk";

export class TestLogger {
  private readonly debugMode: boolean;

  constructor(opts?: LoggerOpts) {
    this.debugMode = opts ? !!opts.debugMode : false;
  }

  // tslint:disable:no-console
  debug(message: string, opts?: LogOpts): void {
    if (this.debugMode) {
      console.log(chalk.gray(this.transformMessage(message, opts)));
    }
  }

  log(message: string, opts?: LogOpts): void {
    console.log(chalk.dim.white(this.transformMessage(message, opts)));
  }

  success(message: string, opts?: LogOpts): void {
    console.log(chalk.green(this.transformMessage(message, opts)));
  }

  warn(message: string, opts?: LogOpts): void {
    console.log(chalk.yellow(this.transformMessage(message, opts)));
  }

  error(message: string, opts?: LogOpts): void {
    console.log(chalk.red(this.transformMessage(message, opts)));
  }
  // tslint:enable:no-console

  private transformMessage(message: string, customOpts?: LogOpts): string {
    const opts = {
      indent: customOpts ? customOpts.indent || 0 : 0
    };
    const indents = "\t".repeat(opts.indent);
    return indents + message.replace(/\n/g, `\n${indents}`);
  }
}

// export const TestLogger = {
//   error,
//   log,
//   success,
//   warn
// };

// tslint:disable:no-console
// function error(message: string, opts?: LogOpts) {
//   console.log(chalk.red(transformMessage(message, opts)));
// }

// function log(message: string, opts?: LogOpts) {
//   console.log(chalk.dim.white(transformMessage(message, opts)));
// }

// function success(message: string, opts?: LogOpts) {
//   console.log(chalk.green(transformMessage(message, opts)));
// }

// function warn(message: string, opts?: LogOpts) {
//   console.log(chalk.yellow(transformMessage(message, opts)));
// }
// tslint:enable:no-console

// function transformMessage(message: string, customOpts?: LogOpts) {
//   const opts = {
//     indent: customOpts ? customOpts.indent || 0 : 0
//   };
//   const indents = "\t".repeat(opts.indent);
//   return indents + message.replace(/\n/g, `\n${indents}`);
// }

interface LoggerOpts {
  debugMode?: boolean;
}

interface LogOpts {
  indent?: number; // number of tabs
}
