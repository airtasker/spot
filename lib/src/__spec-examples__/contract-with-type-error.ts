import { api, body, endpoint, request, response } from "@airtasker/spot";

@api({ name: "type-error-api" })
class TypeErrorApi {}

@endpoint({
  method: "POST",
  path: "/widgets"
})
class CreateWidget {
  @request
  request(
    /** request body */
    @body body: WidgetBody
  ) {}

  /** The widget was created */
  @response({ status: 201 })
  successResponse(
    /** Widget response body */
    @body body: WidgetBody
  ) {}
}

/** Widget request and response body */
interface WidgetBody {
  /** price in cents */
  priceCents: number;
}

// The contract is otherwise valid; this assignment is the sole type error, so a
// parse that succeeds here has stopped type-checking the project altogether.
const malformed: WidgetBody = { priceCents: "free" };
