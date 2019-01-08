/** User response body */
export interface UserBody {
  /** data wrapper */
  data: {
    /** user first name */
    firstName: string;
    /** user last name */
    lastName: string;
  };
}

/** Error body */
export interface ErrorBody {
  /** error name */
  name: string;
  /** error messages */
  message: string[];
}
