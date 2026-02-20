import { forwardRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = "", label, error, children, value, ...props }, ref) => {
        const hasValue = value !== undefined && value !== "";
        return (
            <div className="relative w-full">
                {label && (
                    <label
                        className={`absolute z-10 left-3.5 pointer-events-none transition-all duration-200 font-medium leading-none
                            ${hasValue
                                ? "-top-2 text-[10px] px-1 bg-bg-secondary rounded text-brand-primary"
                                : "top-3.5 text-sm text-text-secondary/70"
                            }
                            ${error ? "text-red-500" : ""}`}
                    >
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    className={`input-field appearance-none cursor-pointer pr-10 disabled:opacity-50 disabled:cursor-not-allowed
                        ${error ? "ring-red-500/60 focus:ring-red-500" : ""}
                        ${className}`}
                    value={value}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                    <ChevronDownIcon className="h-4 w-4" />
                </div>
                {error && <p className="mt-1 text-xs text-red-500 pl-1 font-medium">{error}</p>}
            </div>
        );
    }
);

Select.displayName = "Select";

export default Select;
