import { TypeDefinition } from "../../../lib/src/models/definitions";
import {
  ArrayType,
  DataType,
  ObjectType,
  TypeKind,
  UnionType
} from "../../../lib/src/models/types";

export type Coverage = ObjectTypeCoverage | UnionTypeCoverage | BasicCoverage;

export interface BasicCoverage {
  kind: "basic";
  is: "missing" | "covered";
}

const COVERED: BasicCoverage = {
  kind: "basic",
  is: "covered"
};

const MISSING: BasicCoverage = {
  kind: "basic",
  is: "missing"
};

export interface ObjectTypeCoverage {
  kind: "object";
  properties: {
    [key: string]: Coverage;
  };
}

export interface UnionTypeCoverage {
  kind: "union";
  types: Coverage[];
}

export function coverageScore(coverage: Coverage): number {
  switch (coverage.kind) {
    case "object":
      const propertiesCoverage = Object.values(coverage.properties);
      if (propertiesCoverage.length === 0) {
        return 1;
      }
      return (
        propertiesCoverage.reduce(
          (acc, propertyCoverage) => acc + coverageScore(propertyCoverage),
          0
        ) / propertiesCoverage.length
      );
    case "union":
      if (coverage.types.length === 0) {
        return 1;
      }
      return (
        coverage.types.reduce(
          (acc, propertyCoverage) => acc + coverageScore(propertyCoverage),
          0
        ) / coverage.types.length
      );
    case "basic":
      return coverage.is === "covered" ? 1 : 0;
  }
}

export function coverage(
  types: TypeDefinition[],
  type: DataType,
  value: any
): Coverage {
  switch (type.kind) {
    case TypeKind.NULL:
      if (value !== null) {
        throw new Error(`Expected null`);
      }
      return COVERED;
    case TypeKind.BOOLEAN:
      if (typeof value !== "boolean") {
        throw new Error(`Expected a boolean`);
      }
      return COVERED;
    case TypeKind.STRING:
      if (typeof value !== "string") {
        throw new Error(`Expected a string`);
      }
      return COVERED;
    case TypeKind.FLOAT:
      if (typeof value !== "number") {
        throw new Error(`Expected a number`);
      }
      return COVERED;
    case TypeKind.INT32:
    case TypeKind.INT64:
      if (typeof value !== "number") {
        throw new Error(`Expected a number`);
      }
      if (Math.round(value) !== value) {
        throw new Error(`Expected an integer`);
      }
      return COVERED;
    case TypeKind.DATE:
      // TODO
      return COVERED;
    case TypeKind.DATE_TIME:
      // TODO
      return COVERED;
    case TypeKind.BOOLEAN_LITERAL:
      if (value !== type.value) {
        throw new Error(`Expected ${type.value}`);
      }
      return COVERED;
    case TypeKind.STRING_LITERAL:
      if (value !== type.value) {
        throw new Error(`Expected ${type.value}`);
      }
      return COVERED;
    case TypeKind.NUMBER_LITERAL:
      if (value !== type.value) {
        throw new Error(`Expected ${type.value}`);
      }
      return COVERED;
    case TypeKind.OBJECT:
      return objectCoverage(types, type, value);
    case TypeKind.ARRAY:
      return arrayCoverage(types, type, value);
    case TypeKind.UNION:
      return unionCoverage(types, type, value);
    case TypeKind.TYPE_REFERENCE:
      const referencedType = types.find(t => t.name === type.name);
      if (!referencedType) {
        throw new Error(`Missing referenced type: ${type.name}`);
      }
      return coverage(types, referencedType.type, value);
  }
}

export function mergeCoverage(
  types: TypeDefinition[],
  type: DataType,
  coverages: Coverage[]
): Coverage {
  switch (type.kind) {
    case TypeKind.OBJECT:
      const objectCoverages = coverages as ObjectTypeCoverage[];
      const coverage: ObjectTypeCoverage = {
        kind: "object",
        properties: {}
      };
      for (const property of type.properties) {
        coverage.properties[property.name] = mergeCoverage(
          types,
          property.type,
          objectCoverages.map(c => c.properties[property.name])
        );
      }
      return coverage;
    case TypeKind.ARRAY:
      return mergeCoverage(types, type.elements, coverages);
    case TypeKind.UNION:
      const unionCoverages = coverages as UnionTypeCoverage[];
      return {
        kind: "union",
        types: type.types.map((t, i) =>
          mergeCoverage(types, t, unionCoverages.map(c => c.types[i]))
        )
      };
    case TypeKind.TYPE_REFERENCE:
      const referencedType = types.find(t => t.name === type.name);
      if (!referencedType) {
        throw new Error(`Missing referenced type: ${type.name}`);
      }
      return mergeCoverage(types, referencedType.type, coverages);
    default:
      const basicCoverages = coverages as BasicCoverage[];
      return basicCoverages.find(c => c.is === "covered") ? COVERED : MISSING;
  }
}

function objectCoverage(
  types: TypeDefinition[],
  type: ObjectType,
  value: any
): ObjectTypeCoverage {
  if (typeof value !== "object") {
    throw new Error(`Expected an object`);
  }
  const result: ObjectTypeCoverage = {
    kind: "object",
    properties: {}
  };
  for (const property of type.properties) {
    if (property.name in value) {
      result.properties[property.name] = coverage(
        types,
        property.type,
        value[property.name]
      );
    } else {
      result.properties[property.name] = MISSING;
    }
  }
  return result;
}

function arrayCoverage(
  types: TypeDefinition[],
  type: ArrayType,
  value: any
): Coverage {
  if (!(value instanceof Array)) {
    throw new Error(`Expected an array`);
  }
  return mergeCoverage(
    types,
    type.elements,
    value.map(item => coverage(types, type.elements, item))
  );
}

function unionCoverage(
  types: TypeDefinition[],
  type: UnionType,
  value: any
): Coverage {
  const coverages: Coverage[] = [];
  let hasMatch = false;
  for (const possibleType of type.types) {
    try {
      coverages.push(coverage(types, possibleType, value));
      hasMatch = true;
    } catch (e) {
      // Ignore.
      coverages.push(MISSING);
    }
  }
  if (!hasMatch) {
    throw new Error(`No match in union type`);
  }
  return {
    kind: "union",
    types: coverages
  };
}
