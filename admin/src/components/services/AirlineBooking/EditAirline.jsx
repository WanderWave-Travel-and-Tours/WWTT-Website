import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Plane, User, Mail, DollarSign, MessageSquare, Users, Trash2 } from "lucide-react";
import Sidebar from "../../sidebar/sidebar"; 
import "./EditAirline.css";

// 🔥 HELPER FUNCTION - GET ADMIN DATA (Added for Activity Logs)
const getAdminData = () => {
    try {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        return {
            userEmail: adminData.email || adminData.username || 'Unknown Admin',
            adminId: adminData._id || adminData.id || null
        };
    } catch (error) {
        console.error('❌ Error getting admin data:', error);
        return { userEmail: 'Unknown Admin', adminId: null };
    }
};

const EditAirline = () => {
  const navigate = useNavigate();
  const { id: airlineId } = useParams();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    estimatedPrice: "",
    message: "",
    origin: "",
    destination: "",
    departureDate: "",
    airline: "",
    flightNumber: "",
    passengers: [{ firstName: "", lastName: "", type: "Adult", age: "" }], 
    existingFiles: [],
  });

  const [newFiles, setNewFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const API_BASE_URL = "http://localhost:5000/api/inquiries"; 

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // ✅ ENHANCED PARSING: Handle deeply nested stringified passengers
  const parsePassengers = (rawPassengers) => {
    let result = [{ firstName: "", lastName: "", type: "Adult", age: "" }];
    
    if (!rawPassengers) return result;

    try {
      if (Array.isArray(rawPassengers)) {
        return rawPassengers.length > 0 ? rawPassengers : result;
      }

      if (typeof rawPassengers === 'string') {
        let parsed = JSON.parse(rawPassengers);
        
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("❌ Failed to parse passengers:", e);
    }

    return result;
  };

  // --- FETCH DATA FOR AUTO-POPULATE ---
  useEffect(() => {
    const fetchAirlineDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${airlineId}`);
        const result = await res.json();
        
        if (result.success && result.data) {
          const data = result.data;
          
          const parsedPassengers = parsePassengers(data.passengers);

          console.log("✅ Parsed Passengers:", parsedPassengers);

          setFormData({
            fullName: data.fullName || "",
            email: data.email || "",
            contactNumber: data.contactNumber || "",
            estimatedPrice: data.estimatedPrice || "",
            message: data.message || "",
            origin: data.flightDetails?.origin || "",
            destination: data.flightDetails?.destination || "",
            departureDate: data.flightDetails?.departureDate 
              ? new Date(data.flightDetails.departureDate).toISOString().split("T")[0] 
              : "",
            airline: data.flightDetails?.airline || "",
            flightNumber: data.flightDetails?.flightNumber || "",
            passengers: parsedPassengers,
            existingFiles: data.deliveredDocuments || [],
          });

          if (data.evidenceName) {
            setImagePreview(`http://localhost:5000/uploads/${data.evidenceName}`);
          }
        }
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (airlineId) fetchAirlineDetails();
  }, [airlineId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ SAFE PASSENGER HANDLERS
  const handlePassengerChange = (index, field, value) => {
    setFormData((prev) => {
      let currentArr = Array.isArray(prev.passengers) ? [...prev.passengers] : [];
      
      if (currentArr[index]) {
        currentArr[index] = {
          ...currentArr[index],
          [field]: value
        };
      }

      return { ...prev, passengers: currentArr };
    });
  };

  const addPassenger = () => {
    setFormData(prev => ({
      ...prev,
      passengers: [...prev.passengers, { firstName: "", lastName: "", type: "Adult", age: "" }]
    }));
  };

  const removePassenger = (index) => {
    setFormData(prev => {
      if (prev.passengers.length > 1) {
        return { ...prev, passengers: prev.passengers.filter((_, i) => i !== index) };
      }
      return prev;
    });
  };

  // ✅ FILE HANDLING
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => [...prev, {
          url: reader.result,
          name: file.name,
          isExisting: false
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
    
    const nonExistingCount = filePreviews.slice(0, index + 1).filter(f => !f.isExisting).length;
    if (!filePreviews[index].isExisting) {
      setNewFiles(prev => prev.filter((_, i) => i !== (nonExistingCount - 1)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const { userEmail, adminId } = getAdminData();

    const data = new FormData();
    
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("contactNumber", formData.contactNumber);
    data.append("estimatedPrice", formData.estimatedPrice);
    data.append("message", formData.message);
    
    data.append("origin", formData.origin);
    data.append("destination", formData.destination);
    data.append("departureDate", formData.departureDate);
    data.append("airline", formData.airline);
    data.append("flightNumber", formData.flightNumber);

    data.append("userEmail", userEmail);
    data.append("adminId", adminId);

    if (imageFile) {
      data.append("evidence", imageFile); 
    }

    try {
      const res = await fetch(`${API_BASE_URL}/update/${airlineId}`, {
        method: "PUT",
        body: data,
      });
      
      const result = await res.json();
      
      if (result.success) {
        alert("✅ Airline Booking Updated Successfully!");
        navigate("/services/airlinebooking");
      } else {
        alert("❌ Error: " + result.message);
      }
    } catch (err) {
      console.error("❌ Submit Error:", err);
      alert("❌ Server Error: Connection Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="ea-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`ea-main ${isSidebarCollapsed ? "ea-main--collapsed" : ""}`}>
        <div className="ea-loading">
          <div className="spinner"></div>
          <p>Fetching current booking data...</p>
        </div>
      </main>
    </div>
  );

  return (
    <div className="ea-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`ea-main ${isSidebarCollapsed ? "ea-main--collapsed" : ""}`}>
        <div className="ea-container">
          
          <header className="ea-header">
            <div className="ea-header-content">
              <button className="ea-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Back to Bookings
              </button>
              <h1 className="ea-title">Edit Airline Booking</h1>
              <p className="ea-subtitle">Review and modify the current passenger or flight details</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="ea-form">
            <div className="ea-grid-layout">
              
              <div className="ea-form-left">
                <section className="ea-section">
                  <div className="ea-section-header">
                    <User size={20} className="ea-section-icon" />
                    <h3>Client Information</h3>
                  </div>
                  <div className="ea-fields-grid">
                    <div className="ea-input-group full-width">
                      <label>Full Name</label>
                      <input 
                        type="text" 
                        name="fullName" 
                        value={formData.fullName} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        placeholder="Enter full name" 
                        required 
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        placeholder="example@mail.com" 
                        required 
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Contact Number</label>
                      <input 
                        type="text" 
                        name="contactNumber" 
                        value={formData.contactNumber} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        placeholder="Contact number" 
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Fare Amount (PHP)</label>
                      <input 
                        type="number" 
                        name="estimatedPrice" 
                        value={formData.estimatedPrice} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        placeholder="0.00" 
                        required 
                      />
                    </div>
                  </div>
                </section>

                <section className="ea-section">
                  <div className="ea-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={20} className="ea-section-icon" />
                      <h3>Passenger Manifest ({formData.passengers.length})</h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={addPassenger} 
                      className="ea-add-pax-btn"
                    >
                      + Add Passenger
                    </button>
                  </div>
                  
                  <div className="ea-passengers-list" style={{ marginTop: '15px' }}>
                    {formData.passengers.map((pax, index) => (
                      <div key={index} className="ea-pax-row">
                        <input 
                          type="text" 
                          placeholder="First Name" 
                          value={pax.firstName || ""} 
                          onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)} 
                          className="ea-input" 
                          required 
                        />
                        <input 
                          type="text" 
                          placeholder="Last Name" 
                          value={pax.lastName || ""} 
                          onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)} 
                          className="ea-input" 
                          required 
                        />
                        <select 
                          value={pax.type || "Adult"} 
                          onChange={(e) => handlePassengerChange(index, 'type', e.target.value)} 
                          className="ea-input"
                        >
                          <option value="Adult">Adult</option>
                          <option value="Child">Child</option>
                          <option value="Infant">Infant</option>
                        </select>
                        <input 
                          type="number" 
                          placeholder="Age" 
                          value={pax.age || ""} 
                          onChange={(e) => handlePassengerChange(index, 'age', e.target.value)} 
                          className="ea-input" 
                        />
                        <button 
                          type="button" 
                          onClick={() => removePassenger(index)} 
                          style={{ 
                            border: 'none', 
                            background: 'transparent', 
                            color: '#ef4444', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'center',
                            opacity: formData.passengers.length === 1 ? 0.3 : 1,
                            pointerEvents: formData.passengers.length === 1 ? 'none' : 'auto'
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="ea-section">
                  <div className="ea-section-header">
                    <Plane size={20} className="ea-section-icon" />
                    <h3>Flight Details</h3>
                  </div>
                  <div className="ea-fields-grid">
                    <div className="ea-input-group">
                      <label>Origin</label>
                      <input 
                        type="text" 
                        name="origin" 
                        value={formData.origin} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        placeholder="City or Airport" 
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Destination</label>
                      <input 
                        type="text" 
                        name="destination" 
                        value={formData.destination} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        placeholder="City or Airport" 
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Departure Date</label>
                      <input 
                        type="date" 
                        name="departureDate" 
                        value={formData.departureDate} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Preferred Airline</label>
                      <input 
                        type="text" 
                        name="airline" 
                        value={formData.airline} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        placeholder="e.g. Philippine Airlines" 
                      />
                    </div>
                    <div className="ea-input-group">
                      <label>Flight Number (Optional)</label>
                      <input 
                        type="text" 
                        name="flightNumber" 
                        value={formData.flightNumber} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        placeholder="e.g. PR123" 
                      />
                    </div>
                  </div>
                </section>

                <section className="ea-section">
                  <div className="ea-section-header">
                    <MessageSquare size={20} className="ea-section-icon" />
                    <h3>Request Message / Notes</h3>
                  </div>
                  <textarea 
                    name="message" 
                    value={formData.message} 
                    onChange={handleInputChange} 
                    className="ea-textarea" 
                    rows="4" 
                    placeholder="Update special instructions..." 
                  />
                </section>
              </div>

              <div className="ea-form-right">
                <div className="ea-sticky-sidebar">
                  <section className="ea-section ea-upload-section">
                    <h3 className="ea-upload-title">Booking Documents</h3>
                    
                    <label className="ea-upload-placeholder" style={{ cursor: 'pointer', marginBottom: '16px' }}>
                      <Upload size={24} />
                      <span>Upload Tickets / Proof</span>
                      <input 
                        type="file" 
                        onChange={handleFileChange} 
                        accept="image/*,.pdf" 
                        multiple
                        hidden 
                      />
                    </label>

                    {filePreviews.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filePreviews.map((file, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '10px',
                              backgroundColor: '#f1f5f9',
                              borderRadius: '8px'
                            }}
                          >
                            <span style={{ fontSize: '13px', color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.name}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => removeFile(idx)}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#ef4444', 
                                cursor: 'pointer' 
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <div className="ea-form-actions">
                    <button 
                      type="button" 
                      className="ea-btn ea-btn--cancel" 
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="ea-btn ea-btn--submit" 
                      disabled={submitting}
                    >
                      {submitting ? "Updating..." : "Update Booking"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditAirline;