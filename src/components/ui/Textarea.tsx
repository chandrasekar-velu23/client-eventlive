import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = "", label, error, placeholder, value, ...props }, ref) => {
        return (
            <div className="relative w-full group">
                <textarea
                    ref={ref}
                    className={`peer w-full px-4 py-3 rounded-xl border-2 bg-surface-50 border-surface-200 outline-none transition-all duration-200 placeholder-transparent text-default min-h-[120px] resize-y
            focus:border-brand-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(79,70,229,0.1)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : ""}
            ${className}`}
                    placeholder={label || placeholder || " "}
                    value={value}
                    {...props}
                />
                {label && (
                    <label className={`absolute left-4 transition-all duration-200 pointer-events-none text-muted font-medium
            peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted/70
            peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-brand-600 peer-focus:bg-white peer-focus:px-2 rounded
            ${value ? "-top-2.5 text-xs bg-white px-2 rounded text-brand-600" : ""}
            ${error ? "peer-focus:text-red-500 text-red-500" : ""}
          `}>
                        {label}
                    </label>
                )}
                {error && <p className="mt-1 text-xs text-red-500 pl-1 font-medium flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                    {error}
                </p>}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";

export default Textarea;
