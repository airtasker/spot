import { api, endpoint, Optional, queryParam } from "@zenclabs/spot";

@api()
export class Api {
  @endpoint({
    method: "GET",
    path: "/users"
  })
  getUsers(
    @queryParam limit: number
  ): Promise<
    {
      name: string;
      age?: number;
    }[]
  > {
    throw new Error("Not implemented");
  }
}
