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
        <Route path="/sign" component={Sign}>
        </Route>
        <Route path="/profile" component={Profile}>
        </Route>
        <Route path="/room/:id" component={Room}>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
