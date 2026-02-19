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
  LinkIcon,
  PencilSquareIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { getAllSpeakers, uploadCoverImage, createGlobalSpeaker, BASE_URL } from "../services/api";
import type { EventData, Speaker, AgendaItem } from "../services/api";
import { formatEventDate, formatEventTime } from "../utils/date";

// UI Components
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Select from "../components/ui/Select";

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

  // Helper to format date for input (datetime-local expects YYYY-MM-DDTHH:mm)
  const toInputDate = (dateStr?: string | Date) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    // format to local time string for input
    // Using simple ISO slice is risky if not handling timezone, but input[type="datetime-local"] is local to browser by default.
    // However, we want to show the event's time in the user's local time (or event's timezone if we want to be fancy, but stick to local for editing usually)

    // Better approach:
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
          let organizerId: string | undefined;

          if ((eventData as any).organizer) {
            const org = (eventData as any).organizer;
            organizerId = typeof org === 'object' ? (org._id || org.id) : org;
          } else if (eventData.organizerId) {
            organizerId = eventData.organizerId;
          }

          const userIsOrganizer = organizerId === user.id || user.role === 'Organizer';
          const userIsAttendee = eventData.attendees?.some((att: any) =>
            (typeof att === 'object' ? att._id || att.id : att) === user.id
          ) || false;

          setIsOrganizer(userIsOrganizer);
          setIsAttendee(userIsAttendee);

          // Only organizers can access this page (attendees see details)
          if (!userIsOrganizer && !userIsAttendee) {
            toast.error("You don't have access to this event");
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

            // Handle speakers
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

  // Attendee Actions
  const handleRequestTranscript = async () => {
    if (!event || !user) return;
    setRequestingTranscript(true);
    try {
      const response = await fetch(`${BASE_URL}/events/${eventId}/request-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ attendeeEmail: user.email, attendeeName: user.name, eventTitle: event.title })
      });
      if (!response.ok) throw new Error('Failed');
      setTranscriptRequested(true);
      toast.success("Transcript request sent!");
    } catch (error) {
      toast.error("Failed to request transcript.");
    } finally {
      setRequestingTranscript(false);
    }
  };

  const handleRequestRecording = async () => {
    if (!event || !user) return;
    setRequestingRecording(true);
    try {
      const response = await fetch(`${BASE_URL}/events/${eventId}/request-recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ attendeeEmail: user.email, attendeeName: user.name, eventTitle: event.title })
      });
      if (!response.ok) throw new Error('Failed');
      setRecordingRequested(true);
      toast.success("Recording request sent!");
    } catch (error) {
      toast.error("Failed to request recording.");
    } finally {
      setRequestingRecording(false);
    }
  };

  const copyEventLink = () => {
    if (!event?.sessionCode) return toast.error("Session code not available");
    navigator.clipboard.writeText(`${window.location.origin}/join/${event.sessionCode}`);
    toast.success("Event link copied to clipboard!");
  };

  // Form Handlers
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
        startTime: new Date(startTimeInput).toISOString(), // This takes browser local time input and converts to UTC ISO
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

  if (loading && !event) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!event) return <div className="text-center py-12 text-red-500 font-bold">Event not found</div>;

  let organizerName = 'Unknown Organizer';
  if (event) {
    const org = (event as any).organizer;
    if (typeof org === 'object') organizerName = org.name || 'Unknown Organizer';
    else if (event.organizerDisplayName) organizerName = event.organizerDisplayName;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="secondary" onClick={() => navigate("/dashboard")} className="p-2 h-10 w-10">
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold font-display text-brand-950">{editing ? "Edit Event" : event.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            {isOrganizer && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-700">Organizer View</span>}
            {isAttendee && !isOrganizer && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Attendee View</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Attendee View */}
          {isAttendee && !isOrganizer && (
            <>
              {/* Join Link */}
              <div className="bg-white rounded-2xl border border-brand-100 p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-brand-50 rounded-lg text-brand-600"><LinkIcon className="h-5 w-5" /></div>
                  <h2 className="text-lg font-bold text-brand-950">Event Access</h2>
                </div>
                <div className="space-y-4">
                  <label className="text-sm font-bold text-brand-700">Your Join Link</label>
                  <div className="flex gap-2">
                    <Input value={event.sessionCode ? `${window.location.origin}/join/${event.sessionCode}` : ''} readOnly className="bg-gray-50 font-mono text-sm" />
                    <Button onClick={copyEventLink} disabled={!event.sessionCode}>Copy</Button>
                    {event.sessionCode && (
                      <Link
                        to={`/join/${event.sessionCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex items-center justify-center px-6"
                      >
                        Join
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="bg-white rounded-2xl border border-brand-100 p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-brand-50 rounded-lg text-brand-600"><DocumentTextIcon className="h-5 w-5" /></div>
                  <h2 className="text-lg font-bold text-brand-950">Resources</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-600"><DocumentTextIcon className="h-6 w-6" /></div>
                      <div><p className="font-bold text-brand-900">Transcript</p><p className="text-xs text-brand-500">Full text transcript</p></div>
                    </div>
                    <Button onClick={handleRequestTranscript} disabled={requestingTranscript || transcriptRequested} variant={transcriptRequested ? 'secondary' : 'primary'} className="text-xs">
                      {transcriptRequested ? 'Requested' : 'Request'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-600"><FilmIcon className="h-6 w-6" /></div>
                      <div><p className="font-bold text-brand-900">Recording</p><p className="text-xs text-brand-500">HD Video recording</p></div>
                    </div>
                    <Button onClick={handleRequestRecording} disabled={requestingRecording || recordingRequested} variant={recordingRequested ? 'secondary' : 'primary'} className="text-xs">
                      {recordingRequested ? 'Requested' : 'Request'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Organizer View */}
          {isOrganizer && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div className="bg-white rounded-2xl border border-brand-100 p-8 shadow-sm relative group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-50 rounded-lg text-brand-600"><VideoCameraIcon className="h-5 w-5" /></div>
                    <h2 className="text-lg font-bold text-brand-950">Event Details</h2>
                  </div>
                  <button type="button" onClick={() => editing ? setEditing(false) : setEditing(true)} className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    {editing ? <XMarkIcon className="h-4 w-4" /> : <PencilSquareIcon className="h-4 w-4" />}
                    {editing ? "Cancel Edit" : "Edit Profile"}
                  </button>
                </div>

                <div className="space-y-5">
                  <Input label="Event Title" name="title" value={formData.title || ""} onChange={handleChange} disabled={!editing} />
                  <Textarea label="Description" name="description" value={formData.description || ""} onChange={handleChange} disabled={!editing} rows={4} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Organizer" value={organizerName} disabled className="bg-gray-50 text-gray-500" />
                    <Select label="Visibility" name="visibility" value={formData.visibility || "public"} onChange={handleChange} disabled={!editing} options={[{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }]} />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="bg-white rounded-2xl border border-brand-100 p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-brand-50 rounded-lg text-brand-600"><CalendarIcon className="h-5 w-5" /></div>
                  <h2 className="text-lg font-bold text-brand-950">Schedule</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input type="datetime-local" label="Start Time" name="startTime" value={formData.startTime || ""} onChange={handleChange} disabled={!editing} />
                  <Input type="datetime-local" label="End Time" name="endTime" value={formData.endTime || ""} onChange={handleChange} disabled={!editing} />
                </div>
              </div>

              {/* Agenda */}
              <div className="bg-white rounded-2xl border border-brand-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-50 rounded-lg text-brand-600"><CalendarIcon className="h-5 w-5" /></div>
                    <h2 className="text-lg font-bold text-brand-950">Agenda</h2>
                  </div>
                  {editing && <Button type="button" variant="secondary" onClick={handleAddAgendaItem} className="text-xs h-8"><PlusIcon className="h-3 w-3 mr-1" /> Add Session</Button>}
                </div>
                <div className="space-y-4">
                  {(!formData.agenda || formData.agenda.length === 0) && <p className="text-sm text-brand-400 italic text-center py-4">No agenda items yet.</p>}
                  {formData.agenda?.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-brand-100 bg-gray-50/50 relative group transition-colors hover:border-brand-200">
                      {editing && <button type="button" onClick={() => removeAgendaItem(idx)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"><TrashIcon className="h-4 w-4" /></button>}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                        <div className="md:col-span-1 space-y-2">
                          <Input type="time" disabled={!editing} value={item.startTime} onChange={e => updateAgendaItem(idx, 'startTime', e.target.value)} className="text-xs h-8" placeholder="Start" />
                          <Input type="time" disabled={!editing} value={item.endTime} onChange={e => updateAgendaItem(idx, 'endTime', e.target.value)} className="text-xs h-8" placeholder="End" />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <input disabled={!editing} value={item.title} onChange={e => updateAgendaItem(idx, 'title', e.target.value)} className="w-full font-bold text-brand-950 bg-transparent border-none p-0 focus:ring-0 placeholder-gray-400" placeholder="Session Title" />
                          <Textarea disabled={!editing} value={item.description} onChange={e => updateAgendaItem(idx, 'description', e.target.value)} className="text-sm min-h-[60px]" placeholder="Description" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Speakers */}
              <div className="bg-white rounded-2xl border border-brand-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-50 rounded-lg text-brand-600"><UserGroupIcon className="h-5 w-5" /></div>
                    <h2 className="text-lg font-bold text-brand-950">Speakers</h2>
                  </div>
                  {editing && <Button type="button" variant="secondary" onClick={() => setShowNewSpeakerForm(!showNewSpeakerForm)} className="text-xs h-8">{showNewSpeakerForm ? "Cancel" : "Add Speaker"}</Button>}
                </div>

                {editing && showNewSpeakerForm && (
                  <div className="mb-6 p-4 rounded-xl bg-brand-50 border border-brand-100 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Input placeholder="Name" value={newSpeakerData.name} onChange={e => setNewSpeakerData({ ...newSpeakerData, name: e.target.value })} />
                      <Input placeholder="Role" value={newSpeakerData.role} onChange={e => setNewSpeakerData({ ...newSpeakerData, role: e.target.value })} />
                    </div>
                    <Input placeholder="Bio (Optional)" value={newSpeakerData.bio} onChange={e => setNewSpeakerData({ ...newSpeakerData, bio: e.target.value })} className="mb-3" />
                    <Button type="button" onClick={handleCreateSpeaker} disabled={creatingSpeaker} className="w-full">{creatingSpeaker ? "Saving..." : "Save & Add"}</Button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                  {editing ? availableSpeakers.map(speaker => {
                    const isSelected = (formData.speakers as string[])?.includes(speaker._id);
                    return (
                      <div key={speaker._id} onClick={() => toggleSpeaker(speaker._id)} className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition-all ${isSelected ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500' : 'bg-white border-gray-200 hover:border-brand-300'}`}>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-gray-300'}`}>
                          {isSelected && <CheckCircleIcon className="h-4 w-4 text-white" />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-brand-900 truncate">{speaker.name}</p>
                          <p className="text-xs text-brand-500 truncate">{speaker.role}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    (event.speakers as any[])?.length > 0 ? (event.speakers as any[]).map((speaker: any) => (
                      <div key={speaker._id || speaker} className="p-3 rounded-xl border border-gray-100 bg-white flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700 shrink-0 uppercase">
                          {speaker.name?.[0]}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-brand-900 truncate">{speaker.name}</p>
                          <p className="text-xs text-brand-500 truncate">{speaker.role}</p>
                        </div>
                      </div>
                    )) : <p className="text-brand-400 text-sm col-span-2 italic">No speakers added.</p>
                  )}
                </div>
              </div>

              {/* Cover Image */}
              <div className="bg-white rounded-2xl border border-brand-100 p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-brand-50 rounded-lg text-brand-600"><PhotoIcon className="h-5 w-5" /></div>
                  <h2 className="text-lg font-bold text-brand-950">Cover Image</h2>
                </div>
                {editing && (
                  <div className="mb-4">
                    <label className="block w-full cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                      <div className="w-full border-2 border-dashed border-brand-200 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-brand-50/50 hover:border-brand-300 transition-all">
                        <PhotoIcon className="h-10 w-10 text-brand-300 mb-2" />
                        <p className="font-bold text-brand-600">{uploadingCover ? "Uploading..." : "Click to upload image"}</p>
                        <p className="text-xs text-brand-400">PNG, JPG up to 10MB</p>
                      </div>
                    </label>
                  </div>
                )}
                {formData.coverImage && (
                  <div className="rounded-xl overflow-hidden shadow-md ring-1 ring-black/5">
                    <img src={formData.coverImage as string} alt="Cover" className="w-full h-auto object-cover max-h-80" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  </div>
                )}
              </div>

              {/* Sticky Create/Save */}
              {editing && (
                <div className="fixed bottom-6 right-6 z-20 flex gap-4 p-2 bg-white/80 backdrop-blur-md border border-brand-100 shadow-2xl rounded-2xl">
                  <Button variant="secondary" type="button" onClick={() => { setEditing(false); setFormData(event); }}>Discard</Button>
                  <Button type="submit" disabled={loading} className="shadow-lg shadow-brand-600/20">{loading ? "Saving..." : "Save Changes"}</Button>
                </div>
              )}
            </form>
          )}

          {/* Attendee Info View */}
          {isAttendee && !isOrganizer && (
            <div className="bg-white rounded-2xl border border-brand-100 p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-brand-50 rounded-lg text-brand-600"><CalendarIcon className="h-5 w-5" /></div>
                <h2 className="text-lg font-bold text-brand-950">About this Event</h2>
              </div>
              <div className="prose prose-brand max-w-none">
                <p className="text-brand-900 font-bold mb-2">Description</p>
                <p className="text-brand-600 leading-relaxed mb-6">{event.description || "No description provided."}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-brand-400 font-bold">Start Time</p>
                    <p className="text-brand-900 font-semibold">{formatEventDate(event.startTime)} • {formatEventTime(event.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-brand-400 font-bold">End Time</p>
                    <p className="text-brand-900 font-semibold">{formatEventDate(event.endTime)} • {formatEventTime(event.endTime)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Analytics & Stats */}
        {isOrganizer && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-brand-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-brand-950 font-bold">
                <ChartBarIcon className="h-5 w-5 text-brand-600" /> Analytics
              </div>
              {analytics ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                    <span className="text-sm text-brand-500">Registrations</span>
                    <span className="text-2xl font-bold text-brand-900">{analytics.registrations}</span>
                  </div>
                  <div className="flex justify-between items-end pb-1">
                    <span className="text-sm text-brand-500">Attendance Rate</span>
                    <span className="text-2xl font-bold text-brand-900">{analytics.attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full" style={{ width: `${analytics.attendanceRate}%` }}></div>
                  </div>
                </div>
              ) : <p className="text-sm text-gray-400">Loading analytics...</p>}
            </div>

            <div className="bg-white rounded-2xl border border-brand-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-brand-950 font-bold">
                <UsersIcon className="h-5 w-5 text-brand-600" /> Attendees
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-brand-900">{attendees.length}</span>
                <span className="text-brand-500 text-sm ml-2">Total</span>
              </div>
              <Link to={`/dashboard/events/${event.id}/attendees`} className="btn-secondary w-full flex justify-center text-sm">
                View All Attendees <ArrowLeftIcon className="h-4 w-4 ml-2 rotate-180" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
