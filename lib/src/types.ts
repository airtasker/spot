import assertNever from "assert-never";

export enum TypeKind {
  NULL = "null",
  BOOLEAN = "boolean",
  BOOLEAN_LITERAL = "boolean-literal",
  STRING = "string",
  STRING_LITERAL = "string-literal",
  FLOAT = "float",
  DOUBLE = "double",
  FLOAT_LITERAL = "float-literal",
  INT32 = "int32",
  INT64 = "int64",
  INT_LITERAL = "integer-literal",
  DATE = "date",
  DATE_TIME = "date-time",
  OBJECT = "object",
  ARRAY = "array",
  UNION = "union",
  REFERENCE = "reference"
}

export type Type =
  | NullType
  | BooleanType
  | BooleanLiteralType
  | StringType
  | StringLiteralType
  | FloatType
  | DoubleType
  | FloatLiteralType
  | Int32Type
  | Int64Type
  | IntLiteralType
  | DateType
  | DateTimeType
  | ObjectType
  | ArrayType
  | UnionType
  | ReferenceType;

/**
 * A concrete type is any type that is not a union of types or reference to a type.
 */
export type ConcreteType = Exclude<Type, UnionType | ReferenceType>;
/**
 * A concrete type is any type that is not a
 */
export type PrimitiveType = Exclude<
  Type,
  ObjectType | ArrayType | UnionType | ReferenceType
>;

export type LiteralType =
  | BooleanLiteralType
  | StringLiteralType
  | FloatLiteralType
  | IntLiteralType;

export interface NullType {
  kind: TypeKind.NULL;
}

export interface BooleanType {
  kind: TypeKind.BOOLEAN;
}

export interface BooleanLiteralType {
  kind: TypeKind.BOOLEAN_LITERAL;
  value: boolean;
}

export interface StringType {
  kind: TypeKind.STRING;
}

export interface StringLiteralType {
  kind: TypeKind.STRING_LITERAL;
  value: string;
}

export interface FloatType {
  kind: TypeKind.FLOAT;
}

export interface DoubleType {
  kind: TypeKind.DOUBLE;
}

export interface FloatLiteralType {
  kind: TypeKind.FLOAT_LITERAL;
  value: number;
}

export interface Int32Type {
  kind: TypeKind.INT32;
}

export interface Int64Type {
  kind: TypeKind.INT64;
}

export interface IntLiteralType {
  kind: TypeKind.INT_LITERAL;
  value: number;
}

export interface DateType {
  kind: TypeKind.DATE;
}

export interface DateTimeType {
  kind: TypeKind.DATE_TIME;
}

export interface ObjectType {
  kind: TypeKind.OBJECT;
  properties: {
    name: string;
    description?: string;
    optional: boolean;
    type: Type;
  }[];
}

export interface ArrayType {
  kind: TypeKind.ARRAY;
  elementType: Type;
}

export interface UnionType {
  kind: TypeKind.UNION;
  types: Type[];
  discriminator?: string;
}

export interface ReferenceType {
  kind: TypeKind.REFERENCE;
  name: string;
}

// Type builders

export function nullType(): NullType {
  return {
    kind: TypeKind.NULL
  };
}

export function booleanType(): BooleanType {
  return {
    kind: TypeKind.BOOLEAN
  };
}

export function booleanLiteralType(value: boolean): BooleanLiteralType {
  return {
    kind: TypeKind.BOOLEAN_LITERAL,
    value
  };
}

export function stringType(): StringType {
  return {
    kind: TypeKind.STRING
  };
}

export function stringLiteralType(value: string): StringLiteralType {
  return {
    kind: TypeKind.STRING_LITERAL,
    value
  };
}

export function floatType(): FloatType {
  return {
    kind: TypeKind.FLOAT
  };
}

export function doubleType(): DoubleType {
  return {
    kind: TypeKind.DOUBLE
  };
}

export function floatLiteralType(value: number): FloatLiteralType {
  return {
    kind: TypeKind.FLOAT_LITERAL,
    value
  };
}

export function int32Type(): Int32Type {
  return {
    kind: TypeKind.INT32
  };
}

export function int64Type(): Int64Type {
  return {
    kind: TypeKind.INT64
  };
}

export function intLiteralType(value: number): IntLiteralType {
  return {
    kind: TypeKind.INT_LITERAL,
    value
  };
}

export function dateType(): DateType {
  return {
    kind: TypeKind.DATE
  };
}

export function dateTimeType(): DateTimeType {
  return {
    kind: TypeKind.DATE_TIME
  };
}

