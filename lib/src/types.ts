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
  REFERENCE = "reference",
  INTERSECTION = "intersection"
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
  | ReferenceType
  | IntersectionType;

/**
 * A concrete type is any type that is not a union of types, intersection or reference to a type.
 */
export type ConcreteType = Exclude<
  Type,
  UnionType | ReferenceType | IntersectionType
>;
/**
 * A primitive type is any type that is not an object, array, union, reference or intersection
 */
export type PrimitiveType = Exclude<
  Type,
  ObjectType | ArrayType | UnionType | ReferenceType | IntersectionType
>;

export interface SchemaProp {
  name: string;
  value: boolean | number | string;
}

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
  schemaProps?: SchemaProp[];
}

export interface BooleanLiteralType {
  kind: TypeKind.BOOLEAN_LITERAL;
  value: boolean;
  schemaProps?: SchemaProp[];
}

export interface StringType {
  kind: TypeKind.STRING;
  schemaProps?: SchemaProp[];
}

export interface StringLiteralType {
  kind: TypeKind.STRING_LITERAL;
  value: string;
  schemaProps?: SchemaProp[];
}

export interface FloatType {
  kind: TypeKind.FLOAT;
  schemaProps?: SchemaProp[];
}

export interface DoubleType {
  kind: TypeKind.DOUBLE;
  schemaProps?: SchemaProp[];
}

export interface FloatLiteralType {
  kind: TypeKind.FLOAT_LITERAL;
  value: number;
  schemaProps?: SchemaProp[];
}

export interface Int32Type {
  kind: TypeKind.INT32;
  schemaProps?: SchemaProp[];
}

export interface Int64Type {
  kind: TypeKind.INT64;
  schemaProps?: SchemaProp[];
}

export interface IntLiteralType {
  kind: TypeKind.INT_LITERAL;
  value: number;
  schemaProps?: SchemaProp[];
}

export interface DateType {
  kind: TypeKind.DATE;
  schemaProps?: SchemaProp[];
}

export interface DateTimeType {
  kind: TypeKind.DATE_TIME;
  schemaProps?: SchemaProp[];
}

export interface ObjectPropertiesType {
  name: string;
  description?: string;
  optional: boolean;
  type: Type;
}

export interface ObjectType {
  kind: TypeKind.OBJECT;
  properties: Array<ObjectPropertiesType>;
  schemaProps?: SchemaProp[];
}

export interface ArrayType {
  kind: TypeKind.ARRAY;
  elementType: Type;
  schemaProps?: SchemaProp[];
}

export interface UnionType {
  kind: TypeKind.UNION;
  types: Type[];
  discriminator?: string;
  schemaProps?: SchemaProp[];
}

