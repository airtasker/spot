import { ApiDefintiion } from "../../models/definitions";
import { ApiNode } from "../../models/nodes";

export function cleanseApi(apiNode: ApiNode): ApiDefintiion {
  const name = apiNode.name.value;
  const description = apiNode.description && apiNode.description.value;

  return { name, description };
}
