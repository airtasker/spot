import { PropertyDeclaration } from "ts-morph";
import { SecurityHeader } from "../definitions";
import { OptionalNotAllowedError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { getJsDoc, getPropertyName } from "./parser-helpers";
import { parseType } from "./type-parser";

export function parseSecurityHeader(
  property: PropertyDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): SecurityHeader {
  property.getDecoratorOrThrow("securityHeader");
  if (property.hasQuestionToken()) {
    throw new OptionalNotAllowedError(
      "@securityHeader property cannot be optional",
      {
        file: property.getSourceFile().getFilePath(),
        position: property.getQuestionTokenNodeOrThrow().getPos()
      }
    );
  }
  const name = getPropertyName(property);
  const descriptionDoc = getJsDoc(property);
  return {
    name,
    description: descriptionDoc && descriptionDoc.getComment(),
    type: parseType(property.getTypeNodeOrThrow(), typeTable, lociTable)
  };
}
