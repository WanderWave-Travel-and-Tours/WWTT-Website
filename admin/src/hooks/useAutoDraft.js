import { useState, useEffect, useCallback } from 'react';

const useAutoDraft = ({ module, formData, setFormData, imagePreview, autoRestore = false }) => {
    const [hasDraft, setHasDraft] = useState(false);
    const [draftInfo, setDraftInfo] = useState(null);
    const DRAFT_KEY = `draft_${module}`;
    const isEmptyDraft = (data) => {
        if (!data) return true;
        const hasContent = Object.entries(data).some(([key, value]) => {
            if (key === 'status' && (value === 'Active' || value === 'Published')) return false;
            if (key === 'category' && (value === 'Local' || value === 'Local Tour')) return false;
            if (Array.isArray(value)) {
                const validItems = value.filter(item => {
                    if (typeof item === 'string') return item.trim() !== '';
                    if (typeof item === 'object') {
                        return item.title && item.title.trim() !== '';
                    }
                    return true;
                });
                return validItems.length > 0;
            }
            if (typeof value === 'string') return value.trim() !== '';
            if (typeof value === 'number') return value > 0;
            if (key === 'imageMeta' && value) return true;
            if (key === 'image' && value) return true;

            return false;
        });

        return !hasContent; 
    };
    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        
        if (savedDraft) {
            try {
                const parsedDraft = JSON.parse(savedDraft);
                if (isEmptyDraft(parsedDraft)) {
                    localStorage.removeItem(DRAFT_KEY); 
                    setHasDraft(false);
                    return;
                }

                setDraftInfo(parsedDraft);
                setHasDraft(true);
                if (autoRestore) {
                    setFormData(parsedDraft);
                }
            } catch (err) {
                console.error("Error parsing draft:", err);
                localStorage.removeItem(DRAFT_KEY); 
            }
        }
    }, [DRAFT_KEY, autoRestore]); 
    useEffect(() => {
        const saveTimer = setTimeout(() => {
            if (isEmptyDraft(formData) && !imagePreview) {
                if (localStorage.getItem(DRAFT_KEY)) {
                    localStorage.removeItem(DRAFT_KEY);
                    setHasDraft(false); 
                }
                return;
            }

            const payload = {
                ...formData,
                updatedAt: new Date().toISOString()
            };

            localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        }, 1000); 

        return () => clearTimeout(saveTimer);
    }, [formData, imagePreview, DRAFT_KEY]);

    
    const restoreDraft = useCallback(() => {
        if (draftInfo) {
            setFormData(draftInfo);
        }
    }, [draftInfo, setFormData]);

    const discardDraft = useCallback(async () => {
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
        setDraftInfo(null);
        return Promise.resolve(); 
    }, [DRAFT_KEY]);

    const clearDraft = useCallback(async () => {
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
        setDraftInfo(null);
        return Promise.resolve();
    }, [DRAFT_KEY]);

    return {
        hasDraft,
        draftInfo,
        restoreDraft,
        discardDraft,
        clearDraft
    };
};

export default useAutoDraft;