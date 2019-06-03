export interface ContractDiff {
  addedEndpoints: string[];
  removedEndpoints: string[];
  changedEndpoints: EndpointDiff[];
}

export interface EndpointDiff {
  name: string;
  // TODO: Other things like headers, query params, etc.
  requestDiff: TypeDiff | null;
}

// TODO: Other types.
export type TypeDiff = ObjectTypeDiff;

export enum TypeDiffKind {
  OBJECT
}

export interface ObjectTypeDiff {
  kind: TypeDiffKind.OBJECT;
  addedProperties: string[];
  removedProperties: string[];
  changedProperties: ObjectPropertyDiff[];
}

export interface ObjectPropertyDiff {
  name: string;
  diff: TypeDiff;
}
