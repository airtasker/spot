/**
 * Class decorator factory for describing an API.
 *
 * @param config configuration
 * @example
 * ```
 * @api({ name: "Company API" })
 * class CompanyApi {}
 * ```
 */
export function api(config: ApiConfig) {
  return (target: any) => {};
}
interface ApiConfig {
  /** Name of the API. This should be the name of the service that is being documented */
  name: string;
}
