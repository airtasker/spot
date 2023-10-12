import { Endpoint } from "../definitions";

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
  const requestPath = normalisePath(req.path);
  if (requestPath.substr(0, pathPrefix.length) !== pathPrefix) {
    return false;
  }
  if (req.method.toUpperCase() !== endpoint.method) {
    return false;
  }
  const regexp = new RegExp(
    "^" + endpoint.path.replace(/:\w+/g, "[^/]+") + "$"
  );
  return regexp.test(requestPath.substr(pathPrefix.length));
}

/**
 * Normalises a given HTTP request path, by replacing all instances of two or more "/" in a row with a singular "/".
 *
 * @param path The path to normalise
 */
export function normalisePath(path: string): string {
  return path.replace(/[/]{2,}/g, "/");
}
