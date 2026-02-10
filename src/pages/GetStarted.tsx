import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup as apiSignup, googleAuth } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useGoogleLogin } from "@react-oauth/google";



export default function GetStarted() {
  const navigate = useNavigate();
  // Renaming login to setGlobalUser to avoid naming conflict with component login state checks if/when needed
  const { login: setGlobalUser, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // Password validation state
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    number: false
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (user.onboardingCompleted) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    }
  }, [user, navigate]);


  // Real-time password criteria checker
  useEffect(() => {
    setPasswordCriteria({
      length: formData.password.length >= 8,
      uppercase: /[A-Z]/.test(formData.password),
      number: /\d/.test(formData.password)
    });
  }, [formData.password]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  }, [errors]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      if (!passwordCriteria.length || !passwordCriteria.uppercase || !passwordCriteria.number) {
        newErrors.password = "Password does not meet complexity requirements";
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please ensure all fields are correct.");
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Default accountType to "User", onboarding will refine it to "Organizer" or "Attendee"
      const response = await apiSignup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        accountType: "User"
      });

      if (!response?.data) {
        throw new Error(response?.message || "Signup failed");
      }

      toast.success("Account created successfully!", {
        description: "Welcome to EventLive. Let's finish your setup."
      });

      setGlobalUser({
        ...response.data.user,
        token: response.data.token,
      });

      // New signups always go to onboarding
      navigate("/onboarding", { replace: true });

    } catch (error) {
      console.error("Signup error:", error);
      const message = error instanceof Error ? error.message : "Unable to create account. Please try again.";
      setErrors({ general: message });
      toast.error("Signup Failed", {
        description: message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      setLoading(true);
      const response = await googleAuth(tokenResponse.access_token);

      if (!response?.data) {
        throw new Error("Google login failed");
      }

      toast.success("Welcome!", {
        description: `Signed in as ${response.data.user.name}`
      });

      setGlobalUser({
        ...response.data.user,
        token: response.data.token,
      });

      if (response.data.user.onboardingCompleted) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch {
      toast.error("Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const googleLoginKeys = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error("Google login failed"),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12 animate-fade-in">
      <div className="card w-full max-w-md space-y-8 bg-white p-8 shadow-xl sm:p-10 border border-brand-accent/10">

        {/* Header */}
        <header className="text-center items-center justify-center">
          <Link to="/">
            <div className="bg-brand-primary/10 inline-flex items-center justify-center p-6 rounded-2xl mb-8">
              <img src="/EventLive.svg" alt="EventLive Logo" className="h-16 w-auto" />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">Create Account</h1>
          <p className="mt-2 text-sm text-brand-muted">Join EVENTLIVE, the future of events.</p>
        </header>

        {/* Global Error Alert */}
        {errors.general && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 animate-shake">
            <XCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {/* Name Field */}
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">Full Name</label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-3 outline-none transition-all ${errors.name
                ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                : "border-brand-accent bg-brand-surface/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/50"
                }`}
              disabled={loading}
              autoComplete="name"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">Email Address</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-3 outline-none transition-all ${errors.email
                ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                : "border-brand-accent bg-brand-surface/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/50"
                }`}
              disabled={loading}
              autoComplete="username"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-3 pr-12 outline-none transition-all ${errors.password
                  ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                  : "border-brand-accent bg-brand-surface/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/50"
                  }`}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={loading}
                className="absolute right-3 top-3 text-brand-muted hover:text-brand-dark transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            {/* Password Strength Indicators */}
            <div className="mt-2 flex gap-4 text-xs text-brand-muted">
              <div className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-green-600' : ''}`}>
                {passwordCriteria.length ? <CheckCircleIcon className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                8+ Chars
              </div>
              <div className={`flex items-center gap-1 ${passwordCriteria.uppercase ? 'text-green-600' : ''}`}>
                {passwordCriteria.uppercase ? <CheckCircleIcon className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                Uppercase
              </div>
              <div className={`flex items-center gap-1 ${passwordCriteria.number ? 'text-green-600' : ''}`}>
                {passwordCriteria.number ? <CheckCircleIcon className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                Number
              </div>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-3 outline-none transition-all ${errors.confirmPassword
                ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
                : "border-brand-accent bg-brand-surface/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/50"
                }`}
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : "Create Account"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-accent/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-brand-muted font-medium">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth */}
        <div className="flex justify-center w-full">
          <div className="w-full">
            <button
              type="button"
              onClick={() => googleLoginKeys()}
              className="w-full flex items-center justify-center gap-2 bg-white border border-brand-accent text-brand-dark font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-brand-primary/20 outline-none"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
              <span>Sign up with Google</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-brand-muted pt-2">
          Already have an account?
          <Link to="/login" className="ml-1 font-bold text-brand-primary hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary rounded">
            Login
          </Link>
        </footer>
      </div>
    </div>
  );
}
