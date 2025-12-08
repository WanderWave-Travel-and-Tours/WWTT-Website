import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidebar/sidebar"; 
import {
  Plus,
  FileText,
  Truck,
  AlertTriangle,
  FolderOpen,
  X,
  Save,
  Trash2,
  PlusCircle,
  ListPlus,
  ChevronDown,
  Download,
  ClipboardList,
  Upload,
  Edit,
  CreditCard,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import "./PSASerbilis.css";

const PSASerbilis = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [psaDocs, setPsaDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPSAFormsOpen, setIsPSAFormsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedPSA, setSelectedPSA] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [showContactRemarks, setShowContactRemarks] = useState(false);
  const [contactRemarks, setContactRemarks] = useState("");
  const [contactEvidence, setContactEvidence] = useState(null);

  const [accordionState, setAccordionState] = useState({
    requirements: false,
    downloadForms: false,
    stepsProcess: false,
  });

  const [newPSAForm, setNewPSAForm] = useState({
    documentType: "",
    desc: "",
    price: "",
  });

  const [requirements, setRequirements] = useState([]);
  const [downloadForms, setDownloadForms] = useState([]);
  const [stepsProcess, setStepsProcess] = useState([]);

  const stats = [
    { label: "Total Requests", value: inquiries.length, icon: <FileText size={24} /> },
    { label: "To Process", value: inquiries.filter(i => i.status === 'PENDING').length, icon: <AlertTriangle size={24} /> },
    { label: "Issues", value: inquiries.filter(i => i.status === 'CONTACTED').length, icon: <AlertTriangle size={24} /> },
    { label: "Completed", value: inquiries.filter(i => i.status === 'COMPLETED').length, icon: <CheckCircle size={24} /> },
  ];

  useEffect(() => {
    fetchPSADocs();
    fetchInquiries();
  }, []);

  const fetchPSADocs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/psa");
      if (Array.isArray(res.data)) {
        const mappedData = res.data.map((p) => ({
          ...p,
          id: p._id,
          desc: p.description,
        }));
        setPsaDocs(mappedData);
      }
    } catch (error) {
      console.error("Error fetching PSA docs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
        const response = await axios.get('http://localhost:5000/api/inquiries');
        if (response.data.success) {
        const psaRequests = response.data.data.filter(inq => 
            inq.psaDocument || 
            (inq.serviceName && inq.serviceName.toUpperCase().includes('PSA')) ||
            (inq.serviceName && inq.serviceName.toUpperCase().includes('CERTIFICATE'))
        );
        setInquiries(psaRequests);
        }
    } catch (error) {
        console.error('Error fetching inquiries:', error);
    }
  };

  const fetchDocuments = async (inquiryId) => {
    try {
        const response = await axios.get(`http://localhost:5000/api/documents/inquiry/${inquiryId}`);
        if (response.data.success) {
        setDocuments(response.data.documents || []);
        }
    } catch (error) {
        console.error('Error fetching documents:', error);
        setDocuments([]);
    }
  };

  const handleViewInquiry = async (inquiry) => {
    setSelectedInquiry(inquiry);
    await fetchDocuments(inquiry._id);
    setIsInquiryModalOpen(true);
  };

  const handleCloseInquiryModal = () => {
    setSelectedInquiry(null);
    setDocuments([]);
    setIsInquiryModalOpen(false);
  };

  const handleUpdateInquiryStatus = async (inquiryId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/inquiries/${inquiryId}/status`,
        { status: newStatus }
      );

      if (response.data.success) {
        alert('Status updated successfully!');
        fetchInquiries();
        if (selectedInquiry && selectedInquiry._id === inquiryId) {
          setSelectedInquiry({ ...selectedInquiry, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleRequestPayment = async () => {
      if (!window.confirm("Are documents correct? This will notify the user to pay.")) return;
      await handleUpdateInquiryStatus(selectedInquiry._id, 'PAYMENT_PENDING');
  };

  const initiateContactStatus = () => {
      setShowContactRemarks(true);
  };

  const submitContactWithRemarks = async () => {
      if (!selectedInquiry) return;

      try {
          const formData = new FormData();
          formData.append('status', 'CONTACTED');
          formData.append('remarks', contactRemarks);
          
          if (contactEvidence) {
              formData.append('evidence', contactEvidence);
          }

          const response = await axios.put(
              `http://localhost:5000/api/inquiries/${selectedInquiry._id}/status`,
              formData,
              {
                  headers: { 'Content-Type': 'multipart/form-data' }
              }
          );

          if (response.data.success) {
              alert('Status updated to CONTACTED with remarks!');
              fetchInquiries();
              setSelectedInquiry({ 
                  ...selectedInquiry, 
                  status: 'CONTACTED',
                  remarks: contactRemarks,
                  evidenceUrl: response.data.data?.evidenceUrl 
              });
              setShowContactRemarks(false);
              setContactRemarks("");
              setContactEvidence(null);
          }
      } catch (error) {
          console.error('Error updating status:', error);
          alert('Failed to update status');
      }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const toggleAccordion = (section) => {
    setAccordionState((prev) => ({ ...prev, [section]: !prev[section] }));
  };
  const handleManageService = () => setIsPSAFormsOpen(true);
  const handleAddNewPSA = () => { setIsPSAFormsOpen(false); setIsAddFormOpen(true); setNewPSAForm({ documentType: "", desc: "", price: "" }); };
  
  const handleCreatePSA = async () => {
    if (!newPSAForm.documentType || !newPSAForm.desc || !newPSAForm.price) { alert("Please fill in all required fields"); return; }
    try {
      await axios.post("http://localhost:5000/api/psa", {
        documentType: newPSAForm.documentType,
        description: newPSAForm.desc,
        price: newPSAForm.price,
      });
      alert("PSA Document created successfully!");
      fetchPSADocs(); setIsAddFormOpen(false); setIsPSAFormsOpen(true);
    } catch (error) { console.error(error); alert("Failed to create PSA document"); }
  };

  const handleEditPSA = (psa) => {
    setSelectedPSA(psa); setIsPSAFormsOpen(false); setIsEditorOpen(true);
    const loadedReqs = (psa.requirements || []).map((reqSection) => ({ id: Math.random(), title: reqSection.title, items: reqSection.items.map((item) => ({ id: Math.random(), label: item })) }));
    setRequirements(loadedReqs);
    const loadedForms = (psa.downloadForms || []).map((form) => ({ id: Math.random(), label: form.label, fileName: form.fileName, fileUrl: form.fileUrl }));
    setDownloadForms(loadedForms);
    const loadedSteps = (psa.stepsProcess || []).map((step) => ({ id: Math.random(), label: step }));
    setStepsProcess(loadedSteps);
  };
  
  const handleSaveChanges = async () => {
      if (!selectedPSA) return;
      const formattedRequirements = requirements.map((cat) => ({ title: cat.title, items: cat.items.map((item) => item.label).filter((label) => label) }));
      const formattedDownloadForms = downloadForms.map((form) => ({ label: form.label, fileName: form.fileName, fileUrl: form.fileUrl }));
      const formattedSteps = stepsProcess.map((step) => step.label).filter((label) => label);
      try {
        await axios.put(`http://localhost:5000/api/psa/${selectedPSA.id}`, { requirements: formattedRequirements, downloadForms: formattedDownloadForms, stepsProcess: formattedSteps });
        alert("Changes saved successfully!"); fetchPSADocs(); setIsEditorOpen(false); setIsPSAFormsOpen(true);
      } catch (error) { console.error(error); alert("Failed to save changes"); }
  };
  
  const handleDeletePSA = async (id) => { if (window.confirm("Delete this?")) { await axios.delete(`http://localhost:5000/api/psa/${id}`); fetchPSADocs(); } };
  const addCategory = () => setRequirements([...requirements, { id: Date.now(), title: "", items: [] }]);
  const removeCategory = (id) => setRequirements(requirements.filter(c => c.id !== id));
  const handleCategoryTitleChange = (id, v) => setRequirements(requirements.map(c => c.id === id ? { ...c, title: v } : c));
  const addRequirement = (cId) => setRequirements(requirements.map(c => c.id === cId ? { ...c, items: [...c.items, { id: Date.now(), label: "" }] } : c));
  const removeRequirement = (cId, iId) => setRequirements(requirements.map(c => c.id === cId ? { ...c, items: c.items.filter(i => i.id !== iId) } : c));
  const handleLabelChange = (cId, iId, v) => setRequirements(requirements.map(c => c.id === cId ? { ...c, items: c.items.map(i => i.id === iId ? { ...i, label: v } : i) } : c));
  const removeDownloadForm = (id) => setDownloadForms(downloadForms.filter(f => f.id !== id));
  const addStep = () => setStepsProcess([...stepsProcess, { id: Date.now(), label: "" }]);
  const removeStep = (id) => setStepsProcess(stepsProcess.filter(s => s.id !== id));
  const handleStepChange = (id, v) => setStepsProcess(stepsProcess.map(s => s.id === id ? { ...s, label: v } : s));
  const handleDirectFileUpload = async (e) => { /* Reuse your existing upload logic */ };

  return (
    <div className="psa-page">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className={`psa-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="psa-container">
          <div className="psa-header">
            <div className="psa-title">
              <h1>PSA Serbilis</h1>
              <p>Birth, Marriage, Death Certificate Processing</p>
            </div>
            <button className="psa-btn-add" onClick={handleManageService}>
              <FolderOpen size={18} style={{ marginRight: "8px" }} /> Manage Service
            </button>
          </div>

          <div className="psa-stats-grid">
            {stats.map((s, i) => (
              <div className="psa-card" key={i}>
                <div>
                  <h2>{s.value}</h2>
                  <span>{s.label}</span>
                </div>
                <div className="psa-card-icon">{s.icon}</div>
              </div>
            ))}
          </div>

          <div className="psa-table-container">
            <table className="psa-table">
              <thead>
                <tr>
                  <th>Ref No.</th>
                  <th>Requester</th>
                  <th>Document Type</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.length === 0 ? (
                    <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No PSA requests found.</td>
                    </tr>
                ) : (
                    inquiries.map((row) => (
                    <tr key={row._id}>
                        <td style={{ fontWeight: "700", color: "#0f172a" }}>
                        {row._id.slice(-6).toUpperCase()}
                        </td>
                        <td>{row.fullName}</td>
                        <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontWeight: 'bold', fontSize: '10px' }}>
                                PSA
                            </div>
                            <span style={{ fontWeight: '600', color: '#334155' }}>
                                {row.psaDocument || row.serviceName}
                            </span>
                        </div>
                        </td>
                        <td>
                            <div style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                {row.message}
                            </div>
                        </td>
                        <td>
                        <span className={`visa-badge badge-${(row.status || 'PENDING').toLowerCase()}`}>
                            {row.status || 'PENDING'}
                        </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                        <div style={{display:'flex', justifyContent: 'flex-end'}}>
                            <button 
                                className="visa-action-btn visa-view-btn" 
                                onClick={() => handleViewInquiry(row)}
                            >
                                View
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
          </div>

          {isInquiryModalOpen && selectedInquiry && (
            <div className="modal-overlay" onClick={handleCloseInquiryModal}>
              <div className="modal-content modal-content-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
                      PSA Request Details
                    </h2>
                    <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                      Review customer information and submitted documents
                    </p>
                  </div>
                  <button className="modal-close-btn" onClick={handleCloseInquiryModal}>
                    <X size={24} />
                  </button>
                </div>

                <div className="modal-body">
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>
                      Customer Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                      <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Full Name</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{selectedInquiry.fullName}</p></div>
                      <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Email</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{selectedInquiry.email}</p></div>
                      <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Document Type</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{selectedInquiry.psaDocument || 'N/A'}</p></div>
                      <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Estimated Price</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>₱{(selectedInquiry.estimatedPrice || 0).toLocaleString()}</p></div>
                      <div>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Status</p>
                          <span className={`visa-badge badge-${(selectedInquiry.status || 'pending').toLowerCase()}`}>{selectedInquiry.status || 'PENDING'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Request Details</h3>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6' }}>
                      {selectedInquiry.message}
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Submitted Documents ({documents.length})</h3>
                    {documents.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontStyle: 'italic' }}>No documents uploaded.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {documents.map(doc => (
                                <div key={doc._id} style={{ background: 'white', padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '20px' }}>📄</span>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px 0' }}>{doc.originalName}</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{formatFileSize(doc.fileSize)} • {formatDate(doc.uploadDate)}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="visa-action-btn visa-view-btn" style={{padding:'6px 10px'}}>View</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Update Status</h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        className="visa-action-btn"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, 'PENDING')}
                        disabled={selectedInquiry.status === 'PENDING'}
                      >
                        Set Pending
                      </button>
                      
                      <button 
                        className="visa-action-btn"
                        onClick={initiateContactStatus}
                        disabled={selectedInquiry.status === 'CONTACTED'}
                      >
                        Set Contacted (With Remarks)
                      </button>
                      
                      <button 
                        className="visa-action-btn btn-approve-payment"
                        onClick={handleRequestPayment}
                        disabled={selectedInquiry.status === 'PAYMENT_PENDING' || selectedInquiry.status === 'PAID'}
                      >
                        <CreditCard size={16} /> Approve & Request Payment
                      </button>

                      <button 
                        className="visa-action-btn"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, 'COMPLETED')}
                        disabled={selectedInquiry.status === 'COMPLETED'}
                        style={{background: '#0f172a', color: 'white', borderColor: '#0f172a'}}
                      >
                        Set Completed
                      </button>

                      <button 
                        className="visa-action-btn btn-cancel"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, 'CANCELLED')}
                        disabled={selectedInquiry.status === 'CANCELLED'}
                      >
                        Cancel Request
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button className="visa-action-btn" onClick={handleCloseInquiryModal}>Close</button>
                </div>
              </div>
            </div>
          )}

          {showContactRemarks && (
            <div className="modal-overlay" style={{ zIndex: 10000 }}> 
                <div className="modal-content" style={{ maxWidth: '500px', height: 'auto', padding: '24px', background: 'white', borderRadius: '16px' }}> {/* Nagdagdag din ako ng background at radius para sigurado */}
                    <div className="modal-header" style={{padding: '0 0 20px 0'}}>
                        <h3 style={{margin:0}}>Add Remarks & Evidence</h3>
                        <button className="modal-close-btn" onClick={() => setShowContactRemarks(false)}>
                            <X size={24} />
                        </button>
                    </div>
                    <div className="modal-body" style={{padding: '0'}}>
                        <div className="form-group">
                            <label>Remarks / Issues Found *</label>
                            <textarea 
                                rows="4"
                                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                value={contactRemarks}
                                onChange={(e) => setContactRemarks(e.target.value)}
                                placeholder="Explain the error in documents..."
                            />
                        </div>
                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label>Upload Evidence (Screenshot/Doc)</label>
                            <input 
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setContactEvidence(e.target.files[0])}
                                style={{ display: 'block', marginTop: '5px' }}
                            />
                        </div>
                    </div>
                    <div style={{display:'flex', gap:'10px', marginTop:'20px', justifyContent:'flex-end'}}>
                        <button className="visa-action-btn" onClick={() => setShowContactRemarks(false)}>Cancel</button>
                        <button className="visa-action-btn" style={{background:'#f97316', color:'white', borderColor:'#f97316'}} onClick={submitContactWithRemarks}>Proceed</button>
                    </div>
                </div>
            </div>
          )}

          {isPSAFormsOpen && (
            <div className="modal-overlay" onClick={() => setIsPSAFormsOpen(false)}>
              <div className="psa-forms-modal" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modal-close-btn"
                  onClick={() => setIsPSAFormsOpen(false)}
                >
                  <X size={24} />
                </button>

                <div className="modal-header">
                  <h2>Manage PSA Services</h2>
                  <p>View and edit your offered PSA document services</p>
                </div>

                <div className="psa-forms-grid">
                  {isLoading ? (
                    <p>Loading PSA services...</p>
                  ) : psaDocs.length === 0 ? (
                    <p>No PSA documents found. Add one to get started.</p>
                  ) : (
                    psaDocs.map((psa) => (
                      <div key={psa.id} className="psa-form-card">
                        <div className="psa-form-header">
                          <div className="psa-form-icon">📄</div>
                          <div className="psa-form-info">
                            <h3>{psa.documentType}</h3>
                            <p>{psa.desc}</p>
                            <span className="psa-price-tag">₱{psa.price}</span>
                          </div>
                        </div>
                        <div className="psa-form-actions">
                          <button
                            className="psa-edit-btn"
                            onClick={() => handleEditPSA(psa)}
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            className="psa-delete-btn"
                            onClick={() => handleDeletePSA(psa.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button className="add-psa-btn" onClick={handleAddNewPSA}>
                  <Plus size={18} />
                  Add New PSA Document
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PSASerbilis;