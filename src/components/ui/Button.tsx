interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "glass" | "ghost" | "danger";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "default",
  className = "",
  ...props
}: ButtonProps) {

  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    glass: "btn-glass",
    ghost: "btn-ghost",
    danger: "btn-secondary border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700",
  };

  const sizes = {
    default: "",
    sm: "px-4 py-2 text-xs",
    icon: "p-2 aspect-square flex items-center justify-center",
  };


  return (
    <button
      className={`${variants[variant]} ${sizes[size]} rounded-xl ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}