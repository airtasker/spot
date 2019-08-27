import { ParameterDeclaration } from "ts-morph";
import { QueryParam } from "../definitions";
import { LociTable } from "../locations";
import {
  getJsDoc,
  getParameterTypeAsTypeLiteralOrThrow,
  getPropertyName
} from "../parser-helpers";
import { TypeTable } from "../types";
import { parseType } from "./type-parser";

export function parseQueryParams(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): QueryParam[] {
  const decorator = parameter.getDecoratorOrThrow("queryParams");
  if (parameter.hasQuestionToken()) {
    throw new Error("@queryParams parameter cannot be optional");
  }
  const type = getParameterTypeAsTypeLiteralOrThrow(parameter);
  const queryParams = type
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
  return queryParams;
}
