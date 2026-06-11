import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, Info } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field when user starts typing
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    try {
      await login(formData.username, formData.password);
      toast.success(`Welcome back, ${formData.username}!`);
      navigate("/");
    } catch (error) {
      const responseData = error.response?.data;

      // Handle field-specific validation errors
      if (responseData?.errors && typeof responseData.errors === "object") {
        setFieldErrors(responseData.errors);
      }

      // Show toast for general errors
      const errorMessage = responseData?.message || "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-12 bg-background">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Welcome Back</h1>
          <p className="text-sm text-text-secondary">Sign in to your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-surface border border-surfaceHover rounded-xl p-5 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs font-medium text-text-primary mb-1.5 block">Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full bg-surfaceHover text-text-primary text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 transition-all duration-200 placeholder-text-muted ${
                    fieldErrors.username
                      ? "border-danger focus:ring-danger/30 focus:border-danger"
                      : "border-surfaceHover focus:ring-primary/50 focus:border-primary"
                  }`}
                  placeholder="Enter your username"
                  required
                />
              </div>
              {fieldErrors.username && (
                <div className="flex items-center space-x-1.5 mt-1.5 text-xs text-danger">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.username}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-text-primary mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-surfaceHover text-text-primary text-sm rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 transition-all duration-200 placeholder-text-muted ${
                    fieldErrors.password
                      ? "border-danger focus:ring-danger/30 focus:border-danger"
                      : "border-surfaceHover focus:ring-primary/50 focus:border-primary"
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-surfaceHover"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="flex items-center space-x-1.5 mt-1.5 text-xs text-danger">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.password}</span>
                </div>
              )}
              {/* Password Hint */}
              <div className="flex items-start space-x-1.5 mt-1.5 text-xs text-text-muted">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  Password must contain: 8-128 chars, uppercase, lowercase, digit, special character
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primaryHover text-white font-semibold text-sm rounded-lg px-6 py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-secondary mt-4">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-primary hover:text-primaryHover font-medium transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
