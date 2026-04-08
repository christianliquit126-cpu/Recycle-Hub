import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { isAdmin, logout } = useAuth();

  const links = [
    { to: "/", label: "Home" },
    { to: "/submit", label: "Submit Materials" },
    { to: "/request", label: "Request Materials" },
    { to: "/announcements", label: "Announcements" },
    { to: "/feedback", label: "Feedback" },
  ];

  if (isAdmin) {
    links.push({ to: "/admin", label: "Admin" });
  }

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <div className="navbar-brand-icon">DT</div>
            Digital Trashcan
          </Link>
          <ul className="navbar-links">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={isActive(link.to) ? "active" : ""}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {isAdmin ? (
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                  style={{ color: "var(--red)" }}
                >
                  Logout
                </a>
              </li>
            ) : (
              <li>
                <Link to="/login">Admin Login</Link>
              </li>
            )}
          </ul>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? "X" : "="}
          </button>
        </div>
      </nav>
      <div className={`mobile-nav ${mobileOpen ? "open" : ""}`}>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={isActive(link.to) ? "active" : ""}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        {isAdmin ? (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              logout();
              setMobileOpen(false);
            }}
            style={{ color: "var(--red)" }}
          >
            Logout
          </a>
        ) : (
          <Link to="/login" onClick={() => setMobileOpen(false)}>
            Admin Login
          </Link>
        )}
      </div>
    </>
  );
}
