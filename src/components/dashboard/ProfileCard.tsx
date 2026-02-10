export default function ProfileCard() {
  return (
    <div className="card p-6 space-y-4">
      <div>
        <p className="text-sm text-brand-muted">Name</p>
        <p className="font-semibold text-brand-dark">Chandrasekar</p>
      </div>

      <div>
        <p className="text-sm text-brand-muted">Email</p>
        <p className="font-semibold">user@eventlive.app</p>
      </div>

      <div>
        <p className="text-sm text-brand-muted">Events Hosted</p>
        <p className="font-semibold">12</p>
      </div>

      <button className="btn-primary w-full mt-4">
        Logout
      </button>
    </div>
  );
}
