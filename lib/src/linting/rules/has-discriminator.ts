import { TypeNode, EndpointNode } from "lib/src/models/nodes";
import { UnionType, DataType } from "lib/src/models/types";
import { LintingRule } from "../rule";
import { compact, unnest } from "ramda";
import { Locatable } from "lib/src/models/locatable";

/**
 * Checks that all union types have a discriminator.
 */
export const hasDiscriminator: LintingRule = contract => {
    const unionTypes = unnest([
        ...contract.types,
        ...contract.endpoints.map(extractEndpointTypes)
    ].map(findUnionTypes))
};

function extractEndpointTypes(endpoint: Locatable<EndpointNode>): DataType[] {
    const requestType = endpoint.value.request && endpoint.value.request.value.body && endpoint.value.request.value.body.value.type
    const responseTypes = compact(endpoint.value.responses.map(response => response.value.body && response.value.body.value.type))
    return [
        requestType,
        ...responseTypes
    ]
}

function findUnionTypes(typeNode: TypeNode): UnionType[] {
    const unionTypes = contract.types.
    // TODO: Also recursively in all types.
}
