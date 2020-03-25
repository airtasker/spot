import { Contract } from "../../definitions";
import { JsonSchema, JsonSchemaType } from "./json-schema-specification";
import { typeToJsonSchemaType } from "./json-schema-type-util";

export function generateJsonSchema(contract: Contract): JsonSchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: contract.types.reduce<{
      [typeName: string]: JsonSchemaType;
    }>((acc, typeNode) => {
      acc[typeNode.name] = typeToJsonSchemaType(typeNode.typeDef.type);
      return acc;
    }, {})
  };
}
