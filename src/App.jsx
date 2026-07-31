import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import CheckIn from "./pages/CheckIn";
import AdminDashboard from "./pages/AdminDashboard";
import Register from "./pages/Register";
import People from "./pages/People";
import Logs from "./pages/Logs";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <main className="p-6 max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<CheckIn />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/register" element={<Register />} />
            <Route path="/admin/people" element={<People />} />
            <Route path="/admin/logs" element={<Logs />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}