import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import {
    DocumentDuplicateIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckCircleIcon,
    PlusIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function Drafts() {
    const { events, fetchMyEvents, loading, deleteEventData } = useEvents();
    const [drafts, setDrafts] = useState<typeof events>([]);

    useEffect(() => {
        fetchMyEvents();
    }, [fetchMyEvents]);

    useEffect(() => {
        // Filter for events that are "drafts"
        // Since we just added the status field, older events might not have it. 
        // We can assume 'visibility' === 'private' as a proxy for drafts alongside status === 'draft' for now,
        // or just filter strictly if we start saving them as drafts.
        // For this implementation, we will display events explicitly marked as 'draft' OR (optionally) private events if desired.
        // Let's stick to status === 'draft'.
        if (events.length > 0) {
            // Mocking behavior: If no status field exists on backend yet, we might simulate it for testing
            // For production, we rely on the status field. 
            // NOTE: Since I cannot migrate the DB effectively here without backend access, 
            // I will assume the user will create new drafts.
            const d = events.filter(e => e.status === 'draft');
            setDrafts(d);
        }
    }, [events]);

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this draft?")) {
            try {
                await deleteEventData(id);
                toast.success("Draft deleted successfully");
                setDrafts(prev => prev.filter(e => e.id !== id));
            } catch (error) {
                toast.error("Failed to delete draft");
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark">My Drafts</h1>
                    <p className="text-sm text-brand-muted">Manage your unfinished events</p>
                </div>
                <Link to="/dashboard/create-event" className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-bold">
                    <PlusIcon className="h-5 w-5" /> New Draft
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-12 text-brand-muted">Loading drafts...</div>
            ) : drafts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="mx-auto h-12 w-12 text-gray-300 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <DocumentDuplicateIcon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-dark">No drafts found</h3>
                    <p className="text-sm text-brand-muted max-w-sm mx-auto mt-2">
                        Start creating an event and save it as a draft to finish it later.
                    </p>
                    <div className="mt-6">
                        <Link to="/dashboard/create-event" className="text-brand-primary font-bold hover:underline">
                            Create Event
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drafts.map((draft) => (
                        <div key={draft.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-300" />

                            <div className="flex justify-between items-start mb-4 pl-3">
                                <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                    Draft
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDelete(draft.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors" title="Delete Draft">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-brand-dark mb-2 pl-3 line-clamp-1">{draft.title || "Untitled Draft"}</h3>
                            <p className="text-sm text-brand-muted pl-3 line-clamp-2 mb-4 h-10">
                                {draft.description || "No description provided yet."}
                            </p>

                            <div className="pt-4 border-t border-gray-100 flex gap-3 pl-3">
                                <Link
                                    to={`/dashboard/events/${draft.id}`}
                                    className="flex-1 btn-secondary text-xs justify-center py-2 flex items-center gap-2"
                                >
                                    <PencilSquareIcon className="h-4 w-4" /> Edit
                                </Link>
                                <button className="flex-1 btn-primary text-xs justify-center py-2 flex items-center gap-2 opacity-50 cursor-not-allowed" title="Publish functionality coming soon">
                                    <CheckCircleIcon className="h-4 w-4" /> Publish
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
