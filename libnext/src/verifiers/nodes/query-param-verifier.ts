import { QueryParamNode, TypeNode } from "../../models/nodes";
import { NumberLikeKind, StringLikeKind } from "../../models/types";
import { possibleRootKinds } from "../utilities/type-resolver";
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

  const typeKinds = possibleRootKinds(queryParam.type, typeStore);
  const allowedKinds = StringLikeKind.concat(NumberLikeKind);

  if (!typeKinds.every(kind => allowedKinds.includes(kind))) {
    errors.push({
      message: "query param type may only stem from string or number types",
      location: queryParam.name.location,
      line: queryParam.name.line
    });
  }

  return errors;
}
