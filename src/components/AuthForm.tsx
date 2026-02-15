import React, {
  useState,
  useCallback,
  useEffect,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin, signup as apiSignup } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import {
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { googleAuth } from "../services/api";

type AuthType = "signup" | "login";

interface AuthFormProps {
  type: AuthType;
}

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const navigate = useNavigate();
  const { login: setGlobalUser, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  /* ----------------------------------------
   * Redirect if already authenticated
   * --------------------------------------*/
  useEffect(() => {
    if (user) {
      navigate("/lobby", { replace: true });
    }
  }, [user, navigate]);

  /* ----------------------------------------
   * Input handler
   * --------------------------------------*/
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );


  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  /* ----------------------------------------
   * Email / Password submit
   * --------------------------------------*/
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (
      type === "signup" &&
      formData.password !== formData.confirmPassword
    ) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response =
        type === "signup"
          ? await apiSignup({ ...formData, accountType: "User" })
          : await apiLogin({
            email: formData.email,
            password: formData.password,
          });

      if (!response?.data) {
        toast.error(response?.message || "Authentication failed");
        return;
      }

      toast.success(response.message || "Welcome back!");
      setGlobalUser({
        ...response.data.user,
        token: response.data.token,
      });

      navigate(
        response.data.user.onboardingCompleted ? "/dashboard" : "/onboarding",
        { replace: true }
      );
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------
   * Google OAuth handler
   * --------------------------------------*/
  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    try {
      if (!credentialResponse.credential) {
        toast.error("Invalid Google credential");
        return;
      }

      const response = await googleAuth(
        credentialResponse.credential
      );

      if (!response?.data) {
        toast.error("Google login failed");
        return;
      }

      setGlobalUser({
        ...response.data.user,
        token: response.data.token,
      });

      navigate(
        response.data.user.onboardingCompleted
          ? "/lobby"
          : "/onboarding",
        { replace: true }
      );
    } catch {
      toast.error("Google login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12">
      <div className="card w-full max-w-md space-y-8 bg-white p-8 shadow-xl sm:p-10 border border-brand-accent/10">
        {/* Header */}
        <header className="text-center items-center justify-center">
          <Link to="/">
            <div className="bg-brand-primary flex items-center justify-center p-4 rounded-lg max-w-md mx-auto">
              <img
                src="/logo-EventLive.svg"
                alt="EventLive Logo"
                className="h-50 w-auto"
              />
            </div>
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold text-brand-dark">
            {type === "signup" ? "Create Account" : "Welcome Back"}
          </h1>

          <p className="mt-2 text-sm text-brand-muted">
            {type === "signup"
              ? "Join EVENTLIVE today"
              : "Sign in to your dashboard"}
          </p>
        </header>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {type === "signup" && (
            <div>
              <label className="block text-sm font-bold text-brand-dark">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                onChange={handleChange}
                required
                className="mt-1.5 w-full rounded-lg border border-brand-accent bg-brand-50 px-4 py-3"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-brand-dark">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              onChange={handleChange}
              required
              className="mt-1.5 w-full rounded-lg border border-brand-accent bg-brand-50 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-brand-dark">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-brand-accent bg-brand-50 px-4 py-3 pr-12"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-3"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {type === "signup" && (
            <div>
              <label className="block text-sm font-bold text-brand-dark">
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                onChange={handleChange}
                required
                className="mt-1.5 w-full rounded-lg border border-brand-accent bg-brand-50 px-4 py-3"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 font-bold"
          >
            {loading ? "Processing..." : type === "signup" ? "Sign Up" : "Sign In"}
          </button>
        </form>

        {/* Google OAuth */}
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error("Google authentication failed")}
        />

        {/* Footer */}
        <footer className="text-center text-sm text-brand-muted pt-2 border-t">
          {type === "signup" ? "Already have an account?" : "New to EVENTLIVE?"}
          <Link
            to={type === "signup" ? "/login" : "/get-started"}
            className="ml-1 font-bold text-brand-primary"
          >
            {type === "signup" ? "Login" : "Create account"}
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default AuthForm;
