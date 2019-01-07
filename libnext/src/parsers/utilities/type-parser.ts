import { Type, TypeGuards } from "ts-simple-ast";
import {
  NULL,
  BOOLEAN,
  STRING,
  NUMBER,
  booleanLiteral,
  stringLiteral,
  integerLiteral,
  customString,
  customNumber,
  unionType,
  arrayType,
  DataType,
  objectType,
  ObjectTypeProperty,
  referenceType,
  ReferenceType
} from "../../models/types";
import { last } from "lodash";
import {
  extractJsDocComment,
  extractPropertySignature
} from "./parser-utility";
import { TypeStore } from "./types-store";

/**
 * Convert an AST Type node to a local data type.
 *
 * @param type AST Type
 */
export function parseType(type: Type): DataType {
  if (type.isNull()) {
    return NULL;
  } else if (type.isBoolean()) {
    return BOOLEAN;
  } else if (type.isString()) {
    return STRING;
  } else if (type.isNumber()) {
    return NUMBER;
  } else if (type.isLiteral()) {
    return parseAstLiteralTypes(type);
  } else if (type.isObject()) {
    return parseAstObjectTypes(type);
  } else if (type.isUnion()) {
    return parseUnionTypes(type);
  } else {
    throw new Error("unknown type");
  }
}

/**
 * AST literal types include literal booleans, strings and numbers.
 *
 * @param type AST Type
 */
function parseAstLiteralTypes(type: Type): DataType {
  if (type.isBooleanLiteral()) {
    return booleanLiteral(type.getText() === "true");
  } else if (type.isStringLiteral()) {
    return stringLiteral(type.getText().substr(1, type.getText().length - 2));
  } else if (type.isNumberLiteral()) {
    // TODO: currently support for integer only
    return integerLiteral(parseInt(type.getText()));
  } else {
    throw new Error("expected an AST literal type");
  }
}

/**
 * AST object types include interfaces and arrays and object literals.
 *
 * @param type AST Type
 */
function parseAstObjectTypes(type: Type): DataType {
  if (type.isInterface()) {
    // TODO: convert custom strings and numbers into PrimitiveReferencesType.
    if (typeIsCustomString(type)) {
      return parseCustomString(type);
    } else if (typeIsCustomNumber(type)) {
      return parseCustomNumber(type);
    } else {
      return parseAstGenericInterfaceObject(type);
    }
  } else if (type.isArray()) {
    const arrayElementType = type.getArrayType();
    if (arrayElementType) {
      return arrayType(parseType(arrayElementType));
    } else {
      throw new Error("expected array to be typed");
    }
  } else if (type.isObject()) {
    return parseAstObjectAsLiteralObject(type);
  } else {
    throw new Error("expected an AST object type");
  }
}

function parseAstGenericInterfaceObject(type: Type): ReferenceType {
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

    // TODO: defer this to the parsing process
    if (!Object.keys(TypeStore).includes(interfaceName)) {
      TypeStore[interfaceName] = {
        description: extractJsDocComment(interfaceDeclaration),
        type: parseAstObjectAsLiteralObject(
          type,
          interfaceDeclaration
            .getProperties()
            .map(property => property.getName())
        )
      };
    }

    return referenceType(interfaceName);
  } else {
    throw new Error("expected interface type");
  }
}

function parseAstObjectAsLiteralObject(
  type: Type,
  propertiesFilter?: string[]
): DataType {
  const objectProperties: ObjectTypeProperty[] = type
    .getProperties()
    .filter(property => {
      if (propertiesFilter === undefined) {
        return true;
      }
      return propertiesFilter.includes(property.getName());
    })
    .map(property => {
      const propertySignature = extractPropertySignature(property);
      return {
        name: propertySignature.getName(),
        description: extractJsDocComment(propertySignature),
        type: parseType(propertySignature.getType()),
        optional: propertySignature.hasQuestionToken()
      };
    });

  const extendedTypes = type.getBaseTypes().map(baseType => {
    return parseAstGenericInterfaceObject(baseType);
  });
  return objectType(objectProperties, extendedTypes);
}

function parseUnionTypes(type: Type): DataType {
  // remove the undefined type
  const nonUndefinedUnionTypes = type
    .getUnionTypes()
    .filter(utype => !utype.isUndefined());
  if (nonUndefinedUnionTypes.length === 1) {
    // not a union
    return parseType(nonUndefinedUnionTypes[0]);
  } else if (nonUndefinedUnionTypes.length > 1) {
    return unionType(nonUndefinedUnionTypes.map(utype => parseType(utype)));
  } else {
    throw new Error("union type error");
  }
}

function parseCustomString(type: Type): DataType {
  return customString({
    pattern: extractStringValue(extractTypePropertyType(type, "pattern"))
  });
}

function parseCustomNumber(type: Type): DataType {
  return customNumber({
    integer: extractBooleanValue(extractTypePropertyType(type, "integer")),
    min: extractNumberValue(extractTypePropertyType(type, "min")),
    max: extractNumberValue(extractTypePropertyType(type, "max"))
  });
}

function extractTypePropertyType(type: Type, propertyName: string): Type {
  const property = type.getProperty(propertyName);
  if (property) {
    return extractPropertySignature(property).getType();
  } else {
    throw new Error(`expected property "${propertyName}" from interface`);
  }
}

function extractBooleanValue(type: Type): boolean | undefined {
  if (type.isBoolean()) {
    return undefined;
  } else if (type.isBooleanLiteral()) {
    return type.getText() === "true";
  } else {
    throw new Error("expected property to be a boolean");
  }
}

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
 * Check if a type is an internal custom type.
 *
 * @param type type to check
 */
function typeIsCustomInternalType(type: Type) {
  return (
    type.isInterface() &&
    typeIncludesBaseType(type, "InternalCustomPrimitiveType")
  );
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
