// OpenAPI 3.1 base vocabulary meta-schema, published by the OpenAPI Initiative.
// $id: https://spec.openapis.org/oas/3.1/meta/2024-11-10
// Source: https://spec.openapis.org/oas/3.1/meta/2024-11-10
// Copyright The Linux Foundation. Licensed under the Apache License, Version 2.0:
// https://www.apache.org/licenses/LICENSE-2.0
// The value below is the upstream document's JSON, unmodified.

export const OAS_3_1_META: Record<string, unknown> = {
  $id: "https://spec.openapis.org/oas/3.1/meta/2024-11-10",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "OAS Base Vocabulary",
  description: "A JSON Schema Vocabulary used in the OpenAPI Schema Dialect",
  $dynamicAnchor: "meta",
  $vocabulary: {
    "https://spec.openapis.org/oas/3.1/vocab/base": true
  },
  type: ["object", "boolean"],
  properties: {
    discriminator: {
      $ref: "#/$defs/discriminator"
    },
    example: true,
    externalDocs: {
      $ref: "#/$defs/external-docs"
    },
    xml: {
      $ref: "#/$defs/xml"
    }
  },
  $defs: {
    discriminator: {
      $ref: "#/$defs/extensible",
      properties: {
        mapping: {
          additionalProperties: {
            type: "string"
          },
          type: "object"
        },
        propertyName: {
          type: "string"
        }
      },
      required: ["propertyName"],
      type: "object",
      unevaluatedProperties: false
    },
    extensible: {
      patternProperties: {
        "^x-": true
      }
    },
    "external-docs": {
      $ref: "#/$defs/extensible",
      properties: {
        description: {
          type: "string"
        },
        url: {
          format: "uri-reference",
          type: "string"
        }
      },
      required: ["url"],
      type: "object",
      unevaluatedProperties: false
    },
    xml: {
      $ref: "#/$defs/extensible",
      properties: {
        attribute: {
          type: "boolean"
        },
        name: {
          type: "string"
        },
        namespace: {
          format: "uri",
          type: "string"
        },
        prefix: {
          type: "string"
        },
        wrapped: {
          type: "boolean"
        }
      },
      type: "object",
      unevaluatedProperties: false
    }
  }
};
