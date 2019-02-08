import { ApiDefinition } from "../../models/definitions";
import { ApiNode } from "../../models/nodes";
import { cleanseSecurityHeader } from "./security-header-cleanser";

export function cleanseApi(apiNode: ApiNode): ApiDefinition {
  const name = apiNode.name.value;
  const description = apiNode.description && apiNode.description.value;
  const securityHeader =
    apiNode.securityHeader &&
    cleanseSecurityHeader(apiNode.securityHeader.value);

  return { name, description, securityHeader };
}
