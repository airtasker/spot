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
      @oa3serverVariables
      variables: {
        /**
        * this value is assigned by the service provider, in this example `gigantic-server.com`
        *
        * @default "demo"
        */
/**
        username: String
        /**
        * @default "8443"
        */
/**
        port: "8443" | "443"
        /**
        * @default "v2"
        */
/**
        basePath: String = "v2"
      }
  ) {}
  // ...
}
 ```
 */
export declare function oa3serverVariables(
  target: any,
  propertyKey: string,
  parameterIndex: number
): void;
