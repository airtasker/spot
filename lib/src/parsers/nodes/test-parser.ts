import {
  ArrayLiteralExpression,
  MethodDeclaration,
  ObjectLiteralExpression,
  ts,
  TypeGuards
} from "ts-morph";
import { Locatable } from "../../models/locatable";
import {
  TestNode,
  TestRequestNode,
  TestResponseNode,
  TestStateNode
} from "../../models/nodes";
import { DataExpression } from "../../models/types";
import { parseExpression } from "../utilities/expression-parser";
import {
  extractBooleanProperty,
  extractDecoratorFactoryConfiguration,
  extractDecoratorFactoryOptions,
  extractJsDocCommentLocatable,
  extractNumberProperty,
  extractObjectProperty,
  extractOptionalArrayProperty,
  extractOptionalObjectProperty
} from "../utilities/parser-utility";

/**
 * Parse a `@test` decorated method.
 *
 * @param method a method declaration
 */
export function parseTest(method: MethodDeclaration): Locatable<TestNode> {
  const decorator = method.getDecoratorOrThrow("test");
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const opts = extractDecoratorFactoryOptions(decorator);

  const description = extractJsDocCommentLocatable(method);

  const requestProperty = extractOptionalObjectProperty(
    configuration,
    "request"
  );

  const responseProperty = extractObjectProperty(configuration, "response");

  const statesProperty = extractOptionalArrayProperty(configuration, "states");

  const request = requestProperty && parseTestRequest(requestProperty);
  const response = parseTestResponse(responseProperty);
  const states = statesProperty && parseStates(statesProperty.value);

  const allowInvalidRequest = opts
    ? extractBooleanProperty(opts, "allowInvalidRequest").value
    : false;

  const options = { allowInvalidRequest };

  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return {
    value: { description, states, request, response, options },
    location,
    line
  };
}

function parseStates(expression: ArrayLiteralExpression): TestStateNode[] {
  return expression.getElements().map(exp => {
    if (TypeGuards.isObjectLiteralExpression(exp)) {
      const nameProperty = exp.getPropertyOrThrow("name");
      if (!TypeGuards.isPropertyAssignment(nameProperty)) {
        throw new Error("expected property assignment");
      }
      const name = nameProperty
        .getInitializerIfKindOrThrow(ts.SyntaxKind.StringLiteral)
        .getLiteralValue();

      const paramsProperty = extractOptionalObjectProperty(exp, "params");
      const params =
        paramsProperty && objectExpressionToProperties(paramsProperty.value);

      return {
        name,
        params
      };
    } else {
      throw new Error("expected object literal expression");
    }
  });
}

function parseTestRequest(
  requestProperty: Locatable<ObjectLiteralExpression>
): Locatable<TestRequestNode> {
  const headersProperty = extractOptionalObjectProperty(
    requestProperty.value,
    "headers"
  );
  const pathParamsProperty = extractOptionalObjectProperty(
    requestProperty.value,
    "pathParams"
  );
  const queryParamsProperty = extractOptionalObjectProperty(
    requestProperty.value,
    "queryParams"
  );
  const bodyProperty = requestProperty.value.getProperty("body");

  const headers =
    headersProperty && objectExpressionToProperties(headersProperty.value);
  const pathParams =
    pathParamsProperty &&
    objectExpressionToProperties(pathParamsProperty.value);
  const queryParams =
    queryParamsProperty &&
    objectExpressionToProperties(queryParamsProperty.value);
  const body =
    bodyProperty &&
    (TypeGuards.isPropertyAssignment(bodyProperty)
      ? parseExpression(bodyProperty.getInitializerOrThrow())
      : undefined);

  const value = { headers, pathParams, queryParams, body };

  const location = requestProperty.location;
  const line = requestProperty.line;

  return {
    value,
    location,
    line
  };
}

function parseTestResponse(
  responseProperty: Locatable<ObjectLiteralExpression>
): Locatable<TestResponseNode> {
  const status = extractNumberProperty(responseProperty.value, "status");
  const headersProperty = extractOptionalObjectProperty(
    responseProperty.value,
    "headers"
  );
  const bodyProperty = responseProperty.value.getProperty("body");

  const headers =
    headersProperty && objectExpressionToProperties(headersProperty.value);
  const body =
    bodyProperty &&
    (TypeGuards.isPropertyAssignment(bodyProperty)
      ? parseExpression(bodyProperty.getInitializerOrThrow())
      : undefined);

  const value = { status, headers, body };

  const location = responseProperty.location;
  const line = responseProperty.line;

  return {
    value,
    location,
    line
  };
}

function objectExpressionToProperties(
  expression: ObjectLiteralExpression
): { name: string; expression: DataExpression }[] {
  return expression.getProperties().map(property => {
    if (TypeGuards.isPropertyAssignment(property)) {
      return {
        name: property.getName(),
        expression: parseExpression(property.getInitializerOrThrow())
      };
    } else {
      throw new Error("expected property assignment");
    }
  });
}
