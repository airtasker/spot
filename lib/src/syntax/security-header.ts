/**
 * Decorator for describing a security header used across the entire API.
 * 
 * This should be used only once within an `@api` decorated class.
 * 
 * @example
```
@api({
  // ...
})
class Api {
  @securityHeader
  'x-auth-token': string;
}
```
 */
export declare function securityHeader(target: any, propertyKey: string): void;
