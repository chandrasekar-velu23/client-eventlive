
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { forgotPassword } from "../services/api";
import { EnvelopeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await forgotPassword(email);
            setSubmitted(true);
            toast.success("Reset link sent!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send reset link");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12 animate-fade-in">
                <div className="card w-full max-w-md space-y-8 bg-white p-8 shadow-xl sm:p-10 border border-brand-accent/10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <EnvelopeIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-brand-dark">Check your email</h2>
                    <p className="text-brand-muted">
                        We sent a password reset link to <strong>{email}</strong>
                    </p>
                    <p className="text-sm text-brand-muted">
                        Didn't receive the email? Check your spam filter or{" "}
                        <button
                            onClick={() => setSubmitted(false)}
                            className="text-brand-primary font-semibold hover:underline"
                        >
                            try another email address
                        </button>
                        .
                    </p>
                    <Link to="/login" className="inline-flex items-center justify-center gap-2 mt-4 text-sm font-medium text-brand-primary hover:text-brand-dark transition-colors">
                        <ArrowLeftIcon className="h-4 w-4" /> Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12 animate-fade-in">
            <div className="card w-full max-w-md space-y-8 bg-white p-8 shadow-xl sm:p-10 border border-brand-accent/10">
                <header className="text-center">
                    <Link to="/">
                        <div className="bg-brand-primary/10 inline-flex items-center justify-center p-4 rounded-2xl mb-6">
                            <img src="/EventLive.png" alt="EventLive Logo" className="h-12 w-auto" />
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold text-brand-dark">Forgot password?</h1>
                    <p className="mt-2 text-sm text-brand-muted">
                        No worries, we'll send you reset instructions.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-bold text-brand-dark mb-1">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-brand-accent bg-brand-surface/20 px-4 py-3 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/50 transition-all"
                            placeholder="Enter your email"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {loading ? "Sending..." : "Reset Password"}
                    </button>
                </form>

                <div className="text-center">
                    <Link to="/login" className="inline-flex items-center justify-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-dark transition-colors">
                        <ArrowLeftIcon className="h-4 w-4" /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
