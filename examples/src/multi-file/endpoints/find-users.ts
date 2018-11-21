import { api, endpoint, Optional, queryParam, response } from "@zenclabs/spot";

@api()
export class Api {
  @endpoint({
    method: "GET",
    path: "/users"
  })
  findUsers(
    @queryParam limit: number,
    @queryParam search_term: Optional<string>
  ): Promise<
    {
      name: string;
      age?: number;
    }[]
  > {
    return response();
  }
}
