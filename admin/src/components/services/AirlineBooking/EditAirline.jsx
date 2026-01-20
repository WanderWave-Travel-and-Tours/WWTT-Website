import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Plane, MessageSquare, Users, Trash2 } from "lucide-react";
import Sidebar from "../../sidebar/sidebar"; 
import { useToast } from '../../toast/ToastManager'; // Integrated Toast
import CustomConfirmModal from "../../confirmationModal/CustomConfirmModal"; // Integrated Modal
import "./EditAirline.css";

const getAdminData = () => {
    try {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        return {
            userEmail: adminData.email || adminData.username || 'Unknown Admin',
            adminId: adminData._id || adminData.id || null
        };
    } catch (error) {
        console.error('Error getting admin data:', error);
        return { userEmail: 'Unknown Admin', adminId: null };
    }
};

const EditAirline = () => {
  const navigate = useNavigate();
  const { id: airlineId } = useParams();
  const toast = useToast(); // Initialize Toast

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // MODAL STATE
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary"
  });

  // STATE FOR PASSENGERS
  const [passengers, setPassengers] = useState([{
    firstName: "",
    lastName: "",
    type: "Adult",
    age: 0,
    nationality: "Filipino",
    email: "",
    contactNumber: ""
  }]);

  // FORM DATA
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
  });

  const API_BASE_URL = "https://wanderwaveph-backend.onrender.com/api/inquiries"; 

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  // FETCH DATA
  useEffect(() => {
    const fetchAirlineDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${airlineId}`);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const result = await res.json();
        
        if (!result.success || !result.data) throw new Error("Invalid response format");
        
        const data = result.data;
        
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
        });

        let processedPassengers = [];
        if (Array.isArray(data.passengers) && data.passengers.length > 0) {
          processedPassengers = data.passengers.map((p) => ({
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            type: p.type || "Adult",
            age: p.age || 0,
            nationality: p.nationality || "Filipino",
            email: p.email || "",
            contactNumber: p.contactNumber || ""
          }));
        } else {
          processedPassengers = [{
            firstName: "",
            lastName: "",
            type: "Adult",
            age: 0,
            nationality: "Filipino",
            email: "",
            contactNumber: ""
          }];
        }
        setPassengers(processedPassengers);
        
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error(`Failed to load booking: ${err.message}`); 
      } finally {
        setLoading(false);
      }
    };

    if (airlineId) fetchAirlineDetails();
    else setLoading(false);
  }, [airlineId, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ADD PASSENGER WITH MODAL
  const addPassenger = () => {
    setModalConfig({
      isOpen: true,
      title: "Add New Passenger",
      message: "Are you sure you want to add a new passenger field?",
      type: "primary",
      onConfirm: () => {
        setPassengers(prev => [...prev, {
          firstName: "",
          lastName: "",
          type: "Adult",
          age: 0,
          nationality: "Filipino",
          email: "",
          contactNumber: ""
        }]);
        closeModal();
      }
    });
  };

  const removePassenger = (index) => {
    if (passengers.length > 1) {
      setModalConfig({
        isOpen: true,
        title: "Remove Passenger",
        message: "Are you sure you want to remove this passenger?",
        type: "danger",
        onConfirm: () => {
          setPassengers(prev => prev.filter((_, i) => i !== index));
          closeModal();
        }
      });
    } else {
      toast.warning("At least one passenger is required"); 
    }
  };

  // CANCEL WITH MODAL
  const handleCancel = () => {
    setModalConfig({
      isOpen: true,
      title: "Discard Changes",
      message: "Are you sure you want to cancel? Any unsaved changes will be lost.",
      type: "danger",
      onConfirm: () => {
        closeModal();
        navigate(-1);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    setModalConfig({
      isOpen: true,
      title: "Save Changes",
      message: "Do you want to save the changes made to this booking?",
      type: "primary",
      onConfirm: () => {
        closeModal();
        processSubmit();
      }
    });
  };

  const processSubmit = async () => {
    setSubmitting(true);
    const { userEmail, adminId } = getAdminData();

    const validPassengers = passengers
      .filter(p => (p.firstName && p.firstName.trim()) || (p.lastName && p.lastName.trim()))
      .map(p => ({
        firstName: String(p.firstName || "").trim(),
        lastName: String(p.lastName || "").trim(),
        type: p.type || "Adult",
        age: p.age ? parseInt(p.age) : 0,
        nationality: String(p.nationality || "Filipino").trim(),
        email: String(p.email || "").trim(),
        contactNumber: String(p.contactNumber || "").trim()
      }));

    if (validPassengers.length === 0) {
      toast.error("Please add at least one passenger with a name."); 
      setSubmitting(false);
      return;
    }

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
    data.append("passengers", JSON.stringify(validPassengers));
    data.append("userEmail", userEmail);
    data.append("adminId", adminId);

    try {
      const res = await fetch(`${API_BASE_URL}/update/${airlineId}`, {
        method: "PUT",
        body: data,
      });
      const result = await res.json();
      
      if (result.success) {
        toast.success("Booking Updated Successfully!"); 
        navigate("/services/airlinebooking");
      } else {
        toast.error(`Error: ${result.message}`); 
      }
    } catch (err) {
      toast.error("Server Error: Connection Failed"); 
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
          <p>Loading booking data...</p>
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
              <button className="ea-back-btn" onClick={handleCancel}>
                <ArrowLeft size={18} /> Back
              </button>
              <h1 className="ea-title">Edit Airline Booking</h1>
              <p className="ea-subtitle">Modify passenger and flight details</p>
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
                    <div className="ea-input-group">
                      <label>Full Name</label>
                      <input 
                        type="text" 
                        name="fullName" 
                        value={formData.fullName} 
                        onChange={handleInputChange} 
                        className="ea-input" 
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
                        required 
                      />
                    </div>
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
                      <label>Airline / Flight No.</label>
                      <input 
                        type="text" 
                        name="airline" 
                        value={formData.airline} 
                        onChange={handleInputChange} 
                        className="ea-input" 
                        placeholder="e.g. Cebu Pacific 5J-123"
                      />
                    </div>
                  </div>
                </section>

                <section className="ea-section">
                  <div className="ea-section-header row-between">
                    <div className="flex-center">
                      <Users size={20} className="ea-section-icon" />
                      <h3>Passengers ({passengers.length})</h3>
                    </div>
                    <button type="button" onClick={addPassenger} className="ea-add-pax-btn">
                      + Add Passenger
                    </button>
                  </div>
                  
                  <div className="ea-passengers-list">
                    {passengers.map((pax, index) => (
                      <div key={index} className="ea-pax-row">
                        <div className="ea-input-group">
                           <input 
                            type="text" 
                            placeholder="First Name" 
                            value={pax.firstName} 
                            onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)} 
                            className="ea-input" 
                            required 
                          />
                        </div>
                        <div className="ea-input-group">
                          <input 
                            type="text" 
                            placeholder="Last Name" 
                            value={pax.lastName} 
                            onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)} 
                            className="ea-input" 
                            required 
                          />
                        </div>
                        <div className="ea-input-group">
                           <select 
                            value={pax.type} 
                            onChange={(e) => handlePassengerChange(index, 'type', e.target.value)} 
                            className="ea-input ea-select"
                          >
                            <option value="Adult">Adult</option>
                            <option value="Child">Child</option>
                            <option value="Infant">Infant</option>
                          </select>
                        </div>
                        <div className="ea-input-group">
                          <input 
                            type="number" 
                            placeholder="Age" 
                            value={pax.age || ""} 
                            onChange={(e) => handlePassengerChange(index, 'age', e.target.value)} 
                            className="ea-input" 
                          />
                        </div>
                        <button 
                          type="button" 
                          className="ea-delete-btn"
                          onClick={() => removePassenger(index)} 
                          disabled={passengers.length === 1}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="ea-section">
                  <div className="ea-section-header">
                    <MessageSquare size={20} className="ea-section-icon" />
                    <h3>Notes / Instructions</h3>
                  </div>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="ea-input ea-textarea"
                    placeholder="Add special requests or notes here..."
                  />
                </section>

              </div>

              <div className="ea-form-right">
                <div className="ea-sticky-sidebar">
                  <div className="ea-card-sidebar ea-actions-card">
                    <button 
                      type="submit" 
                      className="ea-btn ea-btn--submit" 
                      disabled={submitting}
                    >
                      {submitting ? "Updating..." : "Save Changes"}
                    </button>

                    <button 
                      type="button" 
                      className="ea-btn ea-btn--cancel" 
                      onClick={handleCancel}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>

      {/* Confirmation Modal Component */}
      <CustomConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
};

export default EditAirline;