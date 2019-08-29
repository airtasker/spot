import { ContractDefinition } from "../models/definitions";
import { ContractNode } from "../models/nodes";
import { cleanseApi } from "./nodes/api-cleanser";
import { cleanseConfig } from "./nodes/config-cleanser";
import { cleanseEndpoint } from "./nodes/endpoint-cleanser";

/**
 * Removes all additional parsing information associated with a parsed contract.
 *
 * @param contractNode a parsed contract
 */
export function cleanse(contractNode: ContractNode): ContractDefinition {
  const api = cleanseApi(contractNode.api.value);
  const config = contractNode.config
    ? cleanseConfig(contractNode.config.value)
    : undefined;
  const endpoints = contractNode.endpoints.map(endpoint =>
    cleanseEndpoint(endpoint.value)
  );
  const types = contractNode.types;

  return { api, config, endpoints, types };
}
