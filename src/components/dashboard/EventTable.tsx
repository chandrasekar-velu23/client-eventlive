import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function EventTable() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/events`, {
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    })
      .then((res) => res.json())
      .then(setEvents)
      .catch(console.error);
  }, [user?.token]);

  return (
    <div className="card p-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-brand-muted">
          <tr>
            <th>Event</th>
            <th>Status</th>
            <th>Date</th>
            <th>Attendees</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event: any) => (
            <tr key={event._id} className="border-t">
              <td className="py-3 font-medium">{event.title}</td>
              <td>{event.status || "Upcoming"}</td>
              <td>{new Date(event.startTime).toLocaleDateString()}</td>
              <td>{event.attendees?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
