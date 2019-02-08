import { SecurityHeaderDefinition } from "../../models/definitions";
import { SecurityHeaderNode } from "../../models/nodes";

export function cleanseSecurityHeader(
  securityHeaderNode: SecurityHeaderNode
): SecurityHeaderDefinition {
  const name = securityHeaderNode.name.value;
  const description =
    securityHeaderNode.description && securityHeaderNode.description.value;
  const type = securityHeaderNode.type;
  return { name, description, type };
}
