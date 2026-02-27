import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { updateUserProfile } from "../services/api";
import { toast } from "sonner";
import { CheckCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

/* ----------------------------------------
 * Types
 * --------------------------------------*/
interface QuestionProps {
    title: string;
    subtitle?: string;
    options: { label: string; description: string; icon: React.ReactNode }[];
    selected: string | null;
    onSelect: (option: string) => void;
}

/* ----------------------------------------
 * Role Option Icons
 * --------------------------------------*/
const OrganizerIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
);

const AttendeeIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
);

/* ----------------------------------------
 * Question Component
 * --------------------------------------*/
const Question: React.FC<QuestionProps> = ({ title, subtitle, options, selected, onSelect }) => {
    return (
        <div className="space-y-5 animate-fade-in">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display text-text-primary tracking-tight">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-sm text-text-secondary leading-relaxed">{subtitle}</p>
                )}
            </div>

            <div className="space-y-3">
                {options.map((option) => {
                    const isSelected = selected === option.label;
                    return (
                        <button
                            key={option.label}
                            type="button"
                            onClick={() => onSelect(option.label)}
                            className={`w-full rounded-xl border-2 px-5 py-4 text-left transition-all duration-200 group flex items-center gap-4 outline-none focus:ring-2 focus:ring-brand-primary/30 ${isSelected
                                    ? "border-brand-primary bg-brand-primary/8 shadow-md shadow-brand-primary/10"
                                    : "border-brand-accent bg-bg-secondary hover:border-brand-300/70 hover:bg-bg-tertiary"
                                }`}
                        >
                            {/* Icon Badge */}
                            <div className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200 ${isSelected
                                    ? "bg-brand-primary text-white"
                                    : "bg-bg-tertiary text-text-secondary group-hover:bg-brand-100 group-hover:text-brand-primary"
                                }`}>
                                {option.icon}
                            </div>

                            {/* Label */}
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm transition-colors duration-200 ${isSelected ? "text-brand-primary" : "text-text-primary"
                                    }`}>
                                    {option.label}
                                </p>
                                <p className={`text-xs mt-0.5 leading-relaxed transition-colors duration-200 ${isSelected ? "text-brand-primary/70" : "text-text-secondary"
                                    }`}>
                                    {option.description}
                                </p>
                            </div>

                            {/* Selected Check */}
                            <div className={`flex-shrink-0 transition-all duration-200 ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
                                <CheckCircleIcon className="h-5 w-5 text-brand-primary" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/* ----------------------------------------
 * Role Options Data
 * --------------------------------------*/
const ROLE_OPTIONS = [
    {
        label: "Organizer",
        description: "Create, manage, and host virtual or hybrid events",
        icon: <OrganizerIcon />,
    },
    {
        label: "Attendee",
        description: "Discover and join events from creators you love",
        icon: <AttendeeIcon />,
    },
];

/* ----------------------------------------
 * Onboarding Page
 * --------------------------------------*/
const Onboarding: React.FC = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFinish = async () => {
        if (!user || !role) return;

        try {
            setLoading(true);

            const updatedProfile = await updateUserProfile({
                role: role,
                onboardingCompleted: true
            } as any);

            if (user.token) {
                login({
                    ...user,
                    ...updatedProfile,
                    role: role,
                    onboardingCompleted: true
                });
            }

            toast.success("All set! Welcome using EventLive.");

            if (role === "Organizer") {
                navigate("/dashboard");
            } else {
                navigate("/dashboard");
            }

        } catch (error) {
            console.error("Onboarding error:", error);
            toast.error("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        handleFinish();
    };

    return (
        <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4 sm:p-6">
            <div className="bg-bg-primary w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 grid grid-cols-1 md:grid-cols-2">

                {/* ── LEFT COLUMN ── */}
                <div className="bg-brand-gradient p-8 md:p-10 flex flex-col justify-between relative overflow-hidden min-h-[260px] md:min-h-0">
                    {/* decorative blobs */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-56 h-56 bg-brand-primary/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

                    {/* Top: Logo + Headline */}
                    <div className="relative z-10 space-y-6">
                        {/* Logo Badge */}
                        <div className="inline-flex items-center justify-center rounded-2xl bg-brand-accent p-3 shadow-md">
                            <img src="/EventLive.png" alt="EventLive Logo" className="h-14 w-auto" />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="space-y-2"
                        >
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                                Let's get you <br className="hidden sm:block" /> started.
                            </h1>
                            <p className="text-white/75 text-base leading-relaxed max-w-xs">
                                Tell us how you'll use EventLive so we can tailor your experience.
                            </p>
                        </motion.div>
                    </div>

                    {/* Bottom: Trust badge */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45, duration: 0.5 }}
                        className="relative z-10 mt-10 md:mt-0"
                    >
                        <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15">
                            <ShieldCheckIcon className="h-5 w-5 text-white/80 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-white font-semibold text-sm">Privacy &amp; Data Protection</p>
                                <p className="text-white/65 text-xs mt-0.5 leading-relaxed">
                                    Your data is encrypted, securely stored, and never sold.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="p-8 md:p-10 flex flex-col justify-between bg-bg-primary">
                    {/* Step label */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold">1</span>
                            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Step 1 of 1</span>
                        </div>
                        {/* Progress bar */}
                        <div className="flex-1 ml-4 h-1.5 rounded-full bg-brand-accent overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-brand-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: role ? "100%" : "30%" }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* Question */}
                    <div className="flex-1 flex flex-col justify-center">
                        <Question
                            title="How will you use EventLive?"
                            subtitle="Choose your primary role. You can always switch later from your profile settings."
                            options={ROLE_OPTIONS}
                            selected={role}
                            onSelect={setRole}
                        />
                    </div>

                    {/* Footer Action */}
                    <div className="mt-8 pt-6 border-t border-brand-accent flex items-center justify-between gap-4">
                        <p className="text-xs text-text-secondary">
                            You can update this anytime in <span className="font-medium text-text-primary">Settings</span>.
                        </p>
                        <button
                            type="button"
                            disabled={loading || !role}
                            onClick={handleNext}
                            className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold shadow-lg shadow-brand-primary/25 hover:bg-brand-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-primary/40 whitespace-nowrap"
                        >
                            {loading ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Finish Setup
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Onboarding;
