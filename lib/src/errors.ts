export class ParserError extends Error {
  readonly locations: { file: string; position: number }[];

  constructor(
    readonly message: string,
    ...locations: { file: string; position: number }[]
  ) {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.locations = locations;
  }
}

export class OptionalNotAllowedError extends ParserError {}
export class TypeNotAllowedError extends ParserError {}
