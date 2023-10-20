import { LociTable } from "../locations";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import { TypeTable } from "../types";
import { parseOa3Servers } from "./oa3server-parser";

describe("oa3server parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/oa3server.ts`
  ).file;

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses @oa3server decorated - Minimal Contract with one server", () => {
    const klass = exampleFile.getClassOrThrow("MinimalOneServerClass");

    const result = parseOa3Servers(klass, typeTable, lociTable).unwrapOrThrow();
    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      url: "https://{username}.gigantic-server.com:{port}/{basePath}",
      description: "Production server",
      oa3ServerVariables: []
    });
  });

  test("parses @oa3server decorated - Minimal Contract with two servers", () => {
    const klass = exampleFile.getClassOrThrow("MinimalTwoServersClass");

    const result = parseOa3Servers(klass, typeTable, lociTable).unwrapOrThrow();
    expect(result).toHaveLength(2);
    expect(result[0]).toStrictEqual({
      url: "https://prd.gigantic-server.com:4243/v1",
      description: "Production server",
      oa3ServerVariables: []
    });
    expect(result[1]).toStrictEqual({
      url: "https://dev.gigantic-server.com:8080/v1",
      oa3ServerVariables: [],
      description: undefined
    });
  });

  test("parses @oa3server decorated - Contract with one server & variables", () => {
    const klass = exampleFile.getClassOrThrow("OneServerWithServerVariables");

    const result = parseOa3Servers(klass, typeTable, lociTable).unwrapOrThrow();
    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      url: "https://{username}.gigantic-server.com:{port}/{basePath}",
      description: "Production server",
      oa3ServerVariables: [
        {
          defaultValue: "demo",
          description:
            "this value is assigned by the service provider, in this example `gigantic-server.com`",
          parameterName: "username",
          type: {
            kind: "string"
          }
        },
        {
          defaultValue: "8443",
          description: "",
          parameterName: "port",
          type: {
            discriminator: undefined,
            kind: "union",
            types: [
              {
                kind: "string-literal",
                value: "8443"
              },
              {
                kind: "string-literal",
                value: "443"
              }
            ]
          }
        },
        {
          defaultValue: "v2",
          description: "",
          parameterName: "basePath",
          type: {
            kind: "string"
          }
        }
      ]
    });
  });

  test("parses @oa3server decorated - Contract with two servers & variables", () => {
    const klass = exampleFile.getClassOrThrow("TwoServerWithServerVariables");

    const result = parseOa3Servers(klass, typeTable, lociTable).unwrapOrThrow();
    expect(result).toHaveLength(2);
    expect(result[0]).toStrictEqual({
      url: "https://{username}.gigantic-server.com:{port}/{basePath}",
      description: "Production server",
      oa3ServerVariables: [
        {
          defaultValue: "demo",
          description:
            "this value is assigned by the service provider, in this example `gigantic-server.com`",
          parameterName: "username",
          type: {
            kind: "string"
          }
        },
        {
          defaultValue: "8443",
          description: "",
          parameterName: "port",
          type: {
            discriminator: undefined,
            kind: "union",
            types: [
              {
                kind: "string-literal",
                value: "8443"
              },
              {
                kind: "string-literal",
                value: "443"
              }
            ]
          }
        },
        {
          defaultValue: "v2",
          description: "",
          parameterName: "basePath",
          type: {
            kind: "string"
          }
        }
      ]
    });

    expect(result[1]).toStrictEqual({
      url: "https://{username}.gigantic-server.com:{port}/{basePath}",
      description: "Dev server",
      oa3ServerVariables: [
        {
          defaultValue: "dev",
          description:
            "this value is assigned by the service provider, in this example `gigantic-server.com`",
          parameterName: "username",
          type: {
            kind: "string"
          }
        },
        {
          defaultValue: "8080",
          description: "",
          parameterName: "port",
          type: {
            discriminator: undefined,
            kind: "union",
            types: [
              {
                kind: "string-literal",
                value: "8080"
              },
              {
                kind: "string-literal",
                value: "8081"
              }
            ]
          }
        },
        {
          defaultValue: "v2",
          description: "",
          parameterName: "basePath",
          type: {
            kind: "string"
          }
        }
      ]
    });
  });

  test("Throws exception when @default tag is missing", () => {
    expect(() => {
      const klass = exampleFile.getClassOrThrow(
        "OneServerWithServerVariablesException"
      );
      parseOa3Servers(klass, typeTable, lociTable).unwrapOrThrow();
    }).toThrow("@default tag is mandatory ! ");
  });
});
