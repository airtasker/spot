import { PathParamNode, TypeNode } from "../../models/nodes";
import { DataType, TypeKind } from "../../models/types";
import { isUrlSafe } from "../utilities/is-url-safe";
import { possibleRootKinds, resolveType } from "../utilities/type-resolver";
import { VerificationError } from "../verification-error";

export function verifyPathParamNode(
  pathParam: PathParamNode,
  typeStore: TypeNode[]
): VerificationError[] {
  let errors: VerificationError[] = [];

  if (!/^[\w\-]+$/.test(pathParam.name.value)) {
    errors.push({
      message:
        "path param name may only contain alphanumeric, underscore and hyphen characters",
      location: pathParam.name.location,
      line: pathParam.name.line
    });
  }

  const pathParamType = resolveType(pathParam.type, typeStore);
  if (
    (pathParamType.kind === TypeKind.ARRAY &&
      !hasOnlyUrlSafeTypes(typeStore, pathParamType.elements)) ||
    (pathParamType.kind !== TypeKind.ARRAY &&
      !hasOnlyUrlSafeTypes(typeStore, pathParamType))
  ) {
    // Top-level primitives are allowed, as well as arrays of primitives.
    errors.push({
      message:
        "path param type may only be a URL-safe type or an array of URL-safe types",
      location: pathParam.name.location,
      line: pathParam.name.line
    });
  }

  return errors;
}

function hasOnlyUrlSafeTypes(
  typeStore: TypeNode[],
  dataType: DataType
): boolean {
  const typeKinds = possibleRootKinds(dataType, typeStore);
  return typeKinds.every(isUrlSafe);
}
