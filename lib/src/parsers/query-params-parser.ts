import { ParameterDeclaration, PropertySignature } from "ts-morph";
import { QueryParam } from "../definitions";
import { OptionalNotAllowedError, ParserError } from "../errors";
import { isQueryParamTypeSafe } from "../http";
import { LociTable } from "../locations";
import { Type, TypeTable } from "../types";
import { err, ok, Result } from "../util";
import {
  getJsDoc,
  getParameterPropertySignaturesOrThrow,
  getPropertyName
} from "./parser-helpers";
import { parseType } from "./type-parser";
import { extractJSDocExamples } from "./example-parser";

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
  const queryParamPropertySignatures = getParameterPropertySignaturesOrThrow(
    parameter
  );

  const queryParams: Array<QueryParam> = [];
  for (const propertySignature of queryParamPropertySignatures) {
    const nameResult = extractQueryParamName(propertySignature);
    if (nameResult.isErr()) return nameResult;
    const name = nameResult.unwrap();

    const typeResult = extractQueryParamType(
      propertySignature,
      typeTable,
      lociTable
    );
    if (typeResult.isErr()) return typeResult;
    const type = typeResult.unwrap();

    const jsDocNode = getJsDoc(propertySignature);
    const description = jsDocNode?.getDescription().trim();

    const examples = extractJSDocExamples(jsDocNode, type);
    if (examples && examples.isErr()) return examples;

    const optional = propertySignature.hasQuestionToken();

    queryParams.push({
      name,
      type,
      description,
      optional,
      examples: examples?.unwrap()
    });
  }

  // TODO: add loci information
  return ok(queryParams.sort((a, b) => (b.name > a.name ? -1 : 1)));
}

function extractQueryParamName(
  propertySignature: PropertySignature
): Result<string, ParserError> {
  const name = getPropertyName(propertySignature);
  if (!/^[\w-]*$/.test(name)) {
    return err(
      new ParserError(
        "@queryParams property name may only contain alphanumeric, underscore and hyphen characters",
        {
          file: propertySignature.getSourceFile().getFilePath(),
          position: propertySignature.getPos()
        }
      )
    );
  }
  if (name.length === 0) {
    return err(
      new ParserError("@queryParams property name must not be empty", {
        file: propertySignature.getSourceFile().getFilePath(),
        position: propertySignature.getPos()
      })
    );
  }
  return ok(name);
}

function extractQueryParamType(
  propertySignature: PropertySignature,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Type, ParserError> {
  const typeResult = parseType(
    propertySignature.getTypeNodeOrThrow(),
    typeTable,
    lociTable
  );
  if (typeResult.isErr()) return typeResult;

  if (!isQueryParamTypeSafe(typeResult.unwrap(), typeTable)) {
    return err(
      new ParserError(
        "query parameter type may only be a URL-safe type, a single depth object of URL-safe types or an array of URL-safe types",
        {
          file: propertySignature.getSourceFile().getFilePath(),
          position: propertySignature.getPos()
        }
      )
    );
  }
  return typeResult;
}
