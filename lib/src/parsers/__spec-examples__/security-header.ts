import { securityHeader } from "@airtasker/spot";

class SecurityHeaderClass {
  "not-security-header": string;

  /** security header description */
  @securityHeader
  "security-header": string;

  @securityHeader
  "optional-security-header"?: string;

  @securityHeader
  "illegal-field-name-security-header%$": string;

  @securityHeader
  "": string;

  @securityHeader
  "not-string-security-header": number;
}
