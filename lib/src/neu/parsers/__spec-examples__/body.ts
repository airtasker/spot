import { body } from "@airtasker/spot";

class BodyClass {
  bodyMethod(
    notBody: string,
    @body body: string,
    @body optionalBody?: string
  ) {}
}
