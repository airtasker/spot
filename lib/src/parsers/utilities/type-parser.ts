import {
  ArrayTypeNode,
  InterfaceDeclaration,
  LiteralTypeNode,
  TypeGuards,
  TypeLiteralNode,
  TypeNode,
  TypeReferenceNode,
  UnionTypeNode
} from "ts-simple-ast";
import {
  arrayType,
  ArrayType,
  BOOLEAN,
  booleanLiteral,
  CustomPrimitiveType,
  DataType,
  DATE,
  DATETIME,
  INTEGER,
  NULL,
  NUMBER,
  numberLiteral,
  objectType,
  ObjectType,
  ObjectTypeProperty,
  PrimitiveLiteral,
  referenceType,
  ReferenceType,
  STRING,
  stringLiteral,
  TypeKind,
  unionType
} from "../../models/types";
import {
  extractJsDocComment,
  getTargetDeclarationFromTypeReference
} from "./parser-utility";

/**
 * Convert an AST type node to a local data type.
 *
 * @param type AST type node
 */
export function parseTypeNode(typeNode: TypeNode): DataType {
  // Type references must be parsed first to ensure internal type aliases are handled
  if (TypeGuards.isTypeReferenceNode(typeNode)) {
    return parseTypeReference(typeNode);
  } else if (TypeGuards.isNullLiteral(typeNode)) {
    return NULL;
  } else if (TypeGuards.isBooleanKeyword(typeNode)) {
    return BOOLEAN;
  } else if (TypeGuards.isStringKeyword(typeNode)) {
    return STRING;
  } else if (TypeGuards.isNumberKeyword(typeNode)) {
    return NUMBER;
  } else if (TypeGuards.isLiteralTypeNode(typeNode)) {
    return parseLiteralType(typeNode);
  } else if (TypeGuards.isArrayTypeNode(typeNode)) {
    return parseArrayType(typeNode);
  } else if (TypeGuards.isTypeLiteralNode(typeNode)) {
    return parseObjectLiteralType(typeNode);
  } else if (TypeGuards.isUnionTypeNode(typeNode)) {
    return parseUnionType(typeNode);
  } else {
    throw new Error("unknown type");
  }
}

/**
 * Parse an reference node. Reference nodes refer to type aliases and interfaces.
 *
 * @param typeNode AST type node
 */
function parseTypeReference(
  typeNode: TypeReferenceNode
): ReferenceType | CustomPrimitiveType {
  const declaration = getTargetDeclarationFromTypeReference(typeNode);
  const name = declaration.getName();
  if (TypeGuards.isTypeAliasDeclaration(declaration)) {
    const targetTypeNode = declaration.getTypeNodeOrThrow();
    // if the type name is one of of the internal ones ensure they have not been redefined
    if (["Date", "DateTime", "Integer"].includes(name)) {
      if (TypeGuards.isTypeReferenceNode(targetTypeNode)) {
        throw new Error(`Internal type ${name} must not be redefined`);
      } else if (declaration.getType().isString()) {
        switch (name) {
          case "Date":
            return DATE;
          case "DateTime":
            return DATETIME;
          default:
            throw new Error(`Internal type ${name} must not be redefined`);
        }
      } else if (declaration.getType().isNumber()) {
        switch (name) {
          case "Integer":
            return INTEGER;
          default:
            throw new Error(`Internal type ${name} must not be redefined`);
        }
      } else {
        throw new Error(`Internal type ${name} must not be redefined`);
      }
    } else {
      return referenceType(
        name,
        declaration.getSourceFile().getFilePath(),
        parseTypeNode(targetTypeNode).kind
      );
    }
  } else {
    if (["Date", "DateTime", "Integer"].includes(name)) {
      throw new Error(`Internal type ${name} must not be redefined`);
    } else {
      return referenceType(
        name,
        declaration.getSourceFile().getFilePath(),
        TypeKind.OBJECT
      );
    }
  }
}

/**
 * AST literal types include literal booleans, strings and numbers.
 *
 * @param typeNode AST type node
 */
function parseLiteralType(typeNode: LiteralTypeNode): PrimitiveLiteral {
  const literal = typeNode.getLiteral();
  if (TypeGuards.isBooleanLiteral(literal)) {
    return booleanLiteral(literal.getLiteralValue());
  } else if (TypeGuards.isStringLiteral(literal)) {
    return stringLiteral(literal.getLiteralText());
  } else if (TypeGuards.isNumericLiteral(literal)) {
    return numberLiteral(literal.getLiteralValue());
  } else {
    throw new Error("unexpected literal type");
  }
}

/**
 * Parse an array node.
 *
 * @param typeNode AST type node
 */
function parseArrayType(typeNode: ArrayTypeNode): ArrayType {
  const elementDataType = parseTypeNode(typeNode.getElementTypeNode());
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
 */
function parseObjectLiteralType(typeNode: TypeLiteralNode): ObjectType {
  const objectProperties: ObjectTypeProperty[] = typeNode
    .getProperties()
    .map(propertySignature => {
      return {
        name: propertySignature.getName(),
        description: extractJsDocComment(propertySignature),
        type: parseTypeNode(propertySignature.getTypeNodeOrThrow()),
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
  const allowedTargetTypes = typeNode
    .getTypeNodes()
    .filter(type => !type.getType().isUndefined());
  if (allowedTargetTypes.length === 1) {
    // not a union
    return parseTypeNode(allowedTargetTypes[0]);
  } else if (allowedTargetTypes.length > 1) {
    return unionType(allowedTargetTypes.map(type => parseTypeNode(type)));
  } else {
    throw new Error("union type error");
  }
}

/**
 * Parse an interface declaration. Resulting object properties will
 * include those from the extended interface hierarchy.
 *
 * @param interfaceDeclaration interface declaration
 */
export function parseInterfaceDeclaration(
  interfaceDeclaration: InterfaceDeclaration
): ObjectType {
  const objectProperties: ObjectTypeProperty[] = interfaceDeclaration
    .getType()
    .getProperties()
    .map(propertySymbol => {
      const valueDeclaration = propertySymbol.getValueDeclarationOrThrow();
      if (!TypeGuards.isPropertySignature(valueDeclaration)) {
        throw new Error("expected property signature");
      }
      return valueDeclaration;
    })
    .map(propertySignature => {
      return {
        name: propertySignature.getName(),
        description: extractJsDocComment(propertySignature),
        type: parseTypeNode(propertySignature.getTypeNodeOrThrow()),
        optional: propertySignature.hasQuestionToken()
      };
    });
  return objectType(objectProperties);
}
