import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import "./addtours.css";

const AddTour = () => {
  // --- SIDEBAR LOGIC START ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  // --- SIDEBAR LOGIC END ---

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [supplierRate, setSupplierRate] = useState("");
  const [markupValue, setMarkupValue] = useState("");
  const [markupType, setMarkupType] = useState("peso");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("Local");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [inclusions, setInclusions] = useState([""]);
  const [isPasteActive, setIsPasteActive] = useState(false);

  const pasteAreaRef = useRef(null);
  const navigate = useNavigate();

  const calculateTotalPrice = (supplier, markup, type) => {
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
  };

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

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const processedInclusions = inclusions.filter(
      (item) => item.trim().length > 0
    );

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
    formData.append("category", category); // Local or International
    
    formData.append("inclusions", JSON.stringify(processedInclusions));

    if (file) {
      formData.append("image", file);
    } else {
      alert("Please upload an image for the tour.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/tours/add", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        alert("✅ Tour Added Successfully!");
        setTitle("");
        setDestination("");
        setSupplierRate("");
        setMarkupValue("");
        setPrice("");
        setDuration("");
        setCategory("Local");
        setFile(null);
        setPreviewUrl(null);
        setInclusions([""]);
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
    <div className="pkg-page">
      {/* 1. Pass the state and toggle function to Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      
      {/* 2. Apply conditional class to the main content */}
      <main className={`pkg-main ${
        isSidebarCollapsed ? "pkg-main--collapsed" : ""
      }`}>
        <div className="pkg-container">
          <header className="pkg-header">
            <h1 className="pkg-title">NEW TOUR</h1>
            <p className="pkg-subtitle">
              Add a new destination tour offer
            </p>
          </header>

          <form onSubmit={handleSubmit} className="pkg-form">
            <div className="pkg-grid">
              <div className="pkg-left">
                <section className="pkg-section">
                  <h2 className="pkg-section-title">COVER IMAGE</h2>

                  {previewUrl ? (
                    <div className="pkg-upload-preview-container">
                      <div className="pkg-upload-preview">
                        <img src={previewUrl} alt="Cover" />
                        <div className="pkg-upload-actions">
                          <label className="pkg-upload-change-btn">
                            <input
                              type="file"
                              onChange={handleFileChange}
                              accept="image/*"
                              hidden
                            />
                            Change
                          </label>
                          <button
                            type="button"
                            className="pkg-upload-remove-btn"
                            onClick={() => {
                              setFile(null);
                              setPreviewUrl(null);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pkg-upload-options">
                      <label className="pkg-upload pkg-upload-click">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept="image/*"
                          hidden
                          required
                        />
                        <div className="pkg-upload-empty">
                          <p>Click to upload image</p>
                        </div>
                      </label>
                    </div>
                  )}
                </section>

                <section className="pkg-section">
                  <h2 className="pkg-section-title">TOUR DETAILS</h2>
                  <div className="pkg-fields">
                    <div className="pkg-field pkg-field--full">
                      <label>Tour Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Island Hopping Adventure"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="pkg-field pkg-field--full">
                      <label>Destination</label>
                      <input
                        type="text"
                        placeholder="e.g. Boracay, Philippines"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required
                      />
                    </div>
                    <div className="pkg-field">
                      <label>Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 1 Day / 8 Hours"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                      />
                    </div>
                    <div className="pkg-field">
                      <label>Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="Local">Local</option>
                        <option value="International">International</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="pkg-section">
                  <h2 className="pkg-section-title">PRICING</h2>
                  <div className="pkg-pricing-layout">
                    <div className="pkg-pricing-inputs">
                      <div className="pkg-field">
                        <label>Supplier Rate (PHP)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={supplierRate}
                          onChange={(e) =>
                            handleSupplierRateChange(e.target.value)
                          }
                          required
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="pkg-field">
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
                        <div className="pkg-field-with-toggle">
                          <input
                            type="number"
                            placeholder={
                              markupType === "percentage" ? "Enter %" : "Enter peso amount"
                            }
                            value={markupValue}
                            onChange={(e) => handleMarkupChange(e.target.value)}
                            required
                            step="0.01"
                            min="0"
                          />
                          <button
                            type="button"
                            className="pkg-toggle-markup"
                            onClick={toggleMarkupType}
                            title="Switch Mode"
                          >
                            ⇄
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pkg-total-price-box">
                      <div className="pkg-total-price-content">
                        <div className="pkg-total-price-label">
                          TOTAL SELLING PRICE
                        </div>
                        <div className="pkg-total-price-amount">
                          ₱
                          {price
                            ? Number(price).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "0.00"}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="pkg-section">
                  <div className="pkg-section-header">
                    <h2 className="pkg-section-title">WHAT'S INCLUDED</h2>
                    <span className="pkg-count">
                      {inclusions.filter((i) => i.trim()).length} items
                    </span>
                  </div>
                  <div className="pkg-list">
                    {inclusions.map((inc, i) => (
                      <div key={i} className="pkg-list-item">
                        <span className="pkg-bullet"></span>
                        <input
                          type="text"
                          placeholder="e.g. Lunch Buffet, Hotel Transfer"
                          value={inc}
                          onChange={(e) => handleIncChange(i, e.target.value)}
                        />
                        {inclusions.length > 1 && (
                          <button
                            type="button"
                            className="pkg-remove"
                            onClick={() => removeInclusion(i)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="pkg-add-btn"
                    onClick={addInclusion}
                  >
                    + Add Item
                  </button>
                </section>
              </div>

              <aside className="pkg-right">
                <div className="pkg-preview">
                  <span className="pkg-preview-label">PREVIEW</span>
                  <div className="pkg-card">
                    <div className="pkg-card-image">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" />
                      ) : (
                        <span>No Image</span>
                      )}
                    </div>
                    <div className="pkg-card-body">
                      <span className="pkg-card-badge">{category}</span>
                      <h3 className="pkg-card-title">
                        {title || "Tour Name"}
                      </h3>
                      <p className="pkg-card-location">
                        {destination || "Destination"}
                      </p>
                      <div className="pkg-card-divider"></div>
                      <div className="pkg-card-meta">
                        <div>
                          <span>Price</span>
                          <strong>
                            ₱{price ? Number(price).toLocaleString() : "0"}
                          </strong>
                        </div>
                        <div>
                          <span>Duration</span>
                          <strong>{duration || "--"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pkg-stats">
                    <div className="pkg-stat">
                      <strong>
                        {inclusions.filter((i) => i.trim()).length}
                      </strong>
                      <span>Inclusions</span>
                    </div>
                  </div>
                </div>
                <div className="pkg-actions">
                  <button
                    type="button"
                    className="pkg-btn pkg-btn--cancel"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="pkg-btn pkg-btn--submit">
                    Publish Tour
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

export default AddTour;