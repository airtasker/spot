/**
 * Class decorator factory for describing an API.
 *
 * ```ts
 * @api({ name: "Company API" })
 * class CompanyApi {}
 * ```
 *
 * @param config configuration
 */
export function api(config: ApiConfig) {
  return (target: any) => {};
}

export interface ApiConfig {
  /** Name of the API. This should be the name of the service that is being documented */
  name: string;
}
