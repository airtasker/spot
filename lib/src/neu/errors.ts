import { Project } from "ts-morph";

export class ParserError extends Error {
  constructor(message: string) {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }

  print(project: Project, options?: Partial<PrintOpts>): string {
    return this.message;
  }

  protected normalizeOpts(options: Partial<PrintOpts>): PrintOpts {
    return {
      surroundingLines: options.surroundingLines || 3
    };
  }
}

export class OptionalNotAllowedError extends ParserError {
  private file: string;
  private position: number;

  constructor(
    message: string,
    data: {
      file: string;
      position: number;
    }
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.file = data.file;
    this.position = data.position;
  }

  print(project: Project, options?: Partial<PrintOpts>): string {
    const opts = this.normalizeOpts(options || {});

    const sourceFile = project.getSourceFileOrThrow(this.file);
    const line = sourceFile.getLineAndColumnAtPos(this.position).line;

    const splittedSource = sourceFile.getFullText().split("\n");
    const totalLines = splittedSource.length;

    const lowerBound =
      line - opts.surroundingLines >= 1 ? line - opts.surroundingLines : 1;
    const upperBound =
      line + opts.surroundingLines <= totalLines
        ? line + opts.surroundingLines
        : totalLines;
    const padding = upperBound.toString().length;

    return (
      `${this.file}\n\n` +
      splittedSource
        .map((e, i) =>
          i + 1 === line
            ? `${(i + 1).toString().padStart(padding)} --> ${e}`
            : `${(i + 1).toString().padStart(padding)}     ${e}`
        )
        .slice(lowerBound - 1, upperBound)
        .join("\n")
    );
  }
}

interface PrintOpts {
  surroundingLines: number;
}
