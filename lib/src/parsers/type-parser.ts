import {
  ArrayTypeNode,
  IndexedAccessTypeNode,
  InterfaceDeclaration,
  IntersectionTypeNode,
  LiteralTypeNode,
  Node,
  TypeAliasDeclaration,
  TypeLiteralNode,
  TypeNode,
  TypeReferenceNode,
  UnionTypeNode
} from "ts-morph";
import { ParserError, TypeNotAllowedError } from "../errors";
import { LociTable } from "../locations";
import {
  ArrayType,
  arrayType,
  BooleanLiteralType,
  booleanLiteralType,
  booleanType,
  DateTimeType,
  dateTimeType,
  dateType,
  DateType,
  doubleType,
  DoubleType,
  floatLiteralType,
  FloatLiteralType,
  floatType,
  FloatType,
  inferDiscriminator,
  int32Type,
  Int32Type,
  int64Type,
  Int64Type,
  intLiteralType,
  IntLiteralType,
  nullType,
  ObjectType,
  objectType,
  ReferenceType,
  referenceType,
  StringLiteralType,
  stringLiteralType,
  stringType,
  StringType,
  Type,
  TypeKind,
  TypeTable,
  unionType,
  NullType,
  intersectionType,
  doesInterfaceEvaluatesToNever,
  possibleRootTypes,
  isObjectType,
  isSchemaPropAllowedType
} from "../types";
import { err, ok, Result } from "../util";
import { getJsDoc, getPropertyName } from "./parser-helpers";
import { extractJSDocSchemaProps } from "./schemaprop-parser";

