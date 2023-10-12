import {
  ClassDeclaration,
  MethodDeclaration,
  ParameterDeclaration
} from "ts-morph";
import { Oa3Server, Oa3ServerVariable } from "../definitions";
import {
  getDecoratorConfigOrThrow,
  getJsDoc,
  getObjLiteralPropOrThrow,
  getParameterPropertySignaturesOrThrow,
  getParamWithDecorator,
  getPropertyName,
  getPropValueAsStringOrThrow
} from "./parser-helpers";
import { Oa3serverConfig } from "../syntax/oa3server";
import { parseType } from "./type-parser";
import { TypeTable } from "../types";
import { LociTable } from "../locations";
import { err, ok, Result } from "../util";
import { OptionalNotAllowedError, ParserError } from "../errors";

export function parseOa3Servers(
  klass: ClassDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Oa3Server[], ParserError> {
  const serverMethods = klass
    .getMethods()
    .filter(m => m.getDecorator("oa3server") !== undefined);

  const servers: Oa3Server[] = [];
  for (const method of serverMethods) {
    const serverResult = parseOa3Server(method, typeTable, lociTable);
    if (serverResult.isErr()) return serverResult;
    servers.push(serverResult.unwrap());
  }
  return ok(servers);
}

function parseOa3Server(
  serverMethod: MethodDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Oa3Server, ParserError> {
  const decorator = serverMethod.getDecoratorOrThrow("oa3server");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);
  const urlProp = getObjLiteralPropOrThrow<Oa3serverConfig>(
    decoratorConfig,
    "url"
  );
  const urlLiteral = getPropValueAsStringOrThrow(urlProp);

  const jsDocNode = getJsDoc(serverMethod);
  const description = jsDocNode?.getDescription().trim();
  const oa3serverVariablesParam = getParamWithDecorator(
    serverMethod,
    "oa3serverVariables"
  );

  const serverVariables: Oa3ServerVariable[] = [];
  if (oa3serverVariablesParam) {
    const variablesResult = parseOa3Variables(
      oa3serverVariablesParam,
      typeTable,
      lociTable
    );
    if (variablesResult.isErr()) return variablesResult;
    serverVariables.push(...variablesResult.unwrap());
  }

  return ok({
    url: urlLiteral.getLiteralValue(),
    description: description,
    oa3ServerVariables: serverVariables
  });
}

function parseOa3Variables(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Oa3ServerVariable[], ParserError> {
  parameter.getDecoratorOrThrow("oa3serverVariables");
  if (parameter.hasQuestionToken()) {
    return err(
      new OptionalNotAllowedError(
        "@oa3serverVariables parameter cannot be optional",
        {
          file: parameter.getSourceFile().getFilePath(),
          position: parameter.getQuestionTokenNodeOrThrow().getPos()
        }
      )
    );
  }

  const queryParamPropertySignatures =
    getParameterPropertySignaturesOrThrow(parameter);

  const oa3ServerVariableParams: Array<Oa3ServerVariable> = [];

  for (const propertySignature of queryParamPropertySignatures) {
    const typeResult = parseType(
      propertySignature.getTypeNodeOrThrow(),
      typeTable,
      lociTable
    );

    if (typeResult.isErr()) return typeResult;
    const type = typeResult.unwrap();

    const parameterName = getPropertyName(propertySignature);
    const jsDocNode = getJsDoc(propertySignature);
    const description = jsDocNode?.getDescription().trim();

    const defaultTagNode = jsDocNode
      ?.getTags()
      .find(tag => tag.getTagName() === "default");
    const defaultTag = defaultTagNode?.getComment()?.toString();
    if (!defaultTag) {
      return err(
        new ParserError("@default tag is mandatory ! ", {
          file: propertySignature.getSourceFile().getFilePath(),
          position: propertySignature.getPos()
        })
      );
    }

    oa3ServerVariableParams.push({
      type: type,
      description: description,
      defaultValue: defaultTag.replace(/^"(.*)"$/, "$1"),
      parameterName: parameterName
    });
  }

  return ok(oa3ServerVariableParams);
}
