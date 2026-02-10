import PageLayout from "../components/layout/PageLayout";
import Button from "../components/ui/Button";

export default function Contact() {
  return (
    <PageLayout
      title="Contact Us"
      subtitle="We’d love to hear from you."
    >
      <form className="space-y-4 max-w-md">
        <input
          className="w-full border p-3 rounded-lg"
          placeholder="Your Email"
        />
        <textarea
          className="w-full border p-3 rounded-lg"
          placeholder="Your Message"
        />
        <Button>Send Message</Button>
      </form>
    </PageLayout>
  );
}
