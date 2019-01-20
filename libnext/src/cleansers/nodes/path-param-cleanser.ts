import { PathParamDefinition } from "../../models/definitions";
import { PathParamNode } from "../../models/nodes";

export function cleansePathParam(
  pathParamNode: PathParamNode
): PathParamDefinition {
  const name = pathParamNode.name.value;
  const description =
    pathParamNode.description && pathParamNode.description.value;
  const type = pathParamNode.type;

  return { name, description, type };
}
