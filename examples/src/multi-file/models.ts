import { DateTime } from "@airtasker/spot";

export interface CreateUserRequest {
  name: string;
  roles: "admin" | "member";
}

export interface CreateUserResponse {
  success: boolean;
  created_at: DateTime;
}
