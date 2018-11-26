import {
  api,
  endpoint,
  Float,
  Int32,
  Optional,
  queryParam,
  response
} from "@airtasker/spot";

@api()
export class Api {
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