export interface IntersectionType {
  kind: TypeKind.INTERSECTION;
  types: Type[];
  schemaProps?: SchemaProp[];
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

export function objectType(properties: ObjectPropertiesType[]): ObjectType {
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

export function intersectionType(intersectionTypes: Type[]): IntersectionType {
  return {
    kind: TypeKind.INTERSECTION,
    types: intersectionTypes
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

function areIntTypes(type: Type): type is Int32Type | Int64Type {
  return isInt64Type(type) || isInt32Type(type);
}

export function areIntLiteralTypes(types: Type[]): types is IntLiteralType[] {
  return areTypes(types, isIntLiteralType);
}

export function areIntOrIntLiteralTypes(
  types: Type[]
): types is Array<IntLiteralType | Int32Type | Int64Type> {
  return types.every(
    type => isInt32Type(type) || isInt64Type(type) || isIntLiteralType(type)
  );
}

export function areStringOrStringLiteralTypes(
  types: Type[]
): types is Array<StringLiteralType | StringType> {
  return types.every(type => isStringType(type) || isStringLiteralType(type));
}

export function areFloatOrFloatLiteralTypes(
  types: Type[]
): types is Array<FloatLiteralType | FloatType> {
  return types.every(type => isFloatType(type) || isFloatLiteralType(type));
}

export function areBooleanOrBooleanLiteralTypes(
  types: Type[]
): types is Array<BooleanLiteralType | BooleanType> {
  return types.every(type => isBooleanType(type) || isBooleanLiteralType(type));
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

export function isIntersectionType(type: Type): type is IntersectionType {
  return type.kind === TypeKind.INTERSECTION;
}

export function isReferenceType(type: Type): type is ReferenceType {
  return type.kind === TypeKind.REFERENCE;
}

export function isNotReferenceType<T extends Type>(
  type: T
): type is Exclude<T, ReferenceType> {
  return !isReferenceType(type);
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
    case TypeKind.INTERSECTION:
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

export function isSchemaPropAllowedType<T extends Type>(
  type: T
): type is Exclude<T, NullType | ReferenceType> {
  return isNotNullType(type) && isNotReferenceType(type);
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
    return possibleRootTypes(typeTable.getOrError(type.name).type, typeTable);
  }
  if (isUnionType(type)) {
    return type.types.reduce<ConcreteType[]>(
      (acc, curr) => acc.concat(possibleRootTypes(curr, typeTable)),
      []
    );
  }

  if (isIntersectionType(type)) {
    const concreteTypes = type.types.reduce<ConcreteType[]>((acc, curr) => {
      return acc.concat(possibleRootTypes(curr, typeTable));
    }, []);
    // if they are all objects then reduce them into one object
    // to allow for proper serialization
    if (concreteTypes.every(isObjectType)) {
      return resolveIntersectionToNarrowestType(concreteTypes);
    }
    throw new Error("Intersection type does not evaluate only object types");
  }
  return [type];
}

export function dereferenceType(
  type: Type,
  typeTable: TypeTable
): Exclude<Type, ReferenceType> {
  if (isReferenceType(type)) {
    return dereferenceType(typeTable.getOrError(type.name).type, typeTable);
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
          (current ?? []).concat({
            value: dereferencedPropertyType.value,
            type
          })
        );
      }
    }
  }

  const candidateDiscriminators = [];

  for (const candidate of possibleDiscriminators.keys()) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

function getPrimitiveOrLiteralType<T extends Type, S extends LiteralType>(
  propertyTypeList: ObjectPropertiesType[],
  predicateLiteralFn: (type: Type) => type is S,
  predicateFn: (type: Type) => type is T
): ObjectPropertiesType {
  const literalType = propertyTypeList.find(property =>
    predicateLiteralFn(property.type)
  );
  if (literalType) {
    return literalType;
  } else {
    const primitiveType = propertyTypeList.find(property =>
      predicateFn(property.type)
    );
    return primitiveType!;
  }
}

/**
 * Given a list of types, if any property exists as both a string and
 * string literal on an intersection, then resolve it to the narrowest type
 *
 * @param types list of types
 */
export function resolveIntersectionToNarrowestType(
  types: Array<ObjectType>
): Array<ObjectType> {
  const possiblePropertyTypes = new Map<string, Array<ObjectPropertiesType>>();

  for (const type of types) {
    for (const property of type.properties) {
      const current = possiblePropertyTypes.get(property.name);
      possiblePropertyTypes.set(
        property.name,
        (current ?? new Array<ObjectPropertiesType>()).concat(property)
      );
    }
  }
  // console.log(possiblePropertyTypes);
  const narrowObjectPropertiesType: ObjectPropertiesType[] = [];
  Array.from(possiblePropertyTypes.values()).forEach(propertyTypeList => {
    // If there is a conflict of types `doesInterfaceEvaluatesToNever` will catch it, we expect that
    // this a safe place and only legal arguments can be sent
    // find the `literal`, only one is a legal literal. If present use
    // that as the type, else
    // if they are all string then change the type to the primitive
    if (
      areStringOrStringLiteralTypes(
        propertyTypeList.map(property => property.type)
      )
    ) {
      const objectPropertyType = getPrimitiveOrLiteralType(
        propertyTypeList,
        isStringLiteralType,
        isStringType
      );
      narrowObjectPropertiesType.push(objectPropertyType);
    } else if (
      areBooleanOrBooleanLiteralTypes(
        propertyTypeList.map(property => property.type)
      )
    ) {
      const objectPropertyType = getPrimitiveOrLiteralType(
        propertyTypeList,
        isBooleanLiteralType,
        isBooleanType
      );
      narrowObjectPropertiesType.push(objectPropertyType);
    } else if (
      areIntOrIntLiteralTypes(propertyTypeList.map(property => property.type))
    ) {
      const objectPropertyType = getPrimitiveOrLiteralType(
        propertyTypeList,
        isIntLiteralType,
        areIntTypes
      );
      narrowObjectPropertiesType.push(objectPropertyType);
    } else if (
      areFloatOrFloatLiteralTypes(
        propertyTypeList.map(property => property.type)
      )
    ) {
      const objectPropertyType = getPrimitiveOrLiteralType(
        propertyTypeList,
        isFloatLiteralType,
        isFloatType
      );
      narrowObjectPropertiesType.push(objectPropertyType);
    } else {
      narrowObjectPropertiesType.concat(propertyTypeList);
    }
  });
  return [objectType(narrowObjectPropertiesType)];
}

/**
 * Given a list of types, try to find if the intersection evaluates to
 * a `never` type
 *
 * @param types list of types
 * @param typeTable a TypeTable
 */
export function doesInterfaceEvaluatesToNever(
  types: Array<Type>,
  typeTable: TypeTable
): boolean {
  // the types on an intersection will always be an object at its root
  // this way we make sure we get an Object Type
  const concreteRootTypesExcludingNull = types
    .reduce<ConcreteType[]>((acc, type) => {
      return acc.concat(...possibleRootTypes(type, typeTable));
    }, [])
    .filter(isNotNullType)
    .filter(isObjectType);

  const possiblePropertyTypes = new Map<string, Array<Type>>();

  for (const type of concreteRootTypesExcludingNull) {
    for (const property of type.properties) {
      const current = possiblePropertyTypes.get(property.name);
      const dereferencedPropertyType = dereferenceType(
        property.type,
        typeTable
      );
      possiblePropertyTypes.set(
        property.name,
        (current ?? new Array<Type>()).concat(dereferencedPropertyType)
      );
    }
  }
  return Array.from(possiblePropertyTypes.values()).some(propertyTypeList => {
    // check for any potential conflicts in literal types for string,
    // int, boolean and floats. For example:
    // StringLiteralType("abc") and StringLiteralType("abc") are compatible.
    // Similarly StringLiteralType("abc") and StringType are compatible.
    // However StringLiteralType("abc") and StringLiteralType("def") are not.
    if (areStringOrStringLiteralTypes(propertyTypeList)) {
      return (
        new Set(propertyTypeList.filter(isStringLiteralType).map(v => v.value))
          .size > 1
      );
    } else if (areBooleanOrBooleanLiteralTypes(propertyTypeList)) {
      return (
        new Set(propertyTypeList.filter(isBooleanLiteralType).map(v => v.value))
          .size > 1
      );
    } else if (areIntOrIntLiteralTypes(propertyTypeList)) {
      return (
        new Set(propertyTypeList.filter(isIntLiteralType).map(v => v.value))
          .size > 1
      );
    } else if (areFloatOrFloatLiteralTypes(propertyTypeList)) {
      return (
        new Set(propertyTypeList.filter(isFloatLiteralType).map(v => v.value))
          .size > 1
      );
    }
    // Check for all other conflicts
    return new Set(propertyTypeList.map(v => v.kind)).size > 1;
  });
}

/**
 * Loci table is a lookup table for types.
 */
export class TypeTable {
  /**
   * Retrieve the number of entries in the type table.
   */
  get size(): number {
    return this.typeDefs.size;
  }

  static fromArray(
    typeTableArr: { name: string; typeDef: TypeDef }[]
  ): TypeTable {
    const entries = typeTableArr.reduce(
      (acc: [string, TypeDef][], t: { name: string; typeDef: TypeDef }) => {
        acc.push([t.name, t.typeDef]);
        return acc;
      },
      []
    );

    return new TypeTable(new Map(entries));
  }

  private typeDefs: Map<string, TypeDef>;

  constructor(types: Map<string, TypeDef> = new Map<string, TypeDef>()) {
    this.typeDefs = types;
  }

  /**
   * Return an object representation of the type table.
   */
  toArray(): { name: string; typeDef: TypeDef }[] {
    const arr = new Array<{ name: string; typeDef: TypeDef }>();
    this.typeDefs.forEach((typeDef, key) => {
      arr.push({ name: key, typeDef });
    });
    return arr;
  }

  /**
   * Add a type to the type table. If the type key is already present, `add` will throw an error.
   *
   * @param key lookup key
   * @param typeDef target type definition
   */
  add(key: string, typeDef: TypeDef): void {
    if (this.typeDefs.has(key)) {
      throw new Error(`Key already present in type table: ${key}`);
    }
    this.typeDefs.set(key, typeDef);
  }

  /**
   * Retrieve a type by lookup key.
   *
   * @param key lookup key
   */
  get(key: string): TypeDef | undefined {
    return this.typeDefs.get(key);
  }

  /**
   * Retrieve a type by lookup key.
   *
   * @param key lookup key
   */
  getOrError(key: string): TypeDef {
    const typeDef = this.get(key);
    if (typeDef === undefined) {
      throw new Error(`Key not present in type table: ${key}`);
    }
    return typeDef;
  }

  /**
   * Check if a type exists in the table.
   *
   * @param key lookup key
   */
  exists(key: string): boolean {
    return this.typeDefs.has(key);
  }
}

export interface TypeDef {
  type: Type;
  description?: string;
}
