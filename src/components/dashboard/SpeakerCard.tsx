export default function SpeakerCard() {
  return (
    <div className="card p-5 space-y-2">
      <h3 className="font-bold text-brand-dark">Jane Smith</h3>
      <p className="text-sm text-brand-muted">UX Design & Accessibility</p>

      <div className="flex gap-3 text-sm text-brand-primary">
        <a href="#">LinkedIn</a>
        <a href="#">Twitter</a>
      </div>
    </div>
  );
}
