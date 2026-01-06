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

const AddPackage = () => {
    // --- SIDEBAR TOGGLE ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const navigate = useNavigate();

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

    const pasteAreaRef = useRef(null);

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC START
    // =========================================================

    // 1. Helper: File <-> Base64 Converters
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

    // 2. Draft Payload State (Consolidates all state into one object)
    const [draftPayload, setDraftPayload] = useState(null);

    // 3. Listen to state changes and update Draft Payload
    useEffect(() => {
        const updateDraft = async () => {
            // 🛑 FIX: Check if form is completely empty/default before saving
            // This prevents saving a draft if the user just visited the page or cleared it
            const isFormEmpty = 
                !title && 
                !destination && 
                !supplierRate && 
                !markupValue && 
                !price && 
                !duration && 
                category === "Local Tour" && // Default
                (inclusions.length === 1 && inclusions[0] === "") && // Empty inclusions
                (itinerary.length === 1 && itinerary[0].title === "Day 1: Arrival" && itinerary[0].activities.length === 1 && itinerary[0].activities[0] === "") && // Default itinerary
                !file;

            if (isFormEmpty) {
                setDraftPayload(null); // Do not save anything
                return;
            }

            let imageBase64 = null;
            let imageMeta = null;

            // Handle Image Conversion
            if (file) {
                try {
                    // Limit draft image size to avoid LocalStorage crash (~3MB limit safety)
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
                image: imageBase64, // Saved as Base64 string
                imageMeta: imageMeta
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500); // Debounce slightly to prevent lag

        return () => clearTimeout(timeoutId);
    }, [title, destination, supplierRate, markupValue, markupType, price, duration, category, inclusions, itinerary, file]);

    // 4. Restore Function (How to put data back into state)
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

        // Restore Image
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

    // 5. Initialize Hook
    const { 
        clearDraft, 
        hasDraft, 
        restoreDraft, 
        discardDraft,
        draftInfo 
    } = useAutoDraft({
        module: 'add-package', // Unique ID for this form
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: previewUrl, 
        autoRestore: false // Manual via modal
    });

    // 6. Modal State
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        if (hasDraft) {
            setShowRestoreModal(true);
        }
    }, [hasDraft]);

    const handleRestoreDraft = () => {
        restoreDraft();
        setShowRestoreModal(false);
    };

    const handleDiscardDraft = async () => {
        await discardDraft(); // Ensure storage is cleared
        setShowRestoreModal(false);
    };

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

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
        }
    };

    const clearImage = () => {
        setFile(null);
        setPreviewUrl(null);
        setIsPasteActive(false);
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
    
    // PASTE HANDLER FOR MULTIPLE LINES
    const handleInclusionPaste = (index, e) => {
        const pastedText = e.clipboardData.getData('text');
        
        // Split by newlines and filter out empty lines
        const lines = pastedText.split(/\r?\n/).filter(line => line.trim());
        
        // If may multiple lines, prevent default and handle manually
        if (lines.length > 1) {
            e.preventDefault();
            
            // Remove ONLY checkmarks and bullet points, preserve other emojis
            const cleanedLines = lines.map(line => {
                // Remove only leading checkmarks/bullets (✓, ✔️, ☑️, •) and extra spaces
                return line.replace(/^[✓✔️☑️•\s]+/, '').trim();
            });
            
            // Create new inclusions array
            const newInclusions = [...inclusions];
            
            // Replace current item with first line
            newInclusions[index] = cleanedLines[0];
            
            // Add remaining lines after current index
            cleanedLines.slice(1).forEach(line => {
                newInclusions.splice(index + 1, 0, line);
                index++;
            });
            
            setInclusions(newInclusions);
        }
        // If single line, let default paste behavior happen
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

        // =========================================================
        // USER DATA HANDLING (GET USER INFO PARA SA LOGS)
        // =========================================================
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        console.log("👤 Admin Data Found:", adminData); 

        // Check kung email, username, or user ang key
        const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
        
        // IMPORTANT: Kapag null, wag na nating ipilit i-append na null value para di maging string na "null"
        // Pero dahil string based ang FormData, haandle natin to sa backend
        const activeId = adminData.id || adminData._id || "";

        formData.append("userEmail", activeUser);
        formData.append("adminId", activeId); 
        // =========================================================

        if (file) {
            formData.append("image", file);
        } else {
            alert("Please upload an image for the package.");
            return;
        }

        try {
            const response = await fetch("https://wanderwaveph-backend.onrender.com/api/packages/add", {
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
                alert("✅ Package Added Successfully!");
                
                // ✅ CLEAR DRAFT ON SUCCESS
                await clearDraft();

                // Reset Form
                setTitle(""); setDestination(""); setSupplierRate("");
                setMarkupValue(""); setPrice(""); setDuration("");
                setCategory("Local Tour"); setFile(null); setPreviewUrl(null);
                setInclusions([""]);
                setItinerary([{ day: 1, title: "Day 1: Arrival", activities: [""] }]);
                setMarkupType("peso");
            } else {
                console.error("Server error:", data);
                alert("❌ Error: " + (data.error || "Server error"));
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("❌ Error connecting to server");
        }
    };

    const handleCancel = async () => {
        if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            // ✅ CLEAR DRAFT ON CANCEL
            await clearDraft();
            navigate(-1);
        }
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
                                    <button type="submit" className="apkg-btn apkg-btn--submit">Publish</button>
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