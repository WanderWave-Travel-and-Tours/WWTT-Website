import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar"; 
import "./addservice.css"; 

const AddService = () => {
  // --- SIDEBAR LOGIC START ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  // --- SIDEBAR LOGIC END ---

  // --- SERVICE STATE VARIABLES based on Mongoose Schema ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(""); 
  const [file, setFile] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null);
  const [category, setCategory] = useState("DOCUMENTATION"); 
  const [price, setPrice] = useState("");
  const [requirements, setRequirements] = useState([""]); 
  const [order, setOrder] = useState(""); 
  const [isActive, setIsActive] = useState(true); 
  const [hasSubCollection, setHasSubCollection] = useState(false);
  const [subCollectionName, setSubCollectionName] = useState("");

  const pasteAreaRef = useRef(null);
  const navigate = useNavigate();

  // --- Image Handling Logic ---
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
  
  const [isPasteActive, setIsPasteActive] = useState(false);

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
  // --- End Image Handling Logic ---


  // --- Requirements (Inclusions equivalent) Logic ---
  const addRequirement = () => setRequirements([...requirements, ""]);
  const removeRequirement = (i) =>
    setRequirements(requirements.filter((_, idx) => idx !== i));
  const handleReqChange = (i, val) =>
    setRequirements(requirements.map((item, idx) => (idx === i ? val : item)));
  // --- End Requirements Logic ---

  // --- Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const processedRequirements = requirements.filter(
      (item) => item.trim().length > 0
    );

    const priceNum = parseFloat(price) || 0;
    const orderNum = parseInt(order) || 0;
    
    const formData = new FormData();

    // Append text fields
    formData.append("title", title);
    formData.append("description", description);
    formData.append("icon", icon); 
    formData.append("category", category);
    formData.append("price", priceNum.toString());
    formData.append("order", orderNum.toString());
    formData.append("isActive", isActive.toString()); 
    formData.append("hasSubCollection", hasSubCollection.toString());
    formData.append("subCollectionName", hasSubCollection ? subCollectionName : ''); 

    // Append array field (JSON stringified)
    formData.append("requirements", JSON.stringify(processedRequirements));
    
    // Append image file
    if (file) {
      formData.append("image", file);
    } else {
      alert("Please upload an image for the service.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/services", {
        method: "POST",
        body: formData, 
      });
      const data = await response.json();
      if (response.ok) {
        alert("✅ Service Added Successfully!");
        setTitle("");
        setDescription("");
        setIcon("");
        setCategory("DOCUMENTATION");
        setPrice("");
        setOrder("");
        setIsActive(true);
        setFile(null);
        setPreviewUrl(null);
        setRequirements([""]);
        setHasSubCollection(false);
        setSubCollectionName("");
      } else {
        console.error("Server error:", data);
        alert("❌ Error: " + (data.message || "Server error"));
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("❌ Error connecting to server");
    }
  };


  // --- UI RENDER ---
  return (
    <div className="svc-page">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      
      <main className={`svc-main ${
        isSidebarCollapsed ? "svc-main--collapsed" : ""
      }`}>
        <div className="svc-container">
          <header className="svc-header">
            <h1 className="svc-title">ADD NEW SERVICE</h1>
            <p className="svc-subtitle">
              Create a new service offering (e.g., VISA, PSA, etc.)
            </p>
          </header>

          <form onSubmit={handleSubmit} className="svc-form">
            <div className="svc-grid">
              <div className="svc-left">
                <section className="svc-section">
                  <h2 className="svc-section-title">SERVICE IMAGE</h2>

                  {previewUrl ? (
                    <div className="svc-upload-preview-container">
                      <div className="svc-upload-preview">
                        <img src={previewUrl} alt="Service Image" />
                        <div className="svc-upload-actions">
                          <label className="svc-upload-change-btn">
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
                            className="svc-upload-remove-btn"
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
                    <div className="svc-upload-options">
                      <label className="svc-upload svc-upload-click">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept="image/*"
                          hidden
                          required
                        />
                        <div className="svc-upload-empty">
                          <div className="svc-upload-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="svc-upload-text">Click to upload</p>
                          <p className="svc-upload-hint">JPG, PNG or WebP</p>
                        </div>
                      </label>
                    </div>
                  )}
                </section>

                <section className="svc-section">
                  <h2 className="svc-section-title">SERVICE DETAILS</h2>
                  <div className="svc-fields">
                    <div className="svc-field svc-field--full">
                      <label>Service Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Hotel Booking"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="svc-field svc-field--full">
                      <label>Description</label>
                      <textarea
                        placeholder="A short description of the service..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows="3"
                        className="svc-textarea"
                      />
                    </div>
                    <div className="svc-field">
                      <label>Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                      >
                        <option value="TRAVEL">TRAVEL</option>
                        <option value="DOCUMENTATION">DOCUMENTATION</option>
                        <option value="FINANCIAL">FINANCIAL</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                    <div className="svc-field">
                      <label>Icon Tag (e.g., 'Hotel', 'Plane')</label>
                      <input
                        type="text"
                        placeholder="e.g. Hotel, Plane, FileText"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        required
                      />
                    </div>
                    <div className="svc-field">
                      <label>Base Price (PHP)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="svc-field">
                      <label>Order/Display Rank</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                        min="0"
                      />
                    </div>

                    <div className="svc-field svc-field--full">
                        <label>Service Status</label>
                        <div className="svc-status-radio-group">
                            <label>
                                <input 
                                    type="radio"
                                    name="serviceStatus"
                                    checked={isActive === true}
                                    onChange={() => setIsActive(true)}
                                />
                                Active (Show on Website)
                            </label>
                            <label>
                                <input 
                                    type="radio"
                                    name="serviceStatus"
                                    checked={isActive === false}
                                    onChange={() => setIsActive(false)}
                                />
                                Coming Soon (Inactive, Blurred on Website)
                            </label>
                        </div>
                    </div>
                    
                    <div className="svc-field svc-field--full">
                      <label>
                        <input 
                          type="checkbox"
                          checked={hasSubCollection}
                          onChange={(e) => setHasSubCollection(e.target.checked)}
                          style={{ marginRight: '8px' }}
                        />
                        Has Sub Collection (e.g., PSA &gt; Birth Cert, Marriage Cert)
                      </label>
                    </div>
                    {hasSubCollection && (
                      <div className="svc-field svc-field--full">
                        <label>Sub Collection Name</label>
                        <input
                          type="text"
                          placeholder="e.g. PSA_REQUESTS"
                          value={subCollectionName}
                          onChange={(e) => setSubCollectionName(e.target.value)}
                          required={hasSubCollection}
                        />
                      </div>
                    )}

                  </div>
                </section>


                <section className="svc-section">
                  <div className="svc-section-header">
                    <h2 className="svc-section-title">REQUIREMENTS</h2>
                    <span className="svc-count">
                      {requirements.filter((i) => i.trim()).length} items
                    </span>
                  </div>
                  
                  <div className="svc-requirements-wrapper">
                    {requirements.map((req, i) => (
                      <div key={i} className="svc-requirement-row">
                        <span className="svc-requirement-bullet"></span>
                        <div className="svc-requirement-input-wrapper">
                          <input
                            type="text"
                            placeholder="What document is required?"
                            value={req}
                            onChange={(e) => handleReqChange(i, e.target.value)}
                          />
                        </div>
                        {requirements.length > 1 && (
                          <button
                            type="button"
                            className="svc-requirement-delete-btn"
                            onClick={() => removeRequirement(i)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    className="svc-add-requirement-btn"
                    onClick={addRequirement}
                  >
                    <span>+</span> Add Requirement
                  </button>
                </section>
              </div>

              <aside className="svc-right">
                <div className="svc-preview">
                  <span className="svc-preview-label">SERVICE PREVIEW</span>
                  <div className="svc-card">
                    <div className="svc-card-image">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Service Preview" />
                      ) : (
                        <span>No Image</span>
                      )}
                    </div>
                    <div className="svc-card-body">
                      <span className="svc-card-badge">{category}</span>
                      <h3 className="svc-card-title">
                        {title || "Service Title"}
                      </h3>
                      <p className="svc-card-description">
                        {description.substring(0, 70) + (description.length > 70 ? '...' : '') || "Affordable and fast document processing."}
                      </p>
                      <div className="svc-card-divider"></div>
                      <div className="svc-card-meta">
                        <div>
                          <span>Starting Price</span>
                          <strong>
                            ₱{price ? Number(price).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) : "0.00"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="svc-stats">
                    <div className="svc-stat">
                      <strong>
                        {requirements.filter((i) => i.trim()).length}
                      </strong>
                      <span>Requirements</span>
                    </div>
                    <div className="svc-stat">
                      <strong>{order || '0'}</strong>
                      <span>Order</span>
                    </div>
                  </div>
                </div>
                <div className="svc-actions">
                  <button
                    type="button"
                    className="svc-btn svc-btn--cancel"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="svc-btn svc-btn--submit">
                    Publish Service
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

export default AddService;