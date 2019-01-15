import assertNever from "assert-never";
import * as ts from "typescript";
import {
  Api,
  ArrayType,
  normalizedObjectType,
  ObjectType,
  OptionalType,
  Type,
  TypeReference,
  Types,
  UnionType
} from "../../models";
import { outputTypeScriptSource } from "./ts-writer";
import compact = require("lodash/compact");

export function generateTypesSource(api: Api): string {
  return outputTypeScriptSource(
    Object.entries(api.types).map(([typeName, type]) =>
      ts.createTypeAliasDeclaration(
        /*decorators*/ undefined,
        /*modifiers*/ [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
        typeName,
        /*typeParameters*/ undefined,
        typeNode(api.types, type)
      )
    )
  );
}

export function promiseTypeNode(types: Types, type: Type): ts.TypeNode {
  return ts.createTypeReferenceNode("Promise", [typeNode(types, type)]);
}

export function typeNode(types: Types, type: Type): ts.TypeNode {
  switch (type.kind) {
    case "void":
      return VOID_TYPE_NODE;
    case "null":
      return NULL_TYPE_NODE;
    case "boolean":
      return BOOLEAN_TYPE_NODE;
    case "boolean-constant":
      return type.value ? TRUE_TYPE_NODE : FALSE_TYPE_NODE;
    case "date":
    case "date-time":
    case "string":
      return STRING_TYPE_NODE;
    case "string-constant":
      return stringConstantTypeNode(type.value);
    case "number":
    case "float":
    case "double":
    case "int32":
    case "int64":
      return NUMBER_TYPE_NODE;
    case "integer-constant":
      return integerConstantTypeNode(type.value);
    case "object":
      return objectTypeNode(types, type);
    case "array":
      return arrayTypeNode(types, type);
    case "optional":
      return optionalTypeNode(types, type);
    case "union":
      return unionTypeNode(types, type);
    case "type-reference":
      return typeReferenceTypeNode(type);
    default:
      throw assertNever(type);
  }
}

const VOID_TYPE_NODE = ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);

const NULL_TYPE_NODE = ts.createKeywordTypeNode(ts.SyntaxKind.NullKeyword);

const BOOLEAN_TYPE_NODE = ts.createKeywordTypeNode(
  ts.SyntaxKind.BooleanKeyword
);

const TRUE_TYPE_NODE = ts.createLiteralTypeNode(ts.createLiteral(true));
const FALSE_TYPE_NODE = ts.createLiteralTypeNode(ts.createLiteral(false));

const STRING_TYPE_NODE = ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);

const NUMBER_TYPE_NODE = ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);

function stringConstantTypeNode(value: string): ts.TypeNode {
  return ts.createLiteralTypeNode(ts.createLiteral(value));
}

function integerConstantTypeNode(value: number): ts.TypeNode {
  return ts.createLiteralTypeNode(ts.createLiteral(value));
}

function objectTypeNode(types: Types, type: ObjectType): ts.TypeNode {
  return ts.createTypeLiteralNode(
    Object.entries(normalizedObjectType(types, type)).map(
      ([propertyName, propertyType]) => {
        if (propertyType.kind === "void") {
          return ts.createPropertySignature(
            /*modifiers*/ undefined,
            propertyName,
            ts.createToken(ts.SyntaxKind.QuestionToken),
            VOID_TYPE_NODE,
            /*initializer*/ undefined
          );
        } else if (propertyType.kind === "optional") {
          return ts.createPropertySignature(
            /*modifiers*/ undefined,
            propertyName,
            ts.createToken(ts.SyntaxKind.QuestionToken),
            typeNode(types, propertyType.optional),
            /*initializer*/ undefined
          );
        } else {
          return ts.createPropertySignature(
            /*modifiers*/ undefined,
            propertyName,
            /*questionToken*/ undefined,
            typeNode(types, propertyType),
            /*initializer*/ undefined
          );
        }
      }
    )
  );
}

function arrayTypeNode(types: Types, type: ArrayType): ts.TypeNode {
  return ts.createArrayTypeNode(typeNode(types, type.elements));
}

function optionalTypeNode(types: Types, type: OptionalType): ts.TypeNode {
  return ts.createUnionTypeNode([
    typeNode(types, type.optional),
    VOID_TYPE_NODE
  ]);
}

function unionTypeNode(types: Types, type: UnionType): ts.TypeNode {
  return ts.createUnionTypeNode(type.types.map(t => typeNode(types, t)));
}

function typeReferenceTypeNode(type: TypeReference): ts.TypeNode {
  return ts.createTypeReferenceNode(type.typeName, /*typeArguments*/ undefined);
}
