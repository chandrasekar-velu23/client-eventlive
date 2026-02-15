import type { Speaker } from "../services/api";
import { UserCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SpeakerSelectorProps {
    availableSpeakers: Speaker[];
    selectedSpeakerIds: string[];
    onAdd: (speakerId: string) => void;
    onRemove: (speakerId: string) => void;
}

export default function SpeakerSelector({ availableSpeakers, selectedSpeakerIds, onAdd, onRemove }: SpeakerSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Available Speakers */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Available Speakers</h3>
                <select
                    key={availableSpeakers.length} // Force re-render when speakers change
                    className="input-field w-full"
                    value=""
                    onChange={(e) => {
                        if (e.target.value) {
                            onAdd(e.target.value);
                        }
                    }}
                >
                    <option value="" disabled>
                        {availableSpeakers.filter(s => !selectedSpeakerIds.includes(s._id)).length === 0
                            ? "All speakers added"
                            : "Choose a speaker to add..."}
                    </option>
                    {availableSpeakers
                        .filter(s => !selectedSpeakerIds.includes(s._id))
                        .map(speaker => (
                            <option key={speaker._id} value={speaker._id}>
                                {speaker.name} ({speaker.role})
                            </option>
                        ))}
                </select>
                {availableSpeakers.length === 0 && (
                    <p className="text-xs text-brand-muted italic">No speakers available. Create one using the button above.</p>
                )}
            </div>

            {/* Selected Speakers */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Added Speakers ({selectedSpeakerIds.length})</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {selectedSpeakerIds.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No speakers added yet.</p>
                    ) : (
                        selectedSpeakerIds.map(id => {
                            const speaker = availableSpeakers.find(s => s._id === id);
                            if (!speaker) return null;
                            return (
                                <div key={id} className="flex items-center gap-3 p-3 bg-brand-surface rounded-lg border border-brand-accent/10 hover:border-brand-primary/30 transition-colors">
                                    <div className="h-10 w-10 rounded-full bg-white overflow-hidden shrink-0 border-2 border-brand-accent/10">
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
                                        onClick={() => onRemove(id)}
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
    );
}
