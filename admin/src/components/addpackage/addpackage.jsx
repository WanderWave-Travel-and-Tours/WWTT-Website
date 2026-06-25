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
    const toast = useToast();

    // --- STATE ---
    const [destination, setDestination] = useState("");
    const [supplierRate, setSupplierRate] = useState("");
    const [markupValue, setMarkupValue] = useState("");
    const [markupType, setMarkupType] = useState("peso");
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState("");
    const [category, setCategory] = useState("Local Tour");
    
    // ✅ Tour Type State — now uses tag-based string (e.g. "Solo", "Min of 2 pax", etc.)
    const [tourType, setTourType] = useState("Solo");
    const [pax, setPax] = useState(""); // Kept for backward compatibility
    const [minPax, setMinPax] = useState(""); // Kept for backward compatibility

    // ✅ Pax Mode — for PricingCalculator pricing mode toggle
    const [paxMode, setPaxMode] = useState("multiple"); // "solo" or "multiple"

    // ✅ Solo and Multiple Pax Price fields
    // soloPaxPrice     — computed selling price for a 1-person booking (saved to DB as Number | null)
    // multiplePaxPrice — computed selling price for a group/multiple-person booking (saved to DB as Number | null)
    const [soloPaxPrice, setSoloPaxPrice] = useState("");
    const [multiplePaxPrice, setMultiplePaxPrice] = useState("");

    // ✅ Solo Pax Pricing Breakdown — supplier rate + markup per pax type
    // These drive the computed soloPaxPrice value (same pattern as main pricing)
    const [soloSupplierRate, setSoloSupplierRate] = useState("");
    const [soloMarkupValue, setSoloMarkupValue] = useState("");
    const [soloMarkupType, setSoloMarkupType] = useState("peso");

    // ✅ Multiple Pax Pricing Breakdown — supplier rate + markup per pax type
    // These drive the computed multiplePaxPrice value
    const [multipleSupplierRate, setMultipleSupplierRate] = useState("");
    const [multipleMarkupValue, setMultipleMarkupValue] = useState("");
    const [multipleMarkupType, setMultipleMarkupType] = useState("peso");
    
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [inclusions, setInclusions] = useState([""]);
    const [itinerary, setItinerary] = useState([
        { day: 1, title: "Arrival", activities: [""] },
    ]);
    const [isPasteActive, setIsPasteActive] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
                !destination && 
                !supplierRate && 
                !markupValue && 
                !price && 
                !duration && 
                category === "Local Tour" && 
                (inclusions.length === 1 && inclusions[0] === "") && 
                (itinerary.length === 1 && itinerary[0].title === "Arrival" && itinerary[0].activities.length === 1 && itinerary[0].activities[0] === "") && 
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
                paxMode,
                soloPaxPrice,           // ✅ included in draft
                multiplePaxPrice,       // ✅ included in draft
                // ✅ Pax pricing breakdown — included in draft
                soloSupplierRate,
                soloMarkupValue,
                soloMarkupType,
                multipleSupplierRate,
                multipleMarkupValue,
                multipleMarkupType,
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
    }, [
        destination, supplierRate, markupValue, markupType,
        price, duration, category, tourType, pax, minPax,
        paxMode, soloPaxPrice, multiplePaxPrice, // ✅
        // ✅ Pax pricing breakdown deps
        soloSupplierRate, soloMarkupValue, soloMarkupType,
        multipleSupplierRate, multipleMarkupValue, multipleMarkupType,
        inclusions, itinerary, file
    ]);

    const restoreDraftData = async (data) => {
        if (!data) return;

        setDestination(data.destination || "");
        setSupplierRate(data.supplierRate || "");
        setMarkupValue(data.markupValue || "");
        setMarkupType(data.markupType || "peso");
        setPrice(data.price || "");
        setDuration(data.duration || "");
        setCategory(data.category || "Local Tour");
        setTourType(data.tourType || "Solo");
        setPax(data.pax || "");
        setMinPax(data.minPax || "");
        setPaxMode(data.paxMode || "multiple");
        setSoloPaxPrice(data.soloPaxPrice || "");         // ✅ restored from draft
        setMultiplePaxPrice(data.multiplePaxPrice || ""); // ✅ restored from draft
        // ✅ Restore pax pricing breakdown from draft
        setSoloSupplierRate(data.soloSupplierRate || "");
        setSoloMarkupValue(data.soloMarkupValue || "");
        setSoloMarkupType(data.soloMarkupType || "peso");
        setMultipleSupplierRate(data.multipleSupplierRate || "");
        setMultipleMarkupValue(data.multipleMarkupValue || "");
        setMultipleMarkupType(data.multipleMarkupType || "peso");
        setInclusions(data.inclusions || [""]);
        setItinerary(data.itinerary || [{ day: 1, title: "Arrival", activities: [""] }]);

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

    // --- PRICING ---

    // ✅ Central price computation — supplierRate + markup only, NO pax multiplier
    // The pax count shown in the breakdown is display-only and does not affect the stored price
    const computePrice = (supplierRateVal, markupVal, markupTypeVal) => {
        const supplierRateNum = Number(supplierRateVal) || 0;
        const markupValueNum = Number(markupVal) || 0;

        const markupInPeso = markupTypeVal === "percentage"
            ? (supplierRateNum * markupValueNum) / 100
            : markupValueNum;

        return Math.round((supplierRateNum + markupInPeso) * 100) / 100;
    };

    const handleSupplierRateChange = (e) => {
        const value = e.target.value;
        if (value === "" || !isNaN(value)) {
            setSupplierRate(value);
            const total = computePrice(value, markupValue, markupType);
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
        const total = computePrice(supplierRate, mValue, mType);
        setPrice(total.toString());
    };

    // ✅ Solo Pax Pricing — supplier rate + markup handlers
    // Mirrors the main pricing pattern: each field change recomputes soloPaxPrice
    const handleSoloSupplierRateChange = (e) => {
        const value = e.target.value;
        if (value === "" || !isNaN(value)) {
            setSoloSupplierRate(value);
            const computed = computePrice(value, soloMarkupValue, soloMarkupType);
            setSoloPaxPrice(computed > 0 ? computed.toString() : "");
        }
    };

    const handleSoloMarkupChange = (e) => {
        const value = e.target.value;
        if (value === "" || !isNaN(value)) {
            setSoloMarkupValue(value);
            const computed = computePrice(soloSupplierRate, value, soloMarkupType);
            setSoloPaxPrice(computed > 0 ? computed.toString() : "");
        }
    };

    const toggleSoloMarkupType = () => {
        const newType = soloMarkupType === "peso" ? "percentage" : "peso";
        setSoloMarkupType(newType);
        const computed = computePrice(soloSupplierRate, soloMarkupValue, newType);
        setSoloPaxPrice(computed > 0 ? computed.toString() : "");
    };

    // ✅ Multiple Pax Pricing — supplier rate + markup handlers
    // Mirrors the main pricing pattern: each field change recomputes multiplePaxPrice
    const handleMultipleSupplierRateChange = (e) => {
        const value = e.target.value;
        if (value === "" || !isNaN(value)) {
            setMultipleSupplierRate(value);
            const computed = computePrice(value, multipleMarkupValue, multipleMarkupType);
            setMultiplePaxPrice(computed > 0 ? computed.toString() : "");
        }
    };

    const handleMultipleMarkupChange = (e) => {
        const value = e.target.value;
        if (value === "" || !isNaN(value)) {
            setMultipleMarkupValue(value);
            const computed = computePrice(multipleSupplierRate, value, multipleMarkupType);
            setMultiplePaxPrice(computed > 0 ? computed.toString() : "");
        }
    };

    const toggleMultipleMarkupType = () => {
        const newType = multipleMarkupType === "peso" ? "percentage" : "peso";
        setMultipleMarkupType(newType);
        const computed = computePrice(multipleSupplierRate, multipleMarkupValue, newType);
        setMultiplePaxPrice(computed > 0 ? computed.toString() : "");
    };

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

    // ✅ UPDATED: Smart Paste for Inclusions
    const handleInclusionPaste = (index, e) => {
        const pastedText = e.clipboardData.getData("text");
        const lines = pastedText.split(/\r?\n/).filter((line) => line.trim());

        if (lines.length > 1) {
            e.preventDefault();
            const cleanedLines = lines.map((line) => {
                return line.replace(/^[✓✔️☑️•\-\s]+/, "").trim();
            });

            const newInclusions = [...inclusions];
            newInclusions[index] = cleanedLines[0];

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
        // Store raw user input only — prefix "Day N: " is added at submit time in cleanedItinerary
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

    // ✅ Smart Paste for Itinerary Activities
    const handleActivityPaste = (dayIndex, actIndex, e) => {
        const pastedText = e.clipboardData.getData("text");
        const lines = pastedText.split(/\r?\n/).filter((line) => line.trim());

        if (lines.length > 1) {
            e.preventDefault();
            const cleanedLines = lines.map((line) => {
                return line.replace(/^[✓✔️☑️•\-\s]+/, "").trim();
            });

            const updatedItinerary = [...itinerary];
            updatedItinerary[dayIndex].activities[actIndex] = cleanedLines[0];

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
        setItinerary([...itinerary, { 
            day: nextDay, 
            title: "",   // prefix "Day N: " is added at submit time; display shows raw title
            activities: [""] 
        }]);
    };

    const removeDay = (dayIndex) => {
        const updated = itinerary.filter((_, i) => i !== dayIndex);
        const renumbered = updated.map((d, i) => ({ ...d, day: i + 1 }));
        setItinerary(renumbered.length ? renumbered : [{ day: 1, title: "Arrival", activities: [""] }]);
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

        if (!destination.trim() || !supplierRate || !duration || !category) {
            toast.warning("Please fill in all required fields.", "Missing Fields");
            setSubmitting(false);
            return;
        }

        if (!tourType || !tourType.trim()) {
            toast.warning("Please select a tour type.", "Missing Tour Type");
            setSubmitting(false);
            return;
        }

        // ✅ Validate pax and minPax based on tourType (backward compat — only fires for legacy 'private'/'joiners' values)
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

        const cleanedItinerary = itinerary
            .map((d, idx) => ({
                day: d.day || (idx + 1),
                // Add "Day N: " prefix here — title in state is stored WITHOUT prefix
                title: d.title?.trim()
                    ? `Day ${d.day || (idx + 1)}: ${d.title.trim()}`
                    : `Day ${d.day || (idx + 1)}`,
                activities: d.activities
                    .map(a => a?.trim())
                    .filter(a => a && a.length > 0)
            }))
            .filter(d => d.activities.length > 0 || d.title.trim() !== `Day ${d.day}`);

        console.log("=== ITINERARY BEFORE SUBMIT ===");
        console.log("Raw itinerary state:", JSON.stringify(itinerary, null, 2));
        console.log("Cleaned itinerary:", JSON.stringify(cleanedItinerary, null, 2));

        if (cleanedItinerary.length === 0) {
            toast.warning("Please add at least one day with activities.", "Missing Itinerary");
            setSubmitting(false);
            return;
        }

        const supplierRateNum = Number(supplierRate) || 0;
        const markupValueNum = Number(markupValue) || 0;
        let markupInPeso = markupType === "percentage" 
            ? (supplierRateNum * markupValueNum) / 100 
            : markupValueNum;
        markupInPeso = Math.round(markupInPeso * 100) / 100;

        // ✅ Build the full formatted title: "{duration} {destination} {tourType}"
        // e.g. "3D2N BOHOL Solo" | "4D3N TOKYO, JAPAN Min of 2 pax (Exclusive Tour)"
        const formattedTitle = [duration, destination, tourType]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Package';

        const formData = new FormData();
        formData.append("title", formattedTitle);
        formData.append("destination", destination);
        formData.append("sellerPrice", supplierRateNum.toString());
        formData.append("markup", markupInPeso.toString());
        formData.append("duration", duration);
        formData.append("category", category === "Local Tour" ? "Local" : "International");
        formData.append("tourType", tourType);
        formData.append("markupType", markupType === "percentage" ? "percentage" : "fixed");
        
        // ✅ Append pax or minPax based on tourType (backward compat)
        if (tourType === "private") {
            formData.append("pax", parseInt(pax));
        } else if (tourType === "joiners") {
            formData.append("minPax", parseInt(minPax));
        }

        // ✅ Append soloPaxPrice and multiplePaxPrice
        // Always send the raw value string; parsePaxPrice() on the backend converts "" to null
        formData.append("soloPaxPrice", soloPaxPrice !== undefined && soloPaxPrice !== null ? String(soloPaxPrice) : "");
        formData.append("multiplePaxPrice", multiplePaxPrice !== undefined && multiplePaxPrice !== null ? String(multiplePaxPrice) : "");
        
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
            });
            
            const data = await response.json();
            
            if (response.ok) {
                toast.success(
                    `"${formattedTitle}" has been published successfully!`,
                    "Package Published",
                    4000
                );
                
                await clearDraft();
                
                setDestination("");
                setSupplierRate("");
                setMarkupValue("");
                setPrice("");
                setDuration("");
                setCategory("Local Tour");
                setTourType("Solo");
                setPax("");
                setMinPax("");
                setPaxMode("multiple");
                setSoloPaxPrice("");            // ✅ reset on success
                setMultiplePaxPrice("");        // ✅ reset on success
                // ✅ Reset pax pricing breakdown on success
                setSoloSupplierRate("");
                setSoloMarkupValue("");
                setSoloMarkupType("peso");
                setMultipleSupplierRate("");
                setMultipleMarkupValue("");
                setMultipleMarkupType("peso");
                setFile(null);
                setPreviewUrl(null);
                setInclusions([""]);
                setItinerary([{ day: 1, title: "Arrival", activities: [""] }]);
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

            {/* ✅ CUSTOM CONFIRMATION MODAL */}
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
                                    paxMode={paxMode}
                                    onPaxModeChange={setPaxMode}
                                    tourType={tourType}
                                    pax={pax}
                                    minPax={minPax}
                                    // ✅ Solo pax pricing breakdown props
                                    soloPaxPrice={soloPaxPrice}
                                    soloSupplierRate={soloSupplierRate}
                                    handleSoloSupplierRateChange={handleSoloSupplierRateChange}
                                    soloMarkupValue={soloMarkupValue}
                                    handleSoloMarkupChange={handleSoloMarkupChange}
                                    soloMarkupType={soloMarkupType}
                                    toggleSoloMarkupType={toggleSoloMarkupType}
                                    // ✅ Multiple pax pricing breakdown props
                                    multiplePaxPrice={multiplePaxPrice}
                                    multipleSupplierRate={multipleSupplierRate}
                                    handleMultipleSupplierRateChange={handleMultipleSupplierRateChange}
                                    multipleMarkupValue={multipleMarkupValue}
                                    handleMultipleMarkupChange={handleMultipleMarkupChange}
                                    multipleMarkupType={multipleMarkupType}
                                    toggleMultipleMarkupType={toggleMultipleMarkupType}
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
                                    title={null} destination={destination}
                                    price={price} duration={duration}
                                    inclusions={inclusions} itinerary={itinerary}
                                    tourType={tourType}
                                    pax={pax}
                                    minPax={minPax}
                                    paxMode={paxMode}
                                    // ✅ Pass solo and multiple pax prices to PackagePreview
                                    soloPaxPrice={soloPaxPrice}
                                    multiplePaxPrice={multiplePaxPrice}
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