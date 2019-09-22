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
  value: string | { [key: string]: unknown } | unknown[];
}

export class Validator {
  // @ts-ignore
  static validatorsMapping: {
    [key in TypeKind]: (str: string, options?: {}) => boolean;
  } = {
    [NULL]: validators.isEmpty,
    [BOOLEAN]: validators.isBoolean,
    [DATE]: validators.isISO8601,
    [DATE_TIME]: validators.isISO8601,
    [FLOAT]: validators.isFloat,
    [INT32]: validators.isInt,
    [INT64]: validators.isInt,
    [DOUBLE]: validators.isFloat,
    [INT_LITERAL]: validators.isInt
  };

  static getErrorMessage(input: string, type: string): string {
    return `"${input}" should be ${type}`;
  }

  messages: string[] = [];
  typesStore: Type[] = [];

  constructor(typesStore: Type[] = []) {
    this.typesStore = typesStore;
  }

  validateObject(input: Input, type: ObjectType): boolean {
    return (
      input &&
      typeof input === "object" &&
      !type.properties
        .map(p =>
          this.run(
            {
              name: `.${input.name}.${p.name}`,
              value: `${(input.value as { [key: string]: unknown })[p.name]}`
            },
            p.type,
            !p.optional
          )
        )
        .some(v => !v)
    );
  }

  validateArray(input: Input, type: ArrayType): boolean {
    return (
      Array.isArray(input.value) &&
      !input.value
        .map((v, index) =>
          this.run(
            { name: `${input.name}[${index}]`, value: `${v}` },
            type.elementType
          )
        )
        .some(v => !v)
    );
  }

  run(input: Input, type: Type, isMandatory: boolean = true): boolean | void {
    if (type.kind === OBJECT) {
      return this.validateObject(input, type);
    }

    if (type.kind === ARRAY) {
      return this.validateArray(input, type);
    }

    const validator = Validator.validatorsMapping[type.kind];

    if (typeof validator !== "function") {
      return;
    }

    const isOptional = !input.value && !isMandatory;

    const isValid = isOptional || validator(`${input.value}`);

    if (!isValid) {
      this.messages.push(Validator.getErrorMessage(input.name, type.kind));
    }

    return isValid;
  }
}
