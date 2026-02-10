import Button from "../ui/Button";

export default function FinalCTA() {
  return (

    <section className="section bg-brand-gradient py-24 text-center">
      <div className="mx-auto max-w-4xl px-6">
        
       
        <h2 className="text-4xl font-extrabold tracking-tight text-brand-dark sm:text-5xl">
          Ready to Go Live with EVENTLIVE?
        </h2>

    
        <p className="mt-6 text-lg font-medium text-brand-dark/80 sm:text-xl">
          Create, manage, and scale your virtual events with confidence. 
          Join thousands of organizers hosting world-class experiences.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
      
          <Button className="px-10 py-4 text-base">
            Get Started for Free
          </Button>
          
          <Button variant="secondary" className="px-10 py-4 text-base bg-white/50 backdrop-blur-sm">
            Request a Demo
          </Button>
        </div>
      </div>
    </section>
  );
}