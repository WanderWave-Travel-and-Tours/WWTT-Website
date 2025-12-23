import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar"; // Ensure this path is correct
import "./addpackage.css";

// Import the sub-components
import BasicInfo from "./BasicInfo";
import ImageUpload from "./ImageUpload";
import PricingCalculator from "./PricingCalculator";
import InclusionsList from "./InclusionsList";
import ItineraryBuilder from "./ItineraryBuilder";
import PackagePreview from "./PackagePreview";

const AddPackage = () => {
    // --- SIDEBAR TOGGLE LOGIC ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // --- STATE MANAGEMENT ---
    const [title, setTitle] = useState("");
    const [destination, setDestination] = useState("");
    const [supplierRate, setSupplierRate] = useState("");
    const [markupValue, setMarkupValue] = useState("");
    const [markupType, setMarkupType] = useState("peso");
    const [price, setPrice] = useState(""); // Calculated total price
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
    const navigate = useNavigate();

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
        
        if (supplierRate) {
            setPrice(parseFloat(supplierRate).toFixed(2));
        } else {
            setPrice("");
        }
    };

    // --- IMAGE HANDLERS ---
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
            if (isPasteActive) {
                handlePaste(e);
            }
        };

        document.addEventListener("paste", handleGlobalPaste);

        return () => {
            document.removeEventListener("paste", handleGlobalPaste);
        };
    }, [isPasteActive]);

    const activatePasteArea = () => {
        setIsPasteActive(true);
    };

    // --- INCLUSIONS HANDLERS ---
    const addInclusion = () => setInclusions([...inclusions, ""]);
    const removeInclusion = (i) =>
        setInclusions(inclusions.filter((_, idx) => idx !== i));
    const handleIncChange = (i, val) =>
        setInclusions(inclusions.map((item, idx) => (idx === i ? val : item)));

    // --- ITINERARY HANDLERS ---
    const addDay = () =>
        setItinerary([
            ...itinerary,
            { day: itinerary.length + 1, title: "", activities: [""] },
        ]);

    const removeDay = (dayIndex) => {
        setItinerary(
            itinerary
                .filter((_, index) => index !== dayIndex)
                .map((day, index) => {
                    const baseTitle = day.title.split(": ").slice(1).join(": ") || "";
                    return {
                        ...day,
                        day: index + 1,
                        title: baseTitle ? `Day ${index + 1}: ${baseTitle}` : "",
                    };
                })
        );
    };
    
    const handleDayTitle = (dayIndex, value) => {
        const trimmedValue = value.trim();
        const newTitle = trimmedValue ? `Day ${dayIndex + 1}: ${trimmedValue}` : "";
        setItinerary(
            itinerary.map((day, index) =>
                index === dayIndex ? { ...day, title: newTitle } : day
            )
        );
    };

    const addAct = (i) =>
        setItinerary(
            itinerary.map((d, idx) =>
                idx === i ? { ...d, activities: [...d.activities, ""] } : d
            )
        );
    const removeAct = (di, ai) =>
        setItinerary(
            itinerary.map((d, idx) =>
                idx === di
                    ? { ...d, activities: d.activities.filter((_, x) => x !== ai) }
                    : d
            )
        );
    const handleAct = (di, ai, val) =>
        setItinerary(
            itinerary.map((d, idx) =>
                idx === di
                    ? {
                          ...d,
                          activities: d.activities.map((a, x) => (x === ai ? val : a)),
                      }
                    : d
            )
        );

    // --- SUBMIT HANDLER ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const processedInclusions = inclusions.filter(
            (item) => item.trim().length > 0
        );
        const cleanedItinerary = itinerary
            .filter((day) => day.activities.some((act) => act.trim() !== ""))
            .map((day) => ({
                day: day.day,
                title: day.title.replace(/^Day \d+:? /, "") || day.title.trim(),
                activities: day.activities.filter((act) => act.trim() !== ""),
            }));

        const supplierRateNum = parseFloat(supplierRate) || 0;
        const markupValueNum = parseFloat(markupValue) || 0;
        
        let markupInPeso = 0;
        if (markupType === "percentage") {
            markupInPeso = (supplierRateNum * markupValueNum) / 100;
        } else {
            markupInPeso = markupValueNum;
        }
        
        markupInPeso = Math.round(markupInPeso * 100) / 100;

        const formData = new FormData();
        formData.append("title", title);
        formData.append("destination", destination);
        formData.append("sellerPrice", supplierRateNum.toString());
        formData.append("markup", markupInPeso.toString());
        formData.append("duration", duration);
        
        const categoryValue = category === "Local Tour" ? "Local" : "International";
        formData.append("category", categoryValue);
        
        formData.append("inclusions", JSON.stringify(processedInclusions));
        formData.append("itinerary", JSON.stringify(cleanedItinerary));

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
            });
            const data = await response.json();
            if (response.ok) {
                alert("✅ Package Added Successfully!");
                setTitle("");
                setDestination("");
                setSupplierRate("");
                setMarkupValue("");
                setPrice("");
                setDuration("");
                setCategory("Local Tour");
                setFile(null);
                setPreviewUrl(null);
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

    return (
        <div className="apkg-page">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className={`apkg-main ${isSidebarCollapsed ? 'collapsed-main' : ''}`}>
                <div className="apkg-container">
                    <header className="apkg-header">
                        <div className="apkg-header-content">
                            <h1 className="apkg-title">NEW PACKAGE</h1>
                            <p className="apkg-subtitle">
                                Fill in the details below to create a new tour package
                            </p>
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
                                    <button type="button" className="apkg-btn apkg-btn--cancel" onClick={() => navigate(-1)}>Cancel</button>
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