import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", label, error, placeholder, value, rightElement, ...props }, ref) => {
        const hasValue = value !== undefined && value !== "";
        return (
            <div className="relative w-full">
                {label && (
                    <label
                        className={`absolute z-10 left-3 transition-all duration-200 font-bold pointer-events-none
                            ${(hasValue || props.type === "date" || props.type === "time" || props.type === "datetime-local")
                                ? "-top-2.5 text-[11px] px-1.5 bg-white rounded-md text-brand-primary shadow-sm border border-brand-100"
                                : "top-3.5 text-sm text-text-secondary"
                            }
                            ${error ? "text-red-500 border-red-100" : ""}`}
                    >
                        {label}
                    </label>
                )}
                <input
                    className={`input-field ${error ? "ring-red-500/60 focus:ring-red-500" : ""} ${rightElement ? "pr-12" : ""} ${className}`}
                    placeholder={label ? "" : (placeholder ?? " ")}
                    value={value}
                    ref={ref}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors">
                        {rightElement}
                    </div>
                )}
                {error && <p className="mt-1 text-xs text-red-500 pl-1 font-medium">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
