import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin, googleAuth } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useGoogleLogin } from "@react-oauth/google";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Login() {
  const navigate = useNavigate();
  const { login: setGlobalUser, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      setLoading(true);
      const response = await googleAuth(tokenResponse.access_token);

      if (!response?.data) {
        throw new Error("Google login failed");
      }

      toast.success("Welcome back!", {
        description: `Logged in as ${response.data.user.name}`,
      });

      setGlobalUser({
        ...response.data.user,
        token: response.data.token,
      });

      navigate(
        response.data.user.onboardingCompleted ? "/dashboard" : "/onboarding",
        { replace: true }
      );
    } catch (err) {
      console.error(err);
      toast.error("Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const googleLoginKeys = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error("Google login failed"),
  });

  useEffect(() => {
    if (user) {
      navigate(user.onboardingCompleted ? "/dashboard" : "/onboarding", { replace: true });
    }
  }, [user, navigate]);

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
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email address";

    if (!formData.password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await apiLogin({
        email: formData.email,
        password: formData.password,
      });

      if (!response?.data) throw new Error(response?.message || "Login failed");

      toast.success("Welcome back!", { description: "Successfully logged in." });

      setGlobalUser({
        ...response.data.user,
        token: response.data.token,
      });

      navigate(
        response.data.user.onboardingCompleted ? "/dashboard" : "/onboarding",
        { replace: true }
      );
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Invalid credentials.";
      setErrors({ general: message });
      toast.error("Login Failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Left Decoration - Desktop Only */}
      <div className="hidden lg:flex flex-1 relative bg-brand-950 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-secondary bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/80 to-transparent"></div>

        <div className="relative z-10 max-w-xl px-12 text-center text-white space-y-6">
          <img src="/EventLive.png" alt="EventLive" className="h-24 w-auto mx-auto mb-8" />
          <h1 className="text-4xl text-white/50 font-bold font-display tracking-tight">Experience Events Like Never Before</h1>
          <p className="text-lg text-white/70 font-light leading-relaxed">
            Join the thousands of organizers creating unforgettable virtual and hybrid experiences with EventLive's powerful platform.
          </p>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-20 xl:px-24 bg-bg-primary relative z-20">
        <div className="mx-auto w-full max-w-sm lg:w-96 space-y-8">

          <div className="text-center lg:text-left">
            <Link to="/" className="lg:hidden inline-block mb-8">
              <img src="/EventLive.png" alt="EventLive" className="h-12 w-auto" />
            </Link>
            <h2 className="text-3xl text-primary font-bold font-display tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/get-started" className="font-semibold text-brand-primary hover:text-brand-600 transition-colors">
                Create one now
              </Link>
            </p>
          </div>

          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 animate-fade-in border border-red-100 dark:border-red-900/30">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder=""
              autoComplete="username"
              disabled={loading}
            />

            <div>
              <div className="flex items-center justify-end mb-1">
                <Link to="/forgot-password" className="text-xs font-semibold text-brand-primary hover:underline" tabIndex={-1}>
                  Forgot password?
                </Link>
              </div>
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                error={errors.password}
                placeholder="••••••••"
                autoComplete="current-password"
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
              {/* Password Validation Checklist */}
              {isPasswordFocused && (
                <div className="mt-3 p-2 bg-transparent animate-fade-in transition-all duration-300 ease-in-out">
                  <p className="text-xs font-semibold text-text-secondary mb-2">Password must contain:</p>
                  <div className="space-y-1.5">
                    <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${formData.password.length >= 8 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-text-secondary'}`}>
                      {formData.password.length >= 8 ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600" />
                      )}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400 font-medium' : 'text-text-secondary'}`}>
                      {/[A-Z]/.test(formData.password) ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600" />
                      )}
                      <span>One uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${/[0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400 font-medium' : 'text-text-secondary'}`}>
                      {/[0-9]/.test(formData.password) ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600" />
                      )}
                      <span>One number</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${/[!@#$%^&*]/.test(formData.password) ? 'text-green-600 dark:text-green-400 font-medium' : 'text-text-secondary'}`}>
                      {/[!@#$%^&*]/.test(formData.password) ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600" />
                      )}
                      <span>One special character (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-accent"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-bg-primary text-text-secondary">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => googleLoginKeys()}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-bg-tertiary border border-brand-accent text-text-primary font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-brand-900/30 transition-all duration-200 focus:ring-2 focus:ring-brand-primary/20 outline-none shadow-sm hover:shadow"
          >
            <img src="/google-icon-logo.svg" className="h-5 w-5" alt="Google" />
            <span>Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
