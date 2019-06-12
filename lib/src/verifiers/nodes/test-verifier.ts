import { Locatable } from "../../models/locatable";
import {
  AttributeExpression,
  BodyNode,
  EndpointNode,
  HeaderNode,
  PathParamNode,
  QueryParamNode,
  RequestNode,
  TestNode,
  TestRequestNode,
  TypeNode
} from "../../models/nodes";
import { DataExpression } from "../../models/types";
import { verifyJsonSchema } from "../utilities/json-schema-verifier";
import { VerificationError } from "../verification-error";

export function verifyTestNode(
  locatableTestNode: Locatable<TestNode>,
  endpointNodeContext: EndpointNode,
  typeStore: TypeNode[]
): VerificationError[] {
  const errors: VerificationError[] = [];

  const testNode = locatableTestNode.value;

  const correlatedResponse =
    endpointNodeContext.responses.find(
      response =>
        response.value.status.value === testNode.response.value.status.value
    ) || endpointNodeContext.defaultResponse;

  if (!correlatedResponse) {
    errors.push({
      message: "test has no matching response",
      location: locatableTestNode.location,
      line: locatableTestNode.line
    });
  }

  if (testNode.options.allowInvalidRequest) {
    return errors;
  }

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
  const errors: VerificationError[] = [];

  const requestHeaderErrors = verifyTestRequestOptionableNode(
    ((endpointRequest.headers && endpointRequest.headers.value) || []).map(
      locatableHeader => locatableHeader.value
    ),
    testRequest.headers || [],
    testRequestLocation,
    testRequestLine,
    "header",
    typeStore
  );
  errors.push(...requestHeaderErrors);

  const pathParamErrors = verifyTestPathParams(
    (
      (endpointRequest.pathParams && endpointRequest.pathParams.value) ||
      []
    ).map(locatablePathParam => locatablePathParam.value),
    testRequest.pathParams || [],
    testRequestLocation,
    testRequestLine,
    typeStore
  );
  errors.push(...pathParamErrors);

  const queryParamErrors = verifyTestRequestOptionableNode(
    (
      (endpointRequest.queryParams && endpointRequest.queryParams.value) ||
      []
    ).map(locatableQueryParam => locatableQueryParam.value),
    testRequest.queryParams || [],
    testRequestLocation,
    testRequestLine,
    "query",
    typeStore
  );
  errors.push(...queryParamErrors);

  if (endpointRequest.body) {
    if (testRequest.body) {
      const bodyErrors = verifyTestBody(
        endpointRequest.body.value,
        testRequest.body,
        testRequestLocation,
        testRequestLine,
        typeStore
      );
      errors.push(...bodyErrors);
    } else {
      errors.push({
        message: "test body missing",
        location: testRequestLocation,
        line: testRequestLine
      });
    }
  } else if (testRequest.body) {
    errors.push({
      message: "unexpected body in test",
      location: testRequestLocation,
      line: testRequestLine
    });
  }

  return errors;
}

function verifyTestRequestOptionableNode(
  endpointOptionableNode: HeaderNode[] | QueryParamNode[],
  testNodeValues: AttributeExpression[],
  testRequestLocation: string,
  testRequestLine: number,
  optionableType: "header" | "query",
  typeStore: TypeNode[]
): VerificationError[] {
  const errors: VerificationError[] = [];

  const endpointNodeNames = endpointOptionableNode.map(node => node.name.value);
  const testNodeNames = testNodeValues.map(node => node.name);

  testNodeNames
    .filter(nodeName => !endpointNodeNames.includes(nodeName))
    .forEach(nodeName => {
      errors.push({
        message: `unexpected request ${optionableType} ${nodeName} in test`,
        location: testRequestLocation,
        line: testRequestLine
      });
    });

  endpointOptionableNode.forEach(requestNode => {
    const testNode = testNodeValues.find(
      node => node.name === requestNode.name.value
    );
    if (testNode) {
      try {
        verifyJsonSchema(requestNode.type, testNode.expression, typeStore);
      } catch (e) {
        errors.push({
          message: e.message,
          location: testRequestLocation,
          line: testRequestLine
        });
      }
    } else if (!requestNode.optional) {
      errors.push({
        message: `test request ${optionableType} ${
          requestNode.name.value
        } missing`,
        location: testRequestLocation,
        line: testRequestLine
      });
    }
  });

  return errors;
}

function verifyTestPathParams(
  endpointPathParams: PathParamNode[],
  testPathParams: AttributeExpression[],
  testRequestLocation: string,
  testRequestLine: number,
  typeStore: TypeNode[]
): VerificationError[] {
  const errors: VerificationError[] = [];

  const endpointPathParamNames = endpointPathParams.map(
    pathParam => pathParam.name.value
  );
  const testPathParamNames = testPathParams.map(pathParam => pathParam.name);

  testPathParamNames
    .filter(pathParamName => !endpointPathParamNames.includes(pathParamName))
    .forEach(pathParamName => {
      errors.push({
        message: `unexpected path param ${pathParamName} in test`,
        location: testRequestLocation,
        line: testRequestLine
      });
    });

  endpointPathParams.forEach(requestPathParam => {
    const testPathParam = testPathParams.find(
      pathParam => pathParam.name === requestPathParam.name.value
    );

    if (testPathParam) {
      try {
        verifyJsonSchema(
          requestPathParam.type,
          testPathParam.expression,
          typeStore
        );
      } catch (e) {
        errors.push({
          message: e.message,
          location: testRequestLocation,
          line: testRequestLine
        });
      }
    } else {
      errors.push({
        message: `test path param ${requestPathParam.name.value} missing`,
        location: testRequestLocation,
        line: testRequestLine
      });
    }
  });

  return errors;
}

function verifyTestBody(
  endpointBody: BodyNode,
  testBody: DataExpression,
  testRequestLocation: string,
  testRequestLine: number,
  typeStore: TypeNode[]
): VerificationError[] {
  const errors: VerificationError[] = [];

  try {
    verifyJsonSchema(endpointBody.type, testBody, typeStore);
  } catch (e) {
    errors.push({
      message: e.message,
      location: testRequestLocation,
      line: testRequestLine
    });
  }

  return errors;
}
