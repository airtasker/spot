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
    servers.push(serverResult);
  }
  return ok(servers);
}

export function parseOa3Server(
  serverMethod: MethodDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Oa3Server {
  const decorator = serverMethod.getDecoratorOrThrow("oa3server");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);
  const urlProp = getObjLiteralPropOrThrow<Oa3serverConfig>(
    decoratorConfig,
    "url"
  );
  const urlLiteral = getPropValueAsStringOrThrow(urlProp);

  const jsDocNode = getJsDoc(serverMethod);
  const description = jsDocNode?.getDescription().trim();

  const variables = serverMethod
    .getParameters()
    .filter(p => p.getDecorator("oa3serverVariable") !== undefined);

  const serverVariables: Oa3ServerVariable[] = [];
  for (const variable of variables) {
    const variablesResult = parseOa3Variables(variable, typeTable, lociTable);
    serverVariables.push(variablesResult.unwrapOrThrow());
  }

  return {
    url: urlLiteral.getLiteralValue(),
    description: description,
    oa3ServerVariables: serverVariables
  };
}

export function parseOa3Variables(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Oa3ServerVariable, ParserError> {
  // TODO: retrieve JsDoc as server variable description https://github.com/dsherret/ts-morph/issues/753
  parameter.getDecoratorOrThrow("oa3serverVariable");
  if (parameter.hasQuestionToken()) {
    return err(
      new OptionalNotAllowedError(
        "@oa3serverVariable parameter cannot be optional",
        {
          file: parameter.getSourceFile().getFilePath(),
          position: parameter.getQuestionTokenNodeOrThrow().getPos()
        }
      )
    );
  }

  const typeResult = parseType(
    parameter.getTypeNodeOrThrow(),
    typeTable,
    lociTable
  );

  if (typeResult.isErr()) return typeResult;

  const parameterName = parameter.getName();

  const defaultValue = parameter.getInitializerOrThrow().getText().trim();

  return ok({
    type: typeResult.unwrap(),
    defaultValue: defaultValue,
    parameterName: parameterName
  });
}
