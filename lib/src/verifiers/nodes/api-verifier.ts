import { ApiNode, TypeNode } from "../../models/nodes";
import { VerificationError } from "../verification-error";
import { verifySecurityHeaderNode } from "./security-header-verifier";

export function verifyApiNode(
  api: ApiNode,
  typeStore: TypeNode[]
): VerificationError[] {
  const errors: VerificationError[] = [];

  if (/(^\s+)|(\s+$)/.test(api.name.value)) {
    errors.push({
      message: "api name may not contain leading or trailing white space",
      location: api.name.location,
      line: api.name.line
    });
  }
  if (!/^[\w\s\-]*$/.test(api.name.value)) {
    errors.push({
      message:
        "api name may only contain alphanumeric, space, underscore and hyphen characters",
      location: api.name.location,
      line: api.name.line
    });
  }
  if (api.securityHeader) {
    errors.push(
      ...verifySecurityHeaderNode(api.securityHeader.value, typeStore)
    );
  }
  return errors;
}
