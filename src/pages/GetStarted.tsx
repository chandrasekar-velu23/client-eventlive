import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup as apiSignup, googleAuth } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useGoogleLogin } from "@react-oauth/google";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function GetStarted() {
  const navigate = useNavigate();
  const { login: setGlobalUser, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
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

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    number: false
  });

  useEffect(() => {
    if (user) {
      navigate(user.onboardingCompleted ? "/dashboard" : "/onboarding", { replace: true });
    }
  }, [user, navigate]);

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
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  }, [errors]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordCriteria.length || !passwordCriteria.uppercase || !passwordCriteria.number) {
      newErrors.password = "Password does not meet complexity requirements";
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
      const response = await apiSignup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        accountType: "User"
      });

      if (!response?.data) throw new Error(response?.message || "Signup failed");

      toast.success("Account created successfully!", {
        description: "Welcome to EventLive. Let's finish your setup."
      });

      setGlobalUser({
        ...response.data.user,
        token: response.data.token,
      });

      navigate("/onboarding", { replace: true });

    } catch (error) {
      console.error("Signup error:", error);
      const message = error instanceof Error ? error.message : "Unable to create account. Please try again.";
      setErrors({ general: message });
      toast.error("Signup Failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      setLoading(true);
      const response = await googleAuth(tokenResponse.access_token);
      if (!response?.data) throw new Error("Google login failed");

      toast.success("Welcome!", { description: `Signed in as ${response.data.user.name}` });

      setGlobalUser({
        ...response.data.user,
        token: response.data.token,
      });

      navigate(response.data.user.onboardingCompleted ? "/dashboard" : "/onboarding", { replace: true });
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
    <div className="flex min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Left Decoration - Desktop Only */}
      <div className="hidden lg:flex flex-1 relative bg-brand-950 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-secondary bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/80 to-transparent"></div>

        <div className="relative z-10 max-w-xl px-12 text-center text-white space-y-6">
          <img src="/EventLive.png" alt="EventLive" className="h-24 w-auto mx-auto mb-15" />
          <h1 className="text-4xl text-white/50 font-bold font-display tracking-tight">Hosted Locally, Experienced Globally</h1>
          <p className="text-lg text-white/70 font-light leading-relaxed">
            Create, manage, and scale your events with the best-in-class tools designed for modern organizers.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-20 xl:px-24 bg-bg-primary relative z-20">
        <div className="mx-auto w-full max-w-sm lg:w-96 space-y-8">
          <div className="text-center lg:text-left">
            <Link to="/" className="lg:hidden inline-block mb-8">
              <img src="/EventLive.png" alt="EventLive" className="h-12 w-auto" />
            </Link>
            <h2 className="text-3xl font-bold font-display text-text-primary tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-primary hover:text-brand-600 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>

          {errors.general && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 animate-fade-in border border-red-100">
              <XCircleIcon className="h-5 w-5 flex-shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <Input
              label="Full Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="John Doe"
              autoComplete="name"
              disabled={loading}
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="username"
              disabled={loading}
            />

            <div>
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                error={errors.password}
                placeholder="Make it strong"
                autoComplete="new-password"
                disabled={loading}
                rightElement={
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                }
              />
              {isPasswordFocused && (
                <div className="mt-3 p-2 bg-transparent animate-fade-in transition-all duration-300 ease-in-out">
                  <p className="text-xs font-semibold text-text-secondary mb-2">Password must contain:</p>
                  <div className="space-y-1.5">
                    <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${passwordCriteria.length ? 'text-green-600 dark:text-green-400 font-medium' : 'text-text-secondary'}`}>
                      {passwordCriteria.length ? <CheckCircleIcon className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600" />}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${passwordCriteria.uppercase ? 'text-green-600 dark:text-green-400 font-medium' : 'text-text-secondary'}`}>
                      {passwordCriteria.uppercase ? <CheckCircleIcon className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600" />}
                      <span>Uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${passwordCriteria.number ? 'text-green-600 dark:text-green-400 font-medium' : 'text-text-secondary'}`}>
                      {passwordCriteria.number ? <CheckCircleIcon className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600" />}
                      <span>Number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Repeat password"
              autoComplete="new-password"
              disabled={loading}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-accent"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-bg-primary text-text-secondary">Or join with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => googleLoginKeys()}
            className="w-full flex items-center justify-center gap-3 bg-white border border-brand-accent text-text-primary font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition-all duration-200 focus:ring-2 focus:ring-brand-primary/20 outline-none shadow-sm hover:shadow"
          >
            <img src="/google-icon-logo.svg" className="h-5 w-5" alt="Google" />
            <span>Google</span>
          </button>
        </div>
      </div >
    </div >
  );
}
