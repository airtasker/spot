import { config } from "@airtasker/spot";

class NotConfigClass {}

@config({
  paramSerializationStrategy: {
    query: {
      array: "comma"
    }
  }
})
class ConfigClass {}

@config({
  paramSerializationStrategy: {}
})
class MinimalConfigClass {}
