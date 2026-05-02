import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/login"
import Dashboard from "./pages/dashboard";
import Category from "./pages/category";
import Supplier from "./pages/supplier"
import Customer from "./pages/customer";
import DailySales from "./pages/daily_sales";
import CylinderTracking from "./pages/cylinder_tracking";
import Navbar from "./components/navbar";

function Layout({ children }) {
  const location = useLocation();
  const hideNavbar = location.pathname === "/";

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/categories" element={<Category />} />
          <Route path="/suppliers" element={<Supplier />} />
          <Route path="/customers" element={<Customer />} />
          <Route path="/daily-sales" element={<DailySales />} />
          <Route path="/cylinder-tracking" element={<CylinderTracking />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
