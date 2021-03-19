/**
 * Class decorator factory for describing a server.
 *
 * ```ts
 * @oa3server({ url: "https://{username}.gigantic-server.com:{port}/{basePath}" })
 * productionServer(){}
 * ```
 *
 * @param config configuration
 */
export function oa3server(config: Oa3serverConfig): any {
  return (target: any) => {
  };
}

export interface Oa3serverConfig {
  /** Server Url */
  url: string;
}