export function objectType(
  properties: {
    name: string;
    description?: string;
    optional: boolean;
    type: Type;
  }[]
): ObjectType {
  return {
    kind: TypeKind.OBJECT,
    properties
  };
}

export function arrayType(elementType: Type): ArrayType {
  return {
    kind: TypeKind.ARRAY,
    elementType
  };
}

export function unionType(
  unionTypes: Type[],
  discriminator?: string
): UnionType {
  return {
    kind: TypeKind.UNION,
    types: unionTypes,
    discriminator
  };
}

export function referenceType(name: string): ReferenceType {
  return {
    kind: TypeKind.REFERENCE,
    name
  };
}

// Type guards

export function isNullType(type: Type): type is NullType {
  return type.kind === TypeKind.NULL;
}

export function isNotNullType<T extends Type>(
  type: T
): type is Exclude<T, NullType> {
  return !isNullType(type);
}

export function isBooleanType(type: Type): type is BooleanType {
  return type.kind === TypeKind.BOOLEAN;
}

export function isBooleanLiteralType(type: Type): type is BooleanLiteralType {
  return type.kind === TypeKind.BOOLEAN_LITERAL;
}

export function areBooleanLiteralTypes(
  types: Type[]
): types is BooleanLiteralType[] {
  return areTypes(types, isBooleanLiteralType);
}

export function isStringType(type: Type): type is StringType {
  return type.kind === TypeKind.STRING;
}

export function isNotStringType<T extends Type>(
  type: T
): type is Exclude<T, StringType> {
  return !isStringType(type);
}

export function isStringLiteralType(type: Type): type is StringLiteralType {
  return type.kind === TypeKind.STRING_LITERAL;
}

export function areStringLiteralTypes(
  types: Type[]
): types is StringLiteralType[] {
  return areTypes(types, isStringLiteralType);
}

export function isFloatType(type: Type): type is FloatType {
  return type.kind === TypeKind.FLOAT;
}

export function isDoubleType(type: Type): type is DoubleType {
  return type.kind === TypeKind.DOUBLE;
}

export function isFloatLiteralType(type: Type): type is FloatLiteralType {
  return type.kind === TypeKind.FLOAT_LITERAL;
}

export function areFloatLiteralTypes(
  types: Type[]
): types is FloatLiteralType[] {
  return areTypes(types, isFloatLiteralType);
}

export function isInt32Type(type: Type): type is Int32Type {
  return type.kind === TypeKind.INT32;
}

export function isInt64Type(type: Type): type is Int64Type {
  return type.kind === TypeKind.INT64;
}

export function isIntLiteralType(type: Type): type is IntLiteralType {
  return type.kind === TypeKind.INT_LITERAL;
}

export function areIntLiteralTypes(types: Type[]): types is IntLiteralType[] {
  return areTypes(types, isIntLiteralType);
}

export function isDateType(type: Type): type is DateType {
  return type.kind === TypeKind.DATE;
}

export function isDateTimeType(type: Type): type is DateTimeType {
  return type.kind === TypeKind.DATE_TIME;
}

export function isObjectType(type: Type): type is ObjectType {
  return type.kind === TypeKind.OBJECT;
}

export function isArrayType(type: Type): type is ArrayType {
  return type.kind === TypeKind.ARRAY;
}

export function isUnionType(type: Type): type is UnionType {
  return type.kind === TypeKind.UNION;
}

export function isReferenceType(type: Type): type is ReferenceType {
  return type.kind === TypeKind.REFERENCE;
}

export function isPrimitiveType(type: Type): type is PrimitiveType {
  switch (type.kind) {
    case TypeKind.NULL:
    case TypeKind.BOOLEAN:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING:
    case TypeKind.STRING_LITERAL:
    case TypeKind.FLOAT:
    case TypeKind.DOUBLE:
    case TypeKind.FLOAT_LITERAL:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.INT_LITERAL:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
      return true;
    case TypeKind.OBJECT:
    case TypeKind.ARRAY:
    case TypeKind.UNION:
    case TypeKind.REFERENCE:
      return false;
    default:
      throw assertNever(type);
  }
}

export function isLiteralType(type: Type): type is LiteralType {
  return (
    isBooleanLiteralType(type) ||
    isStringLiteralType(type) ||
    isFloatLiteralType(type) ||
    isIntLiteralType(type)
  );
}

export function isNotLiteralType<T extends Type>(
  type: T
): type is Exclude<T, LiteralType> {
  return !isLiteralType(type);
}

