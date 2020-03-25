import { body } from "@airtasker/spot";

class BodyClass {
  bodyMethod(
    notBody: string,
    @body body: string,
    /** Body description */
    @body bodyWithDescription: string,
    @body optionalBody?: string
  ) {}
}
