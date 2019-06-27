/**
 * Decorator for marking endpoints as draft. This should be used only in conjunction with an `@endpoint` decorated class.
 * 
 * @example
```
@draft
@endpoint({
  // ...
})
class CreateUserEndpoint {
  // ...
}
```
 */
export declare function draft(target: any): void;
