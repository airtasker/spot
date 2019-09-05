import { PropertyDeclaration } from "ts-morph";
import { SecurityHeader } from "../definitions";
import { OptionalNotAllowedError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { err, ok, Result } from "../util";
import { getJsDoc, getPropertyName } from "./parser-helpers";
import { parseType } from "./type-parser";

export function parseSecurityHeader(
  property: PropertyDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<SecurityHeader, OptionalNotAllowedError> {
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

  return ok({
    name,
    description: descriptionDoc && descriptionDoc.getComment(),
    type: parseType(property.getTypeNodeOrThrow(), typeTable, lociTable)
  });
}
