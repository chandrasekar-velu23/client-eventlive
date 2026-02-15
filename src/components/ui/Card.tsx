import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
    return (
        <div className={`card p-6 ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className = "", children, ...props }: CardProps) {
    return (
        <div className={`mb-4 ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={`text-lg font-bold text-brand-dark ${className}`} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ className = "", children, ...props }: CardProps) {
    return (
        <div className={`${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className = "", children, ...props }: CardProps) {
    return (
        <div className={`mt-6 flex items-center pt-4 border-t border-brand-accent ${className}`} {...props}>
            {children}
        </div>
    );
}
