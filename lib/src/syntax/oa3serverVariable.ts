/**
 * Decorator for describing openapi 3 server variables. This is used to decorate a parameter object in `@oa3server` decorated methods
 *
 * @example
 ```
 @api({
  // ...
  })
 class Contract {
  @oa3server({ url: "https://{username}.gigantic-server.com:{port}/{basePath}" })
  productionServer(
      @oa3serverVariable
      username: String = "demo",
      @oa3serverVariable
      port: "8443" | "443" = "8443",
      @oa3serverVariable
      basePath: String = "v2"
  ) {}
  // ...
}
 ```
 */
export declare function oa3serverVariable(
  target: any,
  propertyKey: string,
  parameterIndex: number
): void;
