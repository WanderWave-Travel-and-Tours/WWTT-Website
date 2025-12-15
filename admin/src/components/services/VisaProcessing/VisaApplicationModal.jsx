import React, { useState } from "react";
import axios from "axios";
import { X, ChevronLeft, CheckCircle, ClipboardList, FileText, User, DollarSign, Briefcase, Building2, GraduationCap, Users, Calendar, Globe } from "lucide-react";
import "./VisaApplicationModal.css";

const VisaApplicationModal = ({ isOpen, onClose, refreshData, visaForms = [] }) => {
  const [step, setStep] = useState(1); // 1: Type Selection, 2: Form, 3: Confirmation
  const [applicantType, setApplicantType] = useState("Adult");
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    travelDate: "",
    lengthOfStay: "",
    visaType: "", 
    givenName: "",
    lastName: "",
    otherNames: "",
    email: "", 
    contactNumber: "",
    files: {} 
  });

  if (!isOpen) return null;

  const handleNextStep = () => setStep(step + 1);
  const handlePrevStep = () => setStep(step - 1);

  // --- Retained Input Change Handler with Validations ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // --- 1. LENGTH OF STAY VALIDATION LOGIC ---
    if (name === "lengthOfStay") {
        if (value === '') {
             setFormData({ ...formData, [name]: value });
             return;
        }
        
        // Strict check for non-negative whole numbers only
        if (!/^\d+$/.test(value)) {
            alert("Invalid input for Length of Stay. Only non-negative whole numbers (days) are allowed.");
            return;
        }

        // Maximum 2 digits check (99 days max)
        if (value.length > 2) {
             alert("Length of Stay cannot exceed 2 digits (99 days max).");
             return;
        }
    }

    // --- 2. TRAVEL DATE VALIDATION LOGIC ---
    if (name === "travelDate") {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const selectedDate = new Date(value);
        selectedDate.setHours(0, 0, 0, 0); 

        if (selectedDate < tomorrow) {
            alert("Travel Date must be tomorrow or later. Past dates and today's date are not allowed.");
            
            setFormData({ ...formData, [name]: "" }); 
            e.target.value = "";
            return;
        }
    }

    // --- 3. NAME INPUTS VALIDATION ---
    if (name === "givenName" || name === "lastName" || name === "otherNames") {
        if (/\d/.test(value)) {
            alert(`Invalid input for ${name}. Numbers are not allowed in name fields.`);
            return;
        }
    }

    // --- 4. CONTACT NUMBER VALIDATION ---
    if (name === "contactNumber") {
        if (value.length > 15) {
            alert("Contact Number cannot exceed 15 characters.");
            return; 
        }

        const validPattern = /^\+?[0-9]*$/;
        if (!validPattern.test(value)) {
            alert("Invalid characters in Contact Number. Only numbers and a single '+' sign (at the start) are allowed.");
            return;
        }
    }
    
    // --- 5. EMAIL VALIDATION LOGIC (Basic Input Check) ---
    if (name === "email") {
        // Haharangan agad kung may space na i-input
        if (/\s/.test(value)) {
            alert("Email cannot contain spaces. Invalid input not accepted.");
            return; 
        }
    }
    // --- END EMAIL VALIDATION LOGIC ---

    // Update state if validation passes or for other fields
    setFormData({ ...formData, [name]: value });
  };
  // --- End handleInputChange ---

  // --- Retained File Change Handler with Specific Validation for 'photo' ---
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    
    // Default allowed extensions for documents (pdf, docx, png, jpg, jpeg)
    const documentExtensions = ['.pdf', '.docx', '.png', '.jpg', '.jpeg'];
    // Specific allowed extensions for Photo (jpg, jpeg, webp, png)
    const photoExtensions = ['.jpg', '.jpeg', '.webp', '.png'];

    let allowedExtensions = documentExtensions;
    let extensionMessage = "PDF, DOCX, PNG, JPG, and JPEG files";

    // Override allowed list if the field is 'photo'
    if (fieldName === 'photo') {
        allowedExtensions = photoExtensions;
        extensionMessage = "JPG, JPEG, WEBP, and PNG files";
    }

    if (file) {
      const fileName = file.name;
      const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        alert(`Invalid file type for ${fieldName}. Only ${extensionMessage} are allowed.`);
        
        e.target.value = ''; 
        
        return; 
      }

      setFormData(prev => ({
        ...prev,
        files: {
          ...prev.files,
          [fieldName]: file 
        }
      }));
    } else {
        setFormData(prev => {
            const newFiles = { ...prev.files };
            delete newFiles[fieldName];
            return {
                ...prev,
                files: newFiles
            }
        });
    }
  };
  // --- End handleFileChange ---

  // --- MODIFIED FUNCTION: submitApplication with Financial Requirements as Mandatory ---
  const submitApplication = async () => {
    
    // 1. Define all strictly mandatory text fields
    const requiredTextFields = [
        { field: 'visaType', label: 'Visa Type' },
        { field: 'travelDate', label: 'Travel Date' },
        { field: 'lengthOfStay', label: 'Length of Stay (Days)' },
        { field: 'givenName', label: 'Given Name' },
        { field: 'lastName', label: 'Last Name' },
        { field: 'email', label: 'Email Address' },
        { field: 'contactNumber', label: 'Contact Number' },
    ];

    // Treating ALL Primary Requirements and FINANCIAL REQUIREMENTS as mandatory
    const requiredFileFields = [
        // Primary Requirements
        { field: 'passport', label: 'Passport' },
        { field: 'photo', label: 'Photo' },
        { field: 'appForm', label: 'Accomplished Application Form' },
        { field: 'psaBirth', label: 'Original PSA Birth Certificate' },
        { field: 'psaMarriage', label: 'Original PSA Marriage Certificate (if Married)' }, 
        { field: 'schedule', label: 'Daily Schedule in Japan' },
        { field: 'baptismal', label: 'Baptismal Certificate/Form 137 (for Late Registration)' },
        // Financial Requirements (NEW MANDATORY FIELDS)
        { field: 'bankCert', label: 'Original Bank Certificate' },
        { field: 'itr', label: 'ITR (Income Tax Return)' },
        { field: 'noItrLetter', label: 'Letter (if there is no ITR)' },
        { field: 'bankStatement', label: 'Bank Statement (if there is no ITR)' },
    ];

    // 2. Check all mandatory text fields for emptiness
    for (const req of requiredTextFields) {
        if (!formData[req.field]) {
            alert(`MANDATORY: Please fill out the required field: ${req.label}.`);
            return;
        }
    }
    
    // 3. Email Format Final Check (Strict Validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        alert("Validation Error: Please enter a valid email address (e.g., example@domain.com).");
        return;
    }

    // 4. Check all mandatory files
    for (const req of requiredFileFields) {
        if (!formData.files[req.field]) {
            alert(`MANDATORY: Please upload the required document in the Primary or Financial Requirements section: ${req.label}.`);
            return;
        }
    }
    
    // 5. Run final data integrity checks (Length, Contact Number Minimum)
    
    // Length of Stay Final Check
    const lengthOfStayValue = parseInt(formData.lengthOfStay, 10);
    if (lengthOfStayValue <= 0 || lengthOfStayValue > 99) {
         alert("Validation Error: Length of Stay must be a positive whole number, 1-99 days.");
         return;
    }
    
    // Contact Number Minimum Length Check (7 digits minimum)
    const cleanNumber = formData.contactNumber.replace(/[^0-9]/g, ''); 
    if (cleanNumber.length < 7) {
        alert("Validation Error: Contact Number must be a minimum of 7 digits long.");
        return;
    }
    // --- END FINAL VALIDATION CHECKS ---


    setIsLoading(true);
    try {
        const data = new FormData();
        
        // Use the specific description directly
        const serviceName = formData.visaType; 

        // 1. Append Text Fields
        data.append('serviceName', serviceName);
        data.append('inquiryType', 'VISA');
        data.append('fullName', `${formData.givenName} ${formData.lastName}`);
        data.append('email', formData.email); 
        data.append('contactNumber', formData.contactNumber);
        
        // Find selected visa details
        const selectedVisa = visaForms.find(v => v.description === formData.visaType || v.desc === formData.visaType);
        const country = selectedVisa ? selectedVisa.country : 'Japan'; 
        const price = selectedVisa ? selectedVisa.price : 0;

        const message = `Application for ${formData.visaType}. 
                         Travel Date: ${formData.travelDate || 'N/A'}, 
                         Length of Stay: ${formData.lengthOfStay || 'N/A'} days.`;
        data.append('message', message);
        
        data.append('visaCountry', country); 
        data.append('estimatedPrice', price); 

        // 2. Append ALL Files
        Object.keys(formData.files).forEach(key => {
            data.append(key, formData.files[key]);
        });

        // 3. Send Request
        const response = await axios.post('https://wanderwaveph-backend.onrender.com/api/inquiries/upload-application', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
            handleNextStep(); 
            if (refreshData) refreshData(); 
        }
    } catch (error) {
        console.error("Error submitting application:", error);
        alert(error.response?.data?.message || "Failed to submit application");
    } finally {
        setIsLoading(false);
    }
  };
  // --- END MODIFIED FUNCTION: submitApplication ---

  const resetAndClose = () => {
    setStep(1);
    setApplicantType("Adult");
    setFormData({
        travelDate: "",
        lengthOfStay: "",
        visaType: "",
        givenName: "",
        lastName: "",
        otherNames: "",
        email: "",
        contactNumber: "",
        files: {}
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === "modal-overlay" && onClose()}>
      <div className={`modal-content ${step === 2 ? "modal-content-xl" : "modal-content-md"}`}>
        
        {/* --- STEP 1: SELECT APPLICANT TYPE --- */}
        {step === 1 && (
          <>
            <div className="modal-header">
              <div>
                <h3>Select Applicant Type</h3>
                <p className="modal-header-subtitle">Choose whether you're applying as an adult or child</p>
              </div>
              <button className="modal-close-btn" onClick={onClose}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Applicant Type <span className="req">*</span></label>
                <select value={applicantType} onChange={(e) => setApplicantType(e.target.value)} className="app-select">
                  <option value="Adult">Adult</option>
                  <option value="Child">Child</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
              <button className="modal-save-btn" onClick={handleNextStep}>Continue</button>
            </div>
          </>
        )}

        {/* --- STEP 2: APPLICATION FORM --- */}
        {step === 2 && (
          <>
            <div className="modal-header">
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <button className="back-icon-btn" onClick={handlePrevStep}><ChevronLeft size={20}/></button>
                <div>
                    <h3>Add Applicant</h3>
                    <p className="modal-header-subtitle">Applicant Type: <strong>{applicantType}</strong></p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={onClose}><X size={24} /></button>
            </div>
            
            <div className="form-scroll-body">
              
              {/* Application Details */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Calendar size={20} color="#f97316" /></div>
                  <h4 className="section-title">Application Details</h4>
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Travel Date <span className="req">*</span></label>
                        <input type="date" name="travelDate" value={formData.travelDate} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Length of Stay (Days) <span className="req">*</span></label>
                        <input 
                            type="number" 
                            name="lengthOfStay" 
                            value={formData.lengthOfStay} 
                            onChange={handleInputChange} 
                            min="1"
                            max="99" 
                            step="1"
                        />
                    </div>
                </div>
              </div>

              {/* Visa Request */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Globe size={20} color="#f97316" /></div>
                  <h4 className="section-title">Visa Request</h4>
                </div>
                <div className="form-group">
                    <label>Visa Type <span className="req">*</span></label>
                    <select name="visaType" value={formData.visaType} onChange={handleInputChange}>
                        <option value="">Select Visa Configuration...</option>
                        {visaForms && visaForms.length > 0 ? (
                            visaForms.map((visa) => (
                                <option key={visa.id} value={visa.desc || visa.description}>
                                    {visa.desc || visa.description}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>No Visa settings found.</option>
                        )}
                    </select>
                </div>
              </div>

              {/* Basic Information */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><User size={20} color="#f97316" /></div>
                  <h4 className="section-title">Basic Information</h4>
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Given Name <span className="req">*</span></label>
                        <input type="text" name="givenName" value={formData.givenName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Last Name <span className="req">*</span></label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Email Address <span className="req">*</span></label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Required" />
                    </div>
                    <div className="form-group">
                        <label>Contact Number <span className="req">*</span></label>
                        <input 
                            type="text" 
                            name="contactNumber" 
                            value={formData.contactNumber} 
                            onChange={handleInputChange} 
                            placeholder="e.g., +639xxxxxxxxx"
                        />
                    </div>
                    <div className="form-group form-full">
                        <label>Other Names (Optional)</label>
                        <input type="text" name="otherNames" value={formData.otherNames} onChange={handleInputChange} />
                    </div>
                </div>
              </div>

              {/* --- PRIMARY REQUIREMENTS --- */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><FileText size={20} color="#f97316" /></div>
                  <h4 className="section-title">Primary Requirements</h4>
                </div>
                <div className="form-grid">
                    {/* All files here are now mandatory */}
                    <FileUploadField label="Passport *" fieldName="passport" currentFile={formData.files['passport']} onChange={handleFileChange} />
                    <FileUploadField label="Photo *" fieldName="photo" currentFile={formData.files['photo']} onChange={handleFileChange} /> 
                    <FileUploadField label="Accomplished Application Form *" fieldName="appForm" currentFile={formData.files['appForm']} onChange={handleFileChange} />
                    <FileUploadField label="Original PSA Birth Certificate *" fieldName="psaBirth" currentFile={formData.files['psaBirth']} onChange={handleFileChange} />
                    <FileUploadField label="Original PSA Marriage Certificate (if Married) *" fieldName="psaMarriage" currentFile={formData.files['psaMarriage']} onChange={handleFileChange} />
                    <FileUploadField label="Daily Schedule in Japan *" fieldName="schedule" currentFile={formData.files['schedule']} onChange={handleFileChange} />
                    <FileUploadField label="Baptismal Certificate/Form 137 (for Late Registration) *" fieldName="baptismal" currentFile={formData.files['baptismal']} onChange={handleFileChange} />
                </div>
              </div>

               {/* --- FINANCIAL REQUIREMENTS (ALL FILES ARE NOW MANDATORY) --- */}
               <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><DollarSign size={20} color="#f97316" /></div>
                  <h4 className="section-title">Financial Requirements</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Original Bank Certificate *" fieldName="bankCert" currentFile={formData.files['bankCert']} onChange={handleFileChange} />
                    <FileUploadField label="ITR (Income Tax Return) *" fieldName="itr" currentFile={formData.files['itr']} onChange={handleFileChange} />
                    <FileUploadField label="Letter (if there is no ITR) *" fieldName="noItrLetter" currentFile={formData.files['noItrLetter']} onChange={handleFileChange} />
                    <FileUploadField label="Bank Statement (if there is no ITR) *" fieldName="bankStatement" currentFile={formData.files['bankStatement']} onChange={handleFileChange} />
                </div>
              </div>

              {/* --- IF EMPLOYED --- */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Briefcase size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Employed</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Original Signed Certificate of Employment" fieldName="coe" currentFile={formData.files['coe']} onChange={handleFileChange} />
                    <FileUploadField label="Company ID" fieldName="companyId" currentFile={formData.files['companyId']} onChange={handleFileChange} />
                    <FileUploadField label="PRC or IBP Card – for Professionals" fieldName="prcId" currentFile={formData.files['prcId']} onChange={handleFileChange} />
                </div>
              </div>

              {/* --- IF BUSINESS OWNER --- */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Building2 size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Business Owner</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="DTI or SEC Permit" fieldName="dtiSec" currentFile={formData.files['dtiSec']} onChange={handleFileChange} />
                    <FileUploadField label="Business Permit" fieldName="businessPermit" currentFile={formData.files['businessPermit']} onChange={handleFileChange} />
                    <FileUploadField label="BIR company registration" fieldName="birReg" currentFile={formData.files['birReg']} onChange={handleFileChange} />
                </div>
              </div>

              {/* --- IF STUDENT --- */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><GraduationCap size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Student</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="School Certificate" fieldName="schoolCert" currentFile={formData.files['schoolCert']} onChange={handleFileChange} />
                    <FileUploadField label="School ID" fieldName="schoolId" currentFile={formData.files['schoolId']} onChange={handleFileChange} />
                </div>
              </div>

               {/* --- IF SENIOR CITIZEN --- */}
               <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Users size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Senior Citizen</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Senior Citizen ID" fieldName="seniorId" currentFile={formData.files['seniorId']} onChange={handleFileChange} />
                </div>
              </div>

              {/* --- IF SPONSORED --- */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Users size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Sponsored</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Proof of Relationship - APPLICANT and GUARANTOR" fieldName="proofRel" currentFile={formData.files['proofRel']} onChange={handleFileChange} />
                    <FileUploadField label="Guarantee Letter" fieldName="guaranteeLetter" currentFile={formData.files['guaranteeLetter']} onChange={handleFileChange} />
                </div>
              </div>

               {/* --- IF MULTIPLE ENTRY --- */}
               <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><ClipboardList size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Requesting for Multiple Entry</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Multiple Entry Request Form" fieldName="multipleEntry" currentFile={formData.files['multipleEntry']} onChange={handleFileChange} />
                </div>
              </div>
              
              {/* --- ADDITIONAL DOCUMENTS --- */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><FileText size={20} color="#f97316" /></div>
                  <h4 className="section-title">Additional Documents</h4>
                </div>
                 <p className="upload-note">Upload all other documents related to this applicant</p>
                 <FileUploadField label="" fieldName="generalUpload" currentFile={formData.files['generalUpload']} onChange={handleFileChange} />
              </div>

            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={onClose} disabled={isLoading}>Cancel</button>
              <button className="modal-save-btn" onClick={submitApplication} disabled={isLoading}>
                {isLoading ? "Saving..." : "Add Applicant"}
              </button>
            </div>
          </>
        )}

        {/* --- STEP 3: CONFIRMATION --- */}
        {step === 3 && (
            <>
            <div className="modal-header">
              <div>
                <h3>Applicant Added</h3>
              </div>
              <button className="modal-close-btn" onClick={resetAndClose}><X size={24} /></button>
            </div>
            <div className="confirmation-step">
                <div className="success-icon">
                    <CheckCircle size={64} color="#10b981" strokeWidth={2} />
                </div>
                <h3>Success!</h3>
                <p>Applicant <strong>{formData.givenName} {formData.lastName}</strong> has been added to the database.</p>
                <div className="confirmation-actions">
                    <button className="submit-inquiry-btn" onClick={resetAndClose}>Close</button>
                </div>
            </div>
            </>
        )}
      </div>
    </div>
  );
};

const FileUploadField = ({ label, fieldName, currentFile, onChange }) => (
    <div className="form-group">
        {label && <label>{label}</label>}
        <div className="file-input-wrapper">
            <label className="choose-file-btn" style={{color: 'white'}}>
                CHOOSE FILE
                <input type="file" style={{display:'none'}} onChange={(e) => onChange(e, fieldName)} />
            </label>
            <span className="file-name">
                {currentFile ? currentFile.name : "No file chosen"}
            </span>
        </div>
    </div>
);

export default VisaApplicationModal;