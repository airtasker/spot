import {
  endpoint,
  Float,
  Int32,
  Optional,
  queryParam,
  response
} from "@airtasker/spot";

export class FindUsers {
  @endpoint({
    method: "GET",
    path: "/users"
  })
  findUsers(
    @queryParam({ description: "Limit number of returned results" })
    limit: Int32,
    @queryParam() search_term: Optional<string>
  ): Promise<
    {
      name: string;
      age?: Float;
    }[]
  > {
    return response();
  }
}
