import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ChevronRight, ChevronDown, FileText, ClipboardList, AlertCircle } from "lucide-react";
import "./PassportTable.css";

const PassportTable = ({ onSelectPassport }) => {
  const [passportData, setPassportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedService, setExpandedService] = useState(false);
  const [accordionStates, setAccordionStates] = useState({
    requirements: false,
    additionalDocs: false,
    stepsProcess: false
  });

  useEffect(() => {
    fetchPassportData();
  }, []);

  const fetchPassportData = async () => {
    try {
      // TATAWAG NA ITO SA BACKEND MO
      const res = await axios.get('http://localhost:5000/api/passports');
      
      if (res.data.success && res.data.data.length > 0) {
        // Kukunin ang pinaka-latest na active passport service
        setPassportData(res.data.data[0]);
      } else {
        setError("No active passport service found in the database.");
      }
    } catch (err) {
      console.error("Error fetching passport data:", err);
      setError("Failed to load passport information.");
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceExpansion = () => {
    setExpandedService(!expandedService);
    if (expandedService) {
      setAccordionStates({
        requirements: false,
        additionalDocs: false,
        stepsProcess: false
      });
    }
  };

  const toggleAccordion = (section) => {
    setAccordionStates((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // DITO IPAPASA ANG DATA SA MODAL FORM
  const handleSendInquiry = () => {
    if (onSelectPassport && passportData) {
      onSelectPassport({
        serviceId: passportData._id, // Importante: Ito ang ID galing sa MongoDB
        serviceName: passportData.serviceName,
        estimatedPrice: passportData.price,
        inquiryType: 'PASSPORT'
      });
    }
  };

  if (loading) {
    return (
      <div className="passport-list-container">
        <p style={{padding:'40px', textAlign:'center'}}>Loading Live Passport Information...</p>
      </div>
    );
  }

  if (error || !passportData) {
    return (
      <div className="passport-list-container">
        <div style={{textAlign:'center', padding:'40px', color:'#ef4444', background:'#fef2f2', borderRadius:'12px', border:'1px solid #fee2e2'}}>
            <AlertCircle size={32} style={{marginBottom:'10px'}}/>
            <h3>Service Unavailable</h3>
            <p>{error || "Please initialize passport data in the admin panel first."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="passport-list-container">
      <div className="passport-list-header">
        <h2 className="passport-list-title">Passport Appointment</h2>
        <p className="passport-list-subtitle">
          Book your Philippine passport appointment through WanderWave Travel and Tours
        </p>
      </div>

      <div className="passport-list-wrapper">
        <div className="passport-list-item">
          <div className="passport-item-content">
            <div className="passport-item-header">
              <div className="passport-header-left">
                <span className="passport-icon">{passportData.icon || '🛂'}</span>
                <div className="passport-info">
                  <h3 className="passport-title">{passportData.serviceName}</h3>
                  <span className="passport-subtitle">{passportData.description}</span>
                  <span className="passport-price">
                    Service Fee: ₱{passportData.price?.toLocaleString()}
                  </span>
                </div>
              </div>

              {!expandedService && (
                <div className="passport-header-right">
                  <button className="view-requirements-btn-passport" onClick={toggleServiceExpansion}>
                    <ChevronRight size={18} /> <span>View Requirements</span>
                  </button>
                </div>
              )}
            </div>

            {expandedService && (
              <div className="passport-requirements-expanded">
                {/* Requirements Accordion */}
                <div className="passport-accordion-section">
                  <button 
                    className={`passport-accordion-header ${accordionStates.requirements ? 'active' : ''}`}
                    onClick={() => toggleAccordion('requirements')}
                  >
                    <span className="passport-accordion-title">
                      <span className="passport-accordion-icon"><FileText size={18} /></span>
                      Primary Requirements
                    </span>
                    <span className={`passport-accordion-chevron ${accordionStates.requirements ? 'rotate' : ''}`}>
                      <ChevronDown size={20} />
                    </span>
                  </button>
                  {accordionStates.requirements && (
                    <div className="passport-accordion-content">
                      {passportData.requirements?.map((reqSection, idx) => (
                        <div key={idx}>
                           <h5 style={{margin:'0 0 10px 0', color:'#0f172a'}}>{reqSection.title}</h5>
                           <ul className="requirements-list-simple">
                             {reqSection.items?.map((req, i) => (
                               <li key={i} className="requirement-simple-item"><span className="req-checkbox">☑️</span>{req}</li>
                             ))}
                           </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Docs Accordion */}
                <div className="passport-accordion-section">
                  <button 
                    className={`passport-accordion-header ${accordionStates.additionalDocs ? 'active' : ''}`}
                    onClick={() => toggleAccordion('additionalDocs')}
                  >
                    <span className="passport-accordion-title">
                      <span className="passport-accordion-icon"><FileText size={18} /></span>
                      Special Cases
                    </span>
                    <span className={`passport-accordion-chevron ${accordionStates.additionalDocs ? 'rotate' : ''}`}>
                       <ChevronDown size={20} />
                    </span>
                  </button>
                  {accordionStates.additionalDocs && (
                    <div className="passport-accordion-content">
                      {passportData.additionalDocuments?.map((docSection, idx) => (
                        <div key={idx}>
                           <ul className="requirements-list-simple">
                             {docSection.items?.map((doc, i) => (
                               <li key={i} className="requirement-simple-item"><span className="req-checkbox">⚠️</span>{doc}</li>
                             ))}
                           </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Process Steps */}
                <div className="passport-accordion-section">
                  <button 
                    className={`passport-accordion-header ${accordionStates.stepsProcess ? 'active' : ''}`}
                    onClick={() => toggleAccordion('stepsProcess')}
                  >
                    <span className="passport-accordion-title">
                      <span className="passport-accordion-icon"><ClipboardList size={18} /></span>
                      Steps and Process
                    </span>
                    <span className={`passport-accordion-chevron ${accordionStates.stepsProcess ? 'rotate' : ''}`}>
                      <ChevronDown size={20} />
                    </span>
                  </button>
                  {accordionStates.stepsProcess && (
                    <div className="passport-accordion-content">
                        <ol className="passport-steps-list">
                          {passportData.stepsProcess?.map((step, index) => (
                            <li key={index} className="passport-step-item">
                              <span className="step-number">{index + 1}</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                    </div>
                  )}
                </div>

                <div className="passport-actions-bottom">
                  <button className="hide-requirements-btn" onClick={toggleServiceExpansion}>
                    <ChevronDown size={18} /> <span>Hide Requirements</span>
                  </button>
                  <button className="send-inquiry-btn" onClick={handleSendInquiry}>
                    <span>Book Appointment</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassportTable;