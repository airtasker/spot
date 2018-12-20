import assertNever from "../assert-never";
import { Endpoint } from "../models";

/**
 * Returns whether a given request should associated with an endpoint, as in the path and method match.
 */
export function isRequestForEndpoint(
  req: {
    method: string;
    path: string;
  },
  endpoint: Endpoint
): boolean {
  if (req.method.toUpperCase() !== endpoint.method) {
    return false;
  }
  let currentPathPosition = 0;
  for (let i = 0; i < endpoint.path.length; i++) {
    const pathComponent = endpoint.path[i];
    switch (pathComponent.kind) {
      case "static":
        if (
          pathComponent.content !==
          req.path.substr(currentPathPosition, pathComponent.content.length)
        ) {
          return false;
        }
        currentPathPosition += pathComponent.content.length;
        break;
      case "dynamic":
        currentPathPosition = req.path.indexOf("/", currentPathPosition);
        if (currentPathPosition === -1) {
          // Only valid if this is the end of the path.
          return i === endpoint.path.length - 1;
        }
        break;
      default:
        throw assertNever(pathComponent);
    }
  }
  return currentPathPosition === req.path.length;
}
