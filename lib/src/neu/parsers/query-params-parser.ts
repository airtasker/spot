import { ParameterDeclaration } from "ts-morph";
import { QueryParam } from "../definitions";
import { OptionalNotAllowedError, ParserError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { err, ok, Result } from "../util";
import {
  getJsDoc,
  getParameterTypeAsTypeLiteralOrThrow,
  getPropertyName
} from "./parser-helpers";
import { parseType } from "./type-parser";

export function parseQueryParams(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<QueryParam[], ParserError> {
  parameter.getDecoratorOrThrow("queryParams");
  if (parameter.hasQuestionToken()) {
    return err(
      new OptionalNotAllowedError("@queryParams parameter cannot be optional", {
        file: parameter.getSourceFile().getFilePath(),
        position: parameter.getQuestionTokenNodeOrThrow().getPos()
      })
    );
  }
  const type = getParameterTypeAsTypeLiteralOrThrow(parameter);

  const queryParams = [];
  for (const ps of type.getProperties()) {
    const typeResult = parseType(ps.getTypeNodeOrThrow(), typeTable, lociTable);
    if (typeResult.isErr()) return typeResult;
    const pDescription = getJsDoc(ps);

    const queryParam = {
      name: getPropertyName(ps),
      type: typeResult.unwrap(),
      description: pDescription && pDescription.getComment(),
      optional: ps.hasQuestionToken()
    };
    queryParams.push(queryParam);
  }

  // TODO: add loci information
  return ok(queryParams.sort((a, b) => (b.name > a.name ? -1 : 1)));
}
