type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string; 
};

export default function Button({ 
  children, 
  variant = "primary", 
  className = "" 
}: ButtonProps) {
  
  
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
  };

  return (
    <button className={`${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}