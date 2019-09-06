import chalk from "chalk";

export class VerificationLogger {
  /** Prepares an object for printing */
  static formatObject(obj: any): string {
    return JSON.stringify(obj, undefined, 2);
  }

  private readonly debugMode: boolean;

  constructor(private printer: (message: string) => void, opts?: LoggerOpts) {
    this.debugMode = opts ? !!opts.debugMode : false;
  }

  debug(message: string, opts?: LogOpts): void {
    if (this.debugMode) {
      this.printer(chalk.magenta(this.transformMessage(message, opts)));
    }
  }

  log(message: string, opts?: LogOpts): void {
    this.printer(chalk.dim.white(this.transformMessage(message, opts)));
  }

  success(message: string, opts?: LogOpts): void {
    this.printer(chalk.green(this.transformMessage(message, opts)));
  }

  warn(message: string, opts?: LogOpts): void {
    this.printer(chalk.yellow(this.transformMessage(message, opts)));
  }

  error(message: string, opts?: LogOpts): void {
    this.printer(chalk.red(this.transformMessage(message, opts)));
  }

  private transformMessage(message: string, customOpts?: LogOpts): string {
    const opts = {
      indent: customOpts ? customOpts.indent || 0 : 0
    };
    const indents = "\t".repeat(opts.indent);
    return indents + message.replace(/\n/g, `\n${indents}`);
  }
}

interface LoggerOpts {
  debugMode?: boolean;
}

interface LogOpts {
  indent?: number; // number of tabs
}