export function parseType(
  typeNode: TypeNode,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Type, ParserError> {
  // Type references must be parsed first to ensure internal type aliases are handled
  if (Node.isTypeReference(typeNode)) {
    if (
      typeNode.getType().isArray() &&
      typeNode.getTypeArguments().length > 0
    ) {
      // TypeScript forbids use of Array constructor without at least one type argument
      return parseArrayConstructorType(typeNode, typeTable, lociTable);
    }
    return parseTypeReference(typeNode, typeTable, lociTable);
    // TODO: discourage native boolean keyword?
  } else if (Node.isBooleanKeyword(typeNode)) {
    return ok(booleanType());
    // TODO: discourage native string keyword?
  } else if (Node.isStringKeyword(typeNode)) {
    return ok(stringType());
    // TODO: discourage native number keyword?
  } else if (Node.isNumberKeyword(typeNode)) {
    return ok(floatType());
  } else if (Node.isLiteralTypeNode(typeNode)) {
    return parseLiteralType(typeNode);
  } else if (Node.isArrayTypeNode(typeNode)) {
    return parseArrayType(typeNode, typeTable, lociTable);
  } else if (Node.isTypeLiteral(typeNode)) {
    return parseObjectLiteralType(typeNode, typeTable, lociTable);
  } else if (Node.isUnionTypeNode(typeNode)) {
    return parseUnionType(typeNode, typeTable, lociTable);
  } else if (Node.isIndexedAccessTypeNode(typeNode)) {
    return parseIndexedAccessType(typeNode, typeTable, lociTable);
  } else if (Node.isIntersectionTypeNode(typeNode)) {
    return parseIntersectionTypeNode(typeNode, typeTable, lociTable);
  } else {
    throw new TypeNotAllowedError("unknown type", {
      file: typeNode.getSourceFile().getFilePath(),
      position: typeNode.getPos()
    });
  }
}

// TODO: store this somewhere else to be more typesafe
const SPOT_TYPE_ALIASES = [
  "Date",
  "DateTime",
  "Number",
  "Double",
  "Float",
  "Integer",
  "Int32",
  "Int64",
  "String"
];

/**
 * Parse an reference node. Reference nodes refer to type aliases and interfaces.
 *
 * @param typeNode AST type node
 * @param typeTable a TypeTable
 * @param lociTable a LociTable
 */
function parseTypeReference(
  typeNode: TypeReferenceNode,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<
  | ReferenceType
  | StringType
  | DateType
  | DateTimeType
  | FloatType
  | DoubleType
  | Int32Type
  | Int64Type,
  ParserError
> {
  const declarationResult = getTargetDeclarationFromTypeReference(typeNode);
  if (declarationResult.isErr()) return declarationResult;

  const declaration = declarationResult.unwrap();
  const name = declaration.getName();
  const jsDocNode = getJsDoc(declaration);
  const description = jsDocNode?.getDescription().trim();

  if (Node.isTypeAliasDeclaration(declaration)) {
    const decTypeNode = declaration.getTypeNodeOrThrow();
    // if the type name is one of of the internal ones ensure they have not been redefined
    // TODO: introduce some more type safety
    if (SPOT_TYPE_ALIASES.includes(name)) {
      if (Node.isTypeReference(decTypeNode)) {
        throw new Error(`Internal type ${name} must not be redefined`);
      } else if (declaration.getType().isString()) {
        switch (name) {
          case "String":
            return ok(stringType());
          case "Date":
            return ok(dateType());
          case "DateTime":
            return ok(dateTimeType());
          default:
            throw new Error(`Internal type ${name} must not be redefined`);
        }
      } else if (declaration.getType().isNumber()) {
        switch (name) {
          case "Number":
          case "Float":
            return ok(floatType());
          case "Double":
            return ok(doubleType());
          case "Integer":
          case "Int32":
            return ok(int32Type());
          case "Int64":
            return ok(int64Type());
          default:
            throw new Error(`Internal type ${name} must not be redefined`);
        }
      } else {
        throw new Error(`Internal type ${name} must not be redefined`);
      }
    } else {
      if (typeTable.exists(name)) {
        if (!lociTable.equalsMorphNode(LociTable.typeKey(name), decTypeNode)) {
          throw new Error(`Type ${name} defined multiple times`);
        }
      } else {
        const targetTypeResult = parseType(decTypeNode, typeTable, lociTable);
        if (targetTypeResult.isErr()) return targetTypeResult;
        const type = targetTypeResult.unwrap();
        const schemaProps = extractJSDocSchemaProps(jsDocNode, type);
        if (schemaProps && schemaProps.isErr()) return schemaProps;
        if (isSchemaPropAllowedType(type)) {
          type.schemaProps = schemaProps?.unwrap();
        }
        typeTable.add(name, {
          type,
          description
        });
        lociTable.addMorphNode(LociTable.typeKey(name), decTypeNode);
      }
      return ok(referenceType(name));
    }
  } else {
    if (SPOT_TYPE_ALIASES.includes(name)) {
      throw new Error(`Internal type ${name} must not be redefined`);
    } else {
      if (typeTable.exists(name)) {
        if (!lociTable.equalsMorphNode(LociTable.typeKey(name), declaration)) {
          throw new Error(`Type ${name} defined multiple times`);
        }
      } else {
        const targetTypeResult = parseInterfaceDeclaration(
          declaration,
          typeTable,
          lociTable
        );
        if (targetTypeResult.isErr()) return targetTypeResult;
        const type = targetTypeResult.unwrap();
        const schemaProps = extractJSDocSchemaProps(jsDocNode, type);
        if (schemaProps && schemaProps.isErr()) return schemaProps;
        type.schemaProps = schemaProps?.unwrap();
        typeTable.add(name, {
          type,
          description
        });
        lociTable.addMorphNode(LociTable.typeKey(name), declaration);
      }
      return ok(referenceType(name));
    }
  }
}

/**
 * AST literal types include literal booleans, strings and numbers.
 *
 * @param typeNode AST type node
 */
function parseLiteralType(
  typeNode: LiteralTypeNode
): Result<
  | BooleanLiteralType
  | StringLiteralType
  | FloatLiteralType
  | IntLiteralType
  | NullType,
  ParserError
> {
  const literal = typeNode.getLiteral();
  if (Node.isTrueLiteral(literal) || Node.isFalseLiteral(literal)) {
    return ok(booleanLiteralType(literal.getLiteralValue()));
  } else if (Node.isStringLiteral(literal)) {
    return ok(stringLiteralType(literal.getLiteralText()));
  } else if (Node.isNumericLiteral(literal)) {
    const numericValue = literal.getLiteralValue();
    return ok(
      Number.isInteger(numericValue)
        ? intLiteralType(numericValue)
        : floatLiteralType(numericValue)
    );
  } else if (Node.isNullLiteral(literal)) {
    return ok(nullType());
  } else {
    return err(
      new TypeNotAllowedError("unexpected literal type", {
        file: typeNode.getSourceFile().getFilePath(),
        position: typeNode.getPos()
      })
    );
  }
}

/**
 * Parse an array node.
 *
 * @param typeNode AST type node
 * @param typeTable a TypeTable
 * @param lociTable a LociTable
 *
 * @example
 * ```ts
 * let array: string[];
 * ```
 */
function parseArrayType(
  typeNode: ArrayTypeNode,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<ArrayType, ParserError> {
  const elementDataTypeResult = parseType(
    typeNode.getElementTypeNode(),
    typeTable,
    lociTable
  );

  if (elementDataTypeResult.isErr()) return elementDataTypeResult;

  return ok(arrayType(elementDataTypeResult.unwrap()));
}

/**
 * Parse an array constructor type.
 *
 * @param typeNode AST type node
 * @param typeTable a TypeTable
 * @param lociTable a LociTable
 */
function parseArrayConstructorType(
  typeNode: TypeReferenceNode,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<ArrayType, ParserError> {
  const typeArguments = typeNode.getTypeArguments();

  if (typeArguments.length !== 1) {
    return err(
      new ParserError("Array types must declare exactly one argument", {
        file: typeNode.getSourceFile().getFilePath(),
        position: typeNode.getPos()
      })
    );
  }

  const elementDataTypeResult = parseType(
    typeArguments[0],
    typeTable,
    lociTable
  );

  if (elementDataTypeResult.isErr()) return elementDataTypeResult;

  return ok(arrayType(elementDataTypeResult.unwrap()));
}

/**
 * Parse an object literal type.
 *
 * NOTE: this parser is limited to `TypeLiteralNode`s. Although `InterfaceDeclaration`s have
 * a very similar structure (both extend `TypeElementMemberedNode`), `InterfaceDeclaration`s
 * may additionally extend other `InterfaceDeclaration`s which should be considered separately.
 *
 * @param typeNode AST type node
 * @param typeTable a TypeTable
 * @param lociTable a LociTable
 */
function parseObjectLiteralType(
  typeNode: TypeLiteralNode,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<ObjectType, ParserError> {
  const indexSignatures = typeNode.getIndexSignatures();
  if (indexSignatures.length > 0) {
    return err(
      new TypeNotAllowedError("indexed types are not supported", {
        file: indexSignatures[0].getSourceFile().getFilePath(),
        position: indexSignatures[0].getPos()
      })
    );
  }

  const objectProperties = [];
  for (const ps of typeNode.getProperties()) {
    const propTypeResult = parseType(
      ps.getTypeNodeOrThrow(),
      typeTable,
      lociTable
    );

    if (propTypeResult.isErr()) return propTypeResult;
    const type = propTypeResult.unwrap();

    const schemaProps = extractJSDocSchemaProps(getJsDoc(ps), type);
    if (schemaProps && schemaProps.isErr()) return schemaProps;
    if (isSchemaPropAllowedType(type)) {
      type.schemaProps = schemaProps?.unwrap();
    }

    const prop = {
      name: getPropertyName(ps),
      description: getJsDoc(ps)?.getDescription().trim(),
      type: propTypeResult.unwrap(),
      optional: ps.hasQuestionToken()
    };

    objectProperties.push(prop);
  }

  return ok(objectType(objectProperties));
}

/**
 * Parse an interface declaration. Resulting object properties will
 * include those from the extended interface hierarchy.
 *
 * @param interfaceDeclaration interface declaration
 * @param typeTable a TypeTable
 * @param lociTable a LociTable
 */
function parseInterfaceDeclaration(
  interfaceDeclaration: InterfaceDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<ObjectType, ParserError> {
  const indexSignatures = interfaceDeclaration.getIndexSignatures();
  if (indexSignatures.length > 0) {
    return err(
      new TypeNotAllowedError("indexed types are not supported", {
        file: indexSignatures[0].getSourceFile().getFilePath(),
        position: indexSignatures[0].getPos()
      })
    );
  }

  const propertySignatures = interfaceDeclaration
    .getType()
    .getProperties()
    .map(propertySymbol => {
      const vd = propertySymbol.getValueDeclarationOrThrow();
      if (!Node.isPropertySignature(vd)) {
        throw new Error("expected property signature");
      }
      return vd;
    });

  const objectProperties = [];
  for (const ps of propertySignatures) {
    const propTypeResult = parseType(
      ps.getTypeNodeOrThrow(),
      typeTable,
      lociTable
    );

    if (propTypeResult.isErr()) return propTypeResult;
    const type = propTypeResult.unwrap();

    const schemaProps = extractJSDocSchemaProps(getJsDoc(ps), type);
    if (schemaProps && schemaProps.isErr()) return schemaProps;
    if (isSchemaPropAllowedType(type)) {
      type.schemaProps = schemaProps?.unwrap();
    }

    const prop = {
      name: getPropertyName(ps),
      description: getJsDoc(ps)?.getDescription().trim(),
      type: propTypeResult.unwrap(),
      optional: ps.hasQuestionToken()
    };

    objectProperties.push(prop);
  }

  return ok(objectType(objectProperties));
}

/**
 * Parse a union type node.
 *
 * @param typeNode union type node
 * @param typeTable a TypeTable
 * @param lociTable a LociTable
 */
function parseUnionType(
  typeNode: UnionTypeNode,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Type, ParserError> {
  const allowedTargetTypes = typeNode
    .getTypeNodes()
    .filter(type => !type.getType().isUndefined());

  switch (allowedTargetTypes.length) {
    case 0:
      return err(
        new TypeNotAllowedError("malformed union type", {
          file: typeNode.getSourceFile().getFilePath(),
          position: typeNode.getPos()
        })
      );
    case 1:
      // not a union
      return parseType(allowedTargetTypes[0], typeTable, lociTable);
    default: {
      const types = [];
      for (const tn of allowedTargetTypes) {
        const typeResult = parseType(tn, typeTable, lociTable);
        if (typeResult.isErr()) return typeResult;
        types.push(typeResult.unwrap());
      }
      return ok(unionType(types, inferDiscriminator(types, typeTable)));
    }
  }
}

/**
 * Parse an intersection type node.
 *
 * @param typeNode intersection type node
 * @param typeTable a TypeTable
 * @param lociTable a LociTable
 */
function parseIntersectionTypeNode(
  typeNode: IntersectionTypeNode,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Type, ParserError> {
  const allowedTargetTypes = typeNode
    .getTypeNodes()
    .filter(type => !type.getType().isUndefined());
  const types: Type[] = [];
  for (const tn of allowedTargetTypes) {
    const typeResult = parseType(tn, typeTable, lociTable);
    if (typeResult.isErr()) return typeResult;
    // Only allow objects, unions, intersections and references
    const typeResultType = typeResult.unwrap();
    const concreteTypes = possibleRootTypes(typeResultType, typeTable);
    if (!concreteTypes.every(isObjectType)) {
      return err(
        new TypeNotAllowedError(
          "Cannot use primitive types in an intersection type",
          {
            file: typeNode.getSourceFile().getFilePath(),
            position: typeNode.getPos()
          }
        )
      );
    }
    types.push(typeResultType);
  }
  if (doesInterfaceEvaluatesToNever(types, typeTable)) {
    return err(
      new TypeNotAllowedError(
        "intersection evaluates to never and is an illegal argument",
        {
          file: typeNode.getSourceFile().getFilePath(),
          position: typeNode.getPos()
        }
      )
    );
  }
  return ok(intersectionType(types));
}

/**
 * Parse a indexed access type node.
 *
 * @param typeNode AST type node
 * @param typeTable a TypeTable
 * @param lociTable a LociTable
 */
function parseIndexedAccessType(
  typeNode: IndexedAccessTypeNode,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Type, ParserError> {
  const propertyAccessChainResult =
    resolveIndexAccessPropertyAccessChain(typeNode);
  if (propertyAccessChainResult.isErr()) return propertyAccessChainResult;

  const rootReferenceResult = resolveIndexedAccessRootReference(typeNode);
  if (rootReferenceResult.isErr()) return rootReferenceResult;

  const refTypeResult = parseTypeReference(
    rootReferenceResult.unwrap(),
    typeTable,
    lociTable
  );
  if (refTypeResult.isErr()) return refTypeResult;
  const refType = refTypeResult.unwrap();
  if (refType.kind !== TypeKind.REFERENCE) {
    return err(
      new TypeNotAllowedError("Indexed access type must be reference", {
        file: typeNode.getSourceFile().getFilePath(),
        position: typeNode.getPos()
      })
    );
  }
  const resolvedType = resolveIndexedAccessType(
    propertyAccessChainResult.unwrap(),
    refType,
    typeTable
  );

  return ok(resolvedType);
}

/**
 * Resolve the target type for an indexed access type.
 *
 * @param propertyChain properties to traverse
 * @param currentType type to inspect
 * @param typeTable a TypeTable
 */
function resolveIndexedAccessType(
  propertyChain: string[],
  currentType: Type,
  typeTable: TypeTable
): Type {
  if (propertyChain.length === 0) return currentType;
  if (currentType.kind === TypeKind.OBJECT) {
    const property = currentType.properties.find(
      p => p.name === propertyChain[0]
    );
    if (property === undefined) {
      throw new Error("Indexed type property not found");
    }
    return resolveIndexedAccessType(
      propertyChain.slice(1),
      property.type,
      typeTable
    );
  }
  if (currentType.kind === TypeKind.REFERENCE) {
    const referencedType = typeTable.getOrError(currentType.name).type;
    return resolveIndexedAccessType(propertyChain, referencedType, typeTable);
  }
  throw new Error("Indexed type error");
}

/**
 * Resolve the root reference type of an indexed access type.
 *
 * @param typeNode an indexed access type node
 */
function resolveIndexedAccessRootReference(
  typeNode: IndexedAccessTypeNode
): Result<TypeReferenceNode, ParserError> {
  const objectType = typeNode.getObjectTypeNode();
  if (Node.isIndexedAccessTypeNode(objectType)) {
    return resolveIndexedAccessRootReference(objectType);
  }
  if (!Node.isTypeReference(objectType)) {
    return err(
      new TypeNotAllowedError("Indexed access type must be reference", {
        file: objectType.getSourceFile().getFilePath(),
        position: objectType.getPos()
      })
    );
  }
  return ok(objectType);
}

/**
 * Resolve the property access chain of an indexed access type.
 *
 * @param typeNode an indexed access type node
 * @param accResult property chain result accumulator
 */
function resolveIndexAccessPropertyAccessChain(
  typeNode: IndexedAccessTypeNode,
  accResult: Result<string[], ParserError> = ok([])
): Result<string[], ParserError> {
  if (accResult.isErr()) return accResult;
  const acc = accResult.unwrap();

  const literalTypeNode = typeNode.getIndexTypeNode();
  if (!Node.isLiteralTypeNode(literalTypeNode)) {
    throw new Error("expected type literal");
  }
  const literalTypeResult = parseLiteralType(literalTypeNode);
  if (literalTypeResult.isErr()) return literalTypeResult;
  const literalType = literalTypeResult.unwrap();
  if (literalType.kind !== TypeKind.STRING_LITERAL) {
    throw new Error("expected string literal");
  }

  const chainParent = typeNode.getObjectTypeNode();
  if (Node.isIndexedAccessTypeNode(chainParent)) {
    return resolveIndexAccessPropertyAccessChain(
      chainParent,
      ok(acc.concat(literalType.value))
    );
  }

  return ok(acc.concat(literalType.value).reverse());
}

/**
 * Extract the target type alias declaration or interface declaration
 * of a type reference.
 *
 * @param typeReference AST type reference node
 */
export function getTargetDeclarationFromTypeReference(
  typeReference: TypeReferenceNode
): Result<TypeAliasDeclaration | InterfaceDeclaration, ParserError> {
  // TODO: check logic
  const symbol = typeReference.getTypeName().getSymbolOrThrow();
  // if the symbol is an alias, it means it the reference is declared from an import
  const targetSymbol = symbol.isAlias()
    ? symbol.getAliasedSymbolOrThrow()
    : symbol;
  const declarations = targetSymbol.getDeclarations();
  const location = typeReference.getSourceFile().getFilePath();
  const line = typeReference.getStartLineNumber();
  const typeName = symbol.getName();

  if (typeName === "Map") {
    return err(
      new TypeNotAllowedError("Map type is not supported", {
        file: location,
        position: typeReference.getPos()
      })
    );
  }

  if (declarations.length !== 1) {
    // String interface must not be redefined and must be imported from the Spot native types
    const errorMsg = `${location}#${line}: expected exactly one declaration for ${typeName}`;
    if (typeName === "String") {
      throw new Error(
        `${errorMsg}\nDid you forget to import String? => import { String } from "@airtasker/spot"`
      );
    } else {
      throw new Error(errorMsg);
    }
    // TODO: same for other internal custom types e.g. Number
  }
  const targetDeclaration = declarations[0];

  // Enums are not supported:
  // enum SomeEnum { A, B, C }
  if (Node.isEnumDeclaration(targetDeclaration)) {
    return err(
      new TypeNotAllowedError("Enums are not supported", {
        file: targetDeclaration.getSourceFile().getFilePath(),
        position: targetDeclaration.getPos()
      })
    );
  }

  // References to enum constants (e.g SomeEnum.A) are not supported either.
  if (Node.isEnumMember(targetDeclaration)) {
    return err(
      new TypeNotAllowedError("Enums are not supported", {
        file: targetDeclaration.getSourceFile().getFilePath(),
        position: targetDeclaration.getPos()
      })
    );
  }

  if (
    Node.isInterfaceDeclaration(targetDeclaration) ||
    Node.isTypeAliasDeclaration(targetDeclaration)
  ) {
    return ok(targetDeclaration);
  }

  return err(
    new TypeNotAllowedError("expected a type alias or interface declaration", {
      file: targetDeclaration.getSourceFile().getFilePath(),
      position: targetDeclaration.getPos()
    })
  );
}
