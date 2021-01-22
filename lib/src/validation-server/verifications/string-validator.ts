import assertNever from "assert-never";
import validator from "validator";
import {
  ArrayType,
  dereferenceType,
  ObjectType,
  ReferenceType,
  Type,
  TypeKind,
  TypeTable,
  UnionType
} from "../../types";

export interface StringInput {
  name: string;
  value: string | { [key: string]: unknown } | unknown[];
}

export class StringValidator {
  static getErrorMessage(
    input: string,
    type: Exclude<Type, ObjectType | ArrayType | ReferenceType>
  ): string {
    switch (type.kind) {
      case TypeKind.NULL:
      case TypeKind.BOOLEAN:
      case TypeKind.STRING:
      case TypeKind.FLOAT:
      case TypeKind.DOUBLE:
      case TypeKind.INT32:
      case TypeKind.INT64:
      case TypeKind.DATE:
      case TypeKind.DATE_TIME:
      case TypeKind.INTERSECTION:
        return `"${input}" should be ${type.kind}`;
      case TypeKind.BOOLEAN_LITERAL:
      case TypeKind.STRING_LITERAL:
      case TypeKind.FLOAT_LITERAL:
      case TypeKind.INT_LITERAL:
        return `"${input}" should be ${type.value}`;
      case TypeKind.UNION:
        return `"${input}" should be a member of a union`;
      default:
        assertNever(type);
    }
  }

  messages: string[] = [];
  typeTable: TypeTable;

  constructor(typeTable: TypeTable) {
    this.typeTable = typeTable;
  }

  run(
    input: StringInput,
    type: Type,
    isMandatory: boolean = true
  ): boolean | never {
    if (!input.value && !isMandatory) return true;

    switch (type.kind) {
      case TypeKind.NULL:
        return this.validateWithValidator(input, type, validator.isEmpty);
      case TypeKind.BOOLEAN:
        return this.validateWithValidator(input, type, (str: string) =>
          ["true", "false"].includes(str.toLowerCase())
        );
      case TypeKind.BOOLEAN_LITERAL:
        return this.validateWithValidator(
          input,
          type,
          (str: string) => str.toLowerCase() === type.value.toString()
        );
      case TypeKind.STRING:
        return this.validateWithValidator(
          input,
          type,
          (str: string) => typeof str === "string"
        );
      case TypeKind.STRING_LITERAL:
        return this.validateWithValidator(
          input,
          type,
          (str: string) => typeof str === "string" && str === type.value
        );
      case TypeKind.FLOAT:
      case TypeKind.DOUBLE:
        return this.validateWithValidator(input, type, validator.isFloat);
      case TypeKind.FLOAT_LITERAL:
        return this.validateWithValidator(
          input,
          type,
          (str: string) => validator.isFloat(str) && Number(str) === type.value
        );
      case TypeKind.INT32:
      case TypeKind.INT64:
        return this.validateWithValidator(input, type, validator.isInt);
      case TypeKind.INT_LITERAL:
        return this.validateWithValidator(
          input,
          type,
          (str: string) => validator.isInt(str) && Number(str) === type.value
        );
      case TypeKind.DATE:
      case TypeKind.DATE_TIME:
        return this.validateWithValidator(input, type, validator.isISO8601);
      case TypeKind.OBJECT:
        return this.validateObject(input, type);
      case TypeKind.ARRAY:
        return this.validateArray(input, type);
      case TypeKind.INTERSECTION:
      case TypeKind.UNION:
        // eslint-disable-next-line no-case-declarations
        const anyValid = type.types.some(t => {
          const unionStringValidator = new StringValidator(this.typeTable);
          return unionStringValidator.run(input, t, isMandatory);
        });
        if (!anyValid) {
          this.messages.push(StringValidator.getErrorMessage(input.name, type));
        }
        return anyValid;
      case TypeKind.REFERENCE:
        return this.run(input, dereferenceType(type, this.typeTable));
      default:
        assertNever(type);
    }
  }

  private validateWithValidator(
    input: StringInput,
    type: Exclude<Type, ObjectType | ArrayType | ReferenceType | UnionType>,
    validatorFn: (str: string, options?: {}) => boolean
  ): boolean {
    const isValid = validatorFn(`${input.value}`);
    if (!isValid) {
      this.messages.push(StringValidator.getErrorMessage(input.name, type));
    }
    return isValid;
  }

  private validateObject(input: StringInput, type: ObjectType): boolean {
    const validateProps = (): boolean =>
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

  private validateArray(input: StringInput, type: ArrayType): boolean {
    const validateItems = (): boolean =>
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
}
