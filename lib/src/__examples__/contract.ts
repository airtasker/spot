import {
  api,
  body,
  defaultResponse,
  endpoint,
  Float,
  headers,
  pathParams,
  queryParams,
  request,
  response,
  securityHeader,
  String,
  test
} from "@airtasker/spot";
import "./contract-endpoint";
import { Address, CompanyBody, ErrorBody, UserBody, UserQuery } from "./models";

/** This is the company API. It does cool things */
@api({ name: "company-api" })
class ExampleApi {
  @securityHeader
  "x-auth-token": String;
}

/** Creates a user in a company */
@endpoint({
  method: "POST",
  path: "/company/:companyId/users",
  tags: ["Company", "User"]
})
class CreateUser {
  @request
  request(
    @pathParams
    pathParams: {
      /** company identifier */
      companyId: String;
    },
    @headers
    headers: {
      /** Auth Header */
      "x-auth-token": String;
    },
    @queryParams
    queryParams: {
      /** a demo query param */
      "sample-query"?: String;
      user?: UserQuery;
      ids?: number[];
      dryRun?: boolean;
    },
    /** request body */
    @body body: CreateUserRequestBody
  ) {}

  /** Successful creation of user */
  @response({ status: 201 })
  successResponse(
    @headers
    headers: {
      /** Location header */
      Location: String;
    },
    /** User response body */
    @body body: UserBody
  ) {}

  /** Bad request response */
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

  @test<CreateUserRequestBody, UserBody>({
    request: {
      pathParams: {
        companyId: "abc"
      },
      headers: {
        "x-auth-token": "hellotoken"
      },
      body: {
        data: {
          firstName: "John",
          lastName: "Snow",
          age: 15,
          email: "johnsnow@spot.com",
          address: "some address"
        }
      }
    },
    response: {
      status: 201
    }
  })
  successResponseTest() {}
}

/** Creates a user in a company */
@endpoint({
  method: "GET",
  path: "/company/:companyId",
  tags: ["Company"]
})
class GetCompany {
  @request
  request(
    @pathParams
    pathParams: {
      /** company identifier */
      companyId: String;
    },
    @headers
    headers: {
      /** Auth Header */
      "x-id": number;
    },
  ) {}

  /** Successful creation of user */
  @response({ status: 201 })
  successResponse(
    @headers
    headers: {
      /** Location header */
      accept: number;
    },
    /** User response body */
    @body body: CompanyBody
  ) {}
}

/** User request body */
interface CreateUserRequestBody {
  /** data wrapper */
  data: {
    /** user first name */
    firstName: String;
    /** user last name */
    lastName: String;
    /** user age */
    age: Float;
    /** user email */
    email: Email;
    /** user address */
    address: Address;
  };
}

/** an email */
type Email = String;
