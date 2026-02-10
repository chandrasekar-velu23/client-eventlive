import { motion } from "framer-motion";
import { 
  ShieldCheckIcon, LockClosedIcon, KeyIcon, 
  ServerIcon, CreditCardIcon, EyeIcon, 
  CommandLineIcon
} from "@heroicons/react/24/outline";

import { SecuritySection } from "../components/security/SecuritySection";

export default function Security() {
  return (
    <div className="bg-brand-bg min-h-screen pt-20">
      <div className="mx-auto max-w-6xl px-6 py-12">
        
        {/* Intro Hero Text */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 rounded-2xl md:p-16 text-center shadow-xl ring-1 ring-white/10"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-brand-primary tracking-tight">
            Security & Data Protection
          </h2>
          <p className="mx-auto max-w-3xl text-lg md:text-xl text-brand-dark/80 leading-relaxed">
            At EVENTLIVE, security is foundational. Our layered architecture prioritizes 
            data confidentiality and integrity, ensuring trust at every interaction.
          </p>
        </motion.div>

        {/* Security Documentation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <SecuritySection title="Authentication & Access" icon={KeyIcon} delay={0.1}>
            <p className="text-brand-muted">Industry-standard mechanisms to protect user accounts and event access.</p>
            <ul className="mt-4 space-y-2 list-disc pl-5 font-semibold text-brand-dark/90">
              <li>Token-based authentication using JWT</li>
              <li>Encrypted password storage with strong hashing</li>
              <li>Role-Based Access Control (RBAC)</li>
              <li>Automatic token expiration and secure handling</li>
            </ul>
          </SecuritySection>

          <SecuritySection title="Data Encryption" icon={LockClosedIcon} delay={0.2}>
            <p className="text-brand-muted">Protecting sensitive data both in transit and at rest.</p>
            <ul className="mt-4 space-y-2 list-disc pl-5 font-semibold text-brand-dark/90">
              <li>TLS encryption for all HTTPS communication</li>
              <li>Data-at-rest encryption before storage</li>
              <li>Secure secrets management (No client exposure)</li>
              <li>Protection against Man-in-the-Middle attacks</li>
            </ul>
          </SecuritySection>

          <SecuritySection title="Event & Content Safety" icon={EyeIcon} delay={0.3}>
            <p className="text-brand-muted">Ensuring virtual content remains private and authorized.</p>
            <ul className="mt-4 space-y-2 list-disc pl-5 font-semibold text-brand-dark/90">
              <li>Unique and validated event access links</li>
              <li>Session-level authorization checks</li>
              <li>Permission-based downloads for assets</li>
              <li>Protection against unauthorized link sharing</li>
            </ul>
          </SecuritySection>

          <SecuritySection title="Payment Security" icon={CreditCardIcon} delay={0.4}>
            <p className="text-brand-muted">Strict financial data protection for monetization features.</p>
            <ul className="mt-4 space-y-2 list-disc pl-5 font-semibold text-brand-dark/90">
              <li>Trusted payment gateway integrations</li>
              <li>No storage of raw card details locally</li>
              <li>Encrypted transaction handling</li>
              <li>Compliance with payment security protocols</li>
            </ul>
          </SecuritySection>

          <SecuritySection title="Infrastructure Safeguards" icon={ServerIcon} delay={0.5}>
            <p className="text-brand-muted">Resilient cloud infrastructure designed for reliability.</p>
            <ul className="mt-4 space-y-2 list-disc pl-5 font-semibold text-brand-dark/90">
              <li>Firewalled backend services</li>
              <li>Regular security updates and patch management</li>
              <li>Restricted database access</li>
              <li>Backup and disaster recovery mechanisms</li>
            </ul>
          </SecuritySection>

          <SecuritySection title="Development Standards" icon={CommandLineIcon} delay={0.6}>
            <p className="text-brand-muted">Embedded security throughout our development lifecycle.</p>
            <ul className="mt-4 space-y-2 list-disc pl-5 font-semibold text-brand-dark/90">
              <li>Input validation and sanitization</li>
              <li>Protection against XSS and CSRF attacks</li>
              <li>Regular internal security reviews</li>
              <li>Rate limiting to prevent brute-force abuse</li>
            </ul>
          </SecuritySection>
        </div>

        {/* Closing Trust Statement */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 rounded-3xl bg-brand-surface p-12 text-center border border-brand-primary/10 shadow-sm"
        >
          <ShieldCheckIcon className="mx-auto h-16 w-16 text-brand-primary mb-6" />
          <h3 className="text-3xl font-bold text-brand-dark">Built for Trust</h3>
          <p className="mt-4 text-brand-muted text-lg max-w-2xl mx-auto">
            Enable seamless, scalable virtual events without compromising privacy. 
            EVENTLIVE is built for confidence and peace of mind.
          </p>
        </motion.div>
      </div>
    </div>
  );
}