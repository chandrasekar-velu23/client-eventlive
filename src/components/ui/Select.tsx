import { forwardRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options?: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = "", label, error, children, value, ...props }, ref) => {
        return (
            <div className="relative w-full group">
                <div className="relative">
                    <select
                        ref={ref}
                        className={`peer input-field appearance-none cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? "ring-red-500 focus:ring-red-500" : ""}
              ${className}`}
                        value={value}
                        {...props}
                    >
                        {children}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted peer-focus:text-brand-600 transition-colors">
                        <ChevronDownIcon className="h-5 w-5" />
                    </div>
                </div>

                {label && (
                    <label className={`absolute left-4 transition-all duration-200 pointer-events-none text-muted font-medium
            peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-brand-600 peer-focus:bg-white peer-focus:px-2 rounded
            ${value ? "-top-2.5 text-xs bg-white px-2 rounded text-brand-600" : "top-3.5 text-sm"}
            ${error ? "peer-focus:text-red-500 text-red-500" : ""}
          `}>
                        {label}
                    </label>
                )}

                {error && <p className="mt-1 text-xs text-red-500 pl-1 font-medium">{error}</p>}
            </div>
        );
    }
);

Select.displayName = "Select";

export default Select;
