import { PropertyDeclaration } from "ts-morph";
import { SecurityHeader } from "../definitions";
import { OptionalNotAllowedError, ParserError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
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
  const name = getPropertyName(property);
  const descriptionDoc = getJsDoc(property);
  const typeResult = parseType(
    property.getTypeNodeOrThrow(),
    typeTable,
    lociTable
  );

  if (typeResult.isErr()) return typeResult;

  return ok({
    name,
    description: descriptionDoc && descriptionDoc.getComment(),
    type: typeResult.unwrap()
  });
}
