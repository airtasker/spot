/** User response body */
export interface UserBody {
  /** data wrapper */
  data: {
    /** user first name */
    firstName: string;
    /** user last name */
    lastName: string;
    /** profile data */
    profile: Profile;
  };
}

/** Error body */
export interface ErrorBody {
  /** error name */
  name: string;
  /** error messages */
  message: string[];
}

interface Profile {
  private: boolean;
  messageOptions: MessageOptions;
}

interface MessageOptions {
  newsletter: boolean;
}

/** a residential address */
export type Address = string;
