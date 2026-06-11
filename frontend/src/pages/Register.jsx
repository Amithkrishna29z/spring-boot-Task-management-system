import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { UserPlus, Mail, Lock, Eye, EyeOff, Check, AlertCircle, Circle } from "lucide-react";

const PasswordRequirement = ({ met, text }) => {
  return (
    <div
      className={`flex items-center space-x-1.5 text-xs ${met ? "text-success" : "text-text-muted"}`}
    >
      {met ? (
        <Check className="w-3.5 h-3.5 flex-shrink-0" />
      ) : (
        <Circle className="w-3 h-3 flex-shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );
};

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { register } = useAuth();
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
    setFieldErrors({});

    // Client-side validation for password match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.username, formData.password);
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (error) {
      const responseData = error.response?.data;

      // Handle user already exists error (409 Conflict)
      if (error.response?.status === 409) {
        setFieldErrors({ username: "Username already exists" });
        toast.error("Username already exists");
        return;
      }

      // Handle field-specific validation errors
      if (responseData?.errors && typeof responseData.errors === "object") {
        setFieldErrors(responseData.errors);
      }

      // Show toast for general errors
      const errorMessage = responseData?.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-5 bg-background">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-full mb-3">
            <UserPlus className="w-6 h-6 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Create Account</h1>
          <p className="text-sm text-text-secondary">Start organizing your tasks</p>
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
                  placeholder="Choose a username"
                  required
                  minLength={3}
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
                  placeholder="Create a password"
                  required
                  minLength={6}
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
              {/* Password Requirements */}
              <div className="mt-2 space-y-1">
                <PasswordRequirement
                  met={formData.password.length >= 8 && formData.password.length <= 128}
                  text="8-128 characters"
                />
                <PasswordRequirement
                  met={/[A-Z]/.test(formData.password)}
                  text="At least one uppercase letter"
                />
                <PasswordRequirement
                  met={/[a-z]/.test(formData.password)}
                  text="At least one lowercase letter"
                />
                <PasswordRequirement
                  met={/[0-9]/.test(formData.password)}
                  text="At least one digit"
                />
                <PasswordRequirement
                  met={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password)}
                  text="At least one special character"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-medium text-text-primary mb-1.5 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-surfaceHover text-text-primary text-sm rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 transition-all duration-200 placeholder-text-muted ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? "border-danger focus:ring-danger/30 focus:border-danger"
                      : "border-surfaceHover focus:ring-primary/50 focus:border-primary"
                  }`}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-surfaceHover"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && (
                <div
                  className={`flex items-center space-x-1.5 text-xs mt-1.5 ${formData.password === formData.confirmPassword ? "text-success" : "text-danger"}`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {formData.password === formData.confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </span>
                </div>
              )}
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
                  <span>Create Account</span>
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-secondary mt-4">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:text-primaryHover font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
