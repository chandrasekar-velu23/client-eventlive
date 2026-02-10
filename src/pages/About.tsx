import PageLayout from "../components/layout/PageLayout";

export default function About() {
  return (
    <PageLayout
      title="About EVENTLIVE"
      subtitle="Building the future of virtual & hybrid events."
    >
      <p className="text-gray-700 max-w-3xl">
        EVENTLIVE is a modern virtual event platform built with security,
        scalability, and developer experience at its core.
      </p>
    </PageLayout>
  );
}
