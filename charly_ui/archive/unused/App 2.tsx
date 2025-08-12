import { Routes, Route } from "react-router-dom";
import DashboardV3Working from "./pages/DashboardV3Working";

export function App() {
  return (
    <Routes>
      <Route path="*" element={<DashboardV3Working />} />
    </Routes>
  );
}

export default App;