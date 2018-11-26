import * as ts from "typescript";
import { isHttpContentType, isHttpMethod } from "../lib";
import {
  Api,
  DynamicPathComponent,
  Endpoint,
  Headers,
  PathComponent,
  QueryParamComponent,
  SpecificError,
  Type,
  VOID
} from "../models";
import {
  extractMultipleDecorators,
  extractSingleDecorator
} from "./decorators";
import {
  extractLiteral,
  isNumericLiteral,
  isObjectLiteral,
  isStringLiteral,
  Literal
} from "./literal-parser";
import { panic } from "./panic";
import { extractType } from "./type-parser";

/**
 * Parses a top-level API class definition and the endpoints it defines, such as:
 * ```
 * @api()
 * class Api {
 *   @endpoint({
 *     method: "POST",
 *     path: "/users"
 *   })
 *   createUser(@request req: CreateUserRequest): CreateUserResponse {
 *     throw "contract";
 *   }
 * }
 * ```
 */
export function parseApiClass(
  sourceFile: ts.SourceFile,
  classDeclaration: ts.ClassDeclaration,
  api: Api
): void {
  for (const member of classDeclaration.members) {
    if (ts.isMethodDeclaration(member)) {
      parseEndpointMethod(sourceFile, member, api);
    }
  }
}

/**
 * Parses a method of an API class definition, such as:
 * ```
 * @endpoint({
 *   method: "POST",
 *   path: "/users"
 * })
 * createUser(@request req: CreateUserRequest): CreateUserResponse {
 *   throw "contract";
 * }
 * ```
 *
 * Methods that do not have an @endpoint() decorator will be ignored.
 *
 * @param sourceFile The TypeScript source file.
 * @param methodDeclaration A method declaration.
 */
