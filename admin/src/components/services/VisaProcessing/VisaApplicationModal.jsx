import React, { useState } from "react";
import { X, ChevronLeft, CheckCircle, ClipboardList, FileText, User, DollarSign, Briefcase, Building2, GraduationCap, Users, Calendar, Globe } from "lucide-react";
import "./VisaApplicationModal.css";

const VisaApplicationModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Type Selection, 2: Form, 3: Confirmation
  const [applicantType, setApplicantType] = useState("Adult");
  const [formData, setFormData] = useState({
    travelDate: "",
    lengthOfStay: "",
    visaType: "",
    givenName: "",
    lastName: "",
    otherNames: "",
    files: {} 
  });

  if (!isOpen) return null;

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

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
                [fieldName]: file.name
            }
        }));
    }
  };

  const handleSubmit = () => {
    console.log("Submitting Application:", { applicantType, formData });
    handleNextStep();
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
                <select 
                  value={applicantType} 
                  onChange={(e) => setApplicantType(e.target.value)}
                  className="app-select"
                >
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
              
              {/* SECTION: APPLICATION DETAILS */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Calendar size={20} color="#f97316" /></div>
                  <h4 className="section-title">Application Details</h4>
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Travel Date <span className="req">*</span></label>
                        <input type="text" placeholder="yyyy-mm-dd" name="travelDate" value={formData.travelDate} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Length of Stay (No. of Days) <span className="req">*</span></label>
                        <input type="number" placeholder="Enter number of days" name="lengthOfStay" value={formData.lengthOfStay} onChange={handleInputChange} />
                    </div>
                </div>
              </div>

              {/* SECTION: VISA REQUEST */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Globe size={20} color="#f97316" /></div>
                  <h4 className="section-title">Visa Request</h4>
                </div>
                <div className="form-group">
                    <label>Visa Type <span className="req">*</span></label>
                    <select name="visaType" value={formData.visaType} onChange={handleInputChange}>
                        <option value="">Select Visa Type...</option>
                        <option value="Tourist">Korea</option>
                        <option value="Business">Australia</option>
                        <option value="Transit">Japan</option>
                    </select>
                </div>
              </div>

              {/* SECTION: BASIC INFORMATION */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><User size={20} color="#f97316" /></div>
                  <h4 className="section-title">Basic Information</h4>
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Given Name <span className="req">*</span></label>
                        <input type="text" name="givenName" placeholder="Enter your first name (and middle name if applicable)" value={formData.givenName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Last Name <span className="req">*</span></label>
                        <input type="text" name="lastName" placeholder="Enter your last name" value={formData.lastName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group form-full">
                        <label>Enter other names of applicant</label>
                        <input type="text" name="otherNames" placeholder="Other names (optional)" value={formData.otherNames} onChange={handleInputChange} />
                    </div>
                </div>
              </div>

              {/* SECTION: PRIMARY REQUIREMENTS */}
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

              {/* SECTION: FINANCIAL REQUIREMENTS */}
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

              {/* SECTION: IF EMPLOYED */}
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

              {/* SECTION: IF BUSINESS OWNER */}
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

              {/* SECTION: IF STUDENT */}
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

               {/* SECTION: IF SENIOR CITIZEN */}
               <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Users size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Senior Citizen</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Senior Citizen ID" fieldName="seniorId" currentFile={formData.files['seniorId']} onChange={handleFileChange} />
                </div>
              </div>

              {/* SECTION: IF SPONSORED */}
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

               {/* SECTION: IF MULTIPLE ENTRY */}
               <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><ClipboardList size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Requesting for Multiple Entry</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Multiple Entry Request Form" fieldName="multipleEntry" currentFile={formData.files['multipleEntry']} onChange={handleFileChange} />
                </div>
              </div>
              
              {/* SECTION: GENERAL UPLOAD */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><FileText size={20} color="#f97316" /></div>
                  <h4 className="section-title">Additional Documents</h4>
                </div>
                 <p className="upload-note">Upload all the documents related to this applicant</p>
                 <FileUploadField label="" fieldName="generalUpload" currentFile={formData.files['generalUpload']} onChange={handleFileChange} />
              </div>

            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
              <button className="modal-save-btn" onClick={handleSubmit}>Add Applicant</button>
            </div>
          </>
        )}

        {/* --- STEP 3: CONFIRMATION --- */}
        {step === 3 && (
            <>
            <div className="modal-header">
              <div>
                <h3>Application Submitted</h3>
                <p className="modal-header-subtitle">Your visa application has been received</p>
              </div>
              <button className="modal-close-btn" onClick={resetAndClose}><X size={24} /></button>
            </div>
            <div className="confirmation-step">
                <div className="success-icon">
                    <CheckCircle size={64} color="#10b981" strokeWidth={2} />
                </div>
                <h3>Ready to Submit!</h3>
                <p>You have filled out the details for <strong>1 applicant(s)</strong>.</p>
                <p className="sub-text">By clicking submit, you confirm that all information provided is true and correct. Our team will verify this data before encoding.</p>
                
                <div className="applicant-summary">
                    <span>1. {formData.givenName} {formData.lastName}</span>
                    <span className="badge-single">{applicantType}</span>
                </div>

                <div className="confirmation-actions">
                    <button className="modal-cancel-btn" onClick={() => setStep(2)}>Go Back</button>
                    <button className="submit-inquiry-btn" onClick={resetAndClose}>Submit Inquiry</button>
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
                <input 
                    type="file" 
                    style={{display:'none'}} 
                    onChange={(e) => onChange(e, fieldName)}
                />
            </label>
            <span className="file-name">
                {currentFile || "No file chosen"}
            </span>
        </div>
    </div>
);

export default VisaApplicationModal;