import { QueryParamDefinition } from "../../models/definitions";
import { QueryParamNode } from "../../models/nodes";

export function cleanseQueryParam(
  queryParamNode: QueryParamNode
): QueryParamDefinition {
  const name = queryParamNode.name.value;
  const description =
    queryParamNode.description && queryParamNode.description.value;
  const type = queryParamNode.type;
  const optional = queryParamNode.optional;

  return { name, description, type, optional };
}
