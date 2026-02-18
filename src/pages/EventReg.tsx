import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import { useEventAttendance } from "../hooks/useEventAttendance";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CalendarIcon,
  UsersIcon,
  FilmIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import type { EventData } from "../services/api";
import { formatEventDate, formatEventTime, isEventUpcoming } from "../utils/date";


export default function EventReg() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchEventById } = useEvents();
  const { enrollInEvent } = useEventAttendance();
  const [event, setEvent] = useState<(EventData & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  /**
   * Load event details on component mount
   */
  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        const eventData = await fetchEventById(eventId);
        if (eventData) {
          setEvent(eventData);
        } else {
          toast.error("Event not found");
          navigate("/all-events");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load event");
        navigate("/all-events");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, fetchEventById, navigate]);

  /**
   * Handle event enrollment
   */
  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please login to register for this event");
      navigate("/login");
      return;
    }

    if (!event?.id) return;

    try {
      setEnrolling(true);
      await enrollInEvent(event.id);
      setEnrolled(true);
      toast.success("Successfully registered for the event!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register for event");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-brand-muted">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Event not found</p>
      </div>
    );
  }

  const isUpcoming = isEventUpcoming(event.startTime);

  return (
    <div className="space-y-8 animate-fade-in pt-32 px-6 max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-brand-surface rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-brand-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Event Registration</h1>
          <p className="text-sm text-brand-muted">
            {enrolled ? "You are registered for this event" : "Register for this event"}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Cover Image */}
          {event.coverImage && (
            <div className="card overflow-hidden ring-1 ring-brand-accent/5">
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Event Details Card */}
          <div className="card p-8 space-y-6 ring-1 ring-brand-accent/5">
            {/* Title */}
            <div>
              <h2 className="text-3xl font-bold text-brand-dark mb-2">
                {event.title}
              </h2>
              <div className="flex gap-2">
                {isUpcoming && (
                  <span className="inline-block px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase">
                    Upcoming
                  </span>
                )}
                <span className="inline-block px-3 py-1 rounded-full bg-brand-surface text-brand-muted text-xs font-bold uppercase">
                  {event.type || "Virtual"} Event
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-bold text-brand-dark mb-2">About This Event</h3>
              <p className="text-brand-muted whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            {/* Event Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-brand-accent/10">
              <div className="space-y-2">
                <p className="text-sm text-brand-muted font-bold uppercase tracking-widest">
                  Start Date & Time
                </p>
                <div className="flex items-center gap-2 text-brand-dark font-bold">
                  <CalendarIcon className="h-5 w-5 text-brand-primary" />
                  <span>
                    {formatEventDate(event.startTime)} at {formatEventTime(event.startTime)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-brand-muted font-bold uppercase tracking-widest">
                  End Date & Time
                </p>
                <div className="flex items-center gap-2 text-brand-dark font-bold">
                  <CalendarIcon className="h-5 w-5 text-brand-primary" />
                  <span>
                    {formatEventDate(event.endTime)} at {formatEventTime(event.endTime)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-brand-muted font-bold uppercase tracking-widest">
                  Event Type
                </p>
                <div className="flex items-center gap-2 text-brand-dark font-bold">
                  <FilmIcon className="h-5 w-5 text-brand-primary" />
                  <span>{event.type || "Virtual"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-brand-muted font-bold uppercase tracking-widest">
                  Attendees
                </p>
                <div className="flex items-center gap-2 text-brand-dark font-bold">
                  <UsersIcon className="h-5 w-5 text-brand-primary" />
                  <span>{Math.floor(Math.random() * 500)} registered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Card */}
        <div>
          <div className="card p-8 space-y-6 ring-1 ring-brand-accent/5 sticky top-20">
            {enrolled ? (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
                  <h3 className="text-lg font-bold text-brand-dark mt-2">
                    Registration Confirmed
                  </h3>
                  <p className="text-sm text-brand-muted mt-1">
                    You have successfully registered for this event
                  </p>
                </div>

                <div className="bg-brand-surface/30 border border-brand-primary/20 rounded-lg p-4 space-y-2">
                  <p className="text-xs text-brand-muted font-bold uppercase">
                    Confirmation Details
                  </p>
                  <div className="text-sm text-brand-dark">
                    <p className="font-bold">Check your email for:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-brand-muted">
                      <li>Event confirmation</li>
                      <li>Meeting link & password</li>
                      <li>Event materials</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full btn-primary py-3 font-bold transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-brand-dark text-lg mb-2">
                    Register Now
                  </h3>
                  <p className="text-sm text-brand-muted">
                    Join this exciting event and connect with other participants
                  </p>
                </div>

                {!user && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Please{" "}
                      <Link to="/login" className="font-bold text-yellow-900 hover:underline">
                        login
                      </Link>{" "}
                      to register for this event
                    </p>
                  </div>
                )}

                {user && (
                  <div className="bg-brand-surface/30 border border-brand-primary/20 rounded-lg p-4">
                    <p className="text-sm text-brand-dark">
                      <span className="font-bold">Registering as:</span>
                      <br />
                      {user.name}
                      <br />
                      <span className="text-xs text-brand-muted">{user.email}</span>
                    </p>
                  </div>
                )}

                <button
                  onClick={handleEnroll}
                  disabled={!user || enrolling}
                  className="w-full btn-primary py-3 font-bold transition-all disabled:opacity-50"
                >
                  {enrolling ? "Processing..." : "Register for Event"}
                </button>

                <p className="text-xs text-brand-muted text-center">
                  By registering, you agree to receive event updates and materials
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
