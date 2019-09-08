import { ParameterDeclaration } from "ts-morph";
import { Header } from "../definitions";
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

export function parseHeaders(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Header[], ParserError> {
  parameter.getDecoratorOrThrow("headers");
  if (parameter.hasQuestionToken()) {
    return err(
      new OptionalNotAllowedError("@headers parameter cannot be optional", {
        file: parameter.getSourceFile().getFilePath(),
        position: parameter.getQuestionTokenNodeOrThrow().getPos()
      })
    );
  }
  const type = getParameterTypeAsTypeLiteralOrThrow(parameter);

  const headers = [];
  for (const propertySignature of type.getProperties()) {
    const typeResult = parseType(
      propertySignature.getTypeNodeOrThrow(),
      typeTable,
      lociTable
    );
    if (typeResult.isErr()) return typeResult;
    const pDescription = getJsDoc(propertySignature);

    const header = {
      name: getPropertyName(propertySignature),
      type: typeResult.unwrap(),
      description: pDescription && pDescription.getComment(),
      optional: propertySignature.hasQuestionToken()
    };
    headers.push(header);
  }

  // TODO: add loci information
  return ok(headers.sort((a, b) => (b.name > a.name ? -1 : 1)));
}
