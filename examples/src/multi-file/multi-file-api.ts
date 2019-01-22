import "./endpoints/create-user";
import "./endpoints/delete-user";
import "./endpoints/find-users";
import "./endpoints/get-user";
import { api } from "@airtasker/spot";

@api({
  name: "My API"
})
class Api {}
