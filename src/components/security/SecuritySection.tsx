import  type { ReactNode } from "react";
import { motion } from "framer-motion";

interface SecuritySectionProps {
  title: string;
  icon: React.ElementType;
  children: ReactNode;
  delay?: number;
}

export const SecuritySection = ({ title, icon: Icon, children, delay = 0 }: SecuritySectionProps) => (
  <motion.section 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="card p-8 border-brand-accent/20 bg-white shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-center gap-4 mb-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-surface text-brand-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-bold text-brand-dark tracking-tight">{title}</h2>
    </div>
    <div className="space-y-4 text-brand-muted leading-relaxed">
      {children}
    </div>
  </motion.section>
);