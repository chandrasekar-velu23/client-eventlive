import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { resetPassword } from "../services/api";
import { EyeIcon, EyeSlashIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function ResetPassword() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            if (!token) throw new Error("Invalid token");
            await resetPassword(token, password);

            toast.success("Password reset successfully!");

            // Delay navigation
            setTimeout(() => navigate("/login"), 2000);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Reset failed. Token may be expired.");
            toast.error("Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12 animate-fade-in">
            <div className="card w-full max-w-md space-y-8 bg-white p-8 shadow-xl sm:p-10 border border-brand-accent/10">
                <header className="text-center">
                    <Link to="/">
                        <div className="bg-brand-primary/10 inline-flex items-center justify-center p-4 rounded-2xl mb-6">
                            <img src="/EventLive.png" alt="EventLive Logo" className="h-12 w-auto" />
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold text-brand-dark">Set new password</h1>
                    <p className="mt-2 text-sm text-brand-muted">
                        Must be at least 8 characters.
                    </p>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 animate-shake">
                        <XCircleIcon className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-brand-dark mb-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-brand-accent bg-brand-surface/20 px-4 py-3 pr-12 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/50 transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-brand-muted hover:text-brand-dark"
                            >
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-dark mb-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-lg border border-brand-accent bg-brand-surface/20 px-4 py-3 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
                <div className="text-center">
                    <Link to="/login" className="text-sm font-medium text-brand-muted hover:text-brand-dark transition-colors">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
