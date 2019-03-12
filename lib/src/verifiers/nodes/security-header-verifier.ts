import { SecurityHeaderNode, TypeNode } from "../../models/nodes";
import { TypeKind } from "../../models/types";
import { possibleRootKinds } from "../utilities/type-resolver";
import { VerificationError } from "../verification-error";

export function verifySecurityHeaderNode(
  securityHeader: SecurityHeaderNode,
  typeStore: TypeNode[]
): VerificationError[] {
  const errors: VerificationError[] = [];

  const typeKinds = possibleRootKinds(securityHeader.type, typeStore);

  if (!typeKinds.every(kind => kind === TypeKind.STRING)) {
    errors.push({
      message: "security header type may only be a string type",
      location: securityHeader.name.location,
      line: securityHeader.name.line
    });
  }

  return errors;
}
