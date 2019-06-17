import assertNever from "assert-never";
import { compact, flatten } from "lodash";
import { Locatable } from "../../models/locatable";
import { EndpointNode } from "../../models/nodes";
import { DataType, TypeKind, UnionType } from "../../models/types";
import { inferDiscriminator } from "../../utilities/infer-discriminator";
import { LintingRule } from "../rule";

/**
 * Checks that all union types have a discriminator.
 */
export const hasDiscriminator: LintingRule = contract => {
  const topLevelTypes = flatten([
    ...contract.types,
    ...contract.endpoints.map(extractEndpointTypes)
  ]);
  const unionTypes = flatten(
    topLevelTypes.map(t => extractNestedUnionTypes(t.type, t.name))
  );
  return unionTypes
    .filter(
      namedType => inferDiscriminator(contract.types, namedType.type) === null
    )
    .map(namedType => ({
      message: `The type \`${namedType.name}\` doesn't have a discriminator`
    }));
};

function extractEndpointTypes(endpoint: Locatable<EndpointNode>): NamedType[] {
  return compact([
    endpoint.value.request &&
      endpoint.value.request.value.body && {
        name: `${endpoint.value.name.value} (request body)`,
        type: endpoint.value.request.value.body.value.type
      },
    endpoint.value.defaultResponse &&
      endpoint.value.defaultResponse.value.body && {
        name: `${endpoint.value.name.value} (default response body)`,
        type: endpoint.value.defaultResponse.value.body.value.type
      },
    ...endpoint.value.responses.map(
      response =>
        response.value.body && {
          name: `${endpoint.value.name.value} (response body for status ${response.value.status.value})`,
          type: response.value.body.value.type
        }
    )
  ]);
}

function extractNestedUnionTypes(
  type: DataType,
  name = ""
): Array<NamedType<UnionType>> {
  switch (type.kind) {
    case TypeKind.NULL:
    case TypeKind.BOOLEAN:
    case TypeKind.STRING:
    case TypeKind.FLOAT:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING_LITERAL:
    case TypeKind.NUMBER_LITERAL:
    case TypeKind.TYPE_REFERENCE:
      return [];
    case TypeKind.OBJECT:
      return flatten(
        type.properties.map(property =>
          extractNestedUnionTypes(property.type, name + "." + property.name)
        )
      );
    case TypeKind.ARRAY:
      return extractNestedUnionTypes(type.elements, name);
    case TypeKind.UNION:
      return flatten([
        {
          name,
          type
        },
        ...type.types.map((possibleType, index) =>
          extractNestedUnionTypes(possibleType, `${name}[${index}]`)
        )
      ]);
    default:
      throw assertNever(type);
  }
}

export interface NamedType<T extends DataType = DataType> {
  name: string;
  type: T;
}
