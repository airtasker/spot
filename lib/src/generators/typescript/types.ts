import assertNever from "assert-never";
import * as ts from "typescript";
import {
  Api,
  ArrayType,
  ObjectType,
  OptionalType,
  Type,
  TypeReference,
  UnionType
} from "../../models";
import { outputTypeScriptSource } from "./ts-writer";

export function generateTypesSource(api: Api): string {
  const definitions: ts.Statement[] = [];
  for (const [typeName, type] of Object.entries(api.types)) {
    definitions.push(
      ts.createTypeAliasDeclaration(
        /*decorators*/ undefined,
        /*modifiers*/ [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
        typeName,
        /*typeParameters*/ undefined,
        typeNode(type)
      )
    );
  }
  return outputTypeScriptSource(definitions);
}

export function promiseTypeNode(type: Type): ts.TypeNode {
  return ts.createTypeReferenceNode("Promise", [typeNode(type)]);
}

export function typeNode(type: Type): ts.TypeNode {
  switch (type.kind) {
    case "void":
      return VOID_TYPE_NODE;
    case "null":
      return NULL_TYPE_NODE;
    case "boolean":
      return BOOLEAN_TYPE_NODE;
    case "boolean-constant":
      return type.value ? TRUE_TYPE_NODE : FALSE_TYPE_NODE;
    case "string":
      return STRING_TYPE_NODE;
    case "string-constant":
      return stringConstantTypeNode(type.value);
    case "number":
      return NUMBER_TYPE_NODE;
    case "integer-constant":
      return integerConstantTypeNode(type.value);
    case "object":
      return objectTypeNode(type);
    case "array":
      return arrayTypeNode(type);
    case "optional":
      return optionalTypeNode(type);
    case "union":
      return unionTypeNode(type);
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

function objectTypeNode(type: ObjectType): ts.TypeNode {
  return ts.createTypeLiteralNode(
    Object.entries(type.properties).map(([propertyName, propertyType]) => {
      if (propertyType.kind === "optional") {
        return ts.createPropertySignature(
          /*modifiers*/ undefined,
          propertyName,
          ts.createToken(ts.SyntaxKind.QuestionToken),
          typeNode(propertyType.optional),
          /*initializer*/ undefined
        );
      } else {
        return ts.createPropertySignature(
          /*modifiers*/ undefined,
          propertyName,
          /*questionToken*/ undefined,
          typeNode(propertyType),
          /*initializer*/ undefined
        );
      }
    })
  );
}

function arrayTypeNode(type: ArrayType): ts.TypeNode {
  return ts.createArrayTypeNode(typeNode(type.elements));
}

function optionalTypeNode(type: OptionalType): ts.TypeNode {
  return ts.createUnionTypeNode([typeNode(type.optional), VOID_TYPE_NODE]);
}

function unionTypeNode(type: UnionType): ts.TypeNode {
  return ts.createUnionTypeNode(type.types.map(typeNode));
}

function typeReferenceTypeNode(type: TypeReference): ts.TypeNode {
  return ts.createTypeReferenceNode(type.typeName, /*typeArguments*/ undefined);
}
