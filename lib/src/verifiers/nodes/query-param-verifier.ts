import { QueryParamNode, TypeNode } from "../../models/nodes";
import { DataType, TypeKind } from "../../models/types";
import { isPrimitiveType } from "../utilities/primitive-check";
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
  if (!hasNoNonPrimitiveArrayTypes(typeStore, queryParamType)) {
    errors.push({
      message: "query param type may not have non-primitive array types",
      location: queryParam.name.location,
      line: queryParam.name.line
    });
  }
  return errors;
}

function hasNoNonPrimitiveArrayTypes(
  typeStore: TypeNode[],
  dataType: DataType
): boolean {
  if (dataType.kind === TypeKind.OBJECT) {
    return dataType.properties
      .map(p => hasNoNonPrimitiveArrayTypes(typeStore, p.type))
      .every(Boolean);
  } else if (dataType.kind === TypeKind.ARRAY) {
    // Arrays of primitives are allowed.
    return hasOnlyPrimitiveTypes(typeStore, dataType.elements);
  } else {
    // Top-level primitives are allowed.
    return hasOnlyPrimitiveTypes(typeStore, dataType);
  }
}

function hasOnlyPrimitiveTypes(
  typeStore: TypeNode[],
  dataType: DataType
): boolean {
  const typeKinds = possibleRootKinds(dataType, typeStore);
  return typeKinds.every(isPrimitiveType);
}
