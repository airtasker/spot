import * as ts from "typescript";
import {
  arrayType,
  ArrayType,
  BOOLEAN,
  booleanConstant,
  integerConstant,
  NULL,
  NUMBER,
  ObjectType,
  objectType,
  optionalType,
  STRING,
  stringConstant,
  Type,
  unionType,
  VOID
} from "../models";
import { extractLiteral } from "./literal-parser";
import { panic } from "./panic";

/**
 * Extracts a Type from a TypeScript type alias or interface, or fails if the expression isn't a supported type.
 */
export function extractType(sourceFile: ts.SourceFile, type: ts.Node): Type {
  switch (type.kind) {
    case ts.SyntaxKind.VoidKeyword:
      return VOID;
    case ts.SyntaxKind.StringKeyword:
      return STRING;
    case ts.SyntaxKind.NumberKeyword:
      return NUMBER;
    case ts.SyntaxKind.BooleanKeyword:
      return BOOLEAN;
  }
  if (ts.isTypeLiteralNode(type)) {
    return extractObjectType(sourceFile, type);
  } else if (ts.isArrayTypeNode(type)) {
    return extractArrayType(sourceFile, type);
  } else if (ts.isLiteralTypeNode(type)) {
    const literal = extractLiteral(sourceFile, type.literal);
    switch (literal.kind) {
      case "string": {
        return stringConstant(literal.text);
      }
      case "number": {
        if (!literal.text.match(/^-?\d+$/)) {
          throw panic(
            `Expected an integer, got this instead: ${type.getText(sourceFile)}`
          );
        }
        return integerConstant(parseInt(literal.text));
      }
      case "boolean": {
        return booleanConstant(literal.value);
      }
      default:
        throw panic(
          `Unexpected literal in type definition: ${type.getText(sourceFile)}`
        );
    }
  } else if (ts.isToken(type) && type.kind === ts.SyntaxKind.NullKeyword) {
    return NULL;
  } else if (ts.isUnionTypeNode(type)) {
    return extractUnionType(sourceFile, type);
  } else if (ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)) {
    const typeName = type.typeName.getText(sourceFile);
    if (typeName === "Optional") {
      if (!type.typeArguments || type.typeArguments.length !== 1) {
        throw panic(
          `Expected exacty one type parameter for Optional, got this instead: ${type.getText(
            sourceFile
          )}`
        );
      }
      const typeParameter = type.typeArguments[0];
      return optionalType(extractType(sourceFile, typeParameter));
    }

    switch (typeName) {
      case "Int32":
        return {
          kind: "int32"
        };
      case "Int64":
        return {
          kind: "int64"
        };
      case "Float":
        return {
          kind: "float"
        };
      case "Double":
        return {
          kind: "double"
        };
      case "Date":
        return {
          kind: "date"
        };
      case "DateTime":
        return {
          kind: "date-time"
        };
      default:
        return {
          kind: "type-reference",
          typeName
        };
    }
  } else {
    throw panic(
      `Expected a plain type identifier, got this instead: ${type.getText(
        sourceFile
      )}`
    );
  }
}

export function extractObjectType(
  sourceFile: ts.SourceFile,
  declaration: ts.TypeLiteralNode | ts.InterfaceDeclaration
): ObjectType {
  const extendsTypeNames = [];
  if (ts.isInterfaceDeclaration(declaration)) {
    for (const heritageClause of declaration.heritageClauses || []) {
      for (const type of heritageClause.types) {
        if (
          ts.isExpressionWithTypeArguments(type) &&
          ts.isIdentifier(type.expression)
        ) {
          extendsTypeNames.push(type.expression.getText(sourceFile));
        }
      }
    }
  }
  const properties: {
    [key: string]: Type;
  } = {};
  for (const member of declaration.members) {
    if (
      !member.name ||
      !ts.isIdentifier(member.name) ||
      !ts.isPropertySignature(member) ||
      !member.type
    ) {
      throw panic(
        `Expected a named and typed property, got this instead: ${member.getText(
          sourceFile
        )}`
      );
    }
    let type = extractType(sourceFile, member.type);
    if (member.questionToken) {
      type = optionalType(type);
    }
    properties[member.name.getText(sourceFile)] = type;
  }
  return objectType(properties, extendsTypeNames);
}

export function extractArrayType(
  sourceFile: ts.SourceFile,
  declaration: ts.ArrayTypeNode
): ArrayType {
  return arrayType(extractType(sourceFile, declaration.elementType));
}

export function extractUnionType(
  sourceFile: ts.SourceFile,
  declaration: ts.UnionTypeNode
): Type {
  return unionType(...declaration.types.map(t => extractType(sourceFile, t)));
}
