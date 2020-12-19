import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";

import Sign from './Pages/Sign';
import Room from './Pages/Room';
import Profile from './Pages/Profile';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/sign" component={Sign} />
        <Route path="/profile" component={Profile} />
        <Route path="/room/:id" component={Room} />
        <Redirect from="/" to="/sign"/>
      </Switch>
    </Router>
  );
}

export default App;
