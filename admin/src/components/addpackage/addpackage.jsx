import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar"; 
import "./addpackage.css";

// Import sub-components
import BasicInfo from "./BasicInfo";
import ImageUpload from "./ImageUpload";
import PricingCalculator from "./PricingCalculator";
import InclusionsList from "./InclusionsList";
import ItineraryBuilder from "./ItineraryBuilder";
import PackagePreview from "./PackagePreview";

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// ✅ CORRECT IMPORT PATHS
import { useToast } from "../toast/ToastManager";
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";

const AddPackage = () => {
    // --- SIDEBAR TOGGLE ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const navigate = useNavigate();
    const toast = useToast(); // ✅ Initialize Toast

    // --- STATE ---
    const [title, setTitle] = useState("");
    const [destination, setDestination] = useState("");
    const [supplierRate, setSupplierRate] = useState("");
    const [markupValue, setMarkupValue] = useState("");
    const [markupType, setMarkupType] = useState("peso");
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState("");
    const [category, setCategory] = useState("Local Tour");
    
    // ✅ Tour Type State
    const [tourType, setTourType] = useState("private"); // "private" or "joiners"
    const [pax, setPax] = useState(""); // Only for private
    const [minPax, setMinPax] = useState(""); // Only for joiners

    // ✅ Pax Mode State (Solo = ×2, Multiple = ×pax/minPax)
    const [paxMode, setPaxMode] = useState("solo"); // "solo" | "multiple"
    
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [inclusions, setInclusions] = useState([""]);
    const [itinerary, setItinerary] = useState([
        { day: 1, title: "Day 1: Arrival", activities: [""] },
    ]);
    const [isPasteActive, setIsPasteActive] = useState(false);
    const [submitting, setSubmitting] = useState(false); // To handle loading state

    const pasteAreaRef = useRef(null);

    // ✅ Confirmation Modal State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    // ✅ Reusable Confirmation Function
    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            },
            type
        });
    };

    // =========================================================
    // ✅ PAX MULTIPLIER HELPER
    // =========================================================

    /**
     * Returns the price multiplier based on paxMode and tourType.
     * - solo:    always ×2
     * - multiple: ×pax (private) or ×minPax (joiners)
     */
    const getMultiplier = (pMode, tType, paxVal, minPaxVal) => {
        if (pMode === 'solo') return 2;
        if (tType === 'private') return parseInt(paxVal) || 1;
        return parseInt(minPaxVal) || 1;
    };

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC START
    // =========================================================

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const base64ToFile = async (base64String, fileName, mimeType) => {
        const res = await fetch(base64String);
        const blob = await res.blob();
        return new File([blob], fileName, { type: mimeType });
    };

    const [draftPayload, setDraftPayload] = useState(null);

    useEffect(() => {
        const updateDraft = async () => {
            const isFormEmpty = 
                !title && 
                !destination && 
                !supplierRate && 
                !markupValue && 
                !price && 
                !duration && 
                category === "Local Tour" && 
                (inclusions.length === 1 && inclusions[0] === "") && 
                (itinerary.length === 1 && itinerary[0].title === "Day 1: Arrival" && itinerary[0].activities.length === 1 && itinerary[0].activities[0] === "") && 
                !file;

            if (isFormEmpty) {
                setDraftPayload(null); 
                return;
            }

            let imageBase64 = null;
            let imageMeta = null;

            if (file) {
                try {
                    if (file.size < 3 * 1024 * 1024) { 
                        imageBase64 = await fileToBase64(file);
                        imageMeta = { name: file.name, type: file.type };
                    }
                } catch (err) {
                    console.warn("Image too large for draft, saving text only.");
                }
            }

            setDraftPayload({
                title,
                destination,
                supplierRate,
                markupValue,
                markupType,
                price,
                duration,
                category,
                tourType,
                pax,
                minPax,
                paxMode, // ✅ NEW: Save paxMode to draft
                inclusions,
                itinerary,
                image: imageBase64,
                imageMeta: imageMeta
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [title, destination, supplierRate, markupValue, markupType, price, duration, category, tourType, pax, minPax, paxMode, inclusions, itinerary, file]);

    const restoreDraftData = async (data) => {
        if (!data) return;

        setTitle(data.title || "");
        setDestination(data.destination || "");
        setSupplierRate(data.supplierRate || "");
        setMarkupValue(data.markupValue || "");
        setMarkupType(data.markupType || "peso");
        setPrice(data.price || "");
        setDuration(data.duration || "");
        setCategory(data.category || "Local Tour");
        setTourType(data.tourType || "private");
        setPax(data.pax || "");
        setMinPax(data.minPax || "");
        setPaxMode(data.paxMode || "solo"); // ✅ NEW: Restore paxMode
        setInclusions(data.inclusions || [""]);
        setItinerary(data.itinerary || [{ day: 1, title: "Day 1: Arrival", activities: [""] }]);

        if (data.image && data.imageMeta) {
            try {
                const restoredFile = await base64ToFile(data.image, data.imageMeta.name, data.imageMeta.type);
                setFile(restoredFile);
                setPreviewUrl(URL.createObjectURL(restoredFile));
            } catch (err) {
                console.error("Failed to restore image:", err);
            }
        }
    };

    const { 
        clearDraft, 
        hasDraft, 
        restoreDraft, 
        discardDraft,
        draftInfo 
    } = useAutoDraft({
        module: 'add-package', 
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: previewUrl, 
        autoRestore: false 
    });

    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        if (hasDraft) {
            setShowRestoreModal(true);
        }
    }, [hasDraft]);

    const handleRestoreDraft = async () => {
        await restoreDraft();
        setShowRestoreModal(false);
    };

    const handleDiscardDraft = async () => {
        await discardDraft();
        setShowRestoreModal(false);
    };

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

    // ✅ FILE CHANGE WITH PASTE DETECTION HANDLER
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validTypes = ["image/png", "image/jpeg", "image/jpg"];
            if (!validTypes.includes(selectedFile.type)) {
                toast.warning("Invalid file type. Please upload a PNG or JPG image.", "Invalid File");
                return;
            }
            
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.warning("File size exceeds 5MB. Please choose a smaller image.", "File Too Large");
                return;
            }

            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            
            toast.success("Image uploaded successfully!", "Upload Success", 2000);
        }
    };

    const clearImage = () => {
        setFile(null);
        setPreviewUrl(null);
        setIsPasteActive(false);
    };

    const activatePasteArea = () => {
        setIsPasteActive(true);
        setTimeout(() => {
            pasteAreaRef.current?.focus();
        }, 100);
    };

    // =========================================================
    // ✅ PRICING — Updated to use paxMode multiplier
    // =========================================================

    const handleSupplierRateChange = (e) => {
        const value = e.target.value;
        if (value === "" || !isNaN(value)) {
            setSupplierRate(value);

            const supplierRateNum = Number(value) || 0;
            const markupValueNum = Number(markupValue) || 0;

            const markupInPeso = markupType === "percentage"
                ? (supplierRateNum * markupValueNum) / 100
                : markupValueNum;

            const multiplier = getMultiplier(paxMode, tourType, pax, minPax);
            const total = Math.round((supplierRateNum + markupInPeso) * multiplier * 100) / 100;
            setPrice(total.toString());
        }
    };

    const handleMarkupChange = (e) => {
        const value = e.target.value;
        if (value === "" || !isNaN(value)) {
            setMarkupValue(value);
            updatePriceFromMarkup(value, markupType);
        }
    };

    const toggleMarkupType = () => {
        const newType = markupType === "peso" ? "percentage" : "peso";
        setMarkupType(newType);
        updatePriceFromMarkup(markupValue, newType);
    };

    const updatePriceFromMarkup = (mValue, mType) => {
        const supplierRateNum = Number(supplierRate) || 0;
        const markupValueNum = Number(mValue) || 0;

        const markupInPeso = mType === "percentage"
            ? (supplierRateNum * markupValueNum) / 100
            : markupValueNum;

        const multiplier = getMultiplier(paxMode, tourType, pax, minPax);
        const total = Math.round((supplierRateNum + markupInPeso) * multiplier * 100) / 100;
        setPrice(total.toString());
    };

    // ✅ Switch paxMode and clear pricing inputs
    const handlePaxModeChange = (mode) => {
        setPaxMode(mode);
        setSupplierRate("");
        setMarkupValue("");
        setPrice("");
    };

    // ✅ Recalculate price when paxMode, pax, minPax, or tourType changes
    useEffect(() => {
        const supplierRateNum = Number(supplierRate) || 0;
        const markupValueNum = Number(markupValue) || 0;

        const markupInPeso = markupType === "percentage"
            ? (supplierRateNum * markupValueNum) / 100
            : markupValueNum;

        const multiplier = getMultiplier(paxMode, tourType, pax, minPax);
        const total = Math.round((supplierRateNum + markupInPeso) * multiplier * 100) / 100;
        setPrice(total.toString());
    }, [paxMode, pax, minPax, tourType]);
    // Note: supplierRate, markupValue, markupType changes are handled by their own handlers above

    // --- INCLUSIONS ---
    const handleIncChange = (index, value) => {
        const updated = [...inclusions];
        updated[index] = value;
        setInclusions(updated);
    };

    const addInclusion = () => {
        setInclusions([...inclusions, ""]);
    };

    const removeInclusion = (index) => {
        const updated = inclusions.filter((_, i) => i !== index);
        setInclusions(updated.length ? updated : [""]);
    };

    // ✅ UPDATED: Smart Paste for Inclusions (Same logic as Tours)
    const handleInclusionPaste = (index, e) => {
        const pastedText = e.clipboardData.getData("text");
        const lines = pastedText.split(/\r?\n/).filter((line) => line.trim());

        if (lines.length > 1) {
            e.preventDefault();
            // Clean common bullet characters
            const cleanedLines = lines.map((line) => {
                return line.replace(/^[✓✔️☑️•\-\s]+/, "").trim();
            });

            const newInclusions = [...inclusions];
            
            // Update the current focused input with the first line
            newInclusions[index] = cleanedLines[0];

            // Splice the rest of the lines after the current index
            let currentIndex = index;
            cleanedLines.slice(1).forEach((line) => {
                newInclusions.splice(++currentIndex, 0, line);
            });

            setInclusions(newInclusions);
            toast.info(`${lines.length} inclusions pasted and formatted.`, "Inclusions Updated");
        }
    };

    // --- ITINERARY ---
    const handleDayTitle = (dayIndex, value) => {
        const updated = [...itinerary];
        updated[dayIndex].title = value;
        setItinerary(updated);
    };

    const addAct = (dayIndex) => {
        const updated = [...itinerary];
        updated[dayIndex].activities.push("");
        setItinerary(updated);
    };

    const removeAct = (dayIndex, actIndex) => {
        const updated = [...itinerary];
        if (updated[dayIndex].activities.length > 1) {
            updated[dayIndex].activities = updated[dayIndex].activities.filter((_, i) => i !== actIndex);
        } else {
            updated[dayIndex].activities = [""];
        }
        setItinerary(updated);
    };

    const handleAct = (dayIndex, actIndex, value) => {
        const updated = [...itinerary];
        updated[dayIndex].activities[actIndex] = value;
        setItinerary(updated);
    };

    // ✅ NEW: Smart Paste for Itinerary Activities
    const handleActivityPaste = (dayIndex, actIndex, e) => {
        const pastedText = e.clipboardData.getData("text");
        const lines = pastedText.split(/\r?\n/).filter((line) => line.trim());

        if (lines.length > 1) {
            e.preventDefault();
            const cleanedLines = lines.map((line) => {
                return line.replace(/^[✓✔️☑️•\-\s]+/, "").trim();
            });

            const updatedItinerary = [...itinerary];
            
            // Update the current focused activity field with the first line
            updatedItinerary[dayIndex].activities[actIndex] = cleanedLines[0];

            // Insert the rest of the activities into this day's array
            let currentActIndex = actIndex;
            cleanedLines.slice(1).forEach((line) => {
                updatedItinerary[dayIndex].activities.splice(++currentActIndex, 0, line);
            });

            setItinerary(updatedItinerary);
            toast.info(`${lines.length} activities added to Day ${itinerary[dayIndex].day}.`, "Itinerary Updated");
        }
    };

    const addDay = () => {
        const nextDay = itinerary.length + 1;
        setItinerary([...itinerary, { day: nextDay, title: `Day ${nextDay}`, activities: [""] }]);
    };

    const removeDay = (dayIndex) => {
        const updated = itinerary.filter((_, i) => i !== dayIndex);
        const renumbered = updated.map((d, i) => ({ ...d, day: i + 1 }));
        setItinerary(renumbered.length ? renumbered : [{ day: 1, title: "Day 1: Arrival", activities: [""] }]);
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Validation
        if (!file) {
            toast.warning("Please upload an image.", "Missing Image");
            setSubmitting(false);
            return;
        }

        if (!title.trim() || !destination.trim() || !supplierRate || !duration || !category) {
            toast.warning("Please fill in all required fields.", "Missing Fields");
            setSubmitting(false);
            return;
        }

        // ✅ Validate pax and minPax based on tourType
        if (tourType === "private" && (!pax || parseInt(pax) < 1)) {
            toast.warning("Please enter the number of pax for private tour.", "Missing Pax");
            setSubmitting(false);
            return;
        }

        if (tourType === "joiners" && (!minPax || parseInt(minPax) < 1)) {
            toast.warning("Please enter the minimum pax for joiners tour.", "Missing Min Pax");
            setSubmitting(false);
            return;
        }

        const processedInclusions = inclusions.filter((i) => i.trim());
        if (processedInclusions.length === 0) {
            toast.warning("Please add at least one inclusion.", "Missing Inclusions");
            setSubmitting(false);
            return;
        }

        const cleanedItinerary = itinerary.map(d => ({
            day: d.day,
            title: d.title,
            activities: d.activities.filter(a => a.trim())
        })).filter(d => d.activities.length > 0);

        if (cleanedItinerary.length === 0) {
            toast.warning("Please add at least one day with activities.", "Missing Itinerary");
            setSubmitting(false);
            return;
        }

        // ✅ Apply paxMode multiplier to sellerPrice and markup before sending
        const supplierRateNum = Number(supplierRate) || 0;
        const markupValueNum = Number(markupValue) || 0;
        let markupInPeso = markupType === "percentage" 
            ? (supplierRateNum * markupValueNum) / 100 
            : markupValueNum;
        markupInPeso = Math.round(markupInPeso * 100) / 100;

        const multiplier = getMultiplier(paxMode, tourType, pax, minPax);
        const finalSellerPrice = Math.round(supplierRateNum * multiplier * 100) / 100;
        const finalMarkup = Math.round(markupInPeso * multiplier * 100) / 100;

        const formData = new FormData();
        formData.append("title", duration ? `${duration} ${title}` : title);
        formData.append("destination", destination);
        formData.append("sellerPrice", finalSellerPrice.toString()); // ✅ Multiplied
        formData.append("markup", finalMarkup.toString());           // ✅ Multiplied
        formData.append("duration", duration);
        formData.append("category", category === "Local Tour" ? "Local" : "International");
        formData.append("tourType", tourType);
        
        // ✅ Append pax or minPax based on tourType
        if (tourType === "private") {
            formData.append("pax", parseInt(pax));
        } else if (tourType === "joiners") {
            formData.append("minPax", parseInt(minPax));
        }
        
        formData.append("inclusions", JSON.stringify(processedInclusions));
        formData.append("itinerary", JSON.stringify(cleanedItinerary));
        formData.append("image", file);

        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
        const activeId = adminData.id || adminData._id || "";

        formData.append("userEmail", activeUser);
        formData.append("adminId", activeId); 

        try {
            const response = await fetch("https://wanderwaveph.onrender.com/api/packages/add", {
                method: "POST",
                body: formData,
                headers: {
                    ...(localStorage.getItem('adminToken') && { 
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}` 
                    })
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                toast.success(
                    `"${title}" has been published successfully!`,
                    "Package Published",
                    4000
                );
                
                await clearDraft();
                
                setTitle("");
                setDestination("");
                setSupplierRate("");
                setMarkupValue("");
                setPrice("");
                setDuration("");
                setCategory("Local Tour");
                setTourType("private");
                setPax("");
                setMinPax("");
                setPaxMode("solo"); // ✅ Reset paxMode
                setFile(null);
                setPreviewUrl(null);
                setInclusions([""]);
                setItinerary([{ day: 1, title: "Day 1: Arrival", activities: [""] }]);
                setMarkupType("peso");
                
            } else {
                const errorMessage = data.error || data.message || "Failed to publish package";
                toast.error(errorMessage, "Server Error", 5000);
            }
            
        } catch (error) {
            toast.error(
                `Cannot connect to server: ${error.message}.`,
                "Connection Error",
                6000
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async () => {
        askConfirmation(
            "Cancel Entry",
            "Are you sure you want to cancel? All unsaved changes and drafts for this session will be lost.",
            async () => {
                await clearDraft();
                toast.info("Process cancelled.", "Cancelled");
                navigate(-1);
            },
            "danger"
        );
    };

    return (
        <div className="apkg-page">
            
            {/* ✅ RESTORE DRAFT MODAL */}
            <RestoreDraftModal
                isOpen={showRestoreModal}
                onRestore={handleRestoreDraft}
                onDiscard={handleDiscardDraft}
                draftInfo={draftInfo}
            />

            {/* ✅ CUSTOM CONFIRMATION MODAL - Using imported component */}
            <CustomConfirmModal 
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />

            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <main className={`apkg-main ${isSidebarCollapsed ? 'collapsed-main' : ''}`}>
                <div className="apkg-container">
                    <header className="apkg-header">
                        <div className="apkg-header-content">
                            <h1 className="apkg-title">NEW PACKAGE</h1>
                            <p className="apkg-subtitle">Fill in the details below to create a new tour package</p>
                        </div>
                    </header>
                    <form onSubmit={handleSubmit} className="apkg-form">
                        <div className="apkg-grid">
                            <div className="apkg-left">
                                <ImageUpload
                                    previewUrl={previewUrl}
                                    handleFileChange={handleFileChange}
                                    clearImage={clearImage}
                                    isPasteActive={isPasteActive}
                                    activatePasteArea={activatePasteArea}
                                    pasteAreaRef={pasteAreaRef}
                                />
                                <BasicInfo
                                    title={title} setTitle={setTitle}
                                    destination={destination} setDestination={setDestination}
                                    duration={duration} setDuration={setDuration}
                                    category={category} setCategory={setCategory}
                                    tourType={tourType} setTourType={setTourType}
                                    pax={pax} setPax={setPax}
                                    minPax={minPax} setMinPax={setMinPax}
                                />
                                <PricingCalculator
                                    supplierRate={supplierRate}
                                    handleSupplierRateChange={handleSupplierRateChange}
                                    markupValue={markupValue}
                                    handleMarkupChange={handleMarkupChange}
                                    markupType={markupType}
                                    toggleMarkupType={toggleMarkupType}
                                    price={price}
                                    // ✅ NEW: Pax Mode Props
                                    paxMode={paxMode}
                                    onPaxModeChange={handlePaxModeChange}
                                    tourType={tourType}
                                    pax={pax}
                                    minPax={minPax}
                                />
                                <InclusionsList
                                    inclusions={inclusions}
                                    handleIncChange={handleIncChange}
                                    addInclusion={addInclusion}
                                    removeInclusion={removeInclusion}
                                    handleInclusionPaste={handleInclusionPaste}
                                />
                                <ItineraryBuilder
                                    itinerary={itinerary}
                                    handleDayTitle={handleDayTitle}
                                    addAct={addAct}
                                    removeAct={removeAct}
                                    handleAct={handleAct}
                                    handleActivityPaste={handleActivityPaste} 
                                    addDay={addDay}
                                    removeDay={removeDay}
                                />
                            </div>
                            <aside className="apkg-right">
                                <PackagePreview
                                    previewUrl={previewUrl} category={category}
                                    title={title} destination={destination}
                                    price={price} duration={duration}
                                    inclusions={inclusions} itinerary={itinerary}
                                    tourType={tourType}
                                    pax={pax}
                                    minPax={minPax}
                                />
                                <div className="apkg-actions">
                                    <button type="button" className="apkg-btn apkg-btn--cancel" onClick={handleCancel}>Cancel</button>
                                    <button type="submit" className="apkg-btn apkg-btn--submit" disabled={submitting}>
                                        {submitting ? "Publishing..." : "Publish"}
                                    </button>
                                </div>
                            </aside>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AddPackage;