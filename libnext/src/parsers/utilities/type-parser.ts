import { Type, TypeGuards, TypeNode, UnionTypeNode } from "ts-simple-ast";
import {
  NULL,
  BOOLEAN,
  STRING,
  NUMBER,
  booleanLiteral,
  stringLiteral,
  unionType,
  arrayType,
  DataType,
  objectType,
  ObjectTypeProperty,
  ObjectType,
  numberLiteral,
  referenceType,
  DATE,
  DATETIME,
  INTEGER,
  ReferenceType,
  Kind,
  PrimitiveLiteral,
  NumberType,
  IntegerType,
  StringType,
  DateType,
  DateTimeType,
  BooleanType,
  NullType
} from "../../models/types";
import {
  extractJsDocComment,
  extractPropertySignature,
  getTypeAliasDeclarationFromTypeReference
} from "./parser-utility";

/**
 * Convert an AST type node to a local data type.
 *
 * @param type AST type node
 */
export function parseType(typeNode: TypeNode): DataType {
  const type = typeNode.getType();

  if (type.isNull()) {
    return parseNull(typeNode);
  } else if (type.isBoolean()) {
    return parseBoolean(typeNode);
  } else if (type.isString()) {
    return parseString(typeNode);
  } else if (type.isNumber()) {
    return parseNumber(typeNode);
  } else if (type.isLiteral()) {
    return parseLiteralType(typeNode);
  } else if (type.isObject()) {
    return parseObjectTypes(typeNode);
  } else if (TypeGuards.isUnionTypeNode(typeNode)) {
    return parseUnionType(typeNode);
  } else {
    throw new Error("unknown type");
  }
}

/**
 * Parse a null type node.
 *
 * @param typeNode AST type node
 */
function parseNull(typeNode: TypeNode): ReferenceType | NullType {
  const type = typeNode.getType();
  if (!type.isNull()) {
    throw new Error("expected null");
  }
  if (TypeGuards.isTypeReferenceNode(typeNode)) {
    const typeAliasDeclaration = getTypeAliasDeclarationFromTypeReference(
      typeNode
    );
    const name = typeAliasDeclaration.getName();
    const location = typeAliasDeclaration.getSourceFile().getFilePath();
    return referenceType(
      name,
      location,
      parseType(typeAliasDeclaration.getTypeNodeOrThrow()).kind
    );
  } else {
    return NULL;
  }
}

/**
 * Parse a boolean type node.
 *
 * @param typeNode AST type node
 */
function parseBoolean(typeNode: TypeNode): ReferenceType | BooleanType {
  const type = typeNode.getType();
  if (!type.isBoolean()) {
    throw new Error("expected boolean");
  }
  if (TypeGuards.isTypeReferenceNode(typeNode)) {
    const typeAliasDeclaration = getTypeAliasDeclarationFromTypeReference(
      typeNode
    );
    const name = typeAliasDeclaration.getName();
    const location = typeAliasDeclaration.getSourceFile().getFilePath();
    return referenceType(
      name,
      location,
      parseType(typeAliasDeclaration.getTypeNodeOrThrow()).kind
    );
  } else {
    return BOOLEAN;
  }
}

/**
 * Parse a string type node.
 *
 * @param typeNode AST type node
 */
function parseString(
  typeNode: TypeNode
): ReferenceType | StringType | DateType | DateTimeType {
  const type = typeNode.getType();
  if (!type.isString()) {
    throw new Error("expected string");
  }
  if (TypeGuards.isTypeReferenceNode(typeNode)) {
    const typeAliasDeclaration = getTypeAliasDeclarationFromTypeReference(
      typeNode
    );
    const name = typeAliasDeclaration.getName();
    switch (name) {
      case "Date": {
        return DATE;
      }
      case "DateTime": {
        return DATETIME;
      }
      default: {
        return referenceType(
          name,
          typeAliasDeclaration.getSourceFile().getFilePath(),
          parseType(typeAliasDeclaration.getTypeNodeOrThrow()).kind
        );
      }
    }
  } else {
    return STRING;
  }
}

/**
 * Parse a number type node.
 *
 * @param typeNode AST type node
 */
