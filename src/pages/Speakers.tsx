import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { PlusIcon, UserGroupIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { getAllSpeakers, getEventById, createGlobalSpeaker, uploadSpeakerImage } from "../services/api";
import type { Speaker } from "../services/api";
import { useFormDraft } from "../hooks/useFormDraft";

interface SpeakerForm {
  name: string;
  role: string;
  bio: string;
  avatar: string;
}

const INITIAL_SPEAKER_FORM: SpeakerForm = { name: "", role: "", bio: "", avatar: "" };

export default function Speakers() {
  const { eventId } = useParams<{ eventId: string }>();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);

  // For "Add Speaker" modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Use Form Draft for persistence
  const {
    formData: newSpeakerData,
    updateFormData,
    clearDraft,
    isDirty
  } = useFormDraft<SpeakerForm>('createSpeakerDraft', INITIAL_SPEAKER_FORM);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (eventId) {
        // Event Context
        const eventData = await getEventById(eventId);
        // Cast as any because we know we populated it, even if TS interface says string[] | Speaker[]
        const eventSpeakers = (eventData.speakers || []) as unknown as Speaker[];
        // Filter out strings if mixed (safety)
        const validSpeakers = eventSpeakers.filter(s => typeof s !== 'string');
        setSpeakers(validSpeakers);
      } else {
        // Global Context
        const allSpeakers = await getAllSpeakers();
        setSpeakers(allSpeakers);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load speakers");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Discard them?")) {
        setShowAddModal(false);
        clearDraft();
      }
    } else {
      setShowAddModal(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { url } = await uploadSpeakerImage(file);
      updateFormData({ avatar: url });
      toast.success("Avatar uploaded");
    } catch (error) {
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCreateSpeaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeakerData.name || !newSpeakerData.role) return toast.error("Name and Role required");

    setIsCreating(true);
    try {
      // 1. Create Global Speaker
      const createdSpeaker = await createGlobalSpeaker({ ...newSpeakerData } as any);

      // 2. If in Event Context, attach it (Logic placeholder as before)
      if (eventId) {
        // Placeholder for future attach logic
      }

      setSpeakers([...speakers, createdSpeaker]);
      setShowAddModal(false);
      clearDraft(); // Clear draft on success
      toast.success("Speaker added successfully");

    } catch (error) {
      toast.error("Failed to add speaker");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-dark mb-2">
            {eventId ? "Event Speakers" : "Speaker Directory"}
          </h1>
          <p className="text-brand-muted">
            {eventId ? "Manage speakers for this event." : "Global list of all speakers."}
          </p>
        </div>
        {!eventId && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary py-2 px-4 flex items-center gap-2 font-bold"
          >
            <PlusIcon className="h-4 w-4" /> Add Speaker
          </button>
        )}
      </header>

      {loading ? (
        <div className="p-12 text-center text-brand-muted">Loading speakers...</div>
      ) : speakers.length === 0 ? (
        <div className="card p-12 text-center text-brand-muted border-dashed border-2 border-brand-accent/30">
          <UserGroupIcon className="h-12 w-12 text-brand-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold text-brand-dark">No speakers found</h3>
          <p className="text-brand-muted">Get started by adding a new speaker.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((speaker) => (
            <div key={speaker._id} className="card p-0 overflow-hidden hover:shadow-lg transition-all group ring-1 ring-brand-accent/5">
              <div className="h-32 bg-brand-primary/10 relative">
                <div className="absolute -bottom-10 left-6">
                  <img
                    src={speaker.avatar || `https://ui-avatars.com/api/?name=${speaker.name}&background=random`}
                    alt={speaker.name}
                    className="h-20 w-20 rounded-xl border-4 border-white object-cover shadow-md"
                  />
                </div>
              </div>
              <div className="pt-12 p-6">
                <h3 className="font-bold text-xl text-brand-dark mb-1">{speaker.name}</h3>
                <span className="inline-block px-2 py-1 bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-lg mb-4">
                  {speaker.role}
                </span>
                <p className="text-sm text-brand-muted line-clamp-3 mb-4">
                  {speaker.bio}
                </p>
                <div className="text-xs text-brand-muted font-mono">
                  ID: {speaker._id}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Speaker Modal (Simplified) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-up">
            <h3 className="text-lg font-bold text-brand-dark mb-4">Add New Speaker</h3>
            <form onSubmit={handleCreateSpeaker} className="space-y-4">
              <div className="flex justify-center mb-6">
                <label className="relative cursor-pointer group">
                  <div className="h-24 w-24 rounded-full border-2 border-brand-accent/30 bg-brand-surface flex items-center justify-center overflow-hidden">
                    {newSpeakerData.avatar ? (
                      <img src={newSpeakerData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <UserCircleIcon className="h-12 w-12 text-brand-muted" />
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">Upload</span>
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-white/80 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>

              <input
                placeholder="Name *"
                className="input-field w-full"
                value={newSpeakerData.name}
                onChange={e => updateFormData({ name: e.target.value })}
              />
              <input
                placeholder="Role *"
                className="input-field w-full"
                value={newSpeakerData.role}
                onChange={e => updateFormData({ role: e.target.value })}
              />
              <textarea
                placeholder="Bio *"
                className="input-field w-full"
                rows={3}
                value={newSpeakerData.bio}
                onChange={e => updateFormData({ bio: e.target.value })}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 font-bold text-brand-muted">Cancel</button>
                <button type="submit" className="btn-primary py-2 px-6 font-bold" disabled={isCreating}>
                  {isCreating ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
