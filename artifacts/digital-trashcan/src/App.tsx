import { Switch, Route, Router as WouterRouter } from "wouter";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SubmitMaterials from "./pages/SubmitMaterials";
import RequestMaterials from "./pages/RequestMaterials";
import Announcements from "./pages/Announcements";
import Feedback from "./pages/Feedback";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import "./styles/app.css";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/submit" component={SubmitMaterials} />
      <Route path="/request" component={RequestMaterials} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/login" component={Login} />
      <Route path="/admin" component={AdminDashboard} />
      <Route>
        <div className="main-content">
          <div className="card" style={{ textAlign: "center", padding: 48 }}>
            <h2>Page Not Found</h2>
            <p style={{ color: "var(--gray-500)", marginTop: 8 }}>
              The page you are looking for does not exist.
            </p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Router />
          </main>
          <footer className="footer">
            Digital Trashcan -- Reduce, Reuse, Recycle
          </footer>
        </div>
      </WouterRouter>
    </AuthProvider>
  );
}

export default App;
