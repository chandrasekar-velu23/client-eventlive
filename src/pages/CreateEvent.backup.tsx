import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import { createGlobalSpeaker, getAllSpeakers } from "../services/api";
import { uploadCoverImage, uploadSpeakerImage, uploadOrganizerLogo, validateImageFile } from "../utils/imageUpload";
import type { Speaker, AgendaItem, EventData } from "../services/api";
import { toast } from "sonner";
import { Dialog, Transition } from '@headlessui/react';
import {
  CalendarIcon,
  VideoCameraIcon,
  PhotoIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  UserCircleIcon,
  BookmarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  EyeIcon,
  LockClosedIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useFormDraft } from "../hooks/useFormDraft";


const ImageUploadField = ({
  label,
  value,
  onChange,
  onUpload,
  uploading,
  error
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  error?: string | null;
}) => {
  const [mode, setMode] = useState<'upload' | 'link'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-brand-dark">{label}</label>

      <div className="aspect-video w-full max-w-xs rounded-xl bg-brand-surface overflow-hidden border border-brand-accent/20 relative group mb-3">
        {value ? (
          <img src={value} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/800x450?text=Error")} />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-brand-muted">
            <PhotoIcon className="h-10 w-10 mb-2 opacity-50" />
            <span className="text-xs">No image</span>
          </div>
        )}
        {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-bold text-sm">Uploading...</div>}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 text-sm mb-2">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`font-semibold ${mode === 'upload' ? 'text-brand-primary underline' : 'text-brand-muted hover:text-brand-dark'}`}
        >
          Direct Upload
        </button>
        <button
          type="button"
          onClick={() => setMode('link')}
          className={`font-semibold ${mode === 'link' ? 'text-brand-primary underline' : 'text-brand-muted hover:text-brand-dark'}`}
        >
          Image Link
        </button>
      </div>

      {mode === 'upload' ? (
        <div className="relative">
          <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <button type="button" className="btn-secondary w-full py-2 text-sm flex items-center justify-center gap-2">
            <PhotoIcon className="h-4 w-4" /> Choose File
          </button>
        </div>
      ) : (
        <input
          type="url"
          placeholder=""
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field w-full text-sm"
        />
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};


interface CreateEventForm {

  title: string;
  shortSummary: string;
  description: string;
  category: string;

  // Step 2: Date & Time
  startTime: string;
  endTime: string;
  timezone: string;

  // Step 3: Visibility & Access
  visibility: 'public' | 'private' | 'unlisted';
  accessType: 'Free' | 'Paid' | 'Invite-only';
  capacity: string;

  // Step 4: Branding
  coverImageUrl: string;
  organizerDisplayName: string;
  organizerLogoUrl: string;
  brandAccentColor: string;

  // Step 5: Agenda & Speakers
  agendaItems: AgendaItem[];
  selectedSpeakerIds: string[];
}

const INITIAL_FORM_STATE: CreateEventForm = {
  title: "",
  shortSummary: "",
  description: "",
  category: "Webinar",

  startTime: "",
  endTime: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

  visibility: "public",
  accessType: "Free",
  capacity: "",

  coverImageUrl: "",
  organizerDisplayName: "",
  organizerLogoUrl: "",
  brandAccentColor: "#FF5722",

  agendaItems: [],
  selectedSpeakerIds: []
};

const STEPS = [
  { id: 1, name: "Basics", icon: VideoCameraIcon },
  { id: 2, name: "Time", icon: CalendarIcon },
  { id: 3, name: "Access", icon: LockClosedIcon },
  { id: 4, name: "Branding", icon: PhotoIcon },
  { id: 5, name: "Content", icon: UserGroupIcon },
  { id: 6, name: "Review", icon: CheckCircleIcon }
];

export default function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form Draft Hook
  const {
    formData,
    updateFormData,
    saveDraft,
    clearDraft
  } = useFormDraft<CreateEventForm>('createEventWizard', {
    ...INITIAL_FORM_STATE,
    organizerDisplayName: user?.name || "",
  });

  // Local Upload States
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingOrgLogo, setUploadingOrgLogo] = useState(false);

  // Speaker Data States
  const [availableSpeakers, setAvailableSpeakers] = useState<Speaker[]>([]);
  const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);
  const [newSpeakerData, setNewSpeakerData] = useState({ name: "", role: "", bio: "", avatar: "" });
  const [creatingSpeaker, setCreatingSpeaker] = useState(false);
  const [uploadingSpeakerAvatar, setUploadingSpeakerAvatar] = useState(false);

  // Load Speakers
  useEffect(() => {
    loadSpeakers();

    // Prevent accidental navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const loadSpeakers = async () => {
    try {
      const speakers = await getAllSpeakers();
      setAvailableSpeakers(speakers);
    } catch (err) {
      console.error("Failed to load speakers", err);
    }
  };

  // --- Handlers ---

  const handleNext = () => {
    // Validation Logic per step
    if (currentStep === 1) {
      if (!formData.title || formData.title.length < 5) return toast.error("Title must be at least 5 chars");
      if (!formData.shortSummary) return toast.error("Short summary is required");
      if (!formData.description) return toast.error("Description is required");
    }
    if (currentStep === 2) {
      if (!formData.startTime || !formData.endTime) return toast.error("Start and End times are required");
      if (new Date(formData.startTime) >= new Date(formData.endTime)) return toast.error("End time must be after start time");
    }
    if (currentStep === 5) {
      if (formData.agendaItems.length === 0) return toast.warning("Ideally add at least one agenda item");
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(curr => curr + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(curr => curr - 1);
    } else {
      // Step 1: Warning before exit - navigating away will logout
      if (window.confirm("Going back will take you to the dashboard. Any unsaved changes will be lost. Continue?")) {
        navigate("/dashboard");
      }
    }
  };

  const handleSaveDraft = () => {
    saveDraft();
    toast.success("Draft saved successfully");
  };

  const handleSubmit = async () => {
    if (!user?.id) return toast.error("User not authenticated");
    setLoading(true);

    try {
      const eventParams: EventData = {
        // Step 1
        title: formData.title,
        shortSummary: formData.shortSummary,
        description: formData.description,
        category: formData.category,
        type: "virtual", // Legacy

        // Step 2
        startTime: formData.startTime,
        endTime: formData.endTime,
        timezone: formData.timezone,

        // Step 3
        visibility: formData.visibility === 'unlisted' ? 'private' : formData.visibility, // Map unlisted to private/public logic if needed, simplifed here
        accessType: formData.accessType,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,

        // Step 4
        coverImage: formData.coverImageUrl,
        organizerDisplayName: formData.organizerDisplayName,
        organizerLogo: formData.organizerLogoUrl,
        brandAccentColor: formData.brandAccentColor,
        organizerId: user.id,

        // Step 5
        agenda: formData.agendaItems,
        speakers: formData.selectedSpeakerIds
      };

      const result = await createEvent(eventParams);
      toast.success("Event Published Successfully!");
      clearDraft();
      navigate(`/dashboard/events/${result.id}`);
    } catch (error) {
      toast.error("Failed to publish event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Upload Handlers ---

  const handleCoverUploadImpl = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) { toast.error(validation.error || "Invalid image"); return; }

    setUploadingCover(true);
    try {
      const { url } = await uploadCoverImage(file);
      updateFormData({ coverImageUrl: url });
      toast.success("Cover uploaded");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleOrgLogoUploadImpl = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid image");
      return;
    }

    setUploadingOrgLogo(true);
    try {
      const { url } = await uploadOrganizerLogo(file);
      updateFormData({ organizerLogoUrl: url });
      toast.success("Logo uploaded");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploadingOrgLogo(false);
    }
  };

  const handleSpeakerAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate using utility
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid image");
      return;
    }

    setUploadingSpeakerAvatar(true);
    try {
      const { url } = await uploadSpeakerImage(file, (progress) => {
        console.log(`Speaker avatar upload progress: ${progress}%`);
      });
      setNewSpeakerData(prev => ({ ...prev, avatar: url }));
      toast.success("Avatar uploaded successfully");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error?.message || "Failed to upload avatar");
    } finally {
      setUploadingSpeakerAvatar(false);
    }
  };

  // --- Agenda Helpers ---
  const updateAgendaItem = (index: number, field: keyof AgendaItem, value: string) => {
    updateFormData(prev => {
      const newItems = [...prev.agendaItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return { agendaItems: newItems };
    });
  };

  const addAgendaItem = () => {
    updateFormData(prev => ({
      agendaItems: [...prev.agendaItems, { startTime: "", endTime: "", title: "", description: "" }]
    }));
  };

  // --- Speaker Helpers ---
  const handleCreateSpeaker = async () => {
    if (!newSpeakerData.name || !newSpeakerData.role) return toast.error("Name & Role required");
    setCreatingSpeaker(true);
    try {
      const newSpeaker = await createGlobalSpeaker(newSpeakerData);

      // Update available speakers list
      setAvailableSpeakers(prev => [...prev, newSpeaker]);

      // Auto-select the newly created speaker
      updateFormData(prev => ({ selectedSpeakerIds: [...prev.selectedSpeakerIds, newSpeaker._id] }));

      // Reset modal state
      setNewSpeakerData({ name: "", role: "", bio: "", avatar: "" });
      setIsSpeakerModalOpen(false);

      // Show success message
      toast.success(`Speaker "${newSpeaker.name}" added successfully!`);

      // Reload all speakers to ensure sync
      await loadSpeakers();
    } catch (error: any) {
      console.error("Speaker creation error:", error);
      toast.error(error?.message || "Failed to add speaker");
    } finally {
      setCreatingSpeaker(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 animate-fade-in pb-32">

      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-dark">Create Event</h1>
          <p className="text-brand-muted text-sm mt-1">Follow the steps to publish your event.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSaveDraft} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
            <BookmarkIcon className="h-4 w-4" /> Save Draft
          </button>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-brand-surface -z-10 rounded-full" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-primary -z-10 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2 cursor-pointer" onClick={() => step.id < currentStep ? setCurrentStep(step.id) : null}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? "border-brand-primary bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-110" :
                    isCompleted ? "border-brand-primary bg-white text-brand-primary" : "border-brand-accent/30 bg-white text-brand-muted"
                    }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`text-xs font-bold ${isActive ? "text-brand-primary" : isCompleted ? "text-brand-dark" : "text-brand-muted"}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Area */}
      <div className="bg-white rounded-2xl border border-brand-accent/10 shadow-xl shadow-brand-dark/5 p-6 lg:p-10 min-h-[400px]">
        {/* Step 1: Basics */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-brand-dark border-b pb-4 mb-4">Event Basics</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">Event Title <span className="text-red-500">*</span></label>
                <input
                  value={formData.title}
                  onChange={e => updateFormData({ title: e.target.value })}
                  className="input-field w-full text-lg"
                  placeholder="e.g. Annual Tech Conference 2024"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">Short Summary <span className="text-red-500">*</span></label>
                <input
                  value={formData.shortSummary}
                  onChange={e => updateFormData({ shortSummary: e.target.value })}
                  className="input-field w-full"
                  placeholder="One sentence pitch..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">Full Description <span className="text-red-500">*</span></label>
                <textarea
                  value={formData.description}
                  onChange={e => updateFormData({ description: e.target.value })}
                  className="input-field w-full"
                  rows={6}
                  placeholder="Detailed description..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => updateFormData({ category: e.target.value })}
                  className="input-field w-full"
                >
                  <option>Webinar</option>
                  <option>Workshop</option>
                  <option>Conference</option>
                  <option>Meetup</option>
                  <option>Panel Discussion</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Time */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-brand-dark border-b pb-4 mb-4">Date, Time & Timezone</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">Start Date & Time <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={e => updateFormData({ startTime: e.target.value })}
                  className="input-field w-full"
                  style={{ colorScheme: 'light' }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">End Date & Time <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={e => updateFormData({ endTime: e.target.value })}
                  className="input-field w-full"
                  style={{ colorScheme: 'light' }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-brand-dark mb-1">Event Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={e => updateFormData({ timezone: e.target.value })}
                  className="input-field w-full"
                >
                  <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>Local ({Intl.DateTimeFormat().resolvedOptions().timeZone})</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (US)</option>
                  <option value="America/Los_Angeles">Pacific Time (US)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Access */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-brand-dark border-b pb-4 mb-4">Visibility & Access Control</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-brand-dark">Visibility</label>
                <div className="space-y-2">
                  {['public', 'unlisted', 'private'].map(opt => (
                    <label key={opt} className={`cursor-pointer p-3 rounded-lg border flex items-start gap-3 transition-colors ${formData.visibility === opt ? "bg-brand-primary/5 border-brand-primary" : "border-brand-accent/20 hover:bg-brand-surface"}`}>
                      <input
                        type="radio"
                        name="visibility"
                        value={opt}
                        checked={formData.visibility === opt}
                        onChange={e => updateFormData({ visibility: e.target.value as any })}
                        className="mt-1"
                      />
                      <span className="capitalize font-bold text-sm text-brand-dark">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-bold text-brand-dark">Access Type</label>
                <div className="space-y-2">
                  {['Free', 'Paid', 'Invite-only'].map(opt => (
                    <label key={opt} className={`cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition-colors ${formData.accessType === opt ? "bg-brand-primary/5 border-brand-primary" : "border-brand-accent/20 hover:bg-brand-surface"}`}>
                      <input
                        type="radio"
                        name="accessType"
                        value={opt}
                        checked={formData.accessType === opt}
                        onChange={e => updateFormData({ accessType: e.target.value as any })}
                      />
                      <span className="text-sm font-bold text-brand-dark">{opt}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-bold text-brand-dark mb-1">Max Capacity (Optional)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={e => updateFormData({ capacity: e.target.value })}
                    className="input-field w-full"
                    placeholder="Unlimited"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Branding */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-brand-dark border-b pb-4 mb-4">Organization Details</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <ImageUploadField
                  label="Cover Image (16:9)"
                  value={formData.coverImageUrl}
                  onChange={(val) => updateFormData({ coverImageUrl: val })}
                  onUpload={handleCoverUploadImpl}
                  uploading={uploadingCover}
                />
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-brand-dark mb-1">Organizer Display Name</label>
                  <input
                    value={formData.organizerDisplayName}
                    onChange={e => updateFormData({ organizerDisplayName: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <ImageUploadField
                    label="Logo / Avatar"
                    value={formData.organizerLogoUrl}
                    onChange={(val) => updateFormData({ organizerLogoUrl: val })}
                    onUpload={handleOrgLogoUploadImpl}
                    uploading={uploadingOrgLogo}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Content (Agenda & Speakers) */}
        {currentStep === 5 && (
          <div className="space-y-8 animate-fade-in">
            {/* Agenda */}
            <div>
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h2 className="text-xl font-bold text-brand-dark">Agenda / Sessions</h2>
                <button type="button" onClick={addAgendaItem} className="text-sm font-bold text-brand-primary flex items-center gap-1 hover:bg-brand-surface px-3 py-1 rounded transition-colors">
                  <PlusIcon className="h-4 w-4" /> Add Session
                </button>
              </div>
              <div className="space-y-4">
                {formData.agendaItems.map((item, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-brand-accent/20 shadow-sm relative hover:border-brand-primary/30 transition-colors">
                    <button onClick={() => {
                      const newItems = [...formData.agendaItems];
                      newItems.splice(idx, 1);
                      updateFormData({ agendaItems: newItems });
                    }} className="absolute top-2 right-2 text-brand-muted hover:text-red-500 p-1">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1 space-y-2">
                        <input type="time" value={item.startTime} onChange={e => updateAgendaItem(idx, 'startTime', e.target.value)} className="input-field text-sm w-full" />
                        <input type="time" value={item.endTime} onChange={e => updateAgendaItem(idx, 'endTime', e.target.value)} className="input-field text-sm w-full" />
                      </div>
                      <div className="md:col-span-3 space-y-2">
                        <input value={item.title} onChange={e => updateAgendaItem(idx, 'title', e.target.value)} className="input-field w-full font-bold" placeholder="Session Title" />
                        <input value={item.description} onChange={e => updateAgendaItem(idx, 'description', e.target.value)} className="input-field w-full text-sm" placeholder="Description..." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Speakers */}
            <div>
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h2 className="text-xl font-bold text-brand-dark">Speakers & Hosts</h2>
                <button type="button" onClick={() => setIsSpeakerModalOpen(true)} className="text-sm font-bold text-brand-primary flex items-center gap-1">
                  <PlusIcon className="h-4 w-4" /> Create New
                </button>
              </div>

              {/* Speakers Section Refactored */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Available Speakers Dropdown */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Select Speakers</h3>
                  <div className="flex gap-2">
                    <select
                      className="input-field flex-1"
                      onChange={(e) => {
                        const speakerId = e.target.value;
                        if (speakerId && !formData.selectedSpeakerIds.includes(speakerId)) {
                          updateFormData({ selectedSpeakerIds: [...formData.selectedSpeakerIds, speakerId] });
                        }
                        e.target.value = ""; // Reset
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Choose a speaker...</option>
                      {availableSpeakers.filter(s => !formData.selectedSpeakerIds.includes(s._id)).map(speaker => (
                        <option key={speaker._id} value={speaker._id}>
                          {speaker.name} ({speaker.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Incident View: Selected Speakers List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Added Speakers ({formData.selectedSpeakerIds.length})</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {formData.selectedSpeakerIds.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No speakers added yet.</p>
                    ) : (
                      formData.selectedSpeakerIds.map(id => {
                        const speaker = availableSpeakers.find(s => s._id === id);
                        if (!speaker) return null;
                        return (
                          <div key={id} className="flex items-center gap-3 p-3 bg-brand-surface rounded-lg border border-brand-accent/10">
                            <div className="h-8 w-8 rounded-full bg-white overflow-hidden shrink-0">
                              {speaker.avatar ? (
                                <img src={speaker.avatar} alt={speaker.name} className="h-full w-full object-cover" />
                              ) : (
                                <UserCircleIcon className="h-full w-full text-brand-muted" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-brand-dark truncate">{speaker.name}</p>
                              <p className="text-xs text-brand-muted truncate">{speaker.role}</p>
                            </div>
                            <button
                              onClick={() => updateFormData({ selectedSpeakerIds: formData.selectedSpeakerIds.filter(sid => sid !== id) })}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Remove Speaker"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review - Same as before */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-brand-dark border-b pb-4 mb-4">Review & Publish</h2>
            <div className="bg-brand-surface/30 rounded-xl p-6 border border-brand-accent/10 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-32 w-56 bg-brand-dark rounded-lg overflow-hidden shrink-0">
                  {formData.coverImageUrl ? <img src={formData.coverImageUrl} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-white/20">No Cover</div>}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-brand-dark">{formData.title}</h3>
                  <div className="flex gap-2 text-sm text-brand-muted mt-1 mb-3">
                    <span className="bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded text-xs font-bold uppercase">{formData.category}</span>
                    <span>•</span>
                    <span>{new Date(formData.startTime).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-brand-dark/80 line-clamp-2">{formData.shortSummary}</p>
                </div>
              </div>
              {/* Stats */}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 text-sm text-yellow-800">
              <EyeIcon className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Ready to go live?</p>
                <p>By publishing, this event will become active immediately.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-accent/20 p-4 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={handleBack}
            // disabled condition removed so we can warn on step 1 too if needed
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-brand-muted hover:bg-brand-surface transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" /> Back
          </button>
          <div className="text-xs font-bold text-brand-muted uppercase tracking-widest hidden sm:block">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}</div>
          <button
            onClick={currentStep === STEPS.length ? handleSubmit : handleNext}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all disabled:opacity-70"
          >
            {loading ? "Processing..." : currentStep === STEPS.length ? "Publish Event" : (<>Next <ChevronRightIcon className="h-5 w-5" /></>)}
          </button>
        </div>
      </div>

      {/* Speaker Creation Modal */}
      <Transition appear show={isSpeakerModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsSpeakerModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-brand-accent/10">
                  <div className="flex justify-between items-center mb-6">
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-brand-dark">
                      Create New Speaker
                    </Dialog.Title>
                    <button onClick={() => setIsSpeakerModalOpen(false)} className="text-brand-muted hover:text-brand-dark">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="shrink-0">
                        <label className="h-20 w-20 rounded-full bg-brand-surface border flex items-center justify-center cursor-pointer overflow-hidden relative hover:border-brand-primary transition-colors">
                          {newSpeakerData.avatar ? (
                            <img src={newSpeakerData.avatar} className="h-full w-full object-cover" />
                          ) : (
                            <UserCircleIcon className="h-10 w-10 text-brand-muted" />
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={handleSpeakerAvatarUpload} />
                          {uploadingSpeakerAvatar && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-4 h-4 border-2 border-brand-primary animate-spin rounded-full border-t-transparent"></div></div>}
                        </label>
                      </div>
                      <div className="flex-1 space-y-3">
                        <input
                          value={newSpeakerData.name}
                          onChange={e => setNewSpeakerData({ ...newSpeakerData, name: e.target.value })}
                          className="input-field w-full text-sm"
                          placeholder="Full Name *"
                        />
                        <input
                          value={newSpeakerData.role}
                          onChange={e => setNewSpeakerData({ ...newSpeakerData, role: e.target.value })}
                          className="input-field w-full text-sm"
                          placeholder="Job Title *"
                        />
                      </div>
                    </div>
                    <textarea
                      value={newSpeakerData.bio}
                      onChange={e => setNewSpeakerData({ ...newSpeakerData, bio: e.target.value })}
                      className="input-field w-full text-sm"
                      rows={3}
                      placeholder="Short Bio..."
                    />
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button type="button" onClick={() => setIsSpeakerModalOpen(false)} className="btn-secondary flex-1">
                      Cancel
                    </button>
                    <button type="button" onClick={handleCreateSpeaker} disabled={creatingSpeaker} className="btn-primary flex-1 font-bold">
                      {creatingSpeaker ? "Saving..." : "Save Speaker"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}