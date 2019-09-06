import { Project } from "ts-morph";

export class ParserError extends Error {
  readonly locations: Array<{ file: string; position: number }>;

  constructor(
    readonly message: string,
    ...locations: Array<{ file: string; position: number }>
  ) {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.locations = locations;
  }
}

export class OptionalNotAllowedError extends ParserError {}
export class TypeNotAllowedError extends ParserError {}

export function printParserError(
  err: ParserError,
  project: Project,
  options?: Partial<PrintOpts>
): string {
  const opts = {
    surroundingLines: (options || {}).surroundingLines || 3
  };

  return (
    `${err.message}:\n\n` +
    err.locations
      .map(l => printParserErrorLocation(l, project, opts))
      .join("\n\n")
  );
}

function printParserErrorLocation(
  location: {
    file: string;
    position: number;
  },
  project: Project,
  opts: PrintOpts
): string {
  const sourceFile = project.getSourceFileOrThrow(location.file);
  const line = sourceFile.getLineAndColumnAtPos(location.position).line;

  const splittedSource = sourceFile.getFullText().split("\n");
  const totalLines = splittedSource.length;

  const lowerBound =
    line - opts.surroundingLines >= 1 ? line - opts.surroundingLines : 1;
  const upperBound =
    line + opts.surroundingLines <= totalLines
      ? line + opts.surroundingLines
      : totalLines;
  const lineNumberPadding = upperBound.toString().length;

  return (
    `${location.file}\n\n` +
    splittedSource
      .map((e, i) =>
        i + 1 === line
          ? `${(i + 1).toString().padStart(lineNumberPadding)} --> ${e}`
          : `${(i + 1).toString().padStart(lineNumberPadding)}     ${e}`
      )
      .slice(lowerBound - 1, upperBound)
      .join("\n")
  );
}

interface PrintOpts {
  surroundingLines: number;
}
