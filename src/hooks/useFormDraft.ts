import { useState, useEffect, useCallback } from 'react';

export function useFormDraft<T>(key: string, initialState: T) {
    // Load from session storage or use initial state
    const [formData, setFormData] = useState<T>(() => {
        try {
            const saved = sessionStorage.getItem(key);
            return saved ? JSON.parse(saved) : initialState;
        } catch {
            return initialState;
        }
    });

    const [isDirty, setIsDirty] = useState(false);

    // Update form data and mark as dirty
    const updateFormData = useCallback((newData: Partial<T> | ((prev: T) => Partial<T>)) => {
        setFormData((prev) => {
            const updated = typeof newData === 'function' ? (newData as any)(prev) : newData;
            // Mark as dirty since we have changes that might differ from saved draft or initial load
            setIsDirty(true);
            return { ...prev, ...updated };
        });
    }, []);

    // Save to session storage
    const saveDraft = useCallback(() => {
        sessionStorage.setItem(key, JSON.stringify(formData));
        setIsDirty(false); // Reset dirty flag after saving
        return true;
    }, [key, formData]);

    // Clear draft
    const clearDraft = useCallback(() => {
        sessionStorage.removeItem(key);
        setFormData(initialState);
        setIsDirty(false);
    }, [key, initialState]);

    // Warn on tab close/refresh if dirty
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Trigger browser confirmation dialog
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    return { formData, updateFormData, saveDraft, clearDraft, isDirty, setFormData };
}
