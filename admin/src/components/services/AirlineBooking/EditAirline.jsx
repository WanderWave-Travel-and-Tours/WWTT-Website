import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Plane, User, Mail, DollarSign, MessageSquare } from "lucide-react";
import Sidebar from "../../sidebar/sidebar"; 
import "./EditAirline.css";

// 🔥🔥🔥 HELPER FUNCTION - GET ADMIN DATA (Added for Activity Logs) 🔥🔥🔥
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

  // centralized state para sa auto-populate
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    estimatedPrice: "",
    message: "",
    origin: "",
    destination: "",
    departureDate: "",
    airline: "",
    existingImage: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Ginawa nating /api/inquiries dahil ito ang nasa inquiryRoute.js mo
  const API_BASE_URL = "http://localhost:5000/api/inquiries"; 

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // --- FETCH DATA FOR AUTO-POPULATE ---
  useEffect(() => {
    const fetchAirlineDetails = async () => {
      try {
        // Gagamit ng /api/inquiries/:id
        const res = await fetch(`${API_BASE_URL}/${airlineId}`);
        const result = await res.json();
        
        // Base sa inquiryController.js, ang success property ay ginagamit
        if (result.success && result.data) {
          const data = result.data;
          
          // Mapping ng data mula sa backend (flightDetails) patungo sa form state
          setFormData({
            fullName: data.fullName || "",
            email: data.email || "",
            estimatedPrice: data.estimatedPrice || "",
            message: data.message || "",
            // Kinukuha ang nested flightDetails mula sa inquiry.js model mo
            origin: data.flightDetails?.origin || "",
            destination: data.flightDetails?.destination || "" ,
            departureDate: data.flightDetails?.departureDate ? data.flightDetails.departureDate.split("T")[0] : "",
            airline: data.flightDetails?.airline || "",
            existingImage: data.evidenceName || "", // evidenceName ang field sa model mo
          });

          // I-set ang preview kung may existing image (evidenceName)
          if (data.evidenceName) {
            setImagePreview(`http://localhost:5000/uploads/${data.evidenceName}`);
          }
        } else {
            console.error("Failed to fetch data:", result.message);
        }
      } catch (err) {
        console.error("Error fetching airline data:", err);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // 🔥 GET ADMIN DATA (To track who updated the record)
    const { userEmail, adminId } = getAdminData();

    const data = new FormData();
    
    // I-append ang top-level fields
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("estimatedPrice", formData.estimatedPrice);
    data.append("message", formData.message);
    
    // I-append ang flight details (dapat i-handle ito ng controller sa backend)
    data.append("origin", formData.origin);
    data.append("destination", formData.destination);
    data.append("departureDate", formData.departureDate);
    data.append("airline", formData.airline);

    // 🔥 APPEND ADMIN DATA FOR LOGS
    data.append("userEmail", userEmail);
    data.append("adminId", adminId);

    // 'evidence' ang gamit sa uploadEvidence.single('evidence') sa route mo
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
      alert("❌ Server Error: Connection Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="et-page">
      <div className="et-loading">
        <div className="spinner"></div>
        <p>Fetching current booking data...</p>
      </div>
    </div>
  );

  return (
    <div className="et-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className={`et-main ${isSidebarCollapsed ? "et-main--collapsed" : ""}`}>
        <div className="et-container">
          
          <header className="et-header">
            <div className="et-header-content">
              <button className="et-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Back to Bookings
              </button>
              <h1 className="et-title">Edit Airline Booking</h1>
              <p className="et-subtitle">Review and modify the current passenger or flight details</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="et-form">
            <div className="et-grid-layout">
              
              <div className="et-form-left">
                {/* Client Information Section */}
                <section className="et-section">
                  <div className="et-section-header">
                    <User size={20} className="et-section-icon" />
                    <h3>Client Information</h3>
                  </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group full-width">
                      <label>Full Name</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="et-input" placeholder="Enter full name" required />
                    </div>
                    <div className="et-input-group">
                      <label>Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="et-input" placeholder="example@mail.com" required />
                    </div>
                    <div className="et-input-group">
                      <label>Fare Amount (PHP)</label>
                      <input type="number" name="estimatedPrice" value={formData.estimatedPrice} onChange={handleInputChange} className="et-input" placeholder="0.00" required />
                    </div>
                  </div>
                </section>

                {/* Flight Details Section */}
                <section className="et-section">
                  <div className="et-section-header">
                    <Plane size={20} className="et-section-icon" />
                    <h3>Flight Details</h3>
                  </div>
                  <div className="et-fields-grid">
                    <div className="et-input-group">
                      <label>Origin</label>
                      <input type="text" name="origin" value={formData.origin} onChange={handleInputChange} className="et-input" placeholder="City or Airport" />
                    </div>
                    <div className="et-input-group">
                      <label>Destination</label>
                      <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} className="et-input" placeholder="City or Airport" />
                    </div>
                    <div className="et-input-group">
                      <label>Departure Date</label>
                      <input type="date" name="departureDate" value={formData.departureDate} onChange={handleInputChange} className="et-input" />
                    </div>
                    <div className="et-input-group">
                      <label>Preferred Airline</label>
                      <input type="text" name="airline" value={formData.airline} onChange={handleInputChange} className="et-input" placeholder="e.g. Philippine Airlines" />
                    </div>
                  </div>
                </section>

                {/* Message Section */}
                <section className="et-section">
                    <div className="et-section-header">
                        <MessageSquare size={20} className="et-section-icon" />
                        <h3>Request Message / Notes</h3>
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleInputChange} className="et-textarea" rows="4" placeholder="Update special instructions..." />
                </section>
              </div>

              <div className="et-form-right">
                <div className="et-sticky-sidebar">
                  <section className="et-section et-upload-section">
                    <h3 className="et-upload-title">Ticket / Proof of Booking</h3>
                    <div className="et-image-upload-container">
                      {imagePreview ? (
                        <div className="et-image-preview">
                          <img src={imagePreview} alt="Preview" />
                          <div className="et-image-overlay" onClick={() => document.getElementById('airline-img').click()}>
                             <Upload size={20} />
                             <span>Change Image</span>
                          </div>
                          <button type="button" className="et-remove-img" onClick={() => {setImagePreview(""); setImageFile(null);}}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="et-upload-placeholder">
                          <Upload size={32} />
                          <span>Upload Ticket Image</span>
                          <input type="file" id="airline-img" onChange={handleImageChange} accept="image/*" hidden />
                        </label>
                      )}
                      <input type="file" id="airline-img" onChange={handleImageChange} accept="image/*" hidden />
                    </div>
                  </section>

                  <div className="et-form-actions">
                    <button type="button" className="et-btn et-btn--cancel" onClick={() => navigate(-1)}>Cancel</button>
                    <button type="submit" className="et-btn et-btn--submit" disabled={submitting}>
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