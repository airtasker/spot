import { ParameterDeclaration } from "ts-morph";
import { PathParam } from "../definitions";
import { OptionalNotAllowedError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import {
  getJsDoc,
  getParameterTypeAsTypeLiteralOrThrow,
  getPropertyName
} from "./parser-helpers";
import { parseType } from "./type-parser";

export function parsePathParams(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): PathParam[] {
  parameter.getDecoratorOrThrow("pathParams");
  if (parameter.hasQuestionToken()) {
    throw new OptionalNotAllowedError(
      "@pathParams parameter cannot be optional",
      {
        file: parameter.getSourceFile().getFilePath(),
        position: parameter.getQuestionTokenNodeOrThrow().getPos()
      }
    );
  }
  const type = getParameterTypeAsTypeLiteralOrThrow(parameter);
  const pathParams = type
    .getProperties()
    .map(p => {
      const pDescription = getJsDoc(p);
      if (p.hasQuestionToken()) {
        throw new OptionalNotAllowedError(
          "@pathParams properties cannot be optional",
          {
            file: p.getSourceFile().getFilePath(),
            position: p.getQuestionTokenNodeOrThrow().getPos()
          }
        );
      }
      return {
        name: getPropertyName(p),
        type: parseType(p.getTypeNodeOrThrow(), typeTable, lociTable),
        description: pDescription && pDescription.getComment()
      };
    })
    .sort((a, b) => (b.name > a.name ? -1 : 1));
  // TODO: add loci information
  return pathParams;
}
