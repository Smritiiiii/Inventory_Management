import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <Link className="navbar-brand" to="/">
        Inventory Management System
      </Link>

      <div className="collapse navbar-collapse">
        <ul className="navbar-nav ms-auto align-items-center">
          <li className="nav-item">
            <Link className="nav-link" to="/dashboard">Home</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/categories">Categories</Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/customers">Customers</Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/suppliers">Suppliers</Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/daily-sales">Daily Sales</Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/cylinder-tracking">Cylinder Tracking</Link>
          </li>

          <li className="nav-item ms-3">
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
