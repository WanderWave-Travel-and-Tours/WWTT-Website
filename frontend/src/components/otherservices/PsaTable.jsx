import React, { useState, useEffect } from "react";
import api from '../../lib/axiosInstance';
import { ChevronRight, ChevronDown, FileText, Download, ClipboardList, FileCheck, X } from "lucide-react";
import "./PsaTable.css";
import { useToast } from "../toast/ToastManager";

const PSATable = ({ onSelectPSA, onClose }) => { // Added onClose prop
  const [psaDocs, setPsaDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPSA, setExpandedPSA] = useState({});
  const [accordionStates, setAccordionStates] = useState({});
  const toast = useToast();

  useEffect(() => {
    const fetchPSADocuments = async () => {
      try {
        const res = await api.get('/api/psa');
        
        if (Array.isArray(res.data)) {
          setPsaDocs(res.data);
        } else {
          setPsaDocs([]);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchPSADocuments();
  }, []);

  const togglePSAExpansion = (id) => {
    setExpandedPSA((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    
    if (expandedPSA[id]) {
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

  const toggleAccordion = (psaId, section) => {
    setAccordionStates((prev) => ({
      ...prev,
      [psaId]: {
        ...prev[psaId],
        [section]: !prev[psaId]?.[section]
      }
    }));
  };

  const handleSendInquiry = (psa) => {
    if (onSelectPSA) {
      onSelectPSA(psa);
    } else {
      toast.info(`Inquiry for ${psa.documentType} has been noted. Please fill in the form.`, "Inquiry");
    }
  };

  const renderDocumentIcon = () => (
    <div className="psa-icon-container">
      <FileCheck size={20} color="#0a203b" />
    </div>
  );

  if (loading) {
    return (
      <div className="psa-list-container">
        <p style={{padding:'20px', textAlign:'center'}}>Loading PSA Documents...</p>
      </div>
    );
  }

  return (
    <div className="psa-list-container">
      <div className="psa-list-header">
        <div className="psa-header-text">
          <h2 className="psa-list-title">PSA Document Services</h2>
          <p className="psa-list-subtitle">
            Request and process your PSA documents with ease
          </p>
        </div>
        
        {/* Close Button (X) */}
        <button className="psa-close-modal-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="psa-list-wrapper">
        {psaDocs.length === 0 ? (
          <p style={{textAlign: 'center', padding: '20px', color: '#888'}}>
            No PSA documents available. (Check Admin Dashboard)
          </p>
        ) : (
          psaDocs.map((psa) => (
            <div key={psa._id} className="psa-list-item">
              <div className="psa-item-content">
                <div className="psa-item-header">
                  <div className="psa-header-left">
                    {renderDocumentIcon()}
                    <div className="psa-info">
                      <h3 className="psa-title">{psa.documentType || "PSA Document"}</h3>
                      <span className="psa-subtitle">{psa.description || "Document Processing"}</span>
                      <span className="psa-price">
                        Price: ₱{psa.price || "0.00"}/copy
                      </span>
                    </div>
                  </div>

                  {!expandedPSA[psa._id] && (
                    <div className="psa-header-right">
                      <button
                        className="view-requirements-btn-psa"
                        onClick={() => togglePSAExpansion(psa._id)}
                      >
                        <ChevronRight size={18} />
                        <span>View Requirements</span>
                      </button>
                    </div>
                  )}
                </div>

                {expandedPSA[psa._id] && (
                  <div className="psa-requirements-expanded">
                    
                    {/* ACCORDION 1 */}
                    <div className="psa-accordion-section">
                      <button 
                        className={`psa-accordion-header ${accordionStates[psa._id]?.requirements ? 'active' : ''}`}
                        onClick={() => toggleAccordion(psa._id, 'requirements')}
                      >
                        <span className="psa-accordion-title">
                          <span className="psa-accordion-icon"><FileText size={18} /></span>
                          List Of Requirements
                          {psa.requirements && psa.requirements.length > 0 && (
                            <span className="psa-accordion-count">{psa.requirements.length} Categories</span>
                          )}
                        </span>
                        <span className={`psa-accordion-chevron ${accordionStates[psa._id]?.requirements ? 'rotate' : ''}`}>
                          <ChevronDown size={20} />
                        </span>
                      </button>
                      
                      {accordionStates[psa._id]?.requirements && (
                        <div className="psa-accordion-content">
                          {psa.requirements && psa.requirements.length > 0 ? (
                            psa.requirements.map((reqSection, sectionIndex) => (
                              <div key={sectionIndex} className="requirements-section">
                                <h5 className="requirements-category">
                                  {reqSection.title}
                                </h5>
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
                            <p style={{fontSize: '14px', color: '#888', fontStyle: 'italic', margin: '10px 0'}}>
                              No specific requirements listed.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ACCORDION 2 */}
                    <div className="psa-accordion-section">
                      <button 
                        className={`psa-accordion-header ${accordionStates[psa._id]?.downloadForms ? 'active' : ''}`}
                        onClick={() => toggleAccordion(psa._id, 'downloadForms')}
                      >
                        <span className="psa-accordion-title">
                          <span className="psa-accordion-icon"><Download size={18} /></span>
                          Download Forms Here
                          {psa.downloadForms && Array.isArray(psa.downloadForms) && psa.downloadForms.length > 0 && (
                            <span className="psa-accordion-count">{psa.downloadForms.length} Forms</span>
                          )}
                        </span>
                        <span className={`psa-accordion-chevron ${accordionStates[psa._id]?.downloadForms ? 'rotate' : ''}`}>
                          <ChevronDown size={20} />
                        </span>
                      </button>
                      
                      {accordionStates[psa._id]?.downloadForms && (
                        <div className="psa-accordion-content">
                          {psa.downloadForms && Array.isArray(psa.downloadForms) && psa.downloadForms.length > 0 ? (
                            <ul className="psa-download-list">
                              {psa.downloadForms.map((form, index) => {
                                const formLabel = typeof form === 'string' ? form : (form.fileName || form.label || 'Download Form');
                                const formUrl = typeof form === 'object' ? form.fileUrl : null;
                                const finalUrl = formUrl && formUrl.startsWith('http') ? formUrl : `https://wanderwaveph.onrender.com${formUrl}`;

                                return (
                                  <li key={index} className="psa-download-item">
                                    <span className="download-icon">📄</span>
                                    {formUrl ? (
                                      <a 
                                        href={finalUrl}
                                        download={formLabel}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="download-link"
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
                    <div className="psa-accordion-section">
                      <button 
                        className={`psa-accordion-header ${accordionStates[psa._id]?.stepsProcess ? 'active' : ''}`}
                        onClick={() => toggleAccordion(psa._id, 'stepsProcess')}
                      >
                        <span className="psa-accordion-title">
                          <span className="psa-accordion-icon"><ClipboardList size={18} /></span>
                          Steps and Other Process
                          {psa.stepsProcess && Array.isArray(psa.stepsProcess) && psa.stepsProcess.length > 0 && (
                            <span className="psa-accordion-count">{psa.stepsProcess.length} Steps</span>
                          )}
                        </span>
                        <span className={`psa-accordion-chevron ${accordionStates[psa._id]?.stepsProcess ? 'rotate' : ''}`}>
                          <ChevronDown size={20} />
                        </span>
                      </button>
                      
                      {accordionStates[psa._id]?.stepsProcess && (
                        <div className="psa-accordion-content">
                          {psa.stepsProcess && Array.isArray(psa.stepsProcess) && psa.stepsProcess.length > 0 ? (
                            <ol className="psa-steps-list">
                              {psa.stepsProcess.map((step, index) => (
                                <li key={index} className="psa-step-item">
                                  <span className="step-number">{index + 1}</span>
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

                    <div className="psa-actions-bottom">
                      <button
                        className="hide-requirements-btn"
                        onClick={() => togglePSAExpansion(psa._id)}
                      >
                        <ChevronDown size={18} />
                        <span>Hide Requirements</span>
                      </button>
                      <button
                        className="send-inquiry-btn"
                        onClick={() => handleSendInquiry(psa)}
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

export default PSATable;