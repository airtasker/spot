import * as React from "react";
import { RedocStandalone } from "redoc";

class App extends React.Component {
  render() {
    return (
      <div>
        <RedocStandalone specUrl="/contract-openapi3" />
      </div>
    );
  }
}

export default App;
