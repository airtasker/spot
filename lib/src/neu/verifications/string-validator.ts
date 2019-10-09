import * as validators from "validator";
import {
  ArrayType,
  dereferenceType,
  ObjectType,
  ReferenceType,
  Type,
  TypeKind,
  TypeTable
} from "../types";

const {
  NULL,
  BOOLEAN,
  DATE,
  DATE_TIME,
  STRING,
  FLOAT,
  DOUBLE,
  FLOAT_LITERAL,
  INT32,
  INT64,
  INT_LITERAL,
  OBJECT,
  ARRAY,
  REFERENCE
} = TypeKind;

interface Input {
  name: string;
  value: string | { [key: string]: unknown } | unknown[];
}

type ValidatorMap = {
  [key in TypeKind]?: (str: string, options?: {}) => boolean | never;
};

export class StringValidator {
  static validatorMap: ValidatorMap = {
    [NULL]: validators.isEmpty,
    [BOOLEAN]: validators.isBoolean,
    [DATE]: validators.isISO8601,
    [DATE_TIME]: validators.isISO8601,
    [FLOAT]: validators.isFloat,
    [INT32]: validators.isInt,
    [INT64]: validators.isInt,
    [DOUBLE]: validators.isFloat,
    [FLOAT_LITERAL]: validators.isFloat,
    [INT_LITERAL]: validators.isInt,
    [STRING]: Boolean
  };

  static getErrorMessage(input: string, type: string): string {
    return `"${input}" should be ${type}`;
  }

  messages: string[] = [];
  typeTable: TypeTable;

  constructor(typeTable: TypeTable) {
    this.typeTable = typeTable;
  }

  run(input: Input, type: Type, isMandatory: boolean = true): boolean | never {
    if (type.kind === OBJECT) {
      return this.validateObject(input, type);
    }

    if (type.kind === ARRAY) {
      return this.validateArray(input, type);
    }

    if (type.kind === REFERENCE) {
      return this.validateReference(input, type);
    }

    const validator = StringValidator.validatorMap[type.kind];

    if (typeof validator !== "function") {
      throw new Error(
        `StringValidator Err - no validator found for type ${type.kind}`
      );
    }

    const isNotRequired = !input.value && !isMandatory;

    const isValid = isNotRequired || validator(`${input.value}`);

    if (!isValid) {
      this.messages.push(
        StringValidator.getErrorMessage(input.name, type.kind)
      );
    }

    return isValid;
  }

  private validateObject(input: Input, type: ObjectType): boolean {
    const validateProps = () =>
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
        .some(v => v === false);

    return input && typeof input === "object" && validateProps();
  }

  private validateArray(input: Input, type: ArrayType): boolean {
    const validateItems = () =>
      !(input.value as [])
        .map((v, index) =>
          this.run(
            { name: `${input.name}[${index}]`, value: `${v}` },
            type.elementType
          )
        )
        .some(v => v === false);

    return Array.isArray(input.value) && validateItems();
  }

  private validateReference(input: Input, type: ReferenceType) {
    return this.run(input, dereferenceType(type, this.typeTable));
  }
}
