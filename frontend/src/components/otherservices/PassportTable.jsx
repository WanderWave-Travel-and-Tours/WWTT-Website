import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ChevronRight, ChevronDown, FileText, ClipboardList } from "lucide-react";
import "./PassportTable.css";

const PassportTable = ({ onSelectPassport }) => {
  const [passportData, setPassportData] = useState(null);
  const [loading, setLoading] = useState(true);
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
      const res = await axios.get('http://localhost:5000/api/passports');
      
      if (res.data.success && res.data.data.length > 0) {
        // Get the first active passport data
        setPassportData(res.data.data[0]);
      } else {
        console.error("No passport data found");
        // Use fallback static data if no data in database
        setPassportData(getDefaultPassportData());
      }
    } catch (error) {
      console.error("Error fetching passport data:", error);
      // Use fallback static data on error
      setPassportData(getDefaultPassportData());
    } finally {
      setLoading(false);
    }
  };

  // Fallback static data
  const getDefaultPassportData = () => ({
    _id: 'passport-default',
    serviceName: 'Passport Appointment',
    description: 'Book your Philippine Passport Appointment',
    price: 1500,
    icon: '🛂',
    requirements: [
      {
        title: 'Primary Requirements',
        items: [
          'Original and photocopy of your PSA Birth Certificate',
          'If the birth certificate is unclear, a transcribed copy from the Local Civil Registrar or the local copy of the birth certificate may be required',
          'Valid government-issued ID: Bring an original and a photocopy of at least one valid ID',
          'For married women: If using your spouse\'s surname, bring the original and a photocopy of your PSA Marriage Certificate'
        ]
      }
    ],
    additionalDocuments: [
      {
        title: 'Special Cases',
        items: [
          'For married women using their maiden name: A PSA Marriage Certificate is not required',
          'For those born abroad: A Report of Birth from a Philippine embassy or consulate is needed',
          'For lost or stolen passports: You may need a notarized affidavit of loss and/or a police report',
          'Other supporting documents: The consular officer may require additional documents to verify your identity and/or citizenship'
        ]
      }
    ],
    stepsProcess: [
      'Prepare all required documents (PSA Birth Certificate, valid ID, etc.)',
      'Submit inquiry request through WanderWave',
      'Receive appointment schedule confirmation',
      'Pay the processing fee',
      'Attend your scheduled appointment at DFA',
      'Wait for passport processing (usually 10-15 working days)',
      'Claim your passport or opt for delivery'
    ]
  });

  const toggleServiceExpansion = () => {
    setExpandedService(!expandedService);
    
    // Reset accordion states when collapsing
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

  const handleSendInquiry = () => {
    if (onSelectPassport && passportData) {
      onSelectPassport({
        serviceId: passportData._id || 'passport-appointment',
        serviceName: passportData.serviceName,
        estimatedPrice: passportData.price,
        inquiryType: 'PASSPORT'
      });
    } else {
      alert(`Inquiry for Passport Appointment sent!`);
    }
  };

  if (loading) {
    return (
      <div className="passport-list-container">
        <p style={{padding:'20px', textAlign:'center'}}>Loading Passport Information...</p>
      </div>
    );
  }

  if (!passportData) {
    return (
      <div className="passport-list-container">
        <p style={{padding:'20px', textAlign:'center', color:'#888'}}>
          No passport data available. Please contact administrator.
        </p>
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
                    Service Fee: ₱{passportData.price?.toLocaleString() || '1,500.00'}
                  </span>
                </div>
              </div>

              {!expandedService && (
                <div className="passport-header-right">
                  <button
                    className="view-requirements-btn-passport"
                    onClick={toggleServiceExpansion}
                  >
                    <ChevronRight size={18} />
                    <span>View Requirements</span>
                  </button>
                </div>
              )}
            </div>

            {expandedService && (
              <div className="passport-requirements-expanded">
                {/* ACCORDION 1: PRIMARY REQUIREMENTS */}
                <div className="passport-accordion-section">
                  <button 
                    className={`passport-accordion-header ${accordionStates.requirements ? 'active' : ''}`}
                    onClick={() => toggleAccordion('requirements')}
                  >
                    <span className="passport-accordion-title">
                      <span className="passport-accordion-icon"><FileText size={18} /></span>
                      Primary Requirements
                      {passportData.requirements && passportData.requirements[0] && (
                        <span className="passport-accordion-count">
                          {passportData.requirements[0].items.length} Items
                        </span>
                      )}
                    </span>
                    <span className={`passport-accordion-chevron ${accordionStates.requirements ? 'rotate' : ''}`}>
                      <ChevronDown size={20} />
                    </span>
                  </button>
                  
                  {accordionStates.requirements && (
                    <div className="passport-accordion-content">
                      {passportData.requirements && passportData.requirements.length > 0 ? (
                        passportData.requirements.map((reqSection, sectionIndex) => (
                          <div key={sectionIndex} className="requirements-section">
                            <ul className="requirements-list-simple">
                              {reqSection.items && reqSection.items.map((req, index) => (
                                <li key={index} className="requirement-simple-item">
                                  <span className="req-checkbox">☑️</span>
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <p style={{fontSize: '14px', color: '#888', fontStyle: 'italic'}}>
                          No requirements listed.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ACCORDION 2: ADDITIONAL DOCUMENTS */}
                <div className="passport-accordion-section">
                  <button 
                    className={`passport-accordion-header ${accordionStates.additionalDocs ? 'active' : ''}`}
                    onClick={() => toggleAccordion('additionalDocs')}
                  >
                    <span className="passport-accordion-title">
                      <span className="passport-accordion-icon"><FileText size={18} /></span>
                      Additional Documents (Special Cases)
                      {passportData.additionalDocuments && passportData.additionalDocuments[0] && (
                        <span className="passport-accordion-count">
                          {passportData.additionalDocuments[0].items.length} Cases
                        </span>
                      )}
                    </span>
                    <span className={`passport-accordion-chevron ${accordionStates.additionalDocs ? 'rotate' : ''}`}>
                      <ChevronDown size={20} />
                    </span>
                  </button>
                  
                  {accordionStates.additionalDocs && (
                    <div className="passport-accordion-content">
                      {passportData.additionalDocuments && passportData.additionalDocuments.length > 0 ? (
                        passportData.additionalDocuments.map((docSection, sectionIndex) => (
                          <div key={sectionIndex} className="requirements-section">
                            <ul className="requirements-list-simple">
                              {docSection.items && docSection.items.map((doc, index) => (
                                <li key={index} className="requirement-simple-item">
                                  <span className="req-checkbox">⚠️</span>
                                  <span>{doc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <p style={{fontSize: '14px', color: '#888', fontStyle: 'italic'}}>
                          No additional documents listed.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ACCORDION 3: STEPS AND PROCESS */}
                <div className="passport-accordion-section">
                  <button 
                    className={`passport-accordion-header ${accordionStates.stepsProcess ? 'active' : ''}`}
                    onClick={() => toggleAccordion('stepsProcess')}
                  >
                    <span className="passport-accordion-title">
                      <span className="passport-accordion-icon"><ClipboardList size={18} /></span>
                      Steps and Process
                      {passportData.stepsProcess && (
                        <span className="passport-accordion-count">
                          {passportData.stepsProcess.length} Steps
                        </span>
                      )}
                    </span>
                    <span className={`passport-accordion-chevron ${accordionStates.stepsProcess ? 'rotate' : ''}`}>
                      <ChevronDown size={20} />
                    </span>
                  </button>
                  
                  {accordionStates.stepsProcess && (
                    <div className="passport-accordion-content">
                      {passportData.stepsProcess && passportData.stepsProcess.length > 0 ? (
                        <ol className="passport-steps-list">
                          {passportData.stepsProcess.map((step, index) => (
                            <li key={index} className="passport-step-item">
                              <span className="step-number">{index + 1}</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p style={{fontSize: '14px', color: '#888', fontStyle: 'italic'}}>
                          No process steps listed.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="passport-actions-bottom">
                  <button
                    className="hide-requirements-btn"
                    onClick={toggleServiceExpansion}
                  >
                    <ChevronDown size={18} />
                    <span>Hide Requirements</span>
                  </button>
                  <button
                    className="send-inquiry-btn"
                    onClick={handleSendInquiry}
                  >
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