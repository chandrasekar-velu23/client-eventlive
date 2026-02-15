import { Fragment, useState } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserCircleIcon, PlusIcon, TagIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { createGlobalSpeaker, uploadSpeakerImage, validateImageFile } from "../services/api";
import type { Speaker } from "../services/api";

// Re-using TagInput locally or importing if it was exported. 
// larger refactoring would move TagInput to shared components, 
// for now, I'll include a simple version here or assume it's available.
// To keep it self-contained and clean without modifying too many files, I'll use a local version.

const TagInput = ({ tags, onChange, placeholder = "Add tags..." }: { tags: string[]; onChange: (tags: string[]) => void; placeholder?: string }) => {
    const [input, setInput] = useState("");
    const safeTags = tags || [];

    const addTag = () => {
        const trimmed = input.trim();
        if (trimmed && !safeTags.includes(trimmed)) {
            onChange([...safeTags, trimmed]);
            setInput("");
        }
    };

    const removeTag = (index: number) => {
        onChange(safeTags.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                        }
                    }}
                    placeholder={placeholder}
                    className="input-field flex-1 text-sm"
                />
                <button type="button" onClick={addTag} className="btn-secondary px-4 py-2 text-sm font-semibold">
                    <PlusIcon className="h-4 w-4" />
                </button>
            </div>
            {safeTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {safeTags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-semibold">
                            <TagIcon className="h-3 w-3" />
                            {tag}
                            <button type="button" onClick={() => removeTag(idx)} className="ml-1 hover:text-red-500">
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

interface CreateSpeakerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newSpeaker: Speaker) => void;
}

const INITIAL_SPEAKER_STATE = {
    name: "",
    role: "",
    bio: "",
    avatar: "",
    email: "",
    tags: [] as string[],
    labels: [] as string[],
    socialLinks: {
        linkedin: "",
        twitter: "",
        website: ""
    }
};