function parseEndpointMethod(
  sourceFile: ts.SourceFile,
  methodDeclaration: ts.MethodDeclaration,
  api: Api
): void {
  const endpointDecorator = extractSingleDecorator(
    sourceFile,
    methodDeclaration,
    "endpoint"
  );
  if (!endpointDecorator) {
    return;
  }
  const endpointName = methodDeclaration.name.getText(sourceFile);
  if (api.endpoints[endpointName]) {
    throw panic(
      `Found multiple definitions of the same endpoint ${endpointName}`
    );
  }
  const genericErrorDecorator = extractSingleDecorator(
    sourceFile,
    methodDeclaration,
    "genericError"
  );
  const specificErrorDecorators = extractMultipleDecorators(
    sourceFile,
    methodDeclaration,
    "specificError"
  );
  if (endpointDecorator.arguments.length !== 1) {
    throw panic(
      `Expected exactly one argument for @endpoint(), got ${
        endpointDecorator.arguments.length
      }`
    );
  }
  const endpointDescriptionExpression = endpointDecorator.arguments[0];
  const endpointDescription = extractLiteral(
    sourceFile,
    endpointDescriptionExpression
  );
  if (!isObjectLiteral(endpointDescription)) {
    throw panic(
      `@endpoint() expects an object literal, got this instead: ${endpointDescriptionExpression.getText(
        sourceFile
      )}`
    );
  }
  const methodLiteral = endpointDescription.properties["method"];
  const pathLiteral = endpointDescription.properties["path"];
  const requestContentTypeLiteral =
    endpointDescription.properties["requestContentType"];
  const successStatusCodeLiteral =
    endpointDescription.properties["successStatusCode"];

  if (!isStringLiteral(methodLiteral)) {
    throw panic(
      `Invalid method in endpoint description: ${endpointDescriptionExpression.getText(
        sourceFile
      )}`
    );
  }
  const method = methodLiteral.text;
  if (!isHttpMethod(method)) {
    throw panic(`${method} is not a valid HTTP method`);
  }
  if (!isStringLiteral(pathLiteral)) {
    throw panic(
      `Invalid path in endpoint description: ${endpointDescriptionExpression.getText(
        sourceFile
      )}`
    );
  }

  let requestContentType = "application/json";
  if (requestContentTypeLiteral) {
    if (!isStringLiteral(requestContentTypeLiteral)) {
      throw panic(
        `Invalid request content type in endpoint description: ${endpointDescriptionExpression.getText(
          sourceFile
        )}`
      );
    }
    requestContentType = requestContentTypeLiteral.text;
  }
  if (!isHttpContentType(requestContentType)) {
    throw panic(`${method} is not a valid HTTP content type`);
  }

  let successStatusCode;
  if (successStatusCodeLiteral) {
    if (!isNumericLiteral(successStatusCodeLiteral)) {
      throw panic(
        `Invalid success status code in endpoint description: ${endpointDescriptionExpression.getText(
          sourceFile
        )}`
      );
    }
    successStatusCode = parseInt(successStatusCodeLiteral.text);
  }
  const path = pathLiteral.text;
  const pathComponents: PathComponent[] = [];
  const dynamicPathComponents: { [name: string]: DynamicPathComponent } = {};
  if (path.length > 0) {
    let componentStartPosition = 0;
    do {
      if (path.charAt(componentStartPosition) === ":") {
        // The parameter name extends until a character that isn't a valid name.
        const nextNonNamePositionRelative = path
          .substr(componentStartPosition + 1)
          .search(/[^a-z0-9_]/gi);
        const dynamicPathComponent: DynamicPathComponent = {
          kind: "dynamic",
          name: path.substr(
            componentStartPosition + 1,
            nextNonNamePositionRelative === -1
              ? undefined
              : nextNonNamePositionRelative
          ),
          type: VOID,
          description: ""
        };
        pathComponents.push(dynamicPathComponent);
        dynamicPathComponents[dynamicPathComponent.name] = dynamicPathComponent;
        componentStartPosition =
          nextNonNamePositionRelative === -1
            ? -1
            : componentStartPosition + 1 + nextNonNamePositionRelative;
      } else {
        // The static component extends until the next parameter, which starts with ":".
        const nextColumnPosition = path.indexOf(":", componentStartPosition);
        pathComponents.push({
          kind: "static",
          content: path.substring(
            componentStartPosition,
            nextColumnPosition === -1 ? undefined : nextColumnPosition
          )
        });
        componentStartPosition = nextColumnPosition;
      }
    } while (componentStartPosition !== -1);
  }
  let requestType: Type = VOID;
  const headers: Headers = {};
  const queryParams: QueryParamComponent[] = [];
  const queryParamComponents: { [name: string]: QueryParamComponent } = {};
  for (const parameter of methodDeclaration.parameters) {
    const requestDecorator = extractSingleDecorator(
      sourceFile,
      parameter,
      "request"
    );
    const pathParamDecorator = extractSingleDecorator(
      sourceFile,
      parameter,
      "pathParam"
    );
    const headerDecorator = extractSingleDecorator(
      sourceFile,
      parameter,
      "header"
    );
    const queryParamDecorator = extractSingleDecorator(
      sourceFile,
      parameter,
      "queryParam"
    );
    if (parameter.questionToken) {
      throw panic(
        `Question tokens are not allowed in parameter definitions. Please use Optional<...> to be specific. Offending parameter: ${parameter.getText(
          sourceFile
        )}`
      );
    }
    if (!ts.isIdentifier(parameter.name)) {
      throw panic(
        `Expected a plain identifier for endpoint parameter name, got this instead: ${parameter.getText(
          sourceFile
        )}`
      );
    }
    if (!parameter.type) {
      throw panic(
        `Expected a type for endpoint parameter: ${parameter.getText(
          sourceFile
        )}`
      );
    }
    const type = extractType(sourceFile, parameter.type);
    if (requestDecorator) {
      requestType = type;
    } else if (pathParamDecorator) {
      const name = parameter.name.getText(sourceFile);
      if (dynamicPathComponents[name]) {
        dynamicPathComponents[name].type = type;
      } else {
        throw panic(
          `Found a path parameter that isn't present in path. Expected one of [${Object.keys(
            dynamicPathComponents
          ).join(", ")}], got this instead: ${name}`
        );
      }
      if (pathParamDecorator.arguments.length > 1) {
        throw panic(
          `Expected exactly one or no arguments for @pathParam(), got ${
            pathParamDecorator.arguments.length
          }`
        );
      }
      if (pathParamDecorator.arguments.length === 1) {
        const pathParamDescription = extractLiteral(
          sourceFile,
          pathParamDecorator.arguments[0]
        );
        if (!isObjectLiteral(pathParamDescription)) {
          throw panic(
            `@pathParam() expects an object literal, got this instead: ${pathParamDecorator.arguments[0].getText(
              sourceFile
            )}`
          );
        }
        const descriptionProperty =
          pathParamDescription.properties["description"];
        if (!descriptionProperty || !isStringLiteral(descriptionProperty)) {
          throw panic(
            `@pathParam() expects a string description, got this instead: ${pathParamDecorator.arguments[0].getText(
              sourceFile
            )}`
          );
        }
        dynamicPathComponents[name].description = descriptionProperty.text;
      }
    } else if (queryParamDecorator) {
      const name = parameter.name.getText(sourceFile);

      if (queryParamComponents[name]) {
        throw panic(`Found multiple query parameters named ${name}`);
      } else {
        const queryParamComponent: QueryParamComponent = {
          name: name,
          description: "",
          type: type
        };
        queryParams.push(queryParamComponent);
        queryParamComponents[queryParamComponent.name] = queryParamComponent;
      }

      if (queryParamDecorator.arguments.length > 1) {
        throw panic(
          `Expected exactly one or no arguments for @queryParam(), got ${
            queryParamDecorator.arguments.length
          }`
        );
      }
      if (queryParamDecorator.arguments.length === 1) {
        const queryParamDescription = extractLiteral(
          sourceFile,
          queryParamDecorator.arguments[0]
        );
        if (!isObjectLiteral(queryParamDescription)) {
          throw panic(
            `@queryParam() expects an object literal, got this instead: ${queryParamDecorator.arguments[0].getText(
              sourceFile
            )}`
          );
        }
        const descriptionProperty =
          queryParamDescription.properties["description"];
        if (!descriptionProperty || !isStringLiteral(descriptionProperty)) {
          throw panic(
            `@queryParam() expects a string description, got this instead: ${queryParamDecorator.arguments[0].getText(
              sourceFile
            )}`
          );
        }
        queryParamComponents[name].description = descriptionProperty.text;
      }
    } else if (headerDecorator) {
      const name = parameter.name.getText(sourceFile);
      if (headers[name]) {
        throw panic(`Found multiple headers named ${name}`);
      }
      if (headerDecorator.arguments.length !== 1) {
        throw panic(
          `Expected exactly one argument for @header(), got ${
            headerDecorator.arguments.length
          }`
        );
      }
      const headerDescription = extractLiteral(
        sourceFile,
        headerDecorator.arguments[0]
      );
      if (!isObjectLiteral(headerDescription)) {
        throw panic(
          `@header() expects an object literal, got this instead: ${headerDecorator.arguments[0].getText(
            sourceFile
          )}`
        );
      }
      const nameProperty = headerDescription.properties["name"];
      if (!nameProperty || !isStringLiteral(nameProperty)) {
        throw panic(
          `@header() expects a string name, got this instead: ${headerDecorator.arguments[0].getText(
            sourceFile
          )}`
        );
      }
      const descriptionProperty = headerDescription.properties["description"];
      let description = "";
      if (descriptionProperty) {
        if (!isStringLiteral(descriptionProperty)) {
          throw panic(
            `@header() expects a string description, got this instead: ${headerDecorator.arguments[0].getText(
              sourceFile
            )}`
          );
        }
        description = descriptionProperty.text;
      }
      headers[name] = {
        headerFieldName: nameProperty.text,
        description,
        type
      };
    } else {
      throw panic(
        `Found a parameter without @request, @pathParam or @header: ${parameter.getText(
          sourceFile
        )}`
      );
    }
  }
  let responseType: Type = VOID;
  if (methodDeclaration.type) {
    if (
      ts.isTypeReferenceNode(methodDeclaration.type) &&
      ts.isIdentifier(methodDeclaration.type.typeName) &&
      methodDeclaration.type.typeName.escapedText === "Promise"
    ) {
      if (
        !methodDeclaration.type.typeArguments ||
        methodDeclaration.type.typeArguments.length !== 1
      ) {
        throw panic(
          `Expected Promise<...>, got this instead: ${methodDeclaration.type.getText(
            sourceFile
          )}`
        );
      }
      const promisedType = methodDeclaration.type.typeArguments[0];
      responseType = extractType(sourceFile, promisedType);
    } else {
      responseType = extractType(sourceFile, methodDeclaration.type);
    }
  }
  let genericErrorType: Type = VOID;
  let specificErrorTypes: {
    [name: string]: SpecificError;
  } = {};
  if (genericErrorDecorator) {
    if (genericErrorDecorator.typeParameters.length !== 1) {
      throw panic(
        `Expected exactly one type parameter for @genericError(), got ${
          genericErrorDecorator.typeParameters.length
        }`
      );
    }
    genericErrorType = extractType(
      sourceFile,
      genericErrorDecorator.typeParameters[0]
    );
  }
  for (const specificErrorDecorator of specificErrorDecorators) {
    if (specificErrorDecorator.typeParameters.length !== 1) {
      throw panic(
        `Expected exactly one type parameter for @specificError(), got ${
          specificErrorDecorator.typeParameters.length
        }`
      );
    }
    const errorResponseType = extractType(
      sourceFile,
      specificErrorDecorator.typeParameters[0]
    );
    if (specificErrorDecorator.arguments.length !== 1) {
      throw panic(
        `Expected exactly one argument for @specificError(), got ${
          specificErrorDecorator.arguments.length
        }`
      );
    }
    let errorDescription: Literal;
    if (specificErrorDecorator.arguments.length === 1) {
      errorDescription = extractLiteral(
        sourceFile,
        specificErrorDecorator.arguments[0]
      );
      if (!isObjectLiteral(errorDescription)) {
        throw panic(
          `@specificError() expects an object literal, got this instead: ${specificErrorDecorator.arguments[0].getText(
            sourceFile
          )}`
        );
      }
    } else {
      errorDescription = {
        kind: "object",
        properties: {}
      };
    }
    const name = errorDescription.properties["name"];
    if (!name || !isStringLiteral(name)) {
      throw panic(
        `@specificError() expects a string name, got this instead: ${specificErrorDecorator.arguments[0].getText(
          sourceFile
        )}`
      );
    }
    const statusCode = errorDescription.properties["statusCode"];
    if (!statusCode || !isNumericLiteral(statusCode)) {
      throw panic(
        `@specificError() expects a numeric status code, got this instead: ${specificErrorDecorator.arguments[0].getText(
          sourceFile
        )}`
      );
    }
    specificErrorTypes[name.text] = {
      // TODO: Ensure that the status is an integer.
      statusCode: parseInt(statusCode.text),
      type: errorResponseType
    };
  }
  const endpoint: Endpoint = {
    method,
    path: pathComponents,
    requestContentType,
    headers,
    queryParams,
    requestType,
    responseType,
    genericErrorType,
    specificErrorTypes,
    ...(successStatusCode ? { successStatusCode } : {})
  };
  api.endpoints[endpointName] = endpoint;
}
