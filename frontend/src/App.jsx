import EnrollmentPage from "./pages/EnrollmentPage/EnrollmentPage";
import RenewalDashboardPage from "./pages/RenewalPage/RenewalDashboardPage";
import LTVPage from "./pages/LTVPage/LTVPage";
import Sidebar from "./components/Sidebar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/renewals" element={<RenewalDashboardPage />} />
            <Route path="/" element={<EnrollmentPage />} />
            
            <Route path="/ltv" element={<LTVPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
