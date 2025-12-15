import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import "./addpackage.css";
// IMPORT: react-hot-toast for notifications
import toast, { Toaster } from 'react-hot-toast';

// NOTE: You must install this library first: npm install react-hot-toast

const AddPackage = () => {

    // --- SIDEBAR TOGGLE LOGIC START ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    // --- SIDEBAR TOGGLE LOGIC END ---

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
    { day: 1, title: "Arrival", activities: [""] },
  ]);
  const [isPasteActive, setIsPasteActive] = useState(false);

  const pasteAreaRef = useRef(null);
  const navigate = useNavigate();

  const calculateTotalPrice = (supplier, markup, type) => {
    // Ensure inputs are safe numbers
    const supplierValue = parseFloat(supplier) || 0;
    const markupVal = parseFloat(markup) || 0;

    if (supplierValue > 0) {
      let total;
      // Only calculate if markup is a valid positive number
      if (markupVal > 0) {
        if (type === "percentage") {
          total = supplierValue + supplierValue * (markupVal / 100);
        } else {
          total = supplierValue + markupVal;
        }
        setPrice(total.toFixed(2));
      } else {
        // No markup, price is just the supplier rate
        setPrice(supplierValue.toFixed(2));
      }
    } else {
      setPrice("");
    }
  };
  
  /**
   * Utility to clean and validate number inputs for price fields.
   * - Rejects signs (e.g., -, +) and non-numeric characters.
   * - Removes leading zeros (e.g., '0123' becomes '123').
   * - Enforces 6-digit max for the integer part where specified ('supplierRate' and 'markupPeso').
   */
  const cleanNumberInput = (value, fieldName) => {
    if (value === '') return '';

    // 1. Remove signs and non-numeric characters (except for the first decimal point)
    let cleaned = value.replace(/[^0-9.]/g, '');

    // Handle multiple decimal points (keep only the first one)
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Re-split after cleaning signs
    let [integerPart, decimalPart] = cleaned.split('.');

    // 2. Reject leading zeros (e.g., '0123' should be '123')
    if (integerPart.length > 1 && integerPart.startsWith('0')) {
      // Remove all leading zeros until a non-zero digit is found, or leave '0' if input was all zeros
      integerPart = integerPart.replace(/^0+(?=\d)/, ''); 
      if (integerPart === '') integerPart = '0'; // Handles case where input was '000'
    }

    // 3. Enforce 6-digit maximum for the integer part 
    // This applies to 'supplierRate' and 'markupPeso' (when in Peso Mode)
    if ((fieldName === 'supplierRate' || fieldName === 'markupPeso') && integerPart.length > 6) {
      integerPart = integerPart.substring(0, 6);
    }
    
    // 4. Enforce 2 decimal places max
    if (decimalPart !== undefined && decimalPart.length > 2) {
      decimalPart = decimalPart.substring(0, 2);
    }

    // Recombine
    return integerPart + (decimalPart !== undefined ? '.' + decimalPart : '');
  };

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
    }
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
      if (isPasteActive && pasteAreaRef.current) {
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
    if (pasteAreaRef.current) {
      pasteAreaRef.current.focus();
    }
  };

  const addInclusion = () => setInclusions([...inclusions, ""]);
  const removeInclusion = (i) =>
    setInclusions(inclusions.filter((_, idx) => idx !== i));
  const handleIncChange = (i, val) =>
    setInclusions(inclusions.map((item, idx) => (idx === i ? val : item)));

  const addDay = () =>
    setItinerary([
      ...itinerary,
      { day: itinerary.length + 1, title: "", activities: [""] },
  ]);

  const removeDay = (dayIndex) => {
    setItinerary(
      itinerary
        .filter((_, index) => index !== dayIndex)
        .map((day, index) => ({
          ...day,
          day: index + 1,
          // Re-map title to correctly reflect the new day number
          title: day.title.replace(/^Day \d+:?/, `Day ${index + 1}:`),
        }))
    );
  };
  
  const handleDayTitle = (dayIndex, value) => {
    // Construct the title with the Day X: prefix only if there's a title value
    const newTitle = value.trim() ? `Day ${dayIndex + 1}: ${value.trim()}` : `Day ${dayIndex + 1}:`;
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
        title: day.title.split(": ").slice(1).join(": ") || day.title.trim().replace(/^Day \d+:?/, ""),
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

    console.log('📊 Frontend Debug:', {
      supplierRate: supplierRateNum,
      markupValue: markupValueNum,
      markupType,
      markupInPeso,
      expectedTotal: supplierRateNum + markupInPeso
    });

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
    <div className="addpkg-page">
      {/* TOASTER COMPONENT ADDED FOR NOTIFICATIONS (top-center as requested) */}
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
      />
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      <main className={`addpkg-main ${isSidebarCollapsed ? 'collapsed-main' : ''}`}>
        <div className="addpkg-container">
          <header className="addpkg-header">
            <h1 className="addpkg-title">NEW PACKAGE</h1>
            <p className="addpkg-subtitle">
              Fill in the details below to create a new tour package
            </p>
          </header>

          <form onSubmit={handleSubmit} className="addpkg-form">
            <div className="addpkg-grid">
              <div className="addpkg-left">
                <section className="addpkg-section">
                  <h2 className="addpkg-section-title">COVER IMAGE</h2>

                  {previewUrl ? (
                    <div className="addpkg-upload-preview-container">
                      <div className="addpkg-upload-preview">
                        <img src={previewUrl} alt="Cover" />
                        <div className="addpkg-upload-actions">
                          <label className="addpkg-upload-change-btn">
                            <input
                              type="file"
                              onChange={handleFileChange}
                              // UPDATED: Added required image formats
                              accept="image/jpeg,image/png,image/webp" 
                              hidden
                            />
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Change
                          </label>
                          <button
                            type="button"
                            className="addpkg-upload-paste-btn"
                            onClick={activatePasteArea}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Paste
                          </button>
                          <button
                            type="button"
                            className="addpkg-upload-remove-btn"
                            onClick={() => {
                              setFile(null);
                              setPreviewUrl(null);
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="addpkg-upload-options">
                      <label className="addpkg-upload addpkg-upload-click">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          // UPDATED: Added required image formats
                          accept="image/jpeg,image/png,image/webp" 
                          hidden
                          required
                        />
                        <div className="addpkg-upload-empty">
                          <div className="addpkg-upload-icon">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </div>
                          <p>Click to upload</p>
                          <span>JPG, JPEG, PNG or WebP</span>
                        </div>
                      </label>

                      <div className="addpkg-upload-divider">
                        <span>OR</span>
                      </div>

                      <div
                        ref={pasteAreaRef}
                        className={`addpkg-upload-paste ${
                          isPasteActive ? "active" : ""
                        }`}
                        onClick={activatePasteArea}
                        onBlur={() => setIsPasteActive(false)}
                        tabIndex={0}
                      >
                        <div className="addpkg-upload-paste-content">
                          <div className="addpkg-upload-icon">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path
                                d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <p>Paste screenshot</p>
                          <span>Press Ctrl+V (Windows) or Cmd+V (Mac)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <section className="addpkg-section">
                  <h2 className="addpkg-section-title">BASIC INFORMATION</h2>
                  <div className="addpkg-fields">
                    <div className="addpkg-field addpkg-field--full">
                      <label>Package Name</label>
                      <input
                        type="text"
                        placeholder="Enter package name"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="addpkg-field addpkg-field--full">
                      <label>Destination</label>
                      <input
                        type="text"
                        placeholder="e.g. Boracay, Philippines"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required
                      />
                    </div>
                    <div className="addpkg-field">
                      <label>Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 3D2N"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                      />
                    </div>
                    <div className="addpkg-field">
                      <label>Tour Type</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="Local Tour">Local Tour</option>
                        <option value="International Tour">International Tour</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="addpkg-section">
                  <h2 className="addpkg-section-title">PRICING</h2>
                  <div className="addpkg-pricing-layout">
                    <div className="addpkg-pricing-inputs">
                      <div className="addpkg-field">
                        <label>Supplier Rate (PHP)</label>
                        {/* Changed to type="text" for full control of input cleaning/validation */}
                        <input
                          type="text"
                          placeholder="Min ₱100.00 | Max 6 digits"
                          value={supplierRate}
                          // Use onInput/onChange to call the validation handler
                          onChange={(e) =>
                            handleSupplierRateChange(e.target.value)
                          }
                          onBlur={() => { // Apply min 100 on blur (final check)
                            const numericRate = parseFloat(supplierRate);
                            if (numericRate > 0 && numericRate < 100) {
                              setSupplierRate("100");
                              calculateTotalPrice("100", markupValue, markupType);
                            } else if (supplierRate === '0' || supplierRate === '.') {
                              setSupplierRate(''); // Clear if 0 or only dot on blur
                              calculateTotalPrice("", markupValue, markupType);
                            }
                          }}
                          required
                          inputMode="decimal"
                        />
                      </div>
                      <div className="addpkg-field">
                        <label>
                          Markup 
                          <span style={{
                            marginLeft: '8px',
                            padding: '3px 8px',
                            background: markupType === "percentage" ? '#fef3c7' : '#dcfce7',
                            color: markupType === "percentage" ? '#92400e' : '#166534',
                            borderRadius: '4px',
                            fontSize: '0.75em',
                            fontWeight: 'bold'
                          }}>
                            {markupType === "percentage" ? "% MODE" : "₱ PESO MODE"}
                          </span>
                        </label>
                        <div className="addpkg-field-with-toggle">
                          {/* Changed to type="text" for full control of input cleaning/validation */}
                          <input
                            type="text"
                            placeholder={
                              // UPDATED PLACEHOLDER to reflect the 6-digit limit in Peso mode and 100% in Percentage mode
                              markupType === "percentage" ? "Enter percentage amount (Max 100%)" : "Enter peso amount (Max 6 digits)" 
                            }
                            value={markupValue}
                            onChange={(e) => handleMarkupChange(e.target.value)}
                            onBlur={() => { // Clear if 0 or empty on blur
                                if (markupValue === '0' || markupValue === '.') {
                                    setMarkupValue('');
                                    calculateTotalPrice(supplierRate, "", markupType);
                                }
                            }}
                            required
                            inputMode="decimal"
                          />
                          <button
                            type="button"
                            className="addpkg-toggle-markup"
                            onClick={toggleMarkupType}
                            title={`Switch to ${
                              markupType === "percentage"
                                ? "Peso"
                                : "Percentage"
                            }`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="addpkg-total-price-box">
                      <div className="addpkg-total-price-content">
                        <div className="addpkg-total-price-label">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          TOTAL SELLING PRICE
                        </div>
                        <div className="addpkg-total-price-amount">
                          ₱
                          {price
                            ? Number(price).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "0.00"}
                        </div>
                        <div className="addpkg-total-price-breakdown">
                          {supplierRate && price && price !== "0.00" ? (
                            <>
                              <span>
                                ₱{Number(supplierRate).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span className="addpkg-plus">+</span>
                              <span>
                                {markupType === "percentage"
                                  ? `${Number(markupValue).toLocaleString("en-US", {
                                      maximumFractionDigits: 2,
                                    })}% (₱${(
                                      (parseFloat(supplierRate) *
                                        parseFloat(markupValue)) /
                                      100
                                    ).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })})`
                                  : `₱${Number(markupValue).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}`}
                              </span>
                            </>
                          ) : (
                            <span className="addpkg-breakdown-empty">
                              Enter supplier rate and markup to calculate
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="addpkg-section">
                  <div className="addpkg-section-header">
                    <h2 className="addpkg-section-title">INCLUSIONS</h2>
                    <span className="addpkg-count">
                      {inclusions.filter((i) => i.trim()).length} items
                    </span>
                  </div>
                  <div className="addpkg-list">
                    {inclusions.map((inc, i) => (
                      <div key={i} className="addpkg-list-item">
                        <span className="addpkg-bullet"></span>
                        <input
                          type="text"
                          placeholder="What's included?"
                          value={inc}
                          onChange={(e) => handleIncChange(i, e.target.value)}
                        />
                        {inclusions.length > 1 && (
                          <button
                            type="button"
                            className="addpkg-remove"
                            onClick={() => removeInclusion(i)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                d="M18 6L6 18M6 6l12 12"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="addpkg-add-btn"
                    onClick={addInclusion}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Add Item
                  </button>
                </section>

                <section className="addpkg-section">
                  <div className="addpkg-section-header">
                    <h2 className="addpkg-section-title">ITINERARY</h2>
                    <span className="addpkg-count">{itinerary.length} days</span>
                  </div>
                  <div className="addpkg-timeline">
                    {itinerary.map((day, dayIdx) => (
                      <div key={day.day} className="addpkg-day">
                        <div className="addpkg-day-marker">
                          <span className="addpkg-day-num">{day.day}</span>
                          {dayIdx < itinerary.length - 1 && (
                            <div className="addpkg-day-line"></div>
                          )}
                        </div>
                        <div className="addpkg-day-content">
                          <div className="addpkg-day-header">
                            <input
                              type="text"
                              className="addpkg-day-title"
                              placeholder="Day title"
                              // Show title without "Day X: " prefix in the input box
                              value={day.title.replace(`Day ${day.day}: `, "")}
                              onChange={(e) =>
                                handleDayTitle(dayIdx, e.target.value)
                              }
                              required
                            />
                            {itinerary.length > 1 && (
                              <button
                                type="button"
                                className="addpkg-day-remove"
                                onClick={() => removeDay(dayIdx)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <div className="addpkg-activities">
                            {day.activities.map((act, actIdx) => (
                              <div key={actIdx} className="addpkg-activity">
                                <input
                                  type="text"
                                  placeholder="Add activity"
                                  value={act}
                                  onChange={(e) =>
                                    handleAct(dayIdx, actIdx, e.target.value)
                                  }
                                />
                                {day.activities.length > 1 && (
                                  <button
                                    type="button"
                                    className="addpkg-remove addpkg-remove--sm"
                                    onClick={() => removeAct(dayIdx, actIdx)}
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path
                                        d="M18 6L6 18M6 6l12 12"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              className="addpkg-add-activity"
                              onClick={() => addAct(dayIdx)}
                            >
                              + Activity
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="addpkg-add-btn"
                    onClick={addDay}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Add Day
                  </button>
                </section>
              </div>

              <aside className="addpkg-right">
                <div className="addpkg-preview">
                  <span className="addpkg-preview-label">PREVIEW</span>
                  <div className="addpkg-card">
                    <div className="addpkg-card-image">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" />
                      ) : (
                        <span>No Image</span>
                      )}
                    </div>
                    <div className="addpkg-card-body">
                      <span className="addpkg-card-badge">{category}</span>
                      <h3 className="addpkg-card-title">
                        {title || "Package Name"}
                      </h3>
                      <p className="addpkg-card-location">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {destination || "Destination"}
                      </p>
                      <div className="addpkg-card-divider"></div>
                      <div className="addpkg-card-meta">
                        <div>
                          <span>Price</span>
                          <strong>
                            ₱{price ? Number(price).toLocaleString("en-US", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }) : "0"}
                          </strong>
                        </div>
                        <div>
                          <span>Duration</span>
                          <strong>{duration || "--"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="addpkg-stats">
                    <div className="addpkg-stat">
                      <strong>
                        {inclusions.filter((i) => i.trim()).length}
                      </strong>
                      <span>Inclusions</span>
                    </div>
                    <div className="addpkg-stat">
                      <strong>{itinerary.length}</strong>
                      <span>Days</span>
                    </div>
                    <div className="addpkg-stat">
                      <strong>
                        {itinerary.reduce(
                          (a, d) =>
                            a + d.activities.filter((x) => x.trim()).length,
                          0
                        )}
                      </strong>
                      <span>Activities</span>
                    </div>
                  </div>
                </div>
                <div className="addpkg-actions">
                  <button
                    type="button"
                    className="addpkg-btn addpkg-btn--cancel"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="addpkg-btn addpkg-btn--submit">
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