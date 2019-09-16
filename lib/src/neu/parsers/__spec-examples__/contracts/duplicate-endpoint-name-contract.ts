import { api, endpoint } from "@airtasker/spot";
import "./duplicate-endpoint-name-contract-dependency";

/** contract description */
@api({ name: "contract" })
class Contract {}

@endpoint({ method: "GET", path: "/path" })
class GetEndpoint {}
