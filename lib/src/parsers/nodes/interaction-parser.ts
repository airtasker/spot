import { MethodDeclaration, ObjectLiteralExpression } from "ts-simple-ast";
import { Locatable } from "../../models/locatable";
import {
  InteractionNode,
  InteractionRequestNode,
  InteractionResponseNode
} from "../../models/nodes";
import {
  extractDecoratorFactoryConfiguration,
  extractJsDocCommentLocatable,
  extractNumberProperty,
  extractObjectProperty,
  extractOptionalObjectProperty
} from "../utilities/parser-utility";

/**
 * Parse a `@interaction` decorated method.
 *
 * @param method a method declaration
 */
export function parseInteraction(
  method: MethodDeclaration
): Locatable<InteractionNode> {
  const decorator = method.getDecoratorOrThrow("interaction");
  const configuration = extractDecoratorFactoryConfiguration(decorator);

  const description = extractJsDocCommentLocatable(method);

  const requestProperty = extractOptionalObjectProperty(
    configuration,
    "request"
  );

  const responseProperty = extractObjectProperty(configuration, "response");

  const request = requestProperty && parseInteractionRequest(requestProperty);
  const response = parserInteractionResponse(responseProperty);

  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return {
    value: { description, request, response },
    location,
    line
  };
}

function parseInteractionRequest(
  requestProperty: Locatable<ObjectLiteralExpression>
): Locatable<InteractionRequestNode> {
  const headersProperty =
    requestProperty &&
    extractOptionalObjectProperty(requestProperty.value, "headers");
  const pathParamsProperty =
    requestProperty &&
    extractOptionalObjectProperty(requestProperty.value, "pathParams");
  const queryParamsProperty =
    requestProperty &&
    extractOptionalObjectProperty(requestProperty.value, "queryParams");

  const headers = headersProperty && {};
  const pathParams = pathParamsProperty && {};
  const queryParams = queryParamsProperty && {};
  const body = undefined;

  const value = { headers, pathParams, queryParams, body };

  const location = requestProperty.location;
  const line = requestProperty.line;

  return {
    value,
    location,
    line
  };
}

function parserInteractionResponse(
  responseProperty: Locatable<ObjectLiteralExpression>
): Locatable<InteractionResponseNode> {
  const status = extractNumberProperty(responseProperty.value, "status");
  const headersProperty =
    responseProperty &&
    extractOptionalObjectProperty(responseProperty.value, "headers");

  const headers = headersProperty && {};
  const body = undefined;

  const value = { status, headers, body };

  const location = responseProperty.location;
  const line = responseProperty.line;

  return {
    value,
    location,
    line
  };
}
