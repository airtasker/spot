import { api, endpoint, Optional, queryParam } from "@zenclabs/spot";

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
    throw new Error("Not implemented");
  }
}
