import { ConfigDefinition } from "../../models/definitions";
import { ConfigNode } from "../../models/nodes";

export function cleanseConfig(configNode: ConfigNode): ConfigDefinition {
  return configNode;
}
