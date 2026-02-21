import { Route, Switch } from 'wouter';
import MemberForm from './pages/MemberForm';
import Success from './pages/Success';
import NotFound from './pages/NotFound';
import { Toaster } from './components/Toaster';

function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={MemberForm} />
        <Route path="/success" component={Success} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
