import {
  api,
  body,
  endpoint,
  headers,
  pathParams,
  request,
  response,
  securityHeader,
  String
} from "@airtasker/spot";
import { ErrorBody, WidgetBody } from "./models";

/** A widget catalogue. */
@api({ name: 'widget-api' })
class WidgetApi {
  @securityHeader
  'x-auth-token': String;
}

/** Creates a widget in a catalogue */
@endpoint({
  method: 'POST',
  path: '/catalogues/:catalogueId/widgets',
  tags: ['Widget']
})
class CreateWidget {
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
        'x-auth-token': String;
      },
    /** request body */
    @body body: WidgetBody
  ) {}

  /** The widget was created */
  @response({ status: 201 })
  successResponse(
    /** Widget response body */
    @body body: WidgetBody
  ) {}

  /** The request was malformed */
  @response({ status: 400 })
  badRequestResponse(
    /** Error response body */
    @body body: ErrorBody
  ) {}
}
