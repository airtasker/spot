import { api, securityHeader, String } from "@airtasker/spot";
import "./imported-endpoint-1";

export * from "./exported-endpoint-1";

/** This is the company API. It does cool things */
@api({ name: "company-api" })
class ExampleApi {
  @securityHeader
  "x-auth-token": String;
}
