import { ParameterDeclaration, PropertySignature } from "ts-morph";
import { PathParam } from "../definitions";
import { OptionalNotAllowedError, ParserError } from "../errors";
import { isPathParamTypeSafe } from "../http";
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

export function parsePathParams(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<PathParam[], ParserError> {
  parameter.getDecoratorOrThrow("pathParams");
  if (parameter.hasQuestionToken()) {
    return err(
      new OptionalNotAllowedError("@pathParams parameter cannot be optional", {
        file: parameter.getSourceFile().getFilePath(),
        position: parameter.getQuestionTokenNodeOrThrow().getPos()
      })
    );
  }
  const pathParamPropertySignatures = getParameterPropertySignaturesOrThrow(
    parameter
  );

  const pathParams = [];
  for (const propertySignature of pathParamPropertySignatures) {
    const pathParamResult = extractPathParam(
      propertySignature,
      typeTable,
      lociTable
    );
    if (pathParamResult.isErr()) return pathParamResult;
    pathParams.push(pathParamResult.unwrap());
  }

  return ok(pathParams);
}

function extractPathParam(
  propertySignature: PropertySignature,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<PathParam, ParserError> {
  if (propertySignature.hasQuestionToken()) {
    return err(
      new OptionalNotAllowedError("@pathParams property cannot be optional", {
        file: propertySignature.getSourceFile().getFilePath(),
        position: propertySignature.getQuestionTokenNodeOrThrow().getPos()
      })
    );
  }

  const nameResult = extractPathParamName(propertySignature);
  if (nameResult.isErr()) return nameResult;
  const name = nameResult.unwrap();

  const typeResult = extractPathParamType(
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

  return ok({
    name,
    type,
    description,
    examples: examples?.unwrap()
  });
}

function extractPathParamName(
  propertySignature: PropertySignature
): Result<string, ParserError> {
  const name = getPropertyName(propertySignature);
  if (!/^[\w-]*$/.test(name)) {
    return err(
      new ParserError(
        "@pathParams property name may only contain alphanumeric, underscore and hyphen characters",
        {
          file: propertySignature.getSourceFile().getFilePath(),
          position: propertySignature.getPos()
        }
      )
    );
  }
  if (name.length === 0) {
    return err(
      new ParserError("@pathParams property name must not be empty", {
        file: propertySignature.getSourceFile().getFilePath(),
        position: propertySignature.getPos()
      })
    );
  }
  return ok(name);
}

function extractPathParamType(
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

  if (!isPathParamTypeSafe(typeResult.unwrap(), typeTable)) {
    return err(
      new ParserError(
        "path parameter type may only be a URL-safe type, or an array of URL-safe types",
        {
          file: propertySignature.getSourceFile().getFilePath(),
          position: propertySignature.getPos()
        }
      )
    );
  }
  return typeResult;
}
