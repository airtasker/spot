import { Locatable } from "../../models/locatable";
import {
  EndpointNode,
  RequestNode,
  TestNode,
  TestRequestNode,
  TypeNode,
  HeaderNode,
  AttributeExpression
} from "../../models/nodes";
import { verifyJsonSchema } from "../utilities/json-schema-verifier";
import { VerificationError } from "../verification-error";

export function verifyTestNode(
  locatableTestNode: Locatable<TestNode>,
  endpointNodeContext: EndpointNode,
  typeStore: TypeNode[]
): VerificationError[] {
  let errors: VerificationError[] = [];

  const testNode = locatableTestNode.value;

  if (endpointNodeContext.request) {
    if (testNode.request) {
      errors.push(
        ...verifyTestRequest(
          endpointNodeContext.request.value,
          testNode.request.value,
          typeStore,
          testNode.request.location,
          testNode.request.line
        )
      );
    } else {
      errors.push({
        message: "request required in test",
        location: locatableTestNode.location,
        line: locatableTestNode.line
      });
    }
  } else if (testNode.request) {
    errors.push({
      message: "unexpected request in test",
      location: testNode.request.location,
      line: testNode.request.line
    });
  }

  return errors;
}
function verifyTestRequest(
  endpointRequest: RequestNode,
  testRequest: TestRequestNode,
  typeStore: TypeNode[],
  testRequestLocation: string,
  testRequestLine: number
): VerificationError[] {
  let errors: VerificationError[] = [];

  if (endpointRequest.headers) {
    if (testRequest.headers) {
      verifyTestRequestHeaders(
        endpointRequest.headers.value.map(
          locatableHeader => locatableHeader.value
        ),
        testRequest.headers,
        testRequestLocation,
        testRequestLine,
        typeStore
      );
    } else {
      errors.push({
        message: "request headers required in test request",
        location: testRequestLocation,
        line: testRequestLine
      });
    }
  }
  return errors;
}
function verifyTestRequestHeaders(
  endpointRequestHeaders: HeaderNode[],
  testRequestHeaders: AttributeExpression[],
  testRequestLocation: string,
  testRequestLine: number,
  typeStore: TypeNode[]
): VerificationError[] {
  let errors: VerificationError[] = [];

  const endpointRequestHeaderNames = endpointRequestHeaders.map(
    header => header.name.value
  );
  const testRequestHeaderNames = testRequestHeaders.map(header => header.name);
  testRequestHeaderNames
    .filter(headerName => !endpointRequestHeaderNames.includes(headerName))
    .forEach(headerName => {
      errors.push({
        message: `unexpected request header ${headerName} in test`,
        location: testRequestLocation,
        line: testRequestLine
      });
    });
  endpointRequestHeaders.forEach(requestHeader => {
    const testHeader = testRequestHeaders.find(
      header => header.name === requestHeader.name.value
    );
    if (testHeader) {
      try {
        verifyJsonSchema(requestHeader.type, testHeader.expression, typeStore);
      } catch (e) {
        errors.push({
          message: e.message,
          location: testRequestLocation,
          line: testRequestLine
        });
      }
    } else if (!requestHeader.optional) {
      errors.push({
        message: `test request header ${requestHeader.name.value} missing`,
        location: testRequestLocation,
        line: testRequestLine
      });
    }
  });
  return errors;
}