export default function CreateSpeakerModal({ isOpen, onClose, onSuccess }: CreateSpeakerModalProps) {
    const [newSpeakerData, setNewSpeakerData] = useState(INITIAL_SPEAKER_STATE);
    const [creatingSpeaker, setCreatingSpeaker] = useState(false);
    const [uploadingSpeakerAvatar, setUploadingSpeakerAvatar] = useState(false);

    const handleSpeakerAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            toast.error(validation.error || "Invalid image");
            return;
        }

        setUploadingSpeakerAvatar(true);
        try {
            const { url } = await uploadSpeakerImage(file);
            setNewSpeakerData(prev => ({ ...prev, avatar: url }));
            toast.success("Avatar uploaded successfully");
        } catch (error: any) {
            toast.error(error?.message || "Failed to upload avatar");
        } finally {
            setUploadingSpeakerAvatar(false);
        }
    };

    const handleCreateSpeaker = async () => {
        if (!newSpeakerData.name || !newSpeakerData.role) {
            toast.error("Name & Role are required");
            return;
        }

        setCreatingSpeaker(true);
        try {
            const newSpeaker = await createGlobalSpeaker(newSpeakerData);

            // Allow parent to handle the new data
            onSuccess(newSpeaker);

            // Reset and close
            setNewSpeakerData(INITIAL_SPEAKER_STATE);
            onClose();

            // Success message handled by parent or here? keeping it here is nice for immediate feedback
            // toast.success(`Speaker "${newSpeaker.name}" created!`);
        } catch (error: any) {
            console.error("Speaker creation error:", error);
            if (error.message?.includes('Unauthorized') || error.message?.includes('token')) {
                toast.error("Session expired. Please log in again.");
                // We don't navigate here to keep component pure-ish, let usage handle auth ideally
            } else {
                toast.error(error?.message || "Failed to create speaker");
            }
        } finally {
            setCreatingSpeaker(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all border border-brand-accent/10">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-brand-dark">
                                        Create New Speaker
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-brand-muted hover:text-brand-dark transition-colors">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Avatar Upload */}
                                    <div className="flex justify-center">
                                        <label className="relative cursor-pointer group">
                                            <div className="h-24 w-24 rounded-full border-2 border-brand-accent/30 bg-brand-surface flex items-center justify-center overflow-hidden">
                                                {newSpeakerData.avatar ? (
                                                    <img src={newSpeakerData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                                                ) : (
                                                    <UserCircleIcon className="h-16 w-16 text-brand-muted" />
                                                )}
                                            </div>
                                            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-xs font-bold">Upload</span>
                                            </div>
                                            {uploadingSpeakerAvatar && (
                                                <div className="absolute inset-0 rounded-full bg-white/80 flex items-center justify-center">
                                                    <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleSpeakerAvatarUpload} />
                                        </label>
                                    </div>

                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-brand-dark mb-1">Full Name <span className="text-red-500">*</span></label>
                                            <input
                                                value={newSpeakerData.name}
                                                onChange={e => setNewSpeakerData({ ...newSpeakerData, name: e.target.value })}
                                                className="input-field w-full"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-brand-dark mb-1">Job Title <span className="text-red-500">*</span></label>
                                            <input
                                                value={newSpeakerData.role}
                                                onChange={e => setNewSpeakerData({ ...newSpeakerData, role: e.target.value })}
                                                className="input-field w-full"
                                                placeholder="CEO, Tech Corp"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={newSpeakerData.email}
                                            onChange={e => setNewSpeakerData({ ...newSpeakerData, email: e.target.value })}
                                            className="input-field w-full"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-1">Bio</label>
                                        <textarea
                                            value={newSpeakerData.bio}
                                            onChange={e => setNewSpeakerData({ ...newSpeakerData, bio: e.target.value })}
                                            className="input-field w-full"
                                            rows={3}
                                            placeholder="Short bio about the speaker..."
                                        />
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">Tags</label>
                                        <TagInput
                                            tags={newSpeakerData.tags}
                                            onChange={(tags) => setNewSpeakerData({ ...newSpeakerData, tags })}
                                            placeholder="e.g. AI Expert, Keynote Speaker..."
                                        />
                                    </div>

                                    {/* Labels */}
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">Labels</label>
                                        <TagInput
                                            tags={newSpeakerData.labels}
                                            onChange={(labels) => setNewSpeakerData({ ...newSpeakerData, labels })}
                                            placeholder="e.g. Featured, Industry Leader..."
                                        />
                                    </div>

                                    {/* Social Links */}
                                    <div>
                                        <label className="block text-sm font-bold text-brand-dark mb-2">Social Links</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            <input
                                                type="url"
                                                value={newSpeakerData.socialLinks.linkedin}
                                                onChange={e => setNewSpeakerData({ ...newSpeakerData, socialLinks: { ...newSpeakerData.socialLinks, linkedin: e.target.value } })}
                                                className="input-field w-full text-sm"
                                                placeholder="LinkedIn URL"
                                            />
                                            <input
                                                type="url"
                                                value={newSpeakerData.socialLinks.twitter}
                                                onChange={e => setNewSpeakerData({ ...newSpeakerData, socialLinks: { ...newSpeakerData.socialLinks, twitter: e.target.value } })}
                                                className="input-field w-full text-sm"
                                                placeholder="Twitter/X URL"
                                            />
                                            <input
                                                type="url"
                                                value={newSpeakerData.socialLinks.website}
                                                onChange={e => setNewSpeakerData({ ...newSpeakerData, socialLinks: { ...newSpeakerData.socialLinks, website: e.target.value } })}
                                                className="input-field w-full text-sm"
                                                placeholder="Website URL"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Info Banner */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 items-start mt-6">
                                    <div className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" >
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> This speaker will be automatically added to your event after creation.
                                    </p>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={handleCreateSpeaker} disabled={creatingSpeaker} className="btn-primary flex-1 font-bold py-3">
                                        {creatingSpeaker ? "Creating..." : "Create & Add Speaker"}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
