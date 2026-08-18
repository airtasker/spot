import {
  body,
  endpoint,
  headers,
  pathParams,
  queryParams,
  request,
  response,
  String
} from "@airtasker/spot";
import { ErrorBody, WidgetListBody } from "./models";

/** Lists the widgets in a catalogue */
@endpoint({
  method: "GET",
  path: "/catalogues/:catalogueId/widgets",
  tags: ["Widget"]
})
class ListWidgets {
  @request
  request(
    @pathParams
    pathParams: {
      /** catalogue identifier */
      catalogueId: String;
    },
    @headers
    headers: {
      /** Auth header */
      "x-auth-token": String;
    },
    @queryParams
    queryParams: {
      /** only return widgets carrying this tag */
      tag?: String;
      /** maximum number of widgets to return */
      limit?: number;
    }
  ) {}

  /** The matching widgets */
  @response({ status: 200 })
  successResponse(
    /** Widget collection response body */
    @body body: WidgetListBody
  ) {}

  /** The catalogue does not exist */
  @response({ status: 404 })
  notFoundResponse(
    /** Error response body */
    @body body: ErrorBody
  ) {}
}
