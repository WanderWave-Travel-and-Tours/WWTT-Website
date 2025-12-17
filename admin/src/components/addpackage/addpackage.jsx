import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar"; // Ensure this path is correct
import "./AddPackage.css";

// Import the new sub-components
import BasicInfo from "./BasicInfo";
import ImageUpload from "./ImageUpload";
import PricingCalculator from "./PricingCalculator";
import InclusionsList from "./InclusionsList";
import ItineraryBuilder from "./ItineraryBuilder";
import PackagePreview from "./PackagePreview";
// IMPORT: react-hot-toast for notifications
import toast, { Toaster } from 'react-hot-toast';

// NOTE: You must install this library first: npm install react-hot-toast

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
    // 1. Clean and validate the input based on all rules
    let cleanedValue = cleanNumberInput(value, 'supplierRate');
    
        setSupplierRate(cleanedValue);
        calculateTotalPrice(cleanedValue, markupValue, markupType);
    };

  const handleMarkupChange = (value) => {
    // Determine the fieldName to inform cleanNumberInput whether to apply the 6-digit limit (only for peso mode)
    const validationFieldName = markupType === 'peso' ? 'markupPeso' : 'markupPercentage';
    
    // 1. Clean and validate the input based on all rules (handles 6-digit limit for Peso mode)
    let cleanedValue = cleanNumberInput(value, validationFieldName);
    
    // 2. Enforce the 100% maximum for Percentage Mode
    if (markupType === "percentage") {
      const floatValue = parseFloat(cleanedValue);
      // Only allow value to be set if it's less than or equal to 100
      if (floatValue > 100) {
        return; 
      }
    }

    setMarkupValue(cleanedValue);
    calculateTotalPrice(supplierRate, cleanedValue, markupType);
  };

    const toggleMarkupType = () => {
        const newType = markupType === "percentage" ? "peso" : "percentage";
        setMarkupType(newType);
        setMarkupValue("");
        
    // Recalculate price based on supplier rate only when markup is reset
        if (supplierRate) {
            setPrice(parseFloat(supplierRate).toFixed(2));
        } else {
            setPrice("");
        }
    };

  // --- IMAGE UPLOAD VALIDATION START ---
    // --- IMAGE HANDLERS ---
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
    // Define allowed MIME types for .jpg, .jpeg, .png, and .webp
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (selected) {
      if (allowedTypes.includes(selected.type)) {
              setFile(selected);
              setPreviewUrl(URL.createObjectURL(selected));
      } else {
        // ERROR TOAST: English, Concise, Custom Style
        toast.error("Invalid file type. Only JPG, PNG, and WebP are allowed.", {
          style: { border: '1px solid #ef4444', color: '#ef4444' },
        });
        // Clear the file input and state to prevent the invalid file from being used
        e.target.value = null; 
        setFile(null);
        setPreviewUrl(null);
      }
            setIsPasteActive(false);
        }
    };

    const clearImage = () => {
        setFile(null);
        setPreviewUrl(null);
        setIsPasteActive(false);
    };
  // --- IMAGE UPLOAD VALIDATION END ---

    const handlePaste = (e) => {
        e.preventDefault();
        const items = e.clipboardData?.items;
    // Define allowed MIME types for paste
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob && allowedTypes.includes(blob.type)) {
            setFile(blob);
            setPreviewUrl(URL.createObjectURL(blob));
            setIsPasteActive(false);
            return; // Stop processing after finding and accepting one image
          } else if (blob) {
             // ERROR TOAST: English, Concise, Custom Style
             toast.error("Pasted image format not supported. Use JPG, PNG, or WebP.", {
                style: { border: '1px solid #ef4444', color: '#ef4444' },
             });
             setIsPasteActive(false);
             return;
          }
        }
      }
      // If code reaches here, it means nothing was pasted or it wasn't an image
      // ERROR TOAST: English, Concise, Custom Style
      toast.error("No valid image found in clipboard.", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
      });
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
          // Re-map title to correctly reflect the new day number
                        title: baseTitle ? `Day ${index + 1}: ${baseTitle}` : "",
                    };
                })
        );
    };
    
    const handleDayTitle = (dayIndex, value) => {
    // Construct the title with the Day X: prefix only if there's a title value
        const trimmedValue = value.trim();
        const newTitle = trimmedValue ? `Day ${dayIndex + 1}: ${trimmedValue}` : `Day ${dayIndex + 1}:`;
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
    // Clean up itinerary: remove days with no activities and remove the "Day X: " prefix from titles
        const cleanedItinerary = itinerary
            .filter((day) => day.activities.some((act) => act.trim() !== ""))
            .map((day) => ({
                day: day.day,
        // Remove the "Day X: " prefix from the title before sending
                // Clean the title by removing "Day N: " prefix
                title: day.title.replace(/^Day \d+:? /, "") || day.title.trim().replace(/^Day \d+:?/, ""),
                activities: day.activities.filter((act) => act.trim() !== ""),
            }));

    // Ensure values are parsed as numbers (they should be positive due to handlers)
        const supplierRateNum = parseFloat(supplierRate) || 0;
        const markupValueNum = parseFloat(markupValue) || 0;
    
    // Final check for 3-digit minimum (must be at least 100) before submission
    if (supplierRateNum < 100) {
      // ERROR TOAST: English, Concise, Custom Style
      toast.error("Supplier Rate must be at least ₱100.00.", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
      });
      return;
    }
        
        let markupInPeso = 0;
        if (markupType === "percentage") {
      // Calculate markup in peso based on percentage
            markupInPeso = (supplierRateNum * markupValueNum) / 100;
        } else {
      // Markup is already in peso
            markupInPeso = markupValueNum;
        }
        
    // Round markup to 2 decimal places for accurate storage
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
            // ERROR TOAST: English, Concise, Custom Style
      toast.error("Please upload a package cover image.", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
      });
            return;
        }

    try {
      const response = await fetch("http://localhost:5000/api/packages/add", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        // SUCCESS TOAST: English and Concise (Green Style)
        toast.success("Package Added Successfully!", {
            style: { border: '1px solid #22c55e', color: '#22c55e' }
        });
        // Reset form state on success
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
        setItinerary([{ day: 1, title: "Arrival", activities: [""] }]);
        setMarkupType("peso");
      } else {
        console.error("Server error:", data);
        // ERROR TOAST: English, Concise, Custom Style
        toast.error("Error adding package. Please check details.", {
            style: { border: '1px solid #ef4444', color: '#ef4444' },
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      // ERROR TOAST: English, Concise, Custom Style
      toast.error("Network error. Cannot connect to server.", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
      });
    }
  };

    return (
        <div className="apkg-page">
      {/* TOASTER COMPONENT ADDED FOR NOTIFICATIONS (top-center as requested) */}
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
      />
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className={`apkg-main ${isSidebarCollapsed ? 'collapsed-main' : ''}`}>
                <div className="apkg-container">
                    <header className="apkg-header">
                        <h1 className="apkg-title">NEW PACKAGE</h1>
                        <p className="apkg-subtitle">
                            Fill in the details below to create a new tour package
                        </p>
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
                                    title={title}
                                    setTitle={setTitle}
                                    destination={destination}
                                    setDestination={setDestination}
                                    duration={duration}
                                    setDuration={setDuration}
                                    category={category}
                                    setCategory={setCategory}
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
                                    previewUrl={previewUrl}
                                    category={category}
                                    title={title}
                                    destination={destination}
                                    price={price}
                                    duration={duration}
                                    inclusions={inclusions}
                                    itinerary={itinerary}
                                />
                                <div className="apkg-actions">
                                    <button
                                        type="button"
                                        className="apkg-btn apkg-btn--cancel"
                                        onClick={() => navigate(-1)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="apkg-btn apkg-btn--submit">
                                        Publish
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