import assertNever from "assert-never";
import * as validators from "validator";
import { ArrayType, ObjectType, Type, TypeKind } from "../types";

const {
  NULL,
  BOOLEAN,
  DATE,
  DATE_TIME,
  STRING_LITERAL,
  FLOAT,
  DOUBLE,
  FLOAT_LITERAL,
  INT32,
  INT64,
  INT_LITERAL,
  OBJECT,
  ARRAY,
  UNION,
  REFERENCE
} = TypeKind;

interface Input {
  name: string;
  value: string | { [key: string]: unknown } | [];
}

export class Validator {
  static getErrorMessage(input: string, type: string): string {
    return `"${input}" should be ${type}`;
  }

  // @ts-ignore
  validatorsMapping: { [key in TypeKind]: any } = {
    [NULL]: validators.isEmpty,
    [BOOLEAN]: validators.isBoolean,
    [DATE]: validators.isISO8601,
    [DATE_TIME]: validators.isISO8601,
    [FLOAT]: validators.isFloat,
    [INT32]: validators.isInt,
    [INT64]: validators.isInt,
    [DOUBLE]: validators.isFloat,
    [INT_LITERAL]: validators.isInt,
    [OBJECT]: this.validateObject,
    [ARRAY]: this.validateArray
  };

  messages: string[] = []
  typesStore: Type[] = []

  constructor(typesStore: Type[] = []) {
    this.typesStore = typesStore;
  }

  validateObject(input: { [key: string]: unknown }, type: ObjectType): boolean {
    return !type.properties
      .map(p =>
        this.run(
          { name: p.name, value: `${input[p.name]}` },
          p.type,
          !p.optional
        )
      )
      .some(v => !v);
  }

  validateArray(input: string[], type: ArrayType): boolean {
    return !input
      .map(v => this.run({ name: "", value: `${v}` }, type.elementType))
      .some(v => !v);
  }

  run(
    input: Input,
    type: Type,
    isMandatory: boolean = true
  ): boolean | void {
    const validator = this.validatorsMapping[type.kind];
    // console.log(validator);

    if (typeof validator !== "function") {
      return;
    }

    const isValid = !isMandatory || validator(input.value);

    if (!isValid) {
      this.messages.push(Validator.getErrorMessage(input.name, type.kind));
    }

    return isValid;
  }
}
