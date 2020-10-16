import { ParserError } from "../errors";
import { LociTable } from "../locations";
import { createProjectFromExistingSourceFile } from "../spec-helpers/helper";
import { TypeKind, TypeTable } from "../types";
import { parseEndpoint } from "./endpoint-parser";

describe("endpoint parser", () => {
  const exampleFile = createProjectFromExistingSourceFile(
    `${__dirname}/__spec-examples__/endpoint.ts`
  ).file;

  let typeTable: TypeTable;
  let lociTable: LociTable;

  beforeEach(() => {
    typeTable = new TypeTable();
    lociTable = new LociTable();
  });

  test("parses @endpoint decorated class", () => {
    const result = parseEndpoint(
      exampleFile.getClassOrThrow("EndpointClass"),
      typeTable,
      lociTable
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      defaultResponse: {
        body: {
          type: { kind: TypeKind.STRING }
        },
        description: undefined,
        headers: [
          {
            description: undefined,
            examples: undefined,
            name: "property",
            optional: false,
            type: { kind: TypeKind.STRING }
          }
        ]
      },
      description: "endpoint description",
      draft: false,
      method: "POST",
      name: "EndpointClass",
      path: "/path/:pathParam/nest",
      request: {
        body: {
          type: { kind: TypeKind.STRING }
        },
        headers: [
          {
            description: undefined,
            examples: undefined,
            name: "property",
            optional: false,
            type: { kind: TypeKind.STRING }
          }
        ],
        pathParams: [
          {
            description: undefined,
            examples: undefined,
            name: "pathParam",
            type: { kind: TypeKind.STRING }
          }
        ],
        queryParams: [
          {
            description: undefined,
            examples: undefined,
            name: "property",
            optional: false,
            type: { kind: TypeKind.STRING }
          }
        ]
      },
      responses: [
        {
          body: {
            type: { kind: TypeKind.STRING }
          },
          description: undefined,
          headers: [
            {
              description: undefined,
              examples: undefined,
              name: "property",
              optional: false,
              type: { kind: TypeKind.STRING }
            }
          ],
          status: 200
        }
      ],
      tags: ["tag1", "tag2"]
    });
  });

  test("parses minimal @endpoint decorated class", () => {
    const result = parseEndpoint(
      exampleFile.getClassOrThrow("MinimalEndpointClass"),
      typeTable,
      lociTable
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      defaultResponse: undefined,
      description: undefined,
      draft: false,
      method: "GET",
      name: "MinimalEndpointClass",
      path: "/path",
      request: undefined,
      responses: [],
      tags: []
    });
  });

  test("parses @draft & @endpoint decorated class", () => {
    const result = parseEndpoint(
      exampleFile.getClassOrThrow("DraftEndpointClass"),
      typeTable,
      lociTable
    ).unwrapOrThrow();

    expect(result).toStrictEqual({
      defaultResponse: undefined,
      description: undefined,
      draft: true,
      method: "GET",
      name: "DraftEndpointClass",
      path: "/path",
      request: undefined,
      responses: [],
      tags: []
    });
  });

  test("fails to parse endpoint with empty tag", () => {
    const err = parseEndpoint(
      exampleFile.getClassOrThrow("EndpointWithEmptyTag"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse endpoint with duplicate tag", () => {
    const err = parseEndpoint(
      exampleFile.getClassOrThrow("EndpointWithDuplicateTag"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse endpoint with duplicate dynamic path component", () => {
    const err = parseEndpoint(
      exampleFile.getClassOrThrow("EndpointWithDuplicateDynamicPathComponent"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse endpoint with missing path param", () => {
    const err = parseEndpoint(
      exampleFile.getClassOrThrow("EndpointWithMissingPathParam"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse endpoint with extra path param", () => {
    const err = parseEndpoint(
      exampleFile.getClassOrThrow("EndpointWithExtraPathParam"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse endpoint with duplicate response status", () => {
    const err = parseEndpoint(
      exampleFile.getClassOrThrow("EndpointWithDuplicateResponseStatus"),
      typeTable,
      lociTable
    ).unwrapErrOrThrow();

    expect(err).toBeInstanceOf(ParserError);
  });

  test("fails to parse non-@endpoint decorated class", () => {
    expect(() =>
      parseEndpoint(
        exampleFile.getClassOrThrow("NotEndpointClass"),
        typeTable,
        lociTable
      )
    ).toThrowError("Expected to find decorator named 'endpoint'");
  });
});
