import { MethodDeclaration } from "ts-simple-ast";
import { NUMBER, STRING } from "../../models/types";
import { createSourceFile } from "../../test/helper";
import { parseHeaders } from "./headers-parser";

describe("@headers parser", () => {
  test("parses all information", () => {
    const method = createMethodDeclaration(`
      @headers
      headersParams: {
        /** auth token description */
        "x-auth-token": string;
        /** expiry description */
        expiresIn?: number;
      }
    `);

    const parameter = method.getParameterOrThrow("headersParams");
    const result = parseHeaders(parameter);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      description: "auth token description",
      name: "x-auth-token",
      type: STRING,
      optional: false
    });
    expect(result).toContainEqual({
      description: "expiry description",
      name: "expiresIn",
      type: NUMBER,
      optional: true
    });
  });

  test("fails if the object is optional", () => {
    const method = createMethodDeclaration(`
      @headers
      headersParams?: {
        "x-auth-token": string;
        expiresIn?: number;
      }
    `);

    const parameter = method.getParameterOrThrow("headersParams");
    expect(() => parseHeaders(parameter)).toThrow();
  });
});

function createMethodDeclaration(
  methodParameterContent: string
): MethodDeclaration {
  const content = `
    import { headers } from "@airtasker/spot"

    class TestClass {
      testMethod(
        ${methodParameterContent}
      ) {}
    }
  `;

  const sourceFile = createSourceFile({ path: "main", content: content });
  const klass = sourceFile.getClassOrThrow("TestClass");
  const method = klass.getMethodOrThrow("testMethod");

  return method;
}
