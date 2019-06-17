import { ClassDeclaration } from "ts-morph";
import { TypeKind } from "../../models/types";
import { createSourceFile } from "../../spec-helpers/helper";
import { parseSecurityHeader } from "./security-header-parser";

describe("@securityHeader parser", () => {
  test("parses all information", () => {
    const klass = createClassDeclaration(`
      /** security header description */
      @securityHeader
      'x-auth-token'?: string;
    `);
    const property = klass.getPropertyOrThrow("'x-auth-token'");

    expect(parseSecurityHeader(property)).toStrictEqual({
      value: {
        name: {
          value: "x-auth-token",
          location: expect.stringMatching(/main\.ts$/),
          line: 6
        },
        description: {
          value: "security header description",
          location: expect.stringMatching(/main\.ts$/),
          line: 4
        },
        type: {
          kind: TypeKind.STRING
        }
      },
      location: expect.stringMatching(/main\.ts$/),
      line: 5
    });
  });
});

function createClassDeclaration(classContent: string): ClassDeclaration {
  const content = `
    import { securityHeader, headers, body } from "@airtasker/spot"

    class TestClass {
      ${classContent.trim()}
    }
  `;

  const sourceFile = createSourceFile({
    path: "main",
    content: content.trim()
  });
  const klass = sourceFile.getClassOrThrow("TestClass");

  return klass;
}
