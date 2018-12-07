import * as ts from "typescript";
import { ApiDescription, api } from "@airtasker/spot";
import { extractSingleDecorator } from "../decorators";
import { panic } from "../panic";
import {
  isObjectLiteral,
  ObjectLiteral,
  isStringLiteral
} from "../literal-parser";

/**
 * Parses a top-level API class definition and the endpoints it defines, such as:
 * ```
 * @api({
 *   name: "My API",
 *   description: "A really cool API"
 * })
 * class Api {
 *   @endpoint({
 *     method: "POST",
 *     path: "/users"
 *   })
 *   createUser(@request req: CreateUserRequest): CreateUserResponse {
 *     ...
 *   }
 * }
 * ```
 */
export function parseApiClass(
  sourceFile: ts.SourceFile,
  classDeclaration: ts.ClassDeclaration
): ApiDescription {
  const apiDecorator = extractSingleDecorator(
    sourceFile,
    classDeclaration,
    "api"
  );
  if (!apiDecorator) {
    throw panic("@api() decorator not found");
  }
  if (apiDecorator.arguments.length !== 1) {
    throw panic(
      `Expected exactly one argument for @api(), got ${
        apiDecorator.arguments.length
      }`
    );
  }
  const apiDescription = apiDecorator.arguments[0];
  if (!isObjectLiteral(apiDescription)) {
    throw panic(
      `@api() expects an object literal, got this instead: ${classDeclaration.getText(
        sourceFile
      )}`
    );
  }
  return extractApiInfo(sourceFile, classDeclaration, apiDescription);
}

function extractApiInfo(
  sourceFile: ts.SourceFile,
  classDeclaration: ts.ClassDeclaration,
  apiDescription: ObjectLiteral
): ApiDescription {
  const nameLiteral = apiDescription.properties["name"];
  if (!isStringLiteral(nameLiteral)) {
    throw panic(
      `Invalid name in api description: ${classDeclaration.getText(sourceFile)}`
    );
  }
  let description = undefined;
  const descriptionLiteral = apiDescription.properties["description"];
  if (descriptionLiteral) {
    if (!isStringLiteral(descriptionLiteral)) {
      throw panic(
        `Invalid name in api description: ${classDeclaration.getText(
          sourceFile
        )}`
      );
    }
    description = descriptionLiteral.text;
  }
  return {
    name: nameLiteral.text,
    description: description
  };
}
