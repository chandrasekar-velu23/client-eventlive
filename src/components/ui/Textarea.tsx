import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = "", label, error, placeholder, value, ...props }, ref) => {
        const hasValue = value !== undefined && value !== "";
        return (
            <div className="relative w-full">
                {label && (
                    <label
                        className={`absolute z-10 left-3.5 pointer-events-none transition-all duration-200 font-medium leading-none
                            ${hasValue
                                ? "-top-2 text-[10px] px-1 bg-bg-secondary rounded text-brand-primary"
                                : "top-3.5 text-sm text-text-secondary"
                            }
                            ${error ? "text-red-500" : ""}`}
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`input-field min-h-[100px] resize-y ${error ? "ring-red-500/60 focus:ring-red-500" : ""} ${className}`}
                    placeholder={label ? "" : (placeholder ?? "")}
                    value={value}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-red-500 pl-1 font-medium">{error}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";

export default Textarea;
