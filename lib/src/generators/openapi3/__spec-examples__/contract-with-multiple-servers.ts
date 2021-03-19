import { api } from "@airtasker/spot";
import {oa3server} from "../../../syntax/oa3server";
import {oa3serverVariable} from "../../../syntax/oa3serverVariable";
import { String } from "@airtasker/spot"

@api({ name: "contract" })
class Contract {
    @oa3server({ url: "https://{username}.gigantic-server.com:{port}/{basePath}" })
    productionServer(
        /** this value is assigned by the service provider, in this example `gigantic-server.com` */
        @oa3serverVariable
            username: String = "demo",
        @oa3serverVariable
            port: "8443" | "443" = "8443",
        @oa3serverVariable
            basePath: String = "v2"
    ) {}
    @oa3server({ url: "https://{username}.gigantic-server.com:{port}/{basePath}" })
    devServer(
        /** this value is assigned by the service provider, in this example `gigantic-server.com` */
        @oa3serverVariable
            username: String = "dev",
        @oa3serverVariable
            port: "8080" | "80" = "8080",
        @oa3serverVariable
            basePath: String = "v2"
    ) {}
}