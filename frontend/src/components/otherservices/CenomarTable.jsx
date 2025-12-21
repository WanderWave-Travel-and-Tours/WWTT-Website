import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ChevronRight, ChevronDown, FileText, Download, ClipboardList, FileCheck, X } from "lucide-react";
import "./CenomarTable.css";

const CenomarTable = ({ onSelectCENOMAR, onClose }) => {
  const [cenomarDocs, setCenomarDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCENOMAR, setExpandedCENOMAR] = useState({});
  const [accordionStates, setAccordionStates] = useState({});

  useEffect(() => {
    const fetchCENOMARDocuments = async () => {
      try {
        const res = await axios.get('https://wanderwaveph-backend.onrender.com/api/cenomar');
        
        if (Array.isArray(res.data)) {
          setCenomarDocs(res.data);
        } else {
          console.error("API returned non-array data:", res.data);
          setCenomarDocs([]);
        }
      } catch (error) {
        console.error("Error fetching CENOMAR documents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCENOMARDocuments();
  }, []);

  const toggleCENOMARExpansion = (id) => {
    setExpandedCENOMAR((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    
    if (expandedCENOMAR[id]) {
      setAccordionStates((prev) => ({
        ...prev,
        [id]: {
          requirements: false,
          downloadForms: false,
          stepsProcess: false
        }
      }));
    }
  };

  const toggleAccordion = (cenomarId, section) => {
    setAccordionStates((prev) => ({
      ...prev,
      [cenomarId]: {
        ...prev[cenomarId],
        [section]: !prev[cenomarId]?.[section]
      }
    }));
  };

  const handleSendInquiry = (cenomar) => {
    if (onSelectCENOMAR) {
      onSelectCENOMAR(cenomar);
    } else {
      alert(`Inquiry for ${cenomar.documentType} sent!`);
    }
  };

  const renderDocumentIcon = () => (
    <div className="cenomar-icon-container">
      <FileCheck size={20} color="#0a203b" />
    </div>
  );

  if (loading) {
    return (
      <div className="cenomar-list-container">
        <p style={{padding:'20px', textAlign:'center'}}>Loading CENOMAR Documents...</p>
      </div>
    );
  }

  return (
    <div className="cenomar-list-container">
      <div className="cenomar-list-header">
        <div className="cenomar-header-text">
          <h2 className="cenomar-list-title">CENOMAR Document Services</h2>
          <p className="cenomar-list-subtitle">
            Request Certificate of No Marriage (CENOMAR) documents
          </p>
        </div>
        
        <button className="cenomar-close-modal-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="cenomar-list-wrapper">
        {cenomarDocs.length === 0 ? (
          <p style={{textAlign: 'center', padding: '20px', color: '#888'}}>
            No CENOMAR documents available. (Check Admin Dashboard)
          </p>
        ) : (
          cenomarDocs.map((cenomar) => (
            <div key={cenomar._id} className="cenomar-list-item">
              <div className="cenomar-item-content">
                <div className="cenomar-item-header">
                  <div className="cenomar-header-left">
                    {renderDocumentIcon()}
                    <div className="cenomar-info">
                      <h3 className="cenomar-title">{cenomar.documentType || "CENOMAR Document"}</h3>
                      <span className="cenomar-subtitle">{cenomar.description || "Document Processing"}</span>
                      <span className="cenomar-price">
                        Price: ₱{cenomar.price || "0.00"}/copy
                      </span>
                    </div>
                  </div>

                  {!expandedCENOMAR[cenomar._id] && (
                    <div className="cenomar-header-right">
                      <button
                        className="view-requirements-btn-cenomar"
                        onClick={() => toggleCENOMARExpansion(cenomar._id)}
                      >
                        <ChevronRight size={18} />
                        <span>View Requirements</span>
                      </button>
                    </div>
                  )}
                </div>

                {expandedCENOMAR[cenomar._id] && (
                  <div className="cenomar-requirements-expanded">
                    
                    {/* ACCORDION 1 */}
                    <div className="cenomar-accordion-section">
                      <button 
                        className={`cenomar-accordion-header ${accordionStates[cenomar._id]?.requirements ? 'active' : ''}`}
                        onClick={() => toggleAccordion(cenomar._id, 'requirements')}
                      >
                        <span className="cenomar-accordion-title">
                          <span className="cenomar-accordion-icon"><FileText size={18} /></span>
                          List Of Requirements
                          {cenomar.requirements && cenomar.requirements.length > 0 && (
                            <span className="cenomar-accordion-count">{cenomar.requirements.length} Categories</span>
                          )}
                        </span>
                        <span className={`cenomar-accordion-chevron ${accordionStates[cenomar._id]?.requirements ? 'rotate' : ''}`}>
                          <ChevronDown size={20} />
                        </span>
                      </button>
                      
                      {accordionStates[cenomar._id]?.requirements && (
                        <div className="cenomar-accordion-content">
                          {cenomar.requirements && cenomar.requirements.length > 0 ? (
                            cenomar.requirements.map((reqSection, sectionIndex) => (
                              <div key={sectionIndex} className="cenomar-requirements-section">
                                <h5 className="cenomar-requirements-category">
                                  {reqSection.title}
                                </h5>
                                <ul className="cenomar-requirements-list-simple">
                                  {reqSection.items && reqSection.items.map((req, index) => (
                                    <li key={index} className="cenomar-requirement-simple-item">
                                      <span className="cenomar-req-checkbox">☑️</span>
                                      <span>{req}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          ) : (
                            <p style={{fontSize: '14px', color: '#888', fontStyle: 'italic', margin: '10px 0'}}>
                              No specific requirements listed.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ACCORDION 2 */}
                    <div className="cenomar-accordion-section">
                      <button 
                        className={`cenomar-accordion-header ${accordionStates[cenomar._id]?.downloadForms ? 'active' : ''}`}
                        onClick={() => toggleAccordion(cenomar._id, 'downloadForms')}
                      >
                        <span className="cenomar-accordion-title">
                          <span className="cenomar-accordion-icon"><Download size={18} /></span>
                          Download Forms Here
                          {cenomar.downloadForms && Array.isArray(cenomar.downloadForms) && cenomar.downloadForms.length > 0 && (
                            <span className="cenomar-accordion-count">{cenomar.downloadForms.length} Forms</span>
                          )}
                        </span>
                        <span className={`cenomar-accordion-chevron ${accordionStates[cenomar._id]?.downloadForms ? 'rotate' : ''}`}>
                          <ChevronDown size={20} />
                        </span>
                      </button>
                      
                      {accordionStates[cenomar._id]?.downloadForms && (
                        <div className="cenomar-accordion-content">
                          {cenomar.downloadForms && Array.isArray(cenomar.downloadForms) && cenomar.downloadForms.length > 0 ? (
                            <ul className="cenomar-download-list">
                              {cenomar.downloadForms.map((form, index) => {
                                const formLabel = typeof form === 'string' ? form : (form.fileName || form.label || 'Download Form');
                                const formUrl = typeof form === 'object' ? form.fileUrl : null;
                                const finalUrl = formUrl && formUrl.startsWith('http') ? formUrl : `https://wanderwaveph-backend.onrender.com${formUrl}`;

                                return (
                                  <li key={index} className="cenomar-download-item">
                                    <span className="cenomar-download-icon">📄</span>
                                    {formUrl ? (
                                      <a 
                                        href={finalUrl}
                                        download={formLabel}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="cenomar-download-link"
                                      >
                                        {formLabel}
                                      </a>
                                    ) : (
                                      <span>{formLabel}</span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p style={{fontSize: '14px', color: '#888', fontStyle: 'italic', margin: '10px 0'}}>
                              No download forms available.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ACCORDION 3 */}
                    <div className="cenomar-accordion-section">
                      <button 
                        className={`cenomar-accordion-header ${accordionStates[cenomar._id]?.stepsProcess ? 'active' : ''}`}
                        onClick={() => toggleAccordion(cenomar._id, 'stepsProcess')}
                      >
                        <span className="cenomar-accordion-title">
                          <span className="cenomar-accordion-icon"><ClipboardList size={18} /></span>
                          Steps and Other Process
                          {cenomar.stepsProcess && Array.isArray(cenomar.stepsProcess) && cenomar.stepsProcess.length > 0 && (
                            <span className="cenomar-accordion-count">{cenomar.stepsProcess.length} Steps</span>
                          )}
                        </span>
                        <span className={`cenomar-accordion-chevron ${accordionStates[cenomar._id]?.stepsProcess ? 'rotate' : ''}`}>
                          <ChevronDown size={20} />
                        </span>
                      </button>
                      
                      {accordionStates[cenomar._id]?.stepsProcess && (
                        <div className="cenomar-accordion-content">
                          {cenomar.stepsProcess && Array.isArray(cenomar.stepsProcess) && cenomar.stepsProcess.length > 0 ? (
                            <ol className="cenomar-steps-list">
                              {cenomar.stepsProcess.map((step, index) => (
                                <li key={index} className="cenomar-step-item">
                                  <span className="cenomar-step-number">{index + 1}</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p style={{fontSize: '14px', color: '#888', fontStyle: 'italic', margin: '10px 0'}}>
                              No process steps listed.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="cenomar-actions-bottom">
                      <button
                        className="cenomar-hide-requirements-btn"
                        onClick={() => toggleCENOMARExpansion(cenomar._id)}
                      >
                        <ChevronDown size={18} />
                        <span>Hide Requirements</span>
                      </button>
                      <button
                        className="cenomar-send-inquiry-btn"
                        onClick={() => handleSendInquiry(cenomar)}
                      >
                        <span>Send Inquiry Request</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CenomarTable;