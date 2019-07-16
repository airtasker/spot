import * as React from "react";
import { RedocStandalone } from "redoc";

class App extends React.Component {
  render() {
    return (
      <div>
        <RedocStandalone specUrl="/contract" />
      </div>
    );
  }
}

export default App;
