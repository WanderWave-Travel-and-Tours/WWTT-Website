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

// ✅ Imports for Toast and Icons
import { useToast } from "../toast/ToastManager";
import { HelpCircle } from "lucide-react";

// --- CUSTOM CONFIRMATION MODAL COMPONENT ---
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
    if (!isOpen) return null;
    return (
      <div className="arc-confirm-overlay" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 11000
      }}>
        <div className="arc-confirm-modal" style={{
          backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
          maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={onCancel}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0',
                backgroundColor: 'white', cursor: 'pointer', fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none',
                backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6',
                color: 'white', cursor: 'pointer', fontWeight: '500'
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
};

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
    }, [title, destination, supplierRate, markupValue, markupType, price, duration, category, inclusions, itinerary, file]);

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

    const handleRestoreDraft = () => {
        restoreDraft();
        setShowRestoreModal(false);
        toast.info("Draft restored successfully.", "Draft");
    };

    const handleDiscardDraft = async () => {
        await discardDraft(); 
        setShowRestoreModal(false);
        toast.info("Draft discarded.");
    };

    // --- CALCULATIONS ---
    const calculateTotalPrice = useCallback((supplier, markup, type) => {
        const supplierValue = parseFloat(supplier) || 0;
        const markupVal = parseFloat(markup) || 0;

        if (supplierValue > 0 && markupVal > 0) {
            let total;
            if (type === "percentage") {
                total = supplierValue + supplierValue * (markupVal / 100);
            } else {
                total = supplierValue + markupVal;
            }
            setPrice(total.toFixed(2));
        } else if (supplierValue > 0) {
            setPrice(supplierValue.toFixed(2));
        } else {
            setPrice("");
        }
    }, []);

    const handleSupplierRateChange = (value) => {
        setSupplierRate(value);
        calculateTotalPrice(value, markupValue, markupType);
    };

    const handleMarkupChange = (value) => {
        setMarkupValue(value);
        calculateTotalPrice(supplierRate, value, markupType);
    };

    const toggleMarkupType = () => {
        const newType = markupType === "percentage" ? "peso" : "percentage";
        setMarkupType(newType);
        setMarkupValue("");
        if (supplierRate) setPrice(parseFloat(supplierRate).toFixed(2));
        else setPrice("");
    };

    // --- IMAGE & PASTE HANDLERS ---
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
            setIsPasteActive(false);
            toast.success("Image uploaded successfully.");
        }
    };

    const clearImage = () => {
        setFile(null);
        setPreviewUrl(null);
        setIsPasteActive(false);
        toast.info("Image removed.");
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const items = e.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        setFile(blob);
                        setPreviewUrl(URL.createObjectURL(blob));
                        setIsPasteActive(false);
                        toast.success("Image pasted successfully.");
                    }
                    break;
                }
            }
        }
    };

    useEffect(() => {
        const handleGlobalPaste = (e) => {
            if (isPasteActive) handlePaste(e);
        };
        document.addEventListener("paste", handleGlobalPaste);
        return () => document.removeEventListener("paste", handleGlobalPaste);
    }, [isPasteActive]);

    const activatePasteArea = () => setIsPasteActive(true);

    // --- LIST HANDLERS ---
    const addInclusion = () => setInclusions([...inclusions, ""]);
    const removeInclusion = (i) => setInclusions(inclusions.filter((_, idx) => idx !== i));
    const handleIncChange = (i, val) => setInclusions(inclusions.map((item, idx) => (idx === i ? val : item)));
    
    const handleInclusionPaste = (index, e) => {
        const pastedText = e.clipboardData.getData('text');
        const lines = pastedText.split(/\r?\n/).filter(line => line.trim());
        if (lines.length > 1) {
            e.preventDefault();
            const cleanedLines = lines.map(line => line.replace(/^[✓✔️☑️•\s]+/, '').trim());
            const newInclusions = [...inclusions];
            newInclusions[index] = cleanedLines[0];
            cleanedLines.slice(1).forEach(line => {
                newInclusions.splice(index + 1, 0, line);
                index++;
            });
            setInclusions(newInclusions);
        }
    };

    const addDay = () => setItinerary([...itinerary, { day: itinerary.length + 1, title: "", activities: [""] }]);
    const removeDay = (dayIndex) => {
        setItinerary(itinerary.filter((_, index) => index !== dayIndex).map((day, index) => {
            const baseTitle = day.title.split(": ").slice(1).join(": ") || "";
            return { ...day, day: index + 1, title: baseTitle ? `Day ${index + 1}: ${baseTitle}` : "" };
        }));
    };
    
    const handleDayTitle = (dayIndex, value) => {
        const trimmedValue = value.trim();
        const newTitle = trimmedValue ? `Day ${dayIndex + 1}: ${trimmedValue}` : "";
        setItinerary(itinerary.map((day, index) => index === dayIndex ? { ...day, title: newTitle } : day));
    };

    const addAct = (i) => setItinerary(itinerary.map((d, idx) => idx === i ? { ...d, activities: [...d.activities, ""] } : d));
    const removeAct = (di, ai) => setItinerary(itinerary.map((d, idx) => idx === di ? { ...d, activities: d.activities.filter((_, x) => x !== ai) } : d));
    const handleAct = (di, ai, val) => setItinerary(itinerary.map((d, idx) => idx === di ? { ...d, activities: d.activities.map((a, x) => (x === ai ? val : a)) } : d));

    // --- SUBMIT HANDLER ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validations using Toast
        if (!file) {
            toast.warning("Please upload an image for the package.", "Missing Image");
            return;
        }

        if (!title || !destination || !price) {
            toast.warning("Please fill in the basic package information.", "Missing Fields");
            return;
        }

        // Ask for confirmation before publishing
        askConfirmation(
            "Publish Package",
            "Are you sure you want to publish this new tour package?",
            () => performPublish()
        );
    };

    const performPublish = async () => {
        setSubmitting(true);
        const processedInclusions = inclusions.filter(item => item.trim().length > 0);
        const cleanedItinerary = itinerary.map((day, index) => {
            const titleWithoutPrefix = day.title.replace(/^Day \d+:\s*/, "").trim();
            return {
                day: index + 1, 
                title: titleWithoutPrefix || `Day ${index + 1}`,
                activities: day.activities.filter((act) => act.trim() !== "")
            };
        });

        const supplierRateNum = parseFloat(supplierRate) || 0;
        const markupValueNum = parseFloat(markupValue) || 0;
        let markupInPeso = markupType === "percentage" ? (supplierRateNum * markupValueNum) / 100 : markupValueNum;
        markupInPeso = Math.round(markupInPeso * 100) / 100;

        const formData = new FormData();
        formData.append("title", title);
        formData.append("destination", destination);
        formData.append("sellerPrice", supplierRateNum.toString());
        formData.append("markup", markupInPeso.toString());
        formData.append("duration", duration);
        formData.append("category", category === "Local Tour" ? "Local" : "International");
        formData.append("inclusions", JSON.stringify(processedInclusions));
        formData.append("itinerary", JSON.stringify(cleanedItinerary));
        formData.append("image", file);

        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
        const activeId = adminData.id || adminData._id || "";

        formData.append("userEmail", activeUser);
        formData.append("adminId", activeId); 

        try {
            const response = await fetch("http://localhost:5000/api/packages/add", {
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
                toast.success("Package published successfully!", "Success");
                await clearDraft();

                // Reset Form
                setTitle(""); setDestination(""); setSupplierRate("");
                setMarkupValue(""); setPrice(""); setDuration("");
                setCategory("Local Tour"); setFile(null); setPreviewUrl(null);
                setInclusions([""]);
                setItinerary([{ day: 1, title: "Day 1: Arrival", activities: [""] }]);
                setMarkupType("peso");
            } else {
                toast.error(data.error || "Failed to publish package.", "Server Error");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Error connecting to server.", "Connection Error");
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
                toast.info("Process cancelled.");
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
                                    title={title} setTitle={setTitle}
                                    destination={destination} setDestination={setDestination}
                                    duration={duration} setDuration={setDuration}
                                    category={category} setCategory={setCategory}
                                />
                                <PricingCalculator
                                    supplierRate={supplierRate}
                                    handleSupplierRateChange={handleSupplierRateChange}
                                    markupValue={markupValue}
                                    handleMarkupChange={handleMarkupChange}
                                    markupType={markupType}
                                    toggleMarkupType={toggleMarkupType}
                                    price={price}
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