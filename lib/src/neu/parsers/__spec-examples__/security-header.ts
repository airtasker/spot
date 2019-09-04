import { securityHeader } from "@airtasker/spot";

class SecurityHeaderClass {
  "not-security-header": string;

  /** security header description */
  @securityHeader
  "security-header": string;

  @securityHeader
  "optional-security-header"?: string;
}
