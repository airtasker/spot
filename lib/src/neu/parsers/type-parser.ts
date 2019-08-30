import {
  ArrayTypeNode,
  InterfaceDeclaration,
  LiteralTypeNode,
  TypeAliasDeclaration,
  TypeGuards,
  TypeLiteralNode,
  TypeNode,
  TypeReferenceNode,
  UnionTypeNode
} from "ts-morph";
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
  TypeTable,
  unionType
} from "../types";
import { getJsDoc, getPropertyName } from "./parser-helpers";

export function parseType(
  typeNode: TypeNode,
  typeTable: TypeTable,
  lociTable: LociTable
): Type {
  // Type references must be parsed first to ensure internal type aliases are handled
  if (TypeGuards.isTypeReferenceNode(typeNode)) {
    return parseTypeReference(typeNode, typeTable, lociTable);
  } else if (TypeGuards.isNullLiteral(typeNode)) {
    return nullType();
    // TODO: discourage native boolean keyword?
  } else if (TypeGuards.isBooleanKeyword(typeNode)) {
    return booleanType();
    // TODO: discourage native string keyword?
  } else if (TypeGuards.isStringKeyword(typeNode)) {
    return stringType();
    // TODO: discourage native number keyword?
  } else if (TypeGuards.isNumberKeyword(typeNode)) {
    return floatType();
  } else if (TypeGuards.isLiteralTypeNode(typeNode)) {
    return parseLiteralType(typeNode);
  } else if (TypeGuards.isArrayTypeNode(typeNode)) {
    return parseArrayType(typeNode, typeTable, lociTable);
  } else if (TypeGuards.isTypeLiteralNode(typeNode)) {
    return parseObjectLiteralType(typeNode, typeTable, lociTable);
  } else if (TypeGuards.isUnionTypeNode(typeNode)) {
    return parseUnionType(typeNode, typeTable, lociTable);
  } else {
    throw new Error("unknown type");
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
):
  | ReferenceType
  | StringType
  | DateType
  | DateTimeType
  | FloatType
  | DoubleType
  | Int32Type
  | Int64Type {
  const declaration = getTargetDeclarationFromTypeReference(typeNode);
  const name = declaration.getName();
  if (TypeGuards.isTypeAliasDeclaration(declaration)) {
    const decTypeNode = declaration.getTypeNodeOrThrow();
    // if the type name is one of of the internal ones ensure they have not been redefined
    // TODO: introduce some more type safety
    if (SPOT_TYPE_ALIASES.includes(name)) {
      if (TypeGuards.isTypeReferenceNode(decTypeNode)) {
        throw new Error(`Internal type ${name} must not be redefined`);
      } else if (declaration.getType().isString()) {
        switch (name) {
          case "String":
            return stringType();
          case "Date":
            return dateType();
          case "DateTime":
            return dateTimeType();
          default:
            throw new Error(`Internal type ${name} must not be redefined`);
        }
      } else if (declaration.getType().isNumber()) {
        switch (name) {
          case "Number":
          case "Float":
            return floatType();
          case "Double":
            return doubleType();
          case "Integer":
          case "Int32":
            return int32Type();
          case "Int64":
            return int64Type();
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
        const targetType = parseType(decTypeNode, typeTable, lociTable);
        typeTable.add(name, targetType);
        lociTable.addMorphNode(LociTable.typeKey(name), decTypeNode);
      }
      return referenceType(name);
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
        const targetType = parseInterfaceDeclaration(
          declaration,
          typeTable,
          lociTable
        );
        typeTable.add(name, targetType);
        lociTable.addMorphNode(LociTable.typeKey(name), declaration);
      }
      return referenceType(name);
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
): BooleanLiteralType | StringLiteralType | FloatLiteralType | IntLiteralType {
  const literal = typeNode.getLiteral();
  if (TypeGuards.isBooleanLiteral(literal)) {
    return booleanLiteralType(literal.getLiteralValue());
  } else if (TypeGuards.isStringLiteral(literal)) {
    return stringLiteralType(literal.getLiteralText());
  } else if (TypeGuards.isNumericLiteral(literal)) {
    const numericValue = literal.getLiteralValue();
    return Number.isInteger(numericValue)
      ? intLiteralType(numericValue)
      : floatLiteralType(numericValue);
  } else {
    throw new Error("unexpected literal type");
  }
}

/**
 * Parse an array node.
 *
 * @param typeNode AST type node
 * @param typeTable a TypeTable
 * @param lociTable a LociTable
 */
function parseArrayType(
  typeNode: ArrayTypeNode,
  typeTable: TypeTable,
  lociTable: LociTable
): ArrayType {
  const elementDataType = parseType(
    typeNode.getElementTypeNode(),
    typeTable,
    lociTable
  );
  return arrayType(elementDataType);
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
): ObjectType {
  if (typeNode.getIndexSignatures().length > 0) {
    throw new Error("indexed types are not supported");
  }
  const objectProperties = typeNode.getProperties().map(ps => {
    const psDescription = getJsDoc(ps);
    return {
      name: getPropertyName(ps),
      description: psDescription && psDescription.getComment(),
      type: parseType(ps.getTypeNodeOrThrow(), typeTable, lociTable),
      optional: ps.hasQuestionToken()
    };
  });
  return objectType(objectProperties);
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
): ObjectType {
  if (interfaceDeclaration.getIndexSignatures().length > 0) {
    throw new Error("indexed types are not supported");
  }
  const objectProperties = interfaceDeclaration
    .getType()
    .getProperties()
    .map(propertySymbol => {
      const vd = propertySymbol.getValueDeclarationOrThrow();
      if (!TypeGuards.isPropertySignature(vd)) {
        throw new Error("expected property signature");
      }
      return vd;
    })
    .map(ps => {
      const psDescription = getJsDoc(ps);
      return {
        name: getPropertyName(ps),
        description: psDescription && psDescription.getComment(),
        type: parseType(ps.getTypeNodeOrThrow(), typeTable, lociTable),
        optional: ps.hasQuestionToken()
      };
    });
  return objectType(objectProperties);
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
): Type {
  const allowedTargetTypes = typeNode
    .getTypeNodes()
    .filter(type => !type.getType().isUndefined());
  if (allowedTargetTypes.length === 1) {
    // not a union
    return parseType(allowedTargetTypes[0], typeTable, lociTable);
  } else if (allowedTargetTypes.length > 1) {
    return unionType(
      allowedTargetTypes.map(type => parseType(type, typeTable, lociTable))
    );
  } else {
    throw new Error("union type error");
  }
}

/**
 * Extract the target type alias declaration or interface declaration
 * of a type reference.
 *
 * @param typeReference AST type reference node
 */
function getTargetDeclarationFromTypeReference(
  typeReference: TypeReferenceNode
): TypeAliasDeclaration | InterfaceDeclaration {
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
    const errorMsg = `${location}#${line}: Map is not supported`;
    throw new Error(errorMsg);
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
  if (TypeGuards.isEnumDeclaration(targetDeclaration)) {
    throw new Error(
      `enums are not supported (offending type: ${targetDeclaration.getName()})`
    );
  }

  // References to enum constants (e.g SomeEnum.A) are not supported either.
  if (TypeGuards.isEnumMember(targetDeclaration)) {
    throw new Error(
      `enums are not supported (offending type: ${targetDeclaration
        .getParent()
        .getName()})`
    );
  }

  if (
    TypeGuards.isInterfaceDeclaration(targetDeclaration) ||
    TypeGuards.isTypeAliasDeclaration(targetDeclaration)
  ) {
    return targetDeclaration;
  }

  throw new Error("expected a type alias or interface declaration");
}
