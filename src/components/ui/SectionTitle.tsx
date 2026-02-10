type SectionTitleProps = {
  title: string;
  subtitle?: string;
  className?: string; 
};

export default function SectionTitle({
  title,
  subtitle,
  className = "",
}: SectionTitleProps) {
  return (
    <div className={`mx-auto max-w-3xl text-center ${className}`}>
      <h2 className="section-title">
        {title}
      </h2>

      {subtitle && (
        <p className="text-muted mt-4 text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}