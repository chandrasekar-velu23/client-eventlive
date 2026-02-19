import { useState, useEffect, Fragment, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import { createGlobalSpeaker, getAllSpeakers } from "../services/api";
import { uploadCoverImage, uploadSpeakerImage, uploadOrganizerLogo, validateImageFile } from "../utils/imageUpload";
import { getImageUrl } from "../utils/urlHelpers";
import { localToUTC } from "../utils/date";
import type { Speaker, AgendaItem, EventData } from "../services/api";
import { toast } from "sonner";
import { Dialog, Transition } from '@headlessui/react';
import TimezoneSelect from 'react-timezone-select';
import {
    CalendarIcon,
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
    XMarkIcon,
    CloudArrowUpIcon,
    BuildingOfficeIcon,
    VideoCameraIcon,
    LockClosedIcon
} from "@heroicons/react/24/outline";
import { useFormDraft } from "../hooks/useFormDraft";

// UI Components
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Textarea from "../components/ui/Textarea";
import Select from "../components/ui/Select";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CreateEventForm {
    // Step 1: Basics
    title: string;
    shortSummary: string;
    description: string;
    category: string;
    tags: string[];

    // Step 2: Date & Time
    startTime: string;
    endTime: string;
    timezone: string;

    // Step 3: Visibility & Access
    visibility: 'public' | 'private';
    accessType: 'Free' | 'Invite-only';
    capacity: string;

    // Step 4: Organizer Details
    coverImageUrl: string;
    organizerDisplayName: string;
    organizerLogoUrl: string;
    organizerWebsite: string;
    organizerEmail: string;
    organizerPhone: string;
    organizerDescription: string;
    brandAccentColor: string;

    // Step 5: Agenda & Speakers
    agendaItems: AgendaItem[];
    selectedSpeakerIds: string[];
}

interface SpeakerFormData {
    name: string;
    role: string;
    bio: string;
    avatar: string;
    email: string;
    tags: string[];
    labels: string[];
    socialLinks: {
        linkedin: string;
        twitter: string;
        website: string;
    };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_FORM_STATE: CreateEventForm = {
    title: "",
    shortSummary: "",
    description: "",
    category: "Webinar",
    tags: [],

    startTime: "",
    endTime: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    visibility: "public",
    accessType: "Free",
    capacity: "",

    coverImageUrl: "",
    organizerDisplayName: "",
    organizerLogoUrl: "",
    organizerWebsite: "",
    organizerEmail: "",
    organizerPhone: "",
    organizerDescription: "",
    brandAccentColor: "#4F46E5", // Default to brand-primary

    agendaItems: [],
    selectedSpeakerIds: []
};

const INITIAL_SPEAKER_STATE: SpeakerFormData = {
    name: "",
    role: "",
    bio: "",
    avatar: "",
    email: "",
    tags: [],
    labels: [],
    socialLinks: {
        linkedin: "",
        twitter: "",
        website: ""
    }
};

const STEPS = [
    { id: 1, name: "Basics", icon: VideoCameraIcon },
    { id: 2, name: "Time", icon: CalendarIcon },
    { id: 3, name: "Access", icon: LockClosedIcon },
    { id: 4, name: "Organizer", icon: BuildingOfficeIcon },
    { id: 5, name: "Content", icon: UserGroupIcon },
    { id: 6, name: "Review", icon: CheckCircleIcon }
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

// ============================================================================
// DRAG & DROP FILE UPLOAD COMPONENT
// ============================================================================

const DragDropFileUpload = ({
    label,
    value,
    onChange,
    onUpload,
    uploading,
    aspectRatio = "16/9",
    error
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    onUpload: (file: File) => Promise<void>;
    uploading: boolean;
    aspectRatio?: string;
    error?: string | null;
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [mode, setMode] = useState<'upload' | 'link'>('upload');
    const dragCounter = useRef(0);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === "dragenter") {
            dragCounter.current += 1;
            if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
                setDragActive(true);
            }
        } else if (e.type === "dragleave") {
            dragCounter.current -= 1;
            if (dragCounter.current === 0) {
                setDragActive(false);
            }
        } else if (e.type === "dragover") {
            // Essential to allow dropping
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        dragCounter.current = 0;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                toast.error("Please upload a valid image file (JPEG, PNG, WebP)");
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File size must be less than 5MB");
                return;
            }
            onUpload(file);
        }
    }, [onUpload]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                toast.error("Please upload a valid image file (JPEG, PNG, WebP)");
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File size must be less than 5MB");
                return;
            }
            onUpload(file);
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-muted">{label}</label>

            {/* Preview */}
            <div
                className={`w-full max-w-2xl rounded-xl bg-bg-secondary/50 overflow-hidden border-2 border-dashed relative group transition-all duration-200
                    ${dragActive ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-accent hover:border-brand-300'}`}
                style={{ aspectRatio }}
            >
                {value ? (
                    <div className="relative h-full w-full group">
                        <img
                            src={getImageUrl(value, "https://via.placeholder.com/800x450?text=Preview")}
                            alt="Preview"
                            className="h-full w-full object-cover"
                            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/800x450?text=Error")}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-bold">Replace Image</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-muted p-8">
                        <CloudArrowUpIcon className="h-12 w-12 mb-3 opacity-50 text-brand-500" />
                        <span className="text-sm font-semibold">Drag & drop or click to upload</span>
                        <span className="text-xs mt-1 opacity-60">Max 5MB • JPEG, PNG, WebP</span>
                    </div>
                )}
                {uploading && (
                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-20">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-bold text-brand-600">Uploading...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 text-sm">
                <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className={`font-semibold transition-colors ${mode === 'upload' ? 'text-brand-600 underline decoration-2' : 'text-muted hover:text-text-primary'}`}
                >
                    Upload File
                </button>
                <button
                    type="button"
                    onClick={() => setMode('link')}
                    className={`font-semibold transition-colors ${mode === 'link' ? 'text-brand-600 underline decoration-2' : 'text-muted hover:text-text-primary'}`}
                >
                    Image URL
                </button>
            </div>

            {mode === 'upload' ? (
                <div
                    className="relative"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <Button type="button" variant="secondary" className="w-full flex items-center justify-center gap-2">
                        <PhotoIcon className="h-5 w-5" /> Choose File
                    </Button>
                </div>
            ) : (
                <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

// ============================================================================
// TAG INPUT COMPONENT
// ============================================================================

const TagInput = ({
    tags,
    onChange,
    placeholder = "Add tags...",
    label,
    error
}: {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    label?: string;
    error?: string;
}) => {
    const [input, setInput] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Defensive: ensure tags is always an array
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
        <div className="relative w-full group">
            <div
                className={`min-h-[56px] w-full rounded-xl bg-bg-secondary/50 px-4 py-3 transition-all duration-200 shadow-sm ring-1 ring-inset
                    ${error ? "ring-red-500" : isFocused ? "ring-2 ring-brand-primary/20 bg-white" : "ring-brand-accent/50 hover:ring-brand-accent"}
                `}
            >
                <div className="flex flex-wrap gap-2">
                    {safeTags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-primary/10 text-brand-700 rounded-md text-xs font-bold border border-brand-primary/20 animate-fade-in">
                            {tag}
                            <button type="button" onClick={() => removeTag(idx)} className="hover:text-red-500 transition-colors">
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <div className="flex-1 min-w-[120px] flex gap-2">
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
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => {
                                setIsFocused(false);
                                addTag(); // Auto-add on blur
                            }}
                            placeholder={safeTags.length === 0 ? (label || placeholder) : placeholder}
                            className="bg-transparent outline-none w-full text-text-primary text-sm placeholder:text-transparent"
                        />
                        <button type="button" onClick={addTag} className={`${input ? 'opacity-100' : 'opacity-0'} transition-opacity text-brand-primary`}>
                            <PlusIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {label && (
                <label className={`absolute left-4 transition-all duration-200 pointer-events-none text-text-secondary/70
                    ${(isFocused || safeTags.length > 0 || input)
                        ? "-top-2.5 text-xs bg-bg-secondary px-2 rounded text-brand-primary"
                        : "top-3.5 text-sm"}
                    ${error ? "text-red-500" : ""}
                `}>
                    {label}
                </label>
            )}

            {error && <p className="mt-1 text-xs text-red-500 pl-1 font-medium">{error}</p>}
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreateEvent() {
    // ========== HOOKS ==========
    const { user } = useAuth();
    const navigate = useNavigate();
    const { createEvent } = useEvents();

    // ========== STATE ==========
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Form Draft Hook
    const { formData, updateFormData, saveDraft, clearDraft } = useFormDraft<CreateEventForm>('createEventWizard', {
        ...INITIAL_FORM_STATE,
        organizerDisplayName: user?.name || "",
        organizerEmail: user?.email || "",
    });

    // Upload States
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingOrgLogo, setUploadingOrgLogo] = useState(false);

    // Speaker States
    const [availableSpeakers, setAvailableSpeakers] = useState<Speaker[]>([]);
    const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);
    const [newSpeakerData, setNewSpeakerData] = useState<SpeakerFormData>(INITIAL_SPEAKER_STATE);
    const [creatingSpeaker, setCreatingSpeaker] = useState(false);
    const [uploadingSpeakerAvatar, setUploadingSpeakerAvatar] = useState(false);

    // ========== EFFECTS ==========
    useEffect(() => {
        loadSpeakers();

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // ========== DATA LOADING ==========
    const loadSpeakers = async () => {
        try {
            const speakers = await getAllSpeakers();
            setAvailableSpeakers(speakers);
        } catch (err) {
            console.error("Failed to load speakers", err);
        }
    };

    // ========== VALIDATION ==========
    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                if (!formData.title || formData.title.length < 5) {
                    toast.error("Title must be at least 5 characters");
                    return false;
                }
                if (!formData.shortSummary) {
                    toast.error("Short summary is required");
                    return false;
                }
                if (!formData.description) {
                    toast.error("Description is required");
                    return false;
                }
                return true;

            case 2:
                if (!formData.startTime || !formData.endTime) {
                    toast.error("Start and End times are required");
                    return false;
                }
                if (new Date(formData.startTime) >= new Date(formData.endTime)) {
                    toast.error("End time must be after start time");
                    return false;
                }
                return true;

            case 4:
                // Organizer Details Validation
                if (!formData.organizerDisplayName) {
                    toast.error("Organizer Name is required");
                    return false;
                }
                if (!formData.organizerEmail) {
                    toast.error("Organizer Email is required");
                    return false;
                }
                return true;

            case 5:
                if (formData.agendaItems.length === 0) {
                    toast.warning("Consider adding at least one agenda item");
                }
                return true;

            default:
                return true;
        }
    };

    // ========== NAVIGATION HANDLERS ==========
    const handleNext = () => {
        if (!validateStep(currentStep)) return;

        if (currentStep < STEPS.length) {
            setCurrentStep(curr => curr + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(curr => curr - 1);
        } else {
            if (window.confirm("Going back will take you to the dashboard. Any unsaved changes will be lost. Continue?")) {
                navigate("/dashboard");
            }
        }
    };

    const handleSaveDraft = () => {
        saveDraft();
        toast.success("Draft saved successfully");
    };

    // ========== SUBMIT HANDLER ==========
    const handleSubmit = async () => {
        if (!user?.id) {
            toast.error("User not authenticated");
            return;
        }

        setLoading(true);

        try {
            // Convert local time inputs to UTC strings based on selected timezone
            // This ensures backend receives the exact absolute time the user intended
            const utcStartTime = localToUTC(formData.startTime.split('T')[0], formData.startTime.split('T')[1], formData.timezone);
            const utcEndTime = localToUTC(formData.endTime.split('T')[0], formData.endTime.split('T')[1], formData.timezone);

            if (!utcStartTime || !utcEndTime) {
                toast.error("Invalid date or time selection");
                setLoading(false);
                return;
            }

            // Ensure start time is before end time (using UTC comparison)
            if (new Date(utcStartTime) >= new Date(utcEndTime)) {
                toast.error("End time must be after start time");
                setLoading(false);
                return;
            }

            const eventParams: EventData = {
                // Step 1
                title: formData.title,
                shortSummary: formData.shortSummary,
                description: formData.description,
                category: formData.category,
                tags: formData.tags,
                type: "virtual",

                // Step 2
                startTime: utcStartTime,
                endTime: utcEndTime,
                timezone: formData.timezone,

                // Step 3
                visibility: formData.visibility,
                accessType: formData.accessType,
                capacity: formData.capacity ? parseInt(formData.capacity) : undefined,

                // Step 4
                coverImage: formData.coverImageUrl,
                organizerDisplayName: formData.organizerDisplayName,
                organizerLogo: formData.organizerLogoUrl,
                organizerWebsite: formData.organizerWebsite,
                organizerEmail: formData.organizerEmail,
                organizerPhone: formData.organizerPhone,
                organizerDescription: formData.organizerDescription,
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
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to publish event. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ========== UPLOAD HANDLERS ==========
    const handleCoverUpload = async (file: File) => {
        const validation = validateImageFile(file);
        if (!validation.valid) {
            toast.error(validation.error || "Invalid image");
            return;
        }

        setUploadingCover(true);
        try {
            const { url } = await uploadCoverImage(file);
            updateFormData({ coverImageUrl: url });
            toast.success("Cover uploaded successfully");
        } catch (error) {
            console.error("Cover upload error:", error);
            toast.error("Upload failed");
        } finally {
            setUploadingCover(false);
        }
    };

    const handleOrgLogoUpload = async (file: File) => {
        const validation = validateImageFile(file);
        if (!validation.valid) {
            toast.error(validation.error || "Invalid image");
            return;
        }

        setUploadingOrgLogo(true);
        try {
            const { url } = await uploadOrganizerLogo(file);
            updateFormData({ organizerLogoUrl: url });
            toast.success("Logo uploaded successfully");
        } catch (error) {
            console.error("Logo upload error:", error);
            toast.error("Upload failed");
        } finally {
            setUploadingOrgLogo(false);
        }
    };

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
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to upload avatar");
        } finally {
            setUploadingSpeakerAvatar(false);
        }
    };

    // ========== AGENDA HELPERS ==========
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

    const removeAgendaItem = (index: number) => {
        updateFormData(prev => ({
            agendaItems: prev.agendaItems.filter((_, i) => i !== index)
        }));
    };

    // ========== SPEAKER HELPERS ==========
    const handleCreateSpeaker = async () => {
        if (!newSpeakerData.name || !newSpeakerData.role) {
            toast.error("Name & Role are required");
            return;
        }

        // Check if user is authenticated
        if (!user?.id) {
            toast.error("You must be logged in to create speakers");
            setIsSpeakerModalOpen(false);
            navigate('/login');
            return;
        }

        setCreatingSpeaker(true);
        try {
            // Create speaker via API
            const newSpeaker = await createGlobalSpeaker(newSpeakerData);
            // Immediately update available speakers list
            setAvailableSpeakers(prev => [...prev, newSpeaker]);
            // Automatically add the newly created speaker to the event
            updateFormData({ selectedSpeakerIds: [...formData.selectedSpeakerIds, newSpeaker._id] });
            // Reset form and close modal
            setNewSpeakerData(INITIAL_SPEAKER_STATE);
            setIsSpeakerModalOpen(false);
            toast.success(`Speaker "${newSpeaker.name}" created and added to event!`);
        } catch (error) {
            console.error("Speaker creation error:", error);
            const message = error instanceof Error ? error.message : "Failed to create speaker";
            if (message.includes('Unauthorized') || message.includes('token')) {
                toast.error("Session expired. Please log in again.");
                navigate('/login');
            } else if (message.includes('Unable to connect')) {
                toast.error("Cannot connect to server. Please ensure the backend is running.");
            } else {
                toast.error(message);
            }
        } finally {
            setCreatingSpeaker(false);
        }
    };

    const addSpeaker = (speakerId: string) => {
        if (!formData.selectedSpeakerIds.includes(speakerId)) {
            const speaker = availableSpeakers.find(s => s._id === speakerId);
            updateFormData({ selectedSpeakerIds: [...formData.selectedSpeakerIds, speakerId] });
            if (speaker) {
                toast.success(`${speaker.name} added to event!`);
            }
        }
    };

    const removeSpeaker = (speakerId: string) => {
        const speaker = availableSpeakers.find(s => s._id === speakerId);
        updateFormData({ selectedSpeakerIds: formData.selectedSpeakerIds.filter(id => id !== speakerId) });
        if (speaker) {
            toast.info(`${speaker.name} removed from event`);
        }
    };

    // ========== RENDER ==========
    return (
        <div className="max-w-5xl mx-auto p-4 lg:p-8 animate-fade-in pb-32">
            {/* Header */}
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-text-primary">Create Event</h1>
                    <p className="text-muted mt-1">Follow the steps to publish your event.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleSaveDraft} className="text-sm px-4 flex items-center gap-2">
                        <BookmarkIcon className="h-4 w-4" /> Save Draft
                    </Button>
                </div>
            </header>

            {/* Progress Steps */}
            <div className="mb-10 overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex items-center justify-between relative min-w-[600px]">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-200 -z-10 rounded-full" />
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-600 -z-10 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        return (
                            <button
                                key={step.id}
                                className="flex flex-col items-center gap-2 bg-transparent px-2 group focus:outline-none"
                                onClick={() => step.id < currentStep ? setCurrentStep(step.id) : null}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${isActive ? "border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-500/30 scale-110" :
                                        isCompleted ? "border-brand-600 bg-white text-brand-600" : "border-surface-200 bg-white text-muted group-hover:border-surface-300"
                                        }`}
                                >
                                    <step.icon className="h-5 w-5" />
                                </div>
                                <span className={`text-xs font-bold transition-colors ${isActive ? "text-brand-700" : isCompleted ? "text-text-primary" : "text-muted"}`}>
                                    {step.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Form Area */}
            <div className="card p-6 lg:p-10 min-h-[500px]">
                {/* Step 1: Basics */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="border-b border-surface-200 pb-4 mb-6">
                            <h2 className="text-xl font-bold font-display text-text-primary">Event Basics</h2>
                            <p className="text-sm text-muted">Let's start with the core details of your event.</p>
                        </div>

                        <div className="space-y-6">
                            <Input
                                label="Event Title *"
                                value={formData.title}
                                onChange={e => updateFormData({ title: e.target.value })}
                                placeholder="e.g. Annual Tech Conference 2024"
                                autoFocus
                                maxLength={100}
                                error={!formData.title && formData.title !== "" ? "Title is required" : undefined}
                            />

                            <Input
                                label="Short Summary *"
                                value={formData.shortSummary}
                                onChange={e => updateFormData({ shortSummary: e.target.value })}
                                placeholder="A catchy one-sentence pitch..."
                                maxLength={200}
                            />

                            <Textarea
                                label="Full Description *"
                                value={formData.description}
                                onChange={e => updateFormData({ description: e.target.value })}
                                rows={6}
                                placeholder="Provide detailed information about what attendees can expect..."
                                maxLength={2000}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Select
                                    label="Category"
                                    value={formData.category}
                                    onChange={e => updateFormData({ category: e.target.value })}
                                >
                                    <option>Webinar</option>
                                    <option>Workshop</option>
                                    <option>Conference</option>
                                    <option>Meetup</option>
                                    <option>Discussion</option>
                                </Select>

                                <TagInput
                                    label="Tags"
                                    tags={formData.tags}
                                    onChange={(tags) => updateFormData({ tags })}
                                    placeholder="e.g. AI, Technology..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Time */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="border-b border-surface-200 pb-4 mb-6">
                            <h2 className="text-xl font-bold font-display text-default">Date & Time</h2>
                            <p className="text-sm text-muted">When will your event take place?</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input
                                type="datetime-local"
                                label="Start Date & Time *"
                                value={formData.startTime}
                                onChange={e => updateFormData({ startTime: e.target.value })}
                                style={{ colorScheme: 'light' }}
                            />

                            <Input
                                type="datetime-local"
                                label="End Date & Time *"
                                value={formData.endTime}
                                onChange={e => updateFormData({ endTime: e.target.value })}
                                style={{ colorScheme: 'light' }}
                            />

                            <div className="md:col-span-2 relative w-full group">
                                <div className="rounded-xl border border-brand-accent bg-bg-secondary/50 p-1 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all duration-200">
                                    <TimezoneSelect
                                        value={formData.timezone}
                                        onChange={(tz) => updateFormData({ timezone: tz.value })}
                                        className="timezone-select-container"
                                        classNames={{
                                            control: () => "!border-0 !shadow-none !bg-transparent !min-h-[44px]",
                                            menu: () => "!bg-bg-primary !shadow-xl !rounded-xl !border !border-brand-accent !mt-2",
                                            option: ({ isFocused }) => isFocused ? "!bg-brand-50 !text-brand-primary" : "!text-text-primary",
                                            singleValue: () => "!text-text-primary",
                                            placeholder: () => "!text-text-secondary/60"
                                        }}
                                    />
                                </div>
                                <label className="absolute -top-2.5 left-4 text-xs bg-bg-secondary px-2 rounded text-brand-primary font-medium pointer-events-none transition-all">
                                    Event Timezone
                                </label>
                                <p className="text-xs text-text-secondary mt-1 pl-1">Attendees will see times converted to their local timezone automatically.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Access */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="border-b border-surface-200 pb-4 mb-6">
                            <h2 className="text-xl font-bold font-display text-default">Visibility & Access</h2>
                            <p className="text-sm text-muted">Control who can see and join your event.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-text-primary">Visibility</label>
                                <div className="space-y-3">
                                    {[
                                        { value: 'public', label: 'Public', desc: 'Anyone can discover and join' },
                                        { value: 'private', label: 'Private', desc: 'Only invited attendees can join' }
                                    ].map(opt => (
                                        <label key={opt.value} className={`cursor-pointer p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 shadow-sm
                                            ${formData.visibility === opt.value
                                                ? "bg-brand-primary/5 border-brand-primary ring-1 ring-brand-primary/20"
                                                : "bg-bg-secondary/50 border-brand-accent hover:border-brand-300 hover:bg-bg-secondary"}`}>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                                ${formData.visibility === opt.value ? "border-brand-primary bg-brand-primary" : "border-brand-400 bg-transparent"}`}>
                                                {formData.visibility === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-bold text-sm text-text-primary block">{opt.label}</span>
                                                <span className="text-xs text-text-secondary">{opt.desc}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-text-primary">Access Type</label>
                                <div className="space-y-3">
                                    {[
                                        { value: 'Free', label: 'Free', desc: 'No payment required' },
                                        { value: 'Invite-only', label: 'Invite-only', desc: 'Requires invitation code' }
                                    ].map(opt => (
                                        <label key={opt.value} className={`cursor-pointer p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 shadow-sm
                                            ${formData.accessType === opt.value
                                                ? "bg-brand-primary/5 border-brand-primary ring-1 ring-brand-primary/20"
                                                : "bg-bg-secondary/50 border-brand-accent hover:border-brand-300 hover:bg-bg-secondary"}`}>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                                ${formData.accessType === opt.value ? "border-brand-primary bg-brand-primary" : "border-brand-400 bg-transparent"}`}>
                                                {formData.accessType === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-bold text-sm text-text-primary block">{opt.label}</span>
                                                <span className="text-xs text-text-secondary">{opt.desc}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <div className="pt-2">
                                    <Input
                                        type="number"
                                        label="Max Capacity (Optional)"
                                        value={formData.capacity}
                                        onChange={e => updateFormData({ capacity: e.target.value })}
                                        placeholder="Unlimited"
                                        min="1"
                                    />
                                    <p className="text-xs text-text-secondary mt-1 ml-1">Leave empty for unlimited participants</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Organizer Details */}
                {currentStep === 4 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="border-b border-surface-200 pb-4 mb-4">
                            <h2 className="text-xl font-bold font-display text-default">Organizer Details</h2>
                            <p className="text-sm text-muted">Customize how you appear to attendees.</p>
                        </div>

                        {/* Cover Image */}
                        <div>
                            <DragDropFileUpload
                                label="Event Cover Image (16:9 recommended)"
                                value={formData.coverImageUrl}
                                onChange={(val) => updateFormData({ coverImageUrl: val })}
                                onUpload={handleCoverUpload}
                                uploading={uploadingCover}
                                aspectRatio="16/9"
                            />
                        </div>

                        {/* Organizer Info Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <Input
                                    label="Organizer Name *"
                                    value={formData.organizerDisplayName}
                                    onChange={e => updateFormData({ organizerDisplayName: e.target.value })}
                                    placeholder="Your organization or name"
                                />
                                <Input
                                    type="email"
                                    label="Contact Email *"
                                    value={formData.organizerEmail}
                                    onChange={e => updateFormData({ organizerEmail: e.target.value })}
                                    placeholder="contact@example.com"
                                />
                                <Input
                                    type="tel"
                                    label="Phone Number (Optional)"
                                    value={formData.organizerPhone}
                                    onChange={e => updateFormData({ organizerPhone: e.target.value })}
                                    placeholder="+1 (555) 123-4567"
                                />
                                <Input
                                    type="url"
                                    label="Website (Optional)"
                                    value={formData.organizerWebsite}
                                    onChange={e => updateFormData({ organizerWebsite: e.target.value })}
                                    placeholder="https://example.com"
                                />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <DragDropFileUpload
                                        label="Organization Logo"
                                        value={formData.organizerLogoUrl}
                                        onChange={(val) => updateFormData({ organizerLogoUrl: val })}
                                        onUpload={handleOrgLogoUpload}
                                        uploading={uploadingOrgLogo}
                                        aspectRatio="1/1"
                                    />
                                </div>
                                <div>
                                    <Textarea
                                        label="Organization Description"
                                        value={formData.organizerDescription}
                                        onChange={e => updateFormData({ organizerDescription: e.target.value })}
                                        rows={4}
                                        placeholder="Tell attendees about your organization..."
                                        maxLength={500}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Content (Agenda & Speakers) */}
                {currentStep === 5 && (
                    <div className="space-y-10 animate-fade-in">
                        {/* Agenda */}
                        <div>
                            <div className="flex items-center justify-between border-b border-surface-200 pb-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-display text-default">Agenda</h2>
                                    <p className="text-sm text-muted">Plan your event schedule.</p>
                                </div>
                                <Button variant="secondary" onClick={addAgendaItem} className="text-xs px-3 py-1.5 flex items-center gap-1">
                                    <PlusIcon className="h-4 w-4" /> Add Session
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {formData.agendaItems.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-surface-200 rounded-xl bg-surface-50">
                                        <CalendarIcon className="h-12 w-12 text-muted mx-auto mb-3 opacity-30" />
                                        <p className="text-muted text-sm font-medium">No agenda items yet.</p>
                                        <button onClick={addAgendaItem} className="text-brand-600 text-sm font-bold hover:underline mt-1">Add your first session</button>
                                    </div>
                                ) : (
                                    formData.agendaItems.map((item, idx) => (
                                        <div key={idx} className="p-4 bg-white rounded-xl border border-surface-200 shadow-sm relative hover:border-brand-200 transition-colors group">
                                            <button onClick={() => removeAgendaItem(idx)} className="absolute top-2 right-2 text-muted hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                <div className="md:col-span-3 space-y-2">
                                                    <Input type="time" value={item.startTime} onChange={e => updateAgendaItem(idx, 'startTime', e.target.value)} className="w-full text-xs" />
                                                    <Input type="time" value={item.endTime} onChange={e => updateAgendaItem(idx, 'endTime', e.target.value)} className="w-full text-xs" />
                                                </div>
                                                <div className="md:col-span-9 space-y-3">
                                                    <Input value={item.title} onChange={e => updateAgendaItem(idx, 'title', e.target.value)} className="font-bold" placeholder="Session Title" />
                                                    <Input value={item.description} onChange={e => updateAgendaItem(idx, 'description', e.target.value)} className="text-sm" placeholder="Description (optional)" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Speakers */}
                        <div>
                            <div className="flex items-center justify-between border-b border-surface-200 pb-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold font-display text-default">Speakers</h2>
                                    <p className="text-sm text-muted">Manage event speakers and hosts.</p>
                                </div>
                                <Button variant="secondary" onClick={() => setIsSpeakerModalOpen(true)} className="text-xs px-3 py-1.5 flex items-center gap-1">
                                    <PlusIcon className="h-4 w-4" /> Create Speaker
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Available Speakers */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Add from Library</h3>
                                    <Select
                                        key={availableSpeakers.length} // Force re-render
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addSpeaker(e.target.value);
                                            }
                                        }}
                                    >
                                        <option value="" disabled>
                                            {availableSpeakers.filter(s => !formData.selectedSpeakerIds.includes(s._id)).length === 0
                                                ? "All speakers added"
                                                : "Select a speaker to add..."}
                                        </option>
                                        {availableSpeakers
                                            .filter(s => !formData.selectedSpeakerIds.includes(s._id))
                                            .map(speaker => (
                                                <option key={speaker._id} value={speaker._id}>
                                                    {speaker.name} ({speaker.role})
                                                </option>
                                            ))}
                                    </Select>
                                    {availableSpeakers.length === 0 && (
                                        <p className="text-xs text-muted italic">No speakers found. Create one to get started.</p>
                                    )}
                                </div>

                                {/* Selected Speakers */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Selected Speakers ({formData.selectedSpeakerIds.length})</h3>
                                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                        {formData.selectedSpeakerIds.length === 0 ? (
                                            <div className="text-center p-4 border border-dashed border-surface-200 rounded-lg bg-surface-50">
                                                <p className="text-sm text-muted italic">No speakers added yet.</p>
                                            </div>
                                        ) : (
                                            formData.selectedSpeakerIds.map(id => {
                                                const speaker = availableSpeakers.find(s => s._id === id);
                                                if (!speaker) return null;
                                                return (
                                                    <div key={id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-surface-200 shadow-sm hover:border-brand-200 transition-colors">
                                                        <div className="h-10 w-10 rounded-full bg-surface-100 overflow-hidden shrink-0 border border-surface-200">
                                                            {speaker.avatar ? (
                                                                <img src={speaker.avatar} alt={speaker.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <UserCircleIcon className="h-full w-full text-muted" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-default truncate">{speaker.name}</p>
                                                            <p className="text-xs text-muted truncate">{speaker.role}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => removeSpeaker(id)}
                                                            className="text-muted hover:text-red-500 transition-colors p-1"
                                                            title="Remove Speaker"
                                                        >
                                                            <XMarkIcon className="h-4 w-4" />
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

                {/* Step 6: Review */}
                {currentStep === 6 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="border-b border-surface-200 pb-4">
                            <h2 className="text-xl font-bold font-display text-default">Review & Publish</h2>
                            <p className="text-sm text-muted">Double check your event details before going live.</p>
                        </div>

                        <div className="bg-white rounded-2xl overflow-hidden border border-surface-200 shadow-lg">
                            {/* Preview Header */}
                            <div className="h-48 bg-surface-900 relative">
                                {formData.coverImageUrl ? (
                                    <img src={formData.coverImageUrl} className="w-full h-full object-cover opacity-80" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-brand-900 to-brand-800 flex items-center justify-center">
                                        <CalendarIcon className="h-16 w-16 text-white/20" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-brand-950">
                                    {formData.accessType}
                                </div>
                            </div>

                            <div className="p-6 lg:p-8">
                                <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-brand-50 text-brand-600">{formData.category}</span>
                                            <span className="text-muted text-xs">•</span>
                                            <span className="text-xs font-bold text-muted">{formData.visibility}</span>
                                        </div>
                                        <h3 className="text-3xl font-black font-display text-default mb-2">{formData.title}</h3>
                                        <p className="text-lg text-muted">{formData.shortSummary}</p>
                                    </div>
                                    <div className="bg-surface-50 p-4 rounded-xl border border-surface-200 min-w-[200px]">
                                        <div className="flex items-center gap-2 text-default font-bold mb-1">
                                            <CalendarIcon className="h-5 w-5 text-brand-500" />
                                            <span>Date & Time</span>
                                        </div>
                                        <p className="text-sm text-muted ml-7">{new Date(formData.startTime).toLocaleDateString()}</p>
                                        <p className="text-sm text-muted ml-7">{new Date(formData.startTime).toLocaleTimeString()} - {new Date(formData.endTime).toLocaleTimeString()}</p>
                                    </div>
                                </div>

                                <div className="border-t border-surface-200 pt-6 mt-6">
                                    <h4 className="font-bold text-default mb-2">Agenda Preview</h4>
                                    {formData.agendaItems.length > 0 ? (
                                        <ul className="space-y-2">
                                            {formData.agendaItems.slice(0, 3).map((item, idx) => (
                                                <li key={idx} className="flex gap-4 text-sm">
                                                    <span className="font-mono text-muted w-24 shrink-0">{item.startTime} - {item.endTime}</span>
                                                    <span className="font-medium text-default">{item.title}</span>
                                                </li>
                                            ))}
                                            {formData.agendaItems.length > 3 && <li className="text-xs text-muted italic ml-28">...and {formData.agendaItems.length - 3} more sessions</li>}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted italic">No agenda details provided.</p>
                                    )}
                                </div>

                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-6">
                                        {formData.tags.map((tag, idx) => (
                                            <span key={idx} className="text-xs font-medium bg-surface-100 text-muted px-2 py-1 rounded-md">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex gap-3 text-sm text-yellow-800">
                            <EyeIcon className="h-5 w-5 shrink-0" />
                            <div>
                                <p className="font-bold">Ready to go live?</p>
                                <p>By publishing, this event will become active immediately and visible to attendees.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Footer */}
            <div className="fixed bottom-6 left-0 right-0 z-40 pointer-events-none">
                <div className="max-w-5xl mx-auto px-4 lg:px-8">
                    <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-brand-900/10 rounded-2xl p-4 flex justify-between items-center pointer-events-auto">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            className="flex items-center gap-2 text-muted hover:text-default"
                        >
                            <ChevronLeftIcon className="h-5 w-5" /> Back
                        </Button>

                        <div className="text-xs font-bold text-muted uppercase tracking-widest hidden sm:block opacity-50">
                            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
                        </div>

                        <Button
                            variant="primary"
                            onClick={currentStep === STEPS.length ? handleSubmit : handleNext}
                            disabled={loading}
                            className="px-8 shadow-lg shadow-brand-500/20"
                        >
                            {loading ? "Processing..." : currentStep === STEPS.length ? "Publish Event" : (<>Next <ChevronRightIcon className="h-5 w-5" /></>)}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Enhanced Speaker Creation Modal */}
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
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-2xl ring-1 ring-black/5">
                                    <div className="flex justify-between items-start mb-6">
                                        <Dialog.Title as="h3" className="text-2xl font-bold font-display text-default">
                                            Create New Speaker
                                        </Dialog.Title>
                                        <button onClick={() => setIsSpeakerModalOpen(false)} className="text-muted hover:text-default transition-colors p-1 rounded-full hover:bg-surface-100">
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Avatar Upload */}
                                        <div className="flex justify-center">
                                            <label className="relative cursor-pointer group">
                                                <div className="h-28 w-28 rounded-full border-4 border-surface-100 bg-surface-50 flex items-center justify-center overflow-hidden shadow-inner">
                                                    {newSpeakerData.avatar ? (
                                                        <img src={newSpeakerData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <UserCircleIcon className="h-20 w-20 text-surface-300" />
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PhotoIcon className="h-8 w-8 text-white" />
                                                </div>
                                                {uploadingSpeakerAvatar && (
                                                    <div className="absolute inset-0 rounded-full bg-white/80 flex items-center justify-center">
                                                        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" className="hidden" onChange={handleSpeakerAvatarUpload} />
                                            </label>
                                        </div>

                                        {/* Basic Info */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <Input
                                                label="Full Name"
                                                value={newSpeakerData.name}
                                                onChange={e => setNewSpeakerData({ ...newSpeakerData, name: e.target.value })}
                                                placeholder="Dr. John Doe"
                                            />
                                            <Input
                                                label="Job Title"
                                                value={newSpeakerData.role}
                                                onChange={e => setNewSpeakerData({ ...newSpeakerData, role: e.target.value })}
                                                placeholder="Chief Scientist"
                                            />
                                        </div>

                                        <Input
                                            type="email"
                                            label="Email Address"
                                            value={newSpeakerData.email}
                                            onChange={e => setNewSpeakerData({ ...newSpeakerData, email: e.target.value })}
                                            placeholder="john@example.com"
                                        />

                                        <Textarea
                                            label="Bio"
                                            value={newSpeakerData.bio}
                                            onChange={e => setNewSpeakerData({ ...newSpeakerData, bio: e.target.value })}
                                            rows={3}
                                            placeholder="A short professional biography..."
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <TagInput
                                                label="Expertise Tags"
                                                tags={newSpeakerData.tags}
                                                onChange={(tags) => setNewSpeakerData({ ...newSpeakerData, tags })}
                                                placeholder="AI, Ethics, Design..."
                                            />
                                            <TagInput
                                                label="Display Labels"
                                                tags={newSpeakerData.labels}
                                                onChange={(labels) => setNewSpeakerData({ ...newSpeakerData, labels })}
                                                placeholder="Keynote, Panelist..."
                                            />
                                        </div>

                                        <div className="bg-surface-50 p-4 rounded-xl border border-surface-200">
                                            <label className="block text-sm font-bold text-default mb-3">Social Profiles</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Input
                                                    value={newSpeakerData.socialLinks.linkedin}
                                                    onChange={e => setNewSpeakerData({ ...newSpeakerData, socialLinks: { ...newSpeakerData.socialLinks, linkedin: e.target.value } })}
                                                    placeholder="LinkedIn URL"
                                                    className="text-xs"
                                                />
                                                <Input
                                                    value={newSpeakerData.socialLinks.twitter}
                                                    onChange={e => setNewSpeakerData({ ...newSpeakerData, socialLinks: { ...newSpeakerData.socialLinks, twitter: e.target.value } })}
                                                    placeholder="X (Twitter) URL"
                                                    className="text-xs"
                                                />
                                                <Input
                                                    value={newSpeakerData.socialLinks.website}
                                                    onChange={e => setNewSpeakerData({ ...newSpeakerData, socialLinks: { ...newSpeakerData.socialLinks, website: e.target.value } })}
                                                    placeholder="Website URL"
                                                    className="text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-4 pt-4 border-t border-surface-200">
                                        <Button variant="ghost" onClick={() => setIsSpeakerModalOpen(false)} className="flex-1">
                                            Cancel
                                        </Button>
                                        <Button onClick={handleCreateSpeaker} disabled={creatingSpeaker} className="flex-1 shadow-lg shadow-brand-500/20">
                                            {creatingSpeaker ? "Creating..." : "Create Speaker"}
                                        </Button>
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
