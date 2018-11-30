import {DateTime} from "@airtasker/spot";

export interface CreateUserRequest {
  name: string;
}

export interface CreateUserResponse {
  success: boolean;
  created_at: DateTime
}
