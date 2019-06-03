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
      before.request.body.type,
      after.request.body.type
    );
  }
  if (endpointDiff.requestDiff) {
    return endpointDiff;
  }
  return null;
}

function compareType(before: DataType, after: DataType): TypeDiff | null {
  if (before.kind !== after.kind) {
    throw new Error(`TODO`);
  }
  const typeKind = before.kind;
  if (typeKind === TypeKind.OBJECT) {
    return compareObjectType(before as ObjectType, after as ObjectType);
  }
  throw new Error(`TODO`);
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
