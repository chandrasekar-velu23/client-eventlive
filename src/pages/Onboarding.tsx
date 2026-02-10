import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { updateUserProfile } from "../services/api";
import { toast } from "sonner";

/* ----------------------------------------
 * Types
 * --------------------------------------*/
interface QuestionProps {
    title: string;
    options: string[];
    selected: string | null;
    onSelect: (option: string) => void;
}

/* ----------------------------------------
 * Question Component
 * --------------------------------------*/
const Question: React.FC<QuestionProps> = ({ title, options, selected, onSelect }) => {
    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-brand-dark">
                {title}
            </h2>

            <div className="space-y-2">
                {options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onSelect(option)}
                        className={`w-full rounded-lg border px-4 py-3 text-left transition-all duration-200 ${selected === option
                            ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                            : "border-brand-accent hover:bg-brand-surface/40 text-brand-dark"
                            }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};

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
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
            <div className="bg-white max-w-5xl w-full rounded-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-2xl ring-1 ring-black/5">

                {/* LEFT COLUMN */}
                <div className="bg-brand-gradient p-8 md:p-12 text-brand-dark flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

                    <div className="relative z-10">
                        <img src="/logo-EventLive.svg" alt="EventLive Logo" className="h-12 mb-8" />

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-3xl font-black tracking-tight mb-2">
                                Let's get you <br /> started.
                            </h1>
                            <p className="text-brand-dark/80 text-lg">
                                Setup your profile to get the most out of your experience.
                            </p>
                        </motion.div>
                    </div>

                    <div className="relative z-10 mt-12 text-sm space-y-4">
                        <div>
                            <strong className="block mb-1">Privacy & Data Protection</strong>
                            <p className="opacity-80 leading-relaxed">
                                Your data is encrypted, securely stored, and never sold.
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="p-8 md:p-12 flex flex-col justify-between bg-white">
                    <div className="flex-1 flex flex-col justify-center">

                        {/* STEP 0: ROLE SELECTION */}
                        <Question
                            title="How will you use Eventlive?"
                            options={["Organizer", "Attendee"]}
                            selected={role}
                            onSelect={setRole}
                        />

                    </div>

                    <div className="flex items-center justify-end mt-8 pt-8 border-t border-brand-accent/20">
                        <button
                            type="button"
                            disabled={loading || !role}
                            onClick={handleNext}
                            className="px-8 py-2.5 rounded-lg bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                        >
                            {loading ? "Processing..." : "Finish"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Onboarding;
