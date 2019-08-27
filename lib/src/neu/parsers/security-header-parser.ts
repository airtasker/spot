import { PropertyDeclaration } from "ts-morph";
import { SecurityHeader } from "../definitions";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { getJsDoc, getPropertyName } from "./parser-helpers";
import { parseType } from "./type-parser";

export function parseSecurityHeader(
  property: PropertyDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): SecurityHeader {
  if (property.hasQuestionToken()) {
    throw new Error("@securityHeader property cannot be optional");
  }
  const decorator = property.getDecoratorOrThrow("securityHeader");
  const name = getPropertyName(property);
  const descriptionDoc = getJsDoc(property);
  return {
    name,
    description: descriptionDoc && descriptionDoc.getComment(),
    type: parseType(property.getTypeNodeOrThrow(), typeTable, lociTable)
  };
}
