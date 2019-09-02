import { createExistingSourceFile } from "../../spec-helpers/helper";
import { LociTable } from "../locations";
import { TypeKind, TypeTable } from "../types";
import { parseEndpoint } from "./endpoint-parser";

describe("endpoint parser", () => {
  const exampleFile = createExistingSourceFile(
    `${__dirname}/__spec-examples__/endpoint.ts`
  );

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
    );

    expect(result).toStrictEqual({
      defaultResponse: {
        body: {
          type: { kind: TypeKind.STRING }
        },
        description: undefined,
        headers: [
          {
            description: undefined,
            name: "property",
            optional: false,
            type: { kind: TypeKind.STRING }
          }
        ]
      },
      description: "endpoint description",
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
            name: "property",
            optional: false,
            type: { kind: TypeKind.STRING }
          }
        ],
        pathParams: [
          {
            description: undefined,
            name: "pathParam",
            type: { kind: TypeKind.STRING }
          }
        ],
        queryParams: [
          {
            description: undefined,
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
    );

    expect(result).toStrictEqual({
      defaultResponse: undefined,
      description: undefined,
      method: "GET",
      name: "MinimalEndpointClass",
      path: "/path",
      request: undefined,
      responses: [],
      tags: []
    });
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
