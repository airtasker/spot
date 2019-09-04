import { ParameterDeclaration } from "ts-morph";
import { Header } from "../definitions";
import { OptionalNotAllowedError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import {
  getJsDoc,
  getParameterTypeAsTypeLiteralOrThrow,
  getPropertyName
} from "./parser-helpers";
import { parseType } from "./type-parser";

export function parseHeaders(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Header[] {
  parameter.getDecoratorOrThrow("headers");
  // TODO check parameter.isOptional()
  if (parameter.hasQuestionToken()) {
    throw new OptionalNotAllowedError("@headers parameter cannot be optional", {
      file: parameter.getSourceFile().getFilePath(),
      position: parameter.getQuestionTokenNodeOrThrow().getPos()
    });
  }
  const type = getParameterTypeAsTypeLiteralOrThrow(parameter);
  const headers = type
    .getProperties()
    .map(p => {
      const pDescription = getJsDoc(p);
      return {
        name: getPropertyName(p),
        type: parseType(p.getTypeNodeOrThrow(), typeTable, lociTable),
        description: pDescription && pDescription.getComment(),
        optional: p.hasQuestionToken()
      };
    })
    .sort((a, b) => (b.name > a.name ? -1 : 1));
  // TODO: add loci information
  return headers;
}
