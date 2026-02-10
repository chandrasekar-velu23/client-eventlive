type PageLayoutProps = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export default function PageLayout({
  title,
  subtitle,
  children,
}: PageLayoutProps) {
  return (

    <section className="min-h-screen bg-brand-bg pt-32 pb-20">
      
      <div className="section mx-auto max-w-5xl">
        
        <h1 className="section-title">
          {title}
        </h1>

        {subtitle && (
          
          <p className="mt-4 text-lg text-brand-muted max-w-3xl">
            {subtitle}
          </p>
        )}

        <div className="mt-10">
          {children}
        </div>
      </div>
    </section>
  );
}