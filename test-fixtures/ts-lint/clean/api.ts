// The same contract as test-fixtures/contract/, in the canonical contract style
// this command enforces — single quotes, where the repo's own config uses double.
// Extend both together, or this stops representing a current contract.
import {
  api,
  body,
  DateTime,
  defaultResponse,
  endpoint,
  Float,
  headers,
  pathParams,
  request,
  response,
  securityHeader,
  String
} from '@airtasker/spot';
import './list-widgets';
import { ErrorBody, WidgetBody } from './models';

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
    @body body: CreateWidgetRequestBody
  ) {}

  /** The widget was created */
  @response({ status: 201 })
  successResponse(
    @headers
    headers: {
      /** Location of the created widget */
      Location: String;
    },
    /** Widget response body */
    @body body: WidgetBody
  ) {}

  /** The request was malformed */
  @response({ status: 400 })
  badRequestResponse(
    /** Error response body */
    @body body: ErrorBody
  ) {}

  @defaultResponse
  unexpectedResponse(
    /** Error response body */
    @body body: ErrorBody
  ) {}
}

/** Widget creation request body */
interface CreateWidgetRequestBody {
  /** data wrapper */
  data: {
    /** display name */
    name: String;
    /** price in cents */
    priceCents: Float;
    /** when the widget becomes orderable */
    availableFrom?: DateTime;
    /** free-form labels */
    tags: String[];
  };
}
