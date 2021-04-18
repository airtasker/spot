import { api } from "@airtasker/spot";
import { oa3server } from "../../../syntax/oa3server";
import { oa3serverVariables } from "../../../syntax/oa3serverVariables";
import { String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {
  /**
   * Production server
   */
  @oa3server({
    url: "https://{username}.gigantic-server.com:{port}/{basePath}"
  })
  productionServer(
    @oa3serverVariables
    variables: {
      /**
       * this value is assigned by the service provider, in this example `gigantic-server.com`
       *
       * @default "demo"
       */
      username: String;
      /**
       * @default "8443"
       */
      port: "8443" | "443";
      /**
       * @default "v2"
       */
      basePath: String;
    }
  ) {}
}
