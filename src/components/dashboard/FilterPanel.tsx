import { useState } from "react";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";

export interface FilterOptions {
    eventType?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    minDuration?: number;
    maxDuration?: number;
    searchQuery?: string;
}

interface FilterPanelProps {
    filters: FilterOptions;
    onFilterChange: (filters: FilterOptions) => void;
    onClearFilters: () => void;
    eventTypes?: string[];
    showEventFilter?: boolean;
}

export default function FilterPanel({
    filters,
    onFilterChange,
    onClearFilters,
    eventTypes = ["Workshop", "Webinar", "Conference", "Meetup", "Training"],
    showEventFilter = true,
}: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleChange = (key: keyof FilterOptions, value: any) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const activeFilterCount = Object.values(filters).filter(
        (v) => v !== undefined && v !== "" && v !== null
    ).length;

    return (
        <div className="card p-4 space-y-4 border border-brand-accent/10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FunnelIcon className="h-5 w-5 text-brand-primary" />
                    <h3 className="font-bold text-brand-dark">Filters</h3>
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-brand-primary text-white rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                        <button
                            onClick={onClearFilters}
                            className="text-xs font-bold text-brand-muted hover:text-brand-dark transition-colors flex items-center gap-1"
                        >
                            <XMarkIcon className="h-4 w-4" />
                            Clear All
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs font-bold text-brand-primary hover:text-brand-dark transition-colors"
                    >
                        {isExpanded ? "Collapse" : "Expand"}
                    </button>
                </div>
            </div>

            {/* Filter Options */}
            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-brand-accent/10">
                    {/* Event Type Filter */}
                    {showEventFilter && (
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-brand-dark uppercase">
                                Event Type
                            </label>
                            <select
                                value={filters.eventType || ""}
                                onChange={(e) => handleChange("eventType", e.target.value || undefined)}
                                className="input-field w-full text-sm"
                            >
                                <option value="">All Types</option>
                                {eventTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Status Filter */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-brand-dark uppercase">
                            Attendance Status
                        </label>
                        <select
                            value={filters.status || ""}
                            onChange={(e) => handleChange("status", e.target.value || undefined)}
                            className="input-field w-full text-sm"
                        >
                            <option value="">All Status</option>
                            <option value="Attended">Attended</option>
                            <option value="Registered">Registered Only</option>
                            <option value="Active">Currently Active</option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-brand-dark uppercase">
                            Date From
                        </label>
                        <input
                            type="date"
                            value={filters.dateFrom || ""}
                            onChange={(e) => handleChange("dateFrom", e.target.value || undefined)}
                            className="input-field w-full text-sm"
                        />
                    </div>

                    {/* Date To */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-brand-dark uppercase">
                            Date To
                        </label>
                        <input
                            type="date"
                            value={filters.dateTo || ""}
                            onChange={(e) => handleChange("dateTo", e.target.value || undefined)}
                            className="input-field w-full text-sm"
                        />
                    </div>

                    {/* Min Duration */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-brand-dark uppercase">
                            Min Duration (minutes)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={filters.minDuration || ""}
                            onChange={(e) =>
                                handleChange("minDuration", e.target.value ? parseInt(e.target.value) : undefined)
                            }
                            placeholder="e.g., 30"
                            className="input-field w-full text-sm"
                        />
                    </div>

                    {/* Max Duration */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-brand-dark uppercase">
                            Max Duration (minutes)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={filters.maxDuration || ""}
                            onChange={(e) =>
                                handleChange("maxDuration", e.target.value ? parseInt(e.target.value) : undefined)
                            }
                            placeholder="e.g., 120"
                            className="input-field w-full text-sm"
                        />
                    </div>
                </div>
            )}

            {/* Quick Filters */}
            {!isExpanded && activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2">
                    {filters.eventType && (
                        <span className="px-3 py-1 text-xs font-bold bg-brand-primary/10 text-brand-primary rounded-full flex items-center gap-1">
                            Type: {filters.eventType}
                            <button
                                onClick={() => handleChange("eventType", undefined)}
                                className="hover:text-brand-dark"
                            >
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {filters.status && (
                        <span className="px-3 py-1 text-xs font-bold bg-brand-primary/10 text-brand-primary rounded-full flex items-center gap-1">
                            Status: {filters.status}
                            <button
                                onClick={() => handleChange("status", undefined)}
                                className="hover:text-brand-dark"
                            >
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {(filters.dateFrom || filters.dateTo) && (
                        <span className="px-3 py-1 text-xs font-bold bg-brand-primary/10 text-brand-primary rounded-full flex items-center gap-1">
                            Date Range
                            <button
                                onClick={() => {
                                    handleChange("dateFrom", undefined);
                                    handleChange("dateTo", undefined);
                                }}
                                className="hover:text-brand-dark"
                            >
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {(filters.minDuration || filters.maxDuration) && (
                        <span className="px-3 py-1 text-xs font-bold bg-brand-primary/10 text-brand-primary rounded-full flex items-center gap-1">
                            Duration Filter
                            <button
                                onClick={() => {
                                    handleChange("minDuration", undefined);
                                    handleChange("maxDuration", undefined);
                                }}
                                className="hover:text-brand-dark"
                            >
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
