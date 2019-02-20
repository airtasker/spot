import { QueryParamNode, TypeNode } from "../../models/nodes";
import { DataType, TypeKind } from "../../models/types";
import { isUrlSafe } from "../utilities/is-url-safe";
import { possibleRootKinds, resolveType } from "../utilities/type-resolver";
import { VerificationError } from "../verification-error";

export function verifyQueryParamNode(
  queryParam: QueryParamNode,
  typeStore: TypeNode[]
): VerificationError[] {
  let errors: VerificationError[] = [];

  if (!/^[\w\-]+$/.test(queryParam.name.value)) {
    errors.push({
      message:
        "query param name may only contain alphanumeric, underscore and hyphen characters",
      location: queryParam.name.location,
      line: queryParam.name.line
    });
  }

  const queryParamType = resolveType(queryParam.type, typeStore);
  if (!hasNoUrlUnsafeArrayTypes(typeStore, queryParamType)) {
    errors.push({
      message:
        "query param type may only be a URL-safe, an object, or an array of non-primitives",
      location: queryParam.name.location,
      line: queryParam.name.line
    });
  }
  return errors;
}

function hasNoUrlUnsafeArrayTypes(
  typeStore: TypeNode[],
  dataType: DataType
): boolean {
  if (dataType.kind === TypeKind.OBJECT) {
    return dataType.properties
      .map(p => hasNoUrlUnsafeArrayTypes(typeStore, p.type))
      .every(Boolean);
  } else if (dataType.kind === TypeKind.ARRAY) {
    // Arrays of primitives are allowed.
    return hasOnlyUrlSafeTypes(typeStore, dataType.elements);
  } else {
    // Top-level primitives are allowed.
    return hasOnlyUrlSafeTypes(typeStore, dataType);
  }
}

function hasOnlyUrlSafeTypes(
  typeStore: TypeNode[],
  dataType: DataType
): boolean {
  const typeKinds = possibleRootKinds(dataType, typeStore);
  return typeKinds.every(isUrlSafe);
}
