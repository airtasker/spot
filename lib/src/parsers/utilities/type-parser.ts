import {
  ArrayTypeNode,
  IndexedAccessTypeNode,
  InterfaceDeclaration,
  LiteralTypeNode,
  StringLiteral,
  TypeAliasDeclaration,
  TypeGuards,
  TypeLiteralNode,
  TypeNode,
  TypeReferenceNode,
  UnionTypeNode
} from "ts-morph";
import {
  arrayType,
  ArrayType,
  BOOLEAN,
  booleanLiteral,
  CustomPrimitiveType,
  DataType,
  DATE,
  DATETIME,
  DOUBLE,
  FLOAT,
  INT32,
  INT64,
  NULL,
  numberLiteral,
  objectType,
  ObjectType,
  ObjectTypeProperty,
  PrimitiveLiteral,
  PrimitiveType,
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
    return FLOAT;
  } else if (TypeGuards.isLiteralTypeNode(typeNode)) {
    return parseLiteralType(typeNode);
  } else if (TypeGuards.isArrayTypeNode(typeNode)) {
    return parseArrayType(typeNode);
  } else if (TypeGuards.isTypeLiteralNode(typeNode)) {
    return parseObjectLiteralType(typeNode);
  } else if (TypeGuards.isUnionTypeNode(typeNode)) {
    return parseUnionType(typeNode);
  } else if (TypeGuards.isIndexedAccessTypeNode(typeNode)) {
    return parseTypeNode(parseIndexedAccessType(typeNode));
  } else {
    throw new Error("unknown type");
  }
}

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
 */
function parseTypeReference(
  typeNode: TypeReferenceNode
): ReferenceType | PrimitiveType | CustomPrimitiveType {
  const declaration = getTargetDeclarationFromTypeReference(typeNode);
  const name = declaration.getName();
  if (TypeGuards.isTypeAliasDeclaration(declaration)) {
    const targetTypeNode = declaration.getTypeNodeOrThrow();
    // if the type name is one of of the internal ones ensure they have not been redefined
    if (SPOT_TYPE_ALIASES.includes(name)) {
      if (TypeGuards.isTypeReferenceNode(targetTypeNode)) {
        throw new Error(`Internal type ${name} must not be redefined`);
      } else if (declaration.getType().isString()) {
        switch (name) {
          case "String":
            return STRING;
          case "Date":
            return DATE;
          case "DateTime":
            return DATETIME;
          default:
            throw new Error(`Internal type ${name} must not be redefined`);
        }
      } else if (declaration.getType().isNumber()) {
        switch (name) {
          case "Number":
          case "Float":
            return FLOAT;
          case "Double":
            return DOUBLE;
          case "Integer":
          case "Int32":
            return INT32;
          case "Int64":
            return INT64;
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
    if (SPOT_TYPE_ALIASES.includes(name)) {
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

function resolveFirstTypeReferenceInIndexedAccessType(
  typeNode: IndexedAccessTypeNode
): TypeReferenceNode {
  const object = typeNode.getObjectTypeNode();

  if (TypeGuards.isIndexedAccessTypeNode(object)) {
    return resolveFirstTypeReferenceInIndexedAccessType(object);
  }

  if (!TypeGuards.isTypeReferenceNode(object)) {
    throw new Error("indexed access type error: not a type reference node");
  }

  return object;
}

function resolveLiteralTypesInIndexedAccessType(
  typeNode: IndexedAccessTypeNode
): LiteralTypeNode[] {
  const object = typeNode.getObjectTypeNode();
  const index = typeNode.getIndexTypeNode();

  if (!TypeGuards.isLiteralTypeNode(index)) {
    throw new Error("indexed access type error: not a literal type node");
  }

  if (TypeGuards.isIndexedAccessTypeNode(object)) {
    return [...resolveLiteralTypesInIndexedAccessType(object), index];
  }

  return [index];
}

function resolvePropertiesFromTypeAliasOrInterfaceDeclaration(
  declaration: TypeAliasDeclaration | InterfaceDeclaration
): TypeLiteralNode | InterfaceDeclaration {
  if (TypeGuards.isInterfaceDeclaration(declaration)) {
    return declaration;
  } else if (TypeGuards.isTypeAliasDeclaration(declaration)) {
    const literalTypeNode = declaration.getTypeNodeOrThrow();

    if (TypeGuards.isTypeLiteralNode(literalTypeNode)) {
      return literalTypeNode;
    }

    throw new Error("indexed access type error: not a type literal node");
  }

  throw new Error(
    "indexed access type error: not an type alias or interface declaration"
  );
}

function resolveIndexedAccessTypeReference(
  declaration: TypeAliasDeclaration | InterfaceDeclaration | TypeLiteralNode,
  literalChain: StringLiteral[]
): TypeNode {
  if (!literalChain[0]) {
    throw new Error("indexed access type error: no literal in chain");
  }

  const propertiesParentDeclaration = TypeGuards.isTypeLiteralNode(declaration)
    ? declaration
    : resolvePropertiesFromTypeAliasOrInterfaceDeclaration(declaration);

  const propertyType = propertiesParentDeclaration
    .getPropertyOrThrow(literalChain[0].getLiteralText())
    .getTypeNodeOrThrow();

  if (TypeGuards.isTypeLiteralNode(propertyType)) {
    return resolveIndexedAccessTypeReference(
      propertyType,
      literalChain.slice(1)
    );
  }

  if (TypeGuards.isExpression(propertyType)) {
    return propertyType;
  }

  if (!TypeGuards.isTypeReferenceNode(propertyType)) {
    throw new Error("indexed access type error: expected type reference node");
  }

  return resolveIndexedAccessTypeReference(
    getTargetDeclarationFromTypeReference(propertyType),
    literalChain.slice(1)
  );
}

/**
 * Parse an indexed access type node.
 *
 * @param typeNode index access type node
 */
function parseIndexedAccessType(typeNode: IndexedAccessTypeNode): TypeNode {
  const typeReference = resolveFirstTypeReferenceInIndexedAccessType(typeNode);

  const declaration = getTargetDeclarationFromTypeReference(typeReference);

  const literalChain = resolveLiteralTypesInIndexedAccessType(typeNode).map(
    literalNode => literalNode.getLiteral()
  );

  if (literalChain.some(literal => !TypeGuards.isStringLiteral(literal))) {
    throw new Error("indexed access type error: not a string literal");
  }

  return resolveIndexedAccessTypeReference(
    declaration,
    literalChain as StringLiteral[]
  );
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
