export interface BaseError {
  message: string;
}

export interface ForbiddenError extends BaseError {
  signedInAs: string;
}
