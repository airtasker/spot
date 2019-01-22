import assertNever from "assert-never";
import { Endpoint } from "../models";

/**
 * Returns whether a given request should associated with an endpoint, as in the path and method match.
 *
 * @param req The incoming request.
 * @param pathPrefix The path prefix on which the API should be served (e.g. /api/v2).
 * @param endpoint The endpoint to match against.
 */
export function isRequestForEndpoint(
  req: {
    method: string;
    path: string;
  },
  pathPrefix: string,
  endpoint: Endpoint
): boolean {
  if (req.path.substr(0, pathPrefix.length) !== pathPrefix) {
    return false;
  }
  if (req.method.toUpperCase() !== endpoint.method) {
    return false;
  }
  let currentPathPosition = pathPrefix.length;
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
