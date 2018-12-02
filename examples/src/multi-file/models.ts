export interface CreateUserRequest {
  name: string;
  roles: "admin" | "member";
}

export interface CreateUserResponse {
  success: boolean;
}
