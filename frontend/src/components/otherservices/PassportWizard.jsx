import React, { useState } from "react";
import { Users, User, ArrowRight, ChevronLeft, CheckCircle, Plus } from "lucide-react";
import "./PassportWizard.css";

const PassportWizard = ({ onClose, onSubmit }) => {
  const [step, setStep] = useState(1); // 1: Type Selection, 2: Forms, 3: Review/Submit
  const [bookingType, setBookingType] = useState(null); // 'INDIVIDUAL' or 'GROUP'
  const [paxCount, setPaxCount] = useState(1);
  const [currentPaxIndex, setCurrentPaxIndex] = useState(0);

  // Template base sa PDF [cite: 5-54]
  const emptyForm = {
    // Personal Details
    lastName: "",
    firstName: "",
    middleName: "",
    placeOfBirth: "",
    gender: "",
    dateOfBirth: "",
    civilStatus: "Single",
    
    // Contact Info [cite: 22-27]
    address: "",
    occupation: "",
    mobile: "",
    workAddress: "",
    email: "",

    // Family Data [cite: 28-33]
    spouseName: "", // For married
    spouseCitizenship: "",
    fatherName: "",
    fatherCitizenship: "",
    motherMaidenName: "",
    motherCitizenship: "",

    // Citizenship Info [cite: 34-40]
    citizenshipAcquisition: "Birth", // Birth, Marriage, Naturalization
    foreignPassportHolder: "No", // Yes/No
    foreignPassportNo: "",
    foreignPassportIssueDate: "",
  };

  const [forms, setForms] = useState([emptyForm]);

  // --- HANDLERS ---

  const handleTypeSelect = (type) => {
    setBookingType(type);
    setPaxCount(type === 'INDIVIDUAL' ? 1 : 2);
  };

  const startFilling = () => {
    // Initialize forms array based on paxCount
    const newForms = Array(paxCount).fill(null).map(() => ({ ...emptyForm }));
    setForms(newForms);
    setStep(2);
    setCurrentPaxIndex(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForms = [...forms];
    updatedForms[currentPaxIndex] = {
      ...updatedForms[currentPaxIndex],
      [name]: value
    };
    setForms(updatedForms);
  };

  const handleNextPax = () => {
    if (currentPaxIndex < paxCount - 1) {
      setCurrentPaxIndex(currentPaxIndex + 1);
      // Scroll to top of form
      document.querySelector('.wizard-body').scrollTop = 0;
    } else {
      setStep(3); // Go to Review/Submit
    }
  };

  const handlePrevPax = () => {
    if (currentPaxIndex > 0) {
      setCurrentPaxIndex(currentPaxIndex - 1);
    } else {
      setStep(1); // Back to Type Selection
    }
  };

  const handleFinalSubmit = () => {
    // Ipasa ang data pabalik sa Parent Component (OtherServices.jsx)
    onSubmit({
      bookingType,
      paxCount,
      applicants: forms
    });
  };

  // --- RENDER HELPERS ---

  const renderForm = () => {
    const data = forms[currentPaxIndex];
    return (
      <div className="passport-form-grid fade-in">
        <div className="form-section-title">Applicant {currentPaxIndex + 1} of {paxCount}</div>
        
        {/* --- PERSONAL INFORMATION [cite: 5-21] --- */}
        <h4 className="section-header">Personal Information</h4>
        <div className="form-row three-col">
          <div className="form-group">
            <label>Last Name *</label>
            <input type="text" name="lastName" value={data.lastName} onChange={handleInputChange} required placeholder="Dela Cruz" />
          </div>
          <div className="form-group">
            <label>First Name *</label>
            <input type="text" name="firstName" value={data.firstName} onChange={handleInputChange} required placeholder="Juan" />
          </div>
          <div className="form-group">
            <label>Middle Name</label>
            <input type="text" name="middleName" value={data.middleName} onChange={handleInputChange} placeholder="Santos" />
          </div>
        </div>

        <div className="form-row three-col">
          <div className="form-group">
            <label>Date of Birth *</label>
            <input type="date" name="dateOfBirth" value={data.dateOfBirth} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Place of Birth *</label>
            <input type="text" name="placeOfBirth" value={data.placeOfBirth} onChange={handleInputChange} required placeholder="City/Municipality" />
          </div>
          <div className="form-group">
            <label>Gender *</label>
            <select name="gender" value={data.gender} onChange={handleInputChange}>
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
        </div>

        <div className="form-group">
            <label>Civil Status [cite: 16-21]</label>
            <select name="civilStatus" value={data.civilStatus} onChange={handleInputChange}>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widow/er">Widow/er</option>
              <option value="Legally Separated">Legally Separated</option>
              <option value="Annulled">Annulled</option>
            </select>
        </div>

        {/* --- CONTACT INFORMATION [cite: 22-27] --- */}
        <h4 className="section-header">Contact Information</h4>
        <div className="form-group">
          <label>Complete Address *</label>
          <input type="text" name="address" value={data.address} onChange={handleInputChange} required placeholder="House No., Street, Brgy, City, Province" />
        </div>
        
        <div className="form-row two-col">
            <div className="form-group">
                <label>Mobile No. *</label>
                <input type="text" name="mobile" value={data.mobile} onChange={handleInputChange} required placeholder="09123456789" />
            </div>
            <div className="form-group">
                <label>Email Address *</label>
                <input type="email" name="email" value={data.email} onChange={handleInputChange} required placeholder="email@example.com" />
            </div>
        </div>
        
        <div className="form-row two-col">
            <div className="form-group">
                <label>Occupation</label>
                <input type="text" name="occupation" value={data.occupation} onChange={handleInputChange} />
            </div>
             <div className="form-group">
                <label>Work Address (If applicable)</label>
                <input type="text" name="workAddress" value={data.workAddress} onChange={handleInputChange} />
            </div>
        </div>

        {/* --- FAMILY DATA [cite: 28-33] --- */}
        <h4 className="section-header">Family Data</h4>
        
        {data.civilStatus === 'Married' && (
             <div className="form-row two-col">
                <div className="form-group">
                    <label>Name of Spouse</label>
                    <input type="text" name="spouseName" value={data.spouseName} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label>Spouse Citizenship</label>
                    <input type="text" name="spouseCitizenship" value={data.spouseCitizenship} onChange={handleInputChange} />
                </div>
            </div>
        )}

        <div className="form-row two-col">
            <div className="form-group">
                <label>Father's Name</label>
                <input type="text" name="fatherName" value={data.fatherName} onChange={handleInputChange} placeholder="Full Name" />
            </div>
            <div className="form-group">
                <label>Father's Citizenship</label>
                <input type="text" name="fatherCitizenship" value={data.fatherCitizenship} onChange={handleInputChange} />
            </div>
        </div>

        <div className="form-row two-col">
            <div className="form-group">
                <label>Mother's Maiden Name</label>
                <input type="text" name="motherMaidenName" value={data.motherMaidenName} onChange={handleInputChange} placeholder="Full Name (Before Marriage)" />
            </div>
            <div className="form-group">
                <label>Mother's Citizenship</label>
                <input type="text" name="motherCitizenship" value={data.motherCitizenship} onChange={handleInputChange} />
            </div>
        </div>

        {/* --- CITIZENSHIP & FOREIGN PASSPORT [cite: 34-43] --- */}
        <h4 className="section-header">Citizenship & Foreign Passport</h4>
        <div className="form-row two-col">
             <div className="form-group">
                <label>Citizenship Acquired By</label>
                <select name="citizenshipAcquisition" value={data.citizenshipAcquisition} onChange={handleInputChange}>
                  <option value="Birth">Birth</option>
                  <option value="Marriage">Marriage</option>
                  <option value="Naturalization">Naturalization</option>
                  <option value="RA9225">R.A. 9225 (Dual Citizen)</option>
                  <option value="Others">Others</option>
                </select>
            </div>
             <div className="form-group">
                <label>Holder of Foreign Passport?</label>
                <select name="foreignPassportHolder" value={data.foreignPassportHolder} onChange={handleInputChange}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
            </div>
        </div>
        
        {data.foreignPassportHolder === 'Yes' && (
            <div className="form-row two-col">
                <div className="form-group">
                    <label>Foreign Passport No.</label>
                    <input type="text" name="foreignPassportNo" value={data.foreignPassportNo} onChange={handleInputChange} />
                </div>
                 <div className="form-group">
                    <label>Date of Issue</label>
                    <input type="date" name="foreignPassportIssueDate" value={data.foreignPassportIssueDate} onChange={handleInputChange} />
                </div>
            </div>
        )}

      </div>
    );
  };

  return (
    <div className="passport-wizard-container">
      <div className="wizard-header">
        <h3>Passport Application Assistant</h3>
        <p>Step {step} of 3</p>
      </div>

      <div className="wizard-body">
        
        {/* STEP 1: SELECTION */}
        {step === 1 && (
          <div className="step-selection fade-in">
            <h2 style={{textAlign:'center', color:'#0a203b'}}>Is this for an Individual or a Group?</h2>
            
            <div className="type-cards">
              <div className={`type-card ${bookingType === 'INDIVIDUAL' ? 'active' : ''}`} onClick={() => handleTypeSelect('INDIVIDUAL')}>
                <User size={48} />
                <h4>Individual</h4>
                <p>One Applicant</p>
              </div>
              <div className={`type-card ${bookingType === 'GROUP' ? 'active' : ''}`} onClick={() => handleTypeSelect('GROUP')}>
                <Users size={48} />
                <h4>Group / Family</h4>
                <p>Multiple Applicants</p>
              </div>
            </div>

            {bookingType === 'GROUP' && (
              <div className="pax-input-container">
                <label>How many applicants in total?</label>
                <div className="pax-counter">
                   <input type="number" min="2" max="20" value={paxCount} onChange={(e) => setPaxCount(parseInt(e.target.value) || 2)} />
                </div>
              </div>
            )}

            <div className="wizard-actions">
               <button className="wizard-btn-primary" disabled={!bookingType} onClick={startFilling}>
                 Start Filling Form <ArrowRight size={18} />
               </button>
            </div>
          </div>
        )}

        {/* STEP 2: FORMS */}
        {step === 2 && (
          <div className="step-forms">
            {renderForm()}
            
            <div className="wizard-actions space-between">
               <button className="wizard-btn-secondary" onClick={handlePrevPax}>
                 <ChevronLeft size={18} /> Back
               </button>
               <button className="wizard-btn-primary" onClick={handleNextPax}>
                 {currentPaxIndex < paxCount - 1 ? 'Next Applicant' : 'Review & Submit'} <ArrowRight size={18} />
               </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUMMARY */}
        {step === 3 && (
            <div className="step-summary fade-in">
                <div className="success-icon"><CheckCircle size={64} color="#166534" /></div>
                <h2>Ready to Submit!</h2>
                <p>You have filled out the details for <strong>{paxCount} applicant(s)</strong>.</p>
                <p className="summary-note">By clicking submit, you confirm that all information provided is true and correct. Our team will verify this data before encoding.</p>
                
                <div className="applicant-list-preview">
                    {forms.map((f, i) => (
                        <div key={i} className="preview-item">
                            <strong>{i+1}. {f.lastName}, {f.firstName}</strong> 
                            <span>{f.civilStatus} • {f.mobile}</span>
                        </div>
                    ))}
                </div>

                <div className="wizard-actions">
                   <button className="wizard-btn-secondary" onClick={() => setStep(2)}>
                     <ChevronLeft size={18} /> Go Back
                   </button>
                   <button className="wizard-btn-primary" onClick={handleFinalSubmit}>
                     Submit Inquiry
                   </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default PassportWizard;