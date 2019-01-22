import { HeaderDefinition } from "../../models/definitions";
import { HeaderNode } from "../../models/nodes";

export function cleanseHeader(headerNode: HeaderNode): HeaderDefinition {
  const name = headerNode.name.value;
  const description = headerNode.description && headerNode.description.value;
  const type = headerNode.type;
  const optional = headerNode.optional;

  return { name, description, type, optional };
}
