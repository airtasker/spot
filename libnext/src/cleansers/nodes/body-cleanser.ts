import { BodyDefinition } from "../../models/definitions";
import { BodyNode } from "../../models/nodes";

export function cleanseBody(bodyNode: BodyNode): BodyDefinition {
  const description = bodyNode.description && bodyNode.description.value;
  const type = bodyNode.type;

  return { description, type };
}
