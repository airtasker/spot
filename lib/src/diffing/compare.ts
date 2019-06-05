import { ContractNode, EndpointNode } from "../models/nodes";
import { Locatable } from "../models/locatable";
import {
  ContractDiff,
  EndpointDiff,
  TypeDiff,
  ObjectTypeDiff,
  TypeDiffKind
} from "./diff";
import {
  ContractDefinition,
  EndpointDefinition,
  TypeDefinition
} from "../models/definitions";
import {
  DataType,
  TypeKind,
  ObjectType,
  ObjectTypeProperty
} from "../models/types";
import { type } from "os";
import { resolveType } from "../verifiers/utilities/type-resolver";
import assertNever from "assert-never";

export function compare(
  before: ContractDefinition,
  after: ContractDefinition
): ContractDiff {
  /*
    - Find all endpoints.
    - For each endpoint, find if deleted or new.
    - Within each endpoint, look at each request and response body.
    - For each object type, look at every property and check if deleted or new.
    */

  const beforeEndpoints = new Map<string, EndpointDefinition>();
  const afterEndpoints = new Map<string, EndpointDefinition>();
  for (const endpoint of before.endpoints) {
    beforeEndpoints.set(endpoint.name, endpoint);
  }
  for (const endpoint of after.endpoints) {
    afterEndpoints.set(endpoint.name, endpoint);
  }
  const contractDiff: ContractDiff = {
    addedEndpoints: [],
    removedEndpoints: [],
    changedEndpoints: []
  };
  for (const endpointName of new Set([
    ...beforeEndpoints.keys(),
    ...afterEndpoints.keys()
  ])) {
    if (beforeEndpoints.has(endpointName) && afterEndpoints.has(endpointName)) {
      // Endpoint may have changed. Look into that.
      const endpointDiff = compareEndpoint(
        beforeEndpoints.get(endpointName)!,
        afterEndpoints.get(endpointName)!
      );
      if (endpointDiff) {
        contractDiff.changedEndpoints.push(endpointDiff);
      }
    } else if (beforeEndpoints.has(endpointName)) {
      // The endpoint has been removed.
      contractDiff.removedEndpoints.push(endpointName);
    } else {
      // The endpoint has been added.
      contractDiff.addedEndpoints.push(endpointName);
    }
  }
  return contractDiff;
}

function compareEndpoint(
  beforeTypes: TypeDefinition[],
  afterTypes: TypeDefinition[],
  before: EndpointDefinition,
  after: EndpointDefinition
): EndpointDiff | null {
  const endpointDiff: EndpointDiff = {
    name: before.name, // identical to after.name
    requestDiff: null
  };
  // TODO: Check when one has a body and the other one doesn't.
  if (before.request.body && after.request.body) {
    endpointDiff.requestDiff = compareType(
      beforeTypes,
      afterTypes,
      before.request.body.type,
      after.request.body.type
    );
  }
  if (endpointDiff.requestDiff) {
    return endpointDiff;
  }
  return null;
}

function compareType(
  beforeTypes: TypeDefinition[],
  afterTypes: TypeDefinition[],
  unresolvedBefore: DataType,
  uresolvedAfter: DataType
): TypeDiff | null {
  // Resolve each type. For example, replacing a string type with a reference to
  // a string type is perfectly backwards compatible. There is no actual change.
  const before = resolveType(unresolvedBefore, beforeTypes);
  const after = resolveType(uresolvedAfter, afterTypes);
  if (before.kind !== after.kind) {
    throw new Error(`TODO`);
  }
  switch (
    before.kind // Same as after.kind, as above.
  ) {
    case TypeKind.NULL:
    case TypeKind.BOOLEAN:
    case TypeKind.STRING:
    case TypeKind.FLOAT:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
      // Well that's great. It hasn't changed (per the check before.kind !== after.kind above), so we're happy.
      break;
    case TypeKind.BOOLEAN_LITERAL:
      // Has it changed?
      if (before.value !== after.value) {
      }
      break;
    case TypeKind.STRING_LITERAL:
      break;
    case TypeKind.NUMBER_LITERAL:
      break;
    case TypeKind.OBJECT:
      return compareObjectType(before as ObjectType, after as ObjectType);
    case TypeKind.ARRAY:
      break;
    case TypeKind.UNION:
      break;
    default:
      throw assertNever(typeKind);
  }
}

function compareObjectType(
  before: ObjectType,
  after: ObjectType
): ObjectTypeDiff | null {
  const beforeProperties = new Map<string, ObjectTypeProperty>();
  const afterProperties = new Map<string, ObjectTypeProperty>();
  for (const property of before.properties) {
    beforeProperties.set(property.name, property);
  }
  for (const property of after.properties) {
    afterProperties.set(property.name, property);
  }
  const diff: ObjectTypeDiff = {
    kind: TypeDiffKind.OBJECT,
    addedProperties: [],
    removedProperties: [],
    changedProperties: []
  };
  for (const propertyName of new Set([
    ...beforeProperties.keys(),
    ...afterProperties.keys()
  ])) {
    if (
      beforeProperties.has(propertyName) &&
      afterProperties.has(propertyName)
    ) {
      // TODO: Check if optional has changed.
      // Endpoint may have changed. Look into that.
      const propertyDiff = compareType(
        beforeProperties.get(propertyName)!.type,
        afterProperties.get(propertyName)!.type
      );
      if (propertyDiff) {
        diff.changedProperties.push({
          name: propertyName,
          diff: propertyDiff
        });
      }
    } else if (beforeProperties.has(propertyName)) {
      // The property has been removed.
      diff.removedProperties.push(propertyName);
    } else {
      // The property has been added.
      diff.addedProperties.push(propertyName);
    }
  }
  if (
    diff.addedProperties.length > 0 ||
    diff.removedProperties.length > 0 ||
    diff.changedProperties.length > 0
  ) {
    return diff;
  }
  return null;
}
