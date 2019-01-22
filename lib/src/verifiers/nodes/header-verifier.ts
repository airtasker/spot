import { HeaderNode, TypeNode } from "../../models/nodes";
import { NumberLikeKind, StringLikeKind } from "../../models/types";
import { possibleRootKinds } from "../utilities/type-resolver";
import { VerificationError } from "../verification-error";

export function verifyHeaderNode(
  header: HeaderNode,
  typeStore: TypeNode[]
): VerificationError[] {
  let errors: VerificationError[] = [];

  if (!/^[\w\-]+$/.test(header.name.value)) {
    errors.push({
      message:
        "header name may only contain alphanumeric, underscore and hyphen characters",
      location: header.name.location,
      line: header.name.line
    });
  }

  const typeKinds = possibleRootKinds(header.type, typeStore);
  const allowedKinds = StringLikeKind.concat(NumberLikeKind);

  if (!typeKinds.every(kind => allowedKinds.includes(kind))) {
    errors.push({
      message: "header type may only stem from string or number types",
      location: header.name.location,
      line: header.name.line
    });
  }

  return errors;
}
