import { PropertyDeclaration } from "ts-morph";
import { SecurityHeader } from "../definitions";
import { OptionalNotAllowedError, ParserError } from "../errors";
import { LociTable } from "../locations";
import { isNotStringType, possibleRootTypes, Type, TypeTable } from "../types";
import { err, ok, Result } from "../util";
import { getJsDoc, getPropertyName } from "./parser-helpers";
import { parseType } from "./type-parser";

export function parseSecurityHeader(
  property: PropertyDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<SecurityHeader, ParserError> {
  property.getDecoratorOrThrow("securityHeader");

  if (property.hasQuestionToken()) {
    return err(
      new OptionalNotAllowedError(
        "@securityHeader property cannot be optional",
        {
          file: property.getSourceFile().getFilePath(),
          position: property.getQuestionTokenNodeOrThrow().getPos()
        }
      )
    );
  }

  // Handle name
  const nameResult = extractName(property);
  if (nameResult.isErr()) return nameResult;
  const name = nameResult.unwrap();

  // Handle description
  const descriptionDoc = getJsDoc(property);
  const description = descriptionDoc && descriptionDoc.getDescription().trim();

  // Handle type
  const typeResult = extractType(property, typeTable, lociTable);
  if (typeResult.isErr()) return typeResult;
  const type = typeResult.unwrap();

  return ok({ name, description, type });
}

function extractName(
  property: PropertyDeclaration
): Result<string, ParserError> {
  const name = getPropertyName(property);
  if (!/^[\w-]*$/.test(name)) {
    return err(
      new ParserError(
        "@securityHeader field name may only contain alphanumeric, underscore and hyphen characters",
        {
          file: property.getSourceFile().getFilePath(),
          position: property.getPos()
        }
      )
    );
  }
  if (name.length === 0) {
    return err(
      new ParserError("@securityHeader field name must not be empty", {
        file: property.getSourceFile().getFilePath(),
        position: property.getPos()
      })
    );
  }
  return ok(name);
}

function extractType(
  property: PropertyDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Type, ParserError> {
  const typeResult = parseType(
    property.getTypeNodeOrThrow(),
    typeTable,
    lociTable
  );
  if (typeResult.isErr()) return typeResult;
  const rootTypes = possibleRootTypes(typeResult.unwrap(), typeTable);
  if (rootTypes.some(isNotStringType)) {
    return err(
      new ParserError("@securityHeader type may only be a string type", {
        file: property.getSourceFile().getFilePath(),
        position: property.getPos()
      })
    );
  }
  return typeResult;
}
