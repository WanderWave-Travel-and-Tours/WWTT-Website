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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
        setFormData(prev => ({
            ...prev,
            files: {
                ...prev.files,
                [fieldName]: file 
            }
        }));
    }
  };

  const submitApplication = async () => {
    if (!formData.email || !formData.givenName || !formData.lastName || !formData.visaType) {
        alert("Please fill in Name, Email, and Visa Type fields.");
        return;
    }

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
                        <input type="number" name="lengthOfStay" value={formData.lengthOfStay} onChange={handleInputChange} />
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
                        <label>Contact Number</label>
                        <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} />
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
                    <FileUploadField label="Passport" fieldName="passport" currentFile={formData.files['passport']} onChange={handleFileChange} />
                    <FileUploadField label="Photo" fieldName="photo" currentFile={formData.files['photo']} onChange={handleFileChange} />
                    <FileUploadField label="Accomplished Application Form" fieldName="appForm" currentFile={formData.files['appForm']} onChange={handleFileChange} />
                    <FileUploadField label="Original PSA Birth Certificate" fieldName="psaBirth" currentFile={formData.files['psaBirth']} onChange={handleFileChange} />
                    <FileUploadField label="Original PSA Marriage Certificate (if Married)" fieldName="psaMarriage" currentFile={formData.files['psaMarriage']} onChange={handleFileChange} />
                    <FileUploadField label="Daily Schedule in Japan" fieldName="schedule" currentFile={formData.files['schedule']} onChange={handleFileChange} />
                    <FileUploadField label="Baptismal Certificate/Form 137 (for Late Registration)" fieldName="baptismal" currentFile={formData.files['baptismal']} onChange={handleFileChange} />
                </div>
              </div>

               {/* --- FINANCIAL REQUIREMENTS --- */}
               <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><DollarSign size={20} color="#f97316" /></div>
                  <h4 className="section-title">Financial Requirements</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Original Bank Certificate" fieldName="bankCert" currentFile={formData.files['bankCert']} onChange={handleFileChange} />
                    <FileUploadField label="ITR (Income Tax Return)" fieldName="itr" currentFile={formData.files['itr']} onChange={handleFileChange} />
                    <FileUploadField label="Letter (if there is no ITR)" fieldName="noItrLetter" currentFile={formData.files['noItrLetter']} onChange={handleFileChange} />
                    <FileUploadField label="Bank Statement (if there is no ITR)" fieldName="bankStatement" currentFile={formData.files['bankStatement']} onChange={handleFileChange} />
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