// Guard helpers

function areTypes<T extends Type>(
  types: Type[],
  predicate: (type: Type) => type is T
): types is T[] {
  return types.every(predicate);
}

// Type helpers

export function possibleRootTypes(
  type: Type,
  typeTable: TypeTable
): ConcreteType[] {
  if (isReferenceType(type)) {
    return possibleRootTypes(typeTable.getOrError(type.name), typeTable);
  }
  if (isUnionType(type)) {
    return type.types.reduce<ConcreteType[]>(
      (acc, curr) => acc.concat(possibleRootTypes(curr, typeTable)),
      []
    );
  }
  return [type];
}

export function dereferenceType(
  type: Type,
  typeTable: TypeTable
): Exclude<Type, ReferenceType> {
  if (isReferenceType(type)) {
    return dereferenceType(typeTable.getOrError(type.name), typeTable);
  }
  return type;
}

/**
 * Given a list of types, try to find a disriminator. The null type is ignored.
 *
 * @param types list of types
 * @param typeTable a TypeTable
 */
export function inferDiscriminator(
  types: Type[],
  typeTable: TypeTable
): string | undefined {
  const concreteRootTypesExcludingNull = types
    .reduce<ConcreteType[]>((acc, type) => {
      return acc.concat(...possibleRootTypes(type, typeTable));
    }, [])
    .filter(isNotNullType);

  const possibleDiscriminators = new Map<
    string,
    { value: string; type: Type }[]
  >();

  for (const type of concreteRootTypesExcludingNull) {
    if (!isObjectType(type)) {
      // Only objects will have discriminator properties
      return;
    }

    for (const property of type.properties) {
      if (property.optional) {
        // Optional properties cannot be considered for discriminators
        continue;
      }
      const dereferencedPropertyType = dereferenceType(
        property.type,
        typeTable
      );
      if (isStringLiteralType(dereferencedPropertyType)) {
        const current = possibleDiscriminators.get(property.name);
        possibleDiscriminators.set(
          property.name,
          (current || []).concat({
            value: dereferencedPropertyType.value,
            type
          })
        );
      }
    }
  }

  const candidateDiscriminators = [];

  for (const candidate of possibleDiscriminators.keys()) {
    const values = possibleDiscriminators.get(candidate)!;
    if (
      new Set(values.map(v => v.value)).size !==
      concreteRootTypesExcludingNull.length
    ) {
      continue;
    }
    candidateDiscriminators.push(candidate);
  }

  // Multiple candidates means the a discriminator is ambiguous and therefore can't be determined
  return candidateDiscriminators.length === 1
    ? candidateDiscriminators[0]
    : undefined;
}

/**
 * Loci table is a lookup table for types.
 */
export class TypeTable {
  /**
   * Retrieve the number of entries in the type table.
   */
  get size(): number {
    return this.types.size;
  }

  static fromArray(types: { name: string; type: Type }[]): TypeTable {
    const entries = types.reduce(
      (acc: [string, Type][], t: { name: string; type: Type }) => {
        acc.push([t.name, t.type]);
        return acc;
      },
      []
    );

    return new TypeTable(new Map(entries));
  }

  private types: Map<string, Type>;

  constructor(types: Map<string, Type> = new Map<string, Type>()) {
    this.types = types;
  }

  /**
   * Return an object representation of the type table.
   */
  toArray(): { name: string; type: Type }[] {
    const arr = new Array<{ name: string; type: Type }>();
    this.types.forEach((type, key, _) => {
      arr.push({ name: key, type });
    });
    return arr.sort((a, b) => (b.name > a.name ? -1 : 1));
  }

  /**
   * Add a type to the type table. If the type key is already present, `add` will throw an error.
   *
   * @param key lookup key
   * @param locus target locus
   */
  add(key: string, type: Type): void {
    if (this.types.has(key)) {
      throw new Error(`Key already present in type table: ${key}`);
    }
    this.types.set(key, type);
  }

  /**
   * Retrieve a type by lookup key.
   *
   * @param key lookup key
   */
  get(key: string): Type | undefined {
    return this.types.get(key);
  }

  /**
   * Retrieve a type by lookup key.
   *
   * @param key lookup key
   */
  getOrError(key: string): Type {
    const type = this.get(key);
    if (type === undefined) {
      throw new Error(`Key not present in type table: ${key}`);
    }
    return type;
  }

  /**
   * Check if a type exists in the table.
   *
   * @param key lookup key
   */
  exists(key: string): boolean {
    return this.types.has(key);
  }
}
