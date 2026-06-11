import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BarChart3, User, LogOut } from "lucide-react";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="border-b border-surfaceHover bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <BarChart3 className="w-7 h-7 text-primary" />
            <span className="text-lg font-bold text-text-primary">Task Manager</span>
          </Link>

          {/* Navigation - Only show when authenticated */}
          {isAuthenticated && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-text-secondary">
                <User className="w-4 h-4" />
                <span className="font-medium text-sm">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-text-muted hover:text-danger transition-colors px-3 py-1.5 rounded-lg hover:bg-surfaceHover"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