function parseNumber(
  typeNode: TypeNode
): ReferenceType | NumberType | IntegerType {
  const type = typeNode.getType();
  if (!type.isNumber()) {
    throw new Error("expected number");
  }
  if (TypeGuards.isTypeReferenceNode(typeNode)) {
    const typeAliasDeclaration = getTypeAliasDeclarationFromTypeReference(
      typeNode
    );
    const name = typeAliasDeclaration.getName();
    switch (name) {
      case "Integer": {
        return INTEGER;
      }
      default: {
        return referenceType(
          name,
          typeAliasDeclaration.getSourceFile().getFilePath(),
          parseType(typeAliasDeclaration.getTypeNodeOrThrow()).kind
        );
      }
    }
  } else {
    return NUMBER;
  }
}

/**
 * AST literal types include literal booleans, strings and numbers.
 *
 * @param type AST type node
 */
function parseLiteralType(
  typeNode: TypeNode
): ReferenceType | PrimitiveLiteral {
  if (TypeGuards.isTypeReferenceNode(typeNode)) {
    const typeAliasDeclaration = getTypeAliasDeclarationFromTypeReference(
      typeNode
    );
    const name = typeAliasDeclaration.getName();
    const location = typeAliasDeclaration.getSourceFile().getFilePath();
    return referenceType(
      name,
      location,
      parseType(typeAliasDeclaration.getTypeNodeOrThrow()).kind
    );
  }
  return parseTargetLiteralType(typeNode.getType());
}

/**
 * Extract the literal value of a type.
 *
 * @param type AST type
 */
function parseTargetLiteralType(type: Type): PrimitiveLiteral {
  if (type.isBooleanLiteral()) {
    return booleanLiteral(type.getText() === "true");
  } else if (type.isStringLiteral()) {
    return stringLiteral(type.getText().substr(1, type.getText().length - 2));
  } else if (type.isNumberLiteral()) {
    return numberLiteral(Number(type.getText()));
  } else {
    throw new Error("expected an AST literal type");
  }
}

/**
 * AST object types include interfaces, arrays and object literals.
 *
 * @param type AST type node
 */
function parseObjectTypes(typeNode: TypeNode): DataType {
  const type = typeNode.getType();
  if (type.isInterface()) {
    return parseInterfaceType(type);
  } else if (TypeGuards.isArrayTypeNode(typeNode)) {
    return arrayType(parseType(typeNode.getElementTypeNode()));
  } else if (type.isObject()) {
    return parseObjectLiteralType(type);
  } else {
    throw new Error("expected an AST object type");
  }
}

/**
 * Parse an interface type.
 *
 * @param type AST type
 */
function parseInterfaceType(type: Type): ReferenceType {
  if (!type.isInterface()) {
    throw new Error("expected interface type");
  }
  // TODO: how to handle if type aliased?
  const declarations = type.getSymbolOrThrow().getDeclarations();
  if (declarations.length !== 1) {
    throw new Error("expected exactly one interface declaration");
  }
  const interfaceDeclaration = declarations[0];
  if (!TypeGuards.isInterfaceDeclaration(interfaceDeclaration)) {
    throw new Error("expected an interface declaration");
  }
  const interfaceName = interfaceDeclaration.getName();
  const location = interfaceDeclaration.getSourceFile().getFilePath();

  return referenceType(interfaceName, location, Kind.Object);
}

/**
 * Parse an object literal type.
 *
 * @param type AST type
 */
export function parseObjectLiteralType(type: Type): ObjectType {
  const objectProperties: ObjectTypeProperty[] = type
    .getProperties()
    .map(property => {
      const propertySignature = extractPropertySignature(property);
      return {
        name: propertySignature.getName(),
        description: extractJsDocComment(propertySignature),
        type: parseType(propertySignature.getTypeNodeOrThrow()),
        optional: propertySignature.hasQuestionToken()
      };
    });
  return objectType(objectProperties);
}

/**
 * Parse a union type node.
 *
 * @param typeNode union type node
 */
function parseUnionType(typeNode: UnionTypeNode): DataType {
  // TODO: support for type aliasing
  const allowedUnionTargetTypes = typeNode
    .getTypeNodes()
    .filter(utype => !utype.getType().isUndefined());
  if (allowedUnionTargetTypes.length === 1) {
    // not a union
    return parseType(allowedUnionTargetTypes[0]);
  } else if (allowedUnionTargetTypes.length > 1) {
    return unionType(allowedUnionTargetTypes.map(utype => parseType(utype)));
  } else {
    throw new Error("union type error");
  }
}
