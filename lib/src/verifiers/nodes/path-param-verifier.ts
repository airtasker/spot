import { PathParamNode, TypeNode } from "../../models/nodes";
import { NumberLikeKind, StringLikeKind } from "../../models/types";
import { possibleRootKinds } from "../utilities/type-resolver";
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

  const typeKinds = possibleRootKinds(pathParam.type, typeStore);
  const allowedKinds = StringLikeKind.concat(NumberLikeKind);

  if (!typeKinds.every(kind => allowedKinds.includes(kind))) {
    errors.push({
      message: "path param type may only stem from string or number types",
      location: pathParam.name.location,
      line: pathParam.name.line
    });
  }

  return errors;
}
