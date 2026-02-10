import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import { useEventAttendance } from "../hooks/useEventAttendance";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CalendarIcon,
  VideoCameraIcon,
  PhotoIcon,
  UsersIcon,
  ChartBarIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  FilmIcon,
  LinkIcon
} from "@heroicons/react/24/outline";
import { getAllSpeakers, uploadCoverImage, createGlobalSpeaker } from "../services/api";
import type { EventData, Speaker, AgendaItem } from "../services/api";

export default function ManageEvent() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchEventById, updateEventData } = useEvents();
  const { attendees, analytics, fetchAttendees, fetchAnalytics } = useEventAttendance();
  const [event, setEvent] = useState<(EventData & { id: string; organizer?: any }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EventData>>({});

  // Role-based access control
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isAttendee, setIsAttendee] = useState(false);

  // Attendee request states
  const [requestingTranscript, setRequestingTranscript] = useState(false);
  const [requestingRecording, setRequestingRecording] = useState(false);
  const [transcriptRequested, setTranscriptRequested] = useState(false);
  const [recordingRequested, setRecordingRequested] = useState(false);

  // Additional States for Editing (Organizer only)
  const [uploadingCover, setUploadingCover] = useState(false);
  const [availableSpeakers, setAvailableSpeakers] = useState<Speaker[]>([]);
  const [showNewSpeakerForm, setShowNewSpeakerForm] = useState(false);
  const [newSpeakerData, setNewSpeakerData] = useState({ name: "", role: "", bio: "" });
  const [creatingSpeaker, setCreatingSpeaker] = useState(false);

  // Helper to format date for input
  const toInputDate = (dateStr?: string | Date) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId || !user) return;

      try {
        setLoading(true);
        const eventData = await fetchEventById(eventId);
        if (eventData) {
          setEvent(eventData);

          // Determine user role for this event
          // Handle both populated organizer object and organizerId string
          let organizerId: string | undefined;

          if ((eventData as any).organizer) {
            // If organizer is populated as an object
            const org = (eventData as any).organizer;
            organizerId = typeof org === 'object' ? (org._id || org.id) : org;
          } else if (eventData.organizerId) {
            // If organizerId is directly available
            organizerId = eventData.organizerId;
          }

          const userIsOrganizer = organizerId === user.id || user.role === 'Organizer';
          const userIsAttendee = eventData.attendees?.some((att: any) =>
            (typeof att === 'object' ? att._id || att.id : att) === user.id
          ) || false;

          setIsOrganizer(userIsOrganizer);
          setIsAttendee(userIsAttendee);

          // Only organizers can access this page
          if (!userIsOrganizer && !userIsAttendee) {
            toast.error("You don't have access to manage this event");
            navigate("/dashboard");
            return;
          }

          // Prepare form data for organizers
          if (userIsOrganizer) {
            const formUpdate: Partial<EventData> = {
              ...eventData,
              startTime: toInputDate(eventData.startTime),
              endTime: toInputDate(eventData.endTime),
            };

            // Handle speakers: If objects, extract IDs for form state
            if (Array.isArray(eventData.speakers) && eventData.speakers.length > 0) {
              const firstSpeaker = eventData.speakers[0];
              if (typeof firstSpeaker === 'object' && firstSpeaker !== null) {
                formUpdate.speakers = (eventData.speakers as any[]).map(s => s._id);
              } else {
                formUpdate.speakers = eventData.speakers as string[];
              }
            }

            setFormData(formUpdate);

            // Load analytics and attendees for organizers
            await fetchAttendees(eventId);
            await fetchAnalytics(eventId);

            // Load global speakers for selection
            const speakers = await getAllSpeakers();
            setAvailableSpeakers(speakers);
          }
        } else {
          toast.error("Event not found");
          navigate("/dashboard");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load event");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, user, fetchEventById, fetchAttendees, fetchAnalytics, navigate]);

  // Attendee: Request Transcript
  const handleRequestTranscript = async () => {
    if (!event || !user) return;

    setRequestingTranscript(true);
    try {
      // Call API to request transcript
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/request-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          attendeeEmail: user.email,
          attendeeName: user.name,
          eventTitle: event.title
        })
      });

      if (!response.ok) throw new Error('Failed to request transcript');

      setTranscriptRequested(true);
      toast.success("Transcript request sent! You'll receive it via email once available.");
    } catch (error) {
      toast.error("Failed to request transcript. Please try again.");
    } finally {
      setRequestingTranscript(false);
    }
  };

  // Attendee: Request Recording
  const handleRequestRecording = async () => {
    if (!event || !user) return;

    setRequestingRecording(true);
    try {
      // Call API to request recording
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/request-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          attendeeEmail: user.email,
          attendeeName: user.name,
          eventTitle: event.title
        })
      });

      if (!response.ok) throw new Error('Failed to request recording');

      setRecordingRequested(true);
      toast.success("Recording request sent! You'll receive it via email once available.");
    } catch (error) {
      toast.error("Failed to request recording. Please try again.");
    } finally {
      setRequestingRecording(false);
    }
  };

  // Generate event join link for attendees (same format as organizer)
  const getEventJoinLink = () => {
    if (!event || !event.sessionCode) return "";
    return `${window.location.origin}/join/${event.sessionCode}`;
  };

  // Copy event link to clipboard (same as organizer function)
  const copyEventLink = () => {
    if (!event || !event.sessionCode) {
      toast.error("Session code not available");
      return;
    }
    const link = `${window.location.origin}/join/${event.sessionCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Event link copied to clipboard!");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const { url } = await uploadCoverImage(file);
      setFormData(prev => ({ ...prev, coverImage: url }));
      toast.success("Cover image uploaded");
    } catch (error) {
      toast.error("Failed to upload cover image");
    } finally {
      setUploadingCover(false);
    }
  };

  // Agenda Handlers
  const handleAddAgendaItem = () => {
    setFormData(prev => ({
      ...prev,
      agenda: [...(prev.agenda || []), { startTime: "", endTime: "", title: "", description: "" }]
    }));
  };

  const updateAgendaItem = (index: number, field: keyof AgendaItem, value: string) => {
    const newAgenda = [...(formData.agenda || [])];
    newAgenda[index] = { ...newAgenda[index], [field]: value };
    setFormData(prev => ({ ...prev, agenda: newAgenda }));
  };

  const removeAgendaItem = (index: number) => {
    const newAgenda = [...(formData.agenda || [])];
    newAgenda.splice(index, 1);
    setFormData(prev => ({ ...prev, agenda: newAgenda }));
  };

  // Speaker Handlers
  const toggleSpeaker = (id: string) => {
    const currentIds = (formData.speakers as string[]) || [];
    if (currentIds.includes(id)) {
      setFormData(prev => ({ ...prev, speakers: currentIds.filter(s => s !== id) }));
    } else {
      setFormData(prev => ({ ...prev, speakers: [...currentIds, id] }));
    }
  };

  const handleCreateSpeaker = async () => {
    if (!newSpeakerData.name || !newSpeakerData.role) return toast.error("Name and Role required");
    setCreatingSpeaker(true);
    try {
      const newSpeaker = await createGlobalSpeaker({ ...newSpeakerData, _id: "" } as any);
      setAvailableSpeakers([...availableSpeakers, newSpeaker]);
      toggleSpeaker(newSpeaker._id);
      setShowNewSpeakerForm(false);
      setNewSpeakerData({ name: "", role: "", bio: "" });
      toast.success("Speaker created and selected");
    } catch (error) {
      toast.error("Failed to create speaker");
    } finally {
      setCreatingSpeaker(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event?.id) return;

    try {
      setLoading(true);
      const startTimeInput = formData.startTime as string;
      const endTimeInput = formData.endTime as string;

      if (new Date(startTimeInput) >= new Date(endTimeInput)) {
        toast.error("End time must be after start time");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        startTime: new Date(startTimeInput).toISOString(),
        endTime: new Date(endTimeInput).toISOString(),
      };

      const updated = await updateEventData(event.id, payload);
      setEvent(updated);
      setEditing(false);
      toast.success("Event updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !event) {
    return <div className="flex items-center justify-center py-12"><p className="text-brand-muted">Loading event details...</p></div>;
  }

  if (!event) return <div className="text-center py-12"><p className="text-red-500">Event not found</p></div>;

  // Get organizer name (hide ID)
  let organizerName = 'Unknown Organizer';
  if (event) {
    const org = (event as any).organizer;
    if (org) {
      organizerName = typeof org === 'object' ? (org.name || 'Unknown Organizer') : 'Unknown Organizer';
    } else if (event.organizerDisplayName) {
      organizerName = event.organizerDisplayName;
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-brand-surface rounded-lg transition-colors">
          <ArrowLeftIcon className="h-5 w-5 text-brand-muted" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-brand-dark">{editing ? "Edit Event" : event.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            {isOrganizer && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary">
                Organizer Access
              </span>
            )}
            {isAttendee && !isOrganizer && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600">
                Attendee View
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Attendee View: Join Link & Requests */}
          {isAttendee && !isOrganizer && (
            <>
              {/* Event Join Link */}
              <section className="card p-8 space-y-6 ring-1 ring-brand-accent/5">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase">
                  <LinkIcon className="h-5 w-5" /> Event Access
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2">Your Event Join Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={getEventJoinLink()}
                        readOnly
                        className="input-field w-full bg-brand-surface/50"
                      />
                      <button
                        onClick={copyEventLink}
                        className="btn-secondary px-4 py-2 font-bold whitespace-nowrap"
                      >
                        Copy Link
                      </button>
                    </div>
                    <p className="text-xs text-brand-muted mt-2">
                      Use this link to join the event. Share it with others or bookmark it for easy access.
                    </p>
                  </div>
                </div>
              </section>

              {/* Request Transcript & Recording */}
              <section className="card p-8 space-y-6 ring-1 ring-brand-accent/5">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase">
                  <DocumentTextIcon className="h-5 w-5" /> Event Resources
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-brand-surface/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <DocumentTextIcon className="h-6 w-6 text-brand-primary" />
                      <div>
                        <p className="font-bold text-brand-dark">Event Transcript</p>
                        <p className="text-xs text-brand-muted">Request the full transcript of this event</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRequestTranscript}
                      disabled={requestingTranscript || transcriptRequested}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${transcriptRequested
                        ? 'bg-green-500/10 text-green-600 cursor-not-allowed'
                        : 'btn-primary'
                        }`}
                    >
                      {requestingTranscript ? 'Requesting...' : transcriptRequested ? 'Requested ✓' : 'Request'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-brand-surface/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FilmIcon className="h-6 w-6 text-brand-primary" />
                      <div>
                        <p className="font-bold text-brand-dark">Event Recording</p>
                        <p className="text-xs text-brand-muted">Request the video recording of this event</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRequestRecording}
                      disabled={requestingRecording || recordingRequested}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${recordingRequested
                        ? 'bg-green-500/10 text-green-600 cursor-not-allowed'
                        : 'btn-primary'
                        }`}
                    >
                      {requestingRecording ? 'Requesting...' : recordingRequested ? 'Requested ✓' : 'Request'}
                    </button>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Once you request a transcript or recording, you'll receive an email notification when it's ready. Processing may take up to 24 hours.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Organizer View: Full Event Management */}
          {isOrganizer && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <section className="card p-8 space-y-6 ring-1 ring-brand-accent/5">
                <div className="flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase pointer-events-auto">
                    <VideoCameraIcon className="h-5 w-5" /> Basic Information
                  </div>
                  <button type="button" onClick={() => editing ? setEditing(false) : setEditing(true)} className="pointer-events-auto text-xs font-bold text-brand-primary hover:text-brand-muted transition-colors">
                    {editing ? "Cancel" : "Edit"}
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2">Event Title</label>
                    <input name="title" value={formData.title || ""} onChange={handleChange} disabled={!editing} className="input-field w-full disabled:opacity-70" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2">Description</label>
                    <textarea name="description" value={formData.description || ""} onChange={handleChange} disabled={!editing} rows={4} className="input-field w-full disabled:opacity-70" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2">Organizer</label>
                    <input value={organizerName} disabled className="input-field w-full bg-brand-surface/50 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2">Visibility</label>
                    <select name="visibility" value={formData.visibility || "public"} onChange={handleChange} disabled={!editing} className="input-field w-full disabled:opacity-70">
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Date & Time */}
              <section className="card p-8 space-y-6 ring-1 ring-brand-accent/5">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase"><CalendarIcon className="h-5 w-5" /> Date & Time</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2">Start</label>
                    <input type="datetime-local" name="startTime" value={formData.startTime || ""} onChange={handleChange} disabled={!editing} className="input-field w-full disabled:opacity-70" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2">End</label>
                    <input type="datetime-local" name="endTime" value={formData.endTime || ""} onChange={handleChange} disabled={!editing} className="input-field w-full disabled:opacity-70" />
                  </div>
                </div>
              </section>

              {/* Agenda */}
              <section className="card p-8 space-y-6 ring-1 ring-brand-accent/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase"><CalendarIcon className="h-5 w-5" /> Agenda</div>
                  {editing && <button type="button" onClick={handleAddAgendaItem} className="text-xs font-bold text-brand-primary"><PlusIcon className="h-4 w-4 inline" /> Add</button>}
                </div>
                <div className="space-y-4">
                  {(!formData.agenda || formData.agenda.length === 0) && <p className="text-sm text-brand-muted italic">No sessions scheduled.</p>}
                  {formData.agenda?.map((item, idx) => (
                    <div key={idx} className="p-4 bg-brand-surface/20 rounded-xl border border-brand-accent/20 relative group">
                      {editing && <button type="button" onClick={() => removeAgendaItem(idx)} className="absolute top-2 right-2 text-red-400 p-1"><TrashIcon className="h-4 w-4" /></button>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-brand-muted">Start</label>
                          <input type="time" disabled={!editing} value={item.startTime} onChange={e => updateAgendaItem(idx, 'startTime', e.target.value)} className="input-field text-sm w-full py-1 disabled:opacity-70" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-brand-muted">End</label>
                          <input type="time" disabled={!editing} value={item.endTime} onChange={e => updateAgendaItem(idx, 'endTime', e.target.value)} className="input-field text-sm w-full py-1 disabled:opacity-70" />
                        </div>
                      </div>
                      <input disabled={!editing} value={item.title} onChange={e => updateAgendaItem(idx, 'title', e.target.value)} className="input-field w-full text-sm font-bold mb-2 disabled:bg-transparent disabled:border-none disabled:p-0" placeholder="Session Title" />
                      <input disabled={!editing} value={item.description} onChange={e => updateAgendaItem(idx, 'description', e.target.value)} className="input-field w-full text-sm disabled:bg-transparent disabled:border-none disabled:p-0" placeholder="Description" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Speakers */}
              <section className="card p-8 space-y-6 ring-1 ring-brand-accent/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase"><UserGroupIcon className="h-5 w-5" /> Speakers</div>
                  {editing && <button type="button" onClick={() => setShowNewSpeakerForm(!showNewSpeakerForm)} className="text-xs font-bold text-brand-primary">{showNewSpeakerForm ? "Cancel" : "+ Create New"}</button>}
                </div>

                {editing && showNewSpeakerForm && (
                  <div className="mb-6 p-4 bg-brand-surface rounded-xl border border-brand-primary/20">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input value={newSpeakerData.name} onChange={e => setNewSpeakerData({ ...newSpeakerData, name: e.target.value })} className="input-field text-sm" placeholder="Name" />
                      <input value={newSpeakerData.role} onChange={e => setNewSpeakerData({ ...newSpeakerData, role: e.target.value })} className="input-field text-sm" placeholder="Role" />
                    </div>
                    <input value={newSpeakerData.bio} onChange={e => setNewSpeakerData({ ...newSpeakerData, bio: e.target.value })} className="input-field w-full text-sm mb-3" placeholder="Bio" />
                    <button type="button" onClick={handleCreateSpeaker} disabled={creatingSpeaker} className="btn-primary w-full py-1 text-sm font-bold">{creatingSpeaker ? "Saving..." : "Save & Select"}</button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                  {editing ? availableSpeakers.map(speaker => {
                    const isSelected = (formData.speakers as string[])?.includes(speaker._id);
                    return (
                      <div key={speaker._id} onClick={() => toggleSpeaker(speaker._id)} className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition-all ${isSelected ? 'bg-brand-primary/5 border-brand-primary ring-1 ring-brand-primary' : 'bg-white border-brand-accent/20'}`}>
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-brand-muted'}`}>
                          {isSelected && <CheckCircleIcon className="h-3 w-3 text-white" />}
                        </div>
                        <div><p className="text-sm font-bold text-brand-dark truncate">{speaker.name}</p><p className="text-xs text-brand-muted truncate">{speaker.role}</p></div>
                      </div>
                    );
                  }) : (
                    (event.speakers as any[])?.length > 0 ? (event.speakers as any[]).map((speaker: any) => (
                      <div key={speaker._id || speaker} className="p-3 rounded-xl border border-brand-accent/20 flex items-center gap-3 bg-white">
                        {typeof speaker === 'object' ? (
                          <>
                            <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-xs text-brand-primary">{speaker.name?.[0]}</div>
                            <div><p className="text-sm font-bold text-brand-dark truncate">{speaker.name}</p><p className="text-xs text-brand-muted truncate">{speaker.role}</p></div>
                          </>
                        ) : <span>Speaker ID: {speaker}</span>}
                      </div>
                    )) : <p className="text-brand-muted text-sm col-span-2 italic">No speakers added.</p>
                  )}
                </div>
              </section>

              {/* Cover Image */}
              <section className="card p-8 space-y-6 ring-1 ring-brand-accent/5">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase"><PhotoIcon className="h-5 w-5" /> Cover Image</div>
                {editing && (
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <button type="button" className="w-full btn-secondary text-sm font-bold py-2 border border-brand-accent/20">{uploadingCover ? "Uploading..." : "Upload New Image"}</button>
                  </div>
                )}
                {formData.coverImage && typeof formData.coverImage === 'string' && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-brand-accent/20">
                    <img
                      src={formData.coverImage}
                      alt="Event cover"
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "https://placehold.co/600x400?text=Cover+Image+Not+Found";
                      }}
                    />
                  </div>
                )}
              </section>

              {editing && (
                <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white/90 backdrop-blur-sm p-4 border-t border-brand-accent/20 z-10 rounded-xl">
                  <button type="button" onClick={() => { setEditing(false); setFormData(event); }} className="px-6 py-2 text-sm font-bold text-brand-muted hover:text-brand-dark transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="btn-primary px-8 py-2 font-bold shadow-lg">{loading ? "Saving..." : "Save Changes"}</button>
                </div>
              )}
            </form>
          )}

          {/* Read-only event details for attendees */}
          {isAttendee && !isOrganizer && (
            <section className="card p-8 space-y-6 ring-1 ring-brand-accent/5">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase">
                <VideoCameraIcon className="h-5 w-5" /> Event Details
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-2">Event Title</label>
                  <p className="text-brand-dark">{event.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-2">Description</label>
                  <p className="text-brand-muted">{event.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-2">Organizer</label>
                  <p className="text-brand-dark">{organizerName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2">Start Time</label>
                    <p className="text-brand-muted">{new Date(event.startTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2">End Time</label>
                    <p className="text-brand-muted">{new Date(event.endTime).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Analytics & Attendees (Organizer Only) */}
        {isOrganizer && (
          <div className="space-y-6">
            {analytics && (
              <div className="card p-6 ring-1 ring-brand-accent/5">
                <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" /> Analytics
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-brand-accent/10">
                    <span className="text-sm text-brand-muted">Registrations</span>
                    <span className="text-xl font-bold text-brand-dark">
                      {analytics.registrations}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-brand-accent/10">
                    <span className="text-sm text-brand-muted">Attendance Rate</span>
                    <span className="text-xl font-bold text-brand-dark">
                      {analytics.attendanceRate}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="card p-6 ring-1 ring-brand-accent/5">
              <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
                <UsersIcon className="h-5 w-5" /> Attendees
              </h2>
              <div className="text-3xl font-bold text-brand-primary mb-4">
                {attendees.length}
              </div>
              <Link to={`/dashboard/events/${event.id}/attendees`} className="block text-center px-4 py-2 text-sm font-bold text-brand-primary hover:bg-brand-surface rounded-lg transition-colors">
                View Details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
