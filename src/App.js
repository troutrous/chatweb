import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import Sign from './Pages/Sign';
import Room from './Pages/Room';

function App() {
  return (
    <Router>
        <Switch>
          <Route path="/sign">
            <Sign />
          </Route>
          <Route path="/room">
            <Room />
          </Route>
        </Switch>
    </Router>
  );
}

export default App;
