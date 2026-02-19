import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", label, error, placeholder, value, rightElement, ...props }, ref) => {
        return (
            <div className="relative w-full group">
                <input
                    className={`input-field peer placeholder-transparent ${error ? "ring-red-500 focus:ring-red-500" : ""
                        } ${rightElement ? "pr-12" : ""} ${className}`}
                    placeholder={placeholder || label || " "}
                    value={value}
                    ref={ref}
                    {...props}
                />
                {label && (
                    <label className={`absolute left-4 transition-all duration-200 pointer-events-none text-text-secondary/70
                        peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
                        peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-brand-primary peer-focus:bg-bg-secondary peer-focus:px-2 rounded
                        ${value ? "-top-2.5 text-xs bg-bg-secondary px-2 rounded" : ""}
                        ${error ? "peer-focus:text-red-500 text-red-500" : ""}
                    `}>
                        {label}
                    </label>
                )}
                {rightElement && (
                    <div className="absolute right-3 top-3 text-text-secondary hover:text-text-primary transition-colors">
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
