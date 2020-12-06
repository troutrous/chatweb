import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import Sign from './Pages/Sign';
import Room from './Pages/Room';
import Profile from './Pages/Profile';

function App() {
  return (
    <Router>
        <Switch>
          <Route path="/sign">
            <Sign />
          </Route>
          <Route path="/profile">
            <Profile />
          </Route>
          <Route path="/room">
            <Room />
          </Route>
        </Switch>
    </Router>
  );
}

export default App;
