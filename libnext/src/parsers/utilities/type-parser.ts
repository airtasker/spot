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
  objectReferenceType,
  ObjectReferenceType,
  booleanReference,
  stringReference,
  numberReference
} from "../../models/types";
import { last } from "lodash";
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
    return NULL;
  } else if (type.isBoolean() || type.isString() || type.isNumber()) {
    return parseAliasablePrimitiveType(typeNode);
  } else if (type.isLiteral()) {
    return parseAstLiteralType(type);
  } else if (type.isObject()) {
    return parseAstObjectTypes(typeNode);
  } else if (TypeGuards.isUnionTypeNode(typeNode)) {
    return parseUnionTypes(typeNode);
  } else {
    throw new Error("unknown type");
  }
}

function parseAliasablePrimitiveType(typeNode: TypeNode) {
  const type = typeNode.getType();
  if (TypeGuards.isTypeReferenceNode(typeNode)) {
    const typeAliasDeclaration = getTypeAliasDeclarationFromTypeReference(
      typeNode
    );
    const name = typeAliasDeclaration.getName();
    const location = typeAliasDeclaration.getSourceFile().getFilePath();

    if (type.isBoolean()) {
      return booleanReference(name, location);
    } else if (type.isString()) {
      return stringReference(name, location);
    } else if (type.isNumber()) {
      return numberReference(name, location);
    } else {
      throw new Error("expected boolean, string, or number");
    }
  } else if (type.isBoolean()) {
    return BOOLEAN;
  } else if (type.isString()) {
    return STRING;
  } else if (type.isNumber()) {
    return NUMBER;
  } else {
    throw new Error("expected boolean, string, or number");
  }
}

/**
 * AST literal types include literal booleans, strings and numbers.
 *
 * @param type AST type node
 */
function parseAstLiteralType(type: Type): DataType {
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
 * AST object types include interfaces and arrays and object literals.
 *
 * @param type AST type node
 */
function parseAstObjectTypes(typeNode: TypeNode): DataType {
  const type = typeNode.getType();
  if (type.isInterface()) {
    return parseAstGenericInterfaceObject(type);
    // if (typeIsCustomString(type)) {
    //   return parseCustomString(type);
    // } else if (typeIsCustomNumber(type)) {
    //   return parseCustomNumber(type);
    // } else {
    //   return parseAstGenericInterfaceObject(type);
    // }
  } else if (TypeGuards.isArrayTypeNode(typeNode)) {
    return arrayType(parseType(typeNode.getElementTypeNode()));
  } else if (type.isObject()) {
    return parseAstObjectAsLiteralObject(type);
  } else {
    console.log(typeNode);
    throw new Error("expected an AST object type");
  }
}

function parseAstGenericInterfaceObject(type: Type): ObjectReferenceType {
  if (type.isInterface()) {
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

    return objectReferenceType(interfaceName, location);
  } else {
    throw new Error("expected interface type");
  }
}

export function parseAstObjectAsLiteralObject(type: Type): ObjectType {
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

function parseUnionTypes(typeNode: UnionTypeNode): DataType {
  const nonUndefinedUnionTypes = typeNode
    .getTypeNodes()
    .filter(utype => !utype.getType().isUndefined());
  if (nonUndefinedUnionTypes.length === 1) {
    // not a union
    return parseType(nonUndefinedUnionTypes[0]);
  } else if (nonUndefinedUnionTypes.length > 1) {
    return unionType(nonUndefinedUnionTypes.map(utype => parseType(utype)));
  } else {
    throw new Error("union type error");
  }
}

// function parseCustomString(type: Type): DataType {
//   return customString({
//     pattern: extractStringValue(extractTypePropertyType(type, "pattern"))
//   });
// }

// function parseCustomNumber(type: Type): DataType {
//   return customNumber({
//     integer: extractBooleanValue(extractTypePropertyType(type, "integer")),
//     min: extractNumberValue(extractTypePropertyType(type, "min")),
//     max: extractNumberValue(extractTypePropertyType(type, "max"))
//   });
// }

// function extractTypePropertyType(type: Type, propertyName: string): Type {
//   const property = type.getProperty(propertyName);
//   if (property) {
//     return extractPropertySignature(property).getType();
//   } else {
//     throw new Error(`expected property "${propertyName}" from interface`);
//   }
// }

// function extractBooleanValue(type: Type): boolean | undefined {
//   if (type.isBoolean()) {
//     return undefined;
//   } else if (type.isBooleanLiteral()) {
//     return type.getText() === "true";
//   } else {
//     throw new Error("expected property to be a boolean");
//   }
// }

function extractStringValue(type: Type): string | undefined {
  if (type.isString()) {
    return undefined;
  } else if (type.isStringLiteral()) {
    return type.getText().substr(1, type.getText().length - 2);
  } else {
    throw new Error("expected property to be a string");
  }
}

function extractNumberValue(type: Type): number | undefined {
  if (type.isNumber()) {
    return undefined;
  } else if (type.isNumberLiteral()) {
    return Number(type.getText());
  } else {
    throw new Error("expected property to be a number");
  }
}

/**
 * Check if a type is a custom string.
 *
 * @param type type to check
 */
function typeIsCustomString(type: Type) {
  return type.isInterface() && typeIncludesBaseType(type, "CustomStringType");
}

/**
 * Check if a type is a custom number.
 *
 * @param type type to check
 */
function typeIsCustomNumber(type: Type) {
  return type.isInterface() && typeIncludesBaseType(type, "CustomNumberType");
}

/**
 * Check if a type has a base type of a certain name.
 *
 * @param type type to check
 * @param typeName name of type to check for
 */
function typeIncludesBaseType(type: Type, typeName: string) {
  return type
    .getBaseTypes()
    .some(baseType => last(baseType.getText().split(".")) === typeName);
}
