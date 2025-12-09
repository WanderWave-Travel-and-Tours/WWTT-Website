import React, { useState, useEffect } from "react";
import axios from 'axios';
import Sidebar from "../../sidebar/sidebar"; 
import {
  Plus,
  FileText,
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
} from "lucide-react";
import "./CenomarRequest.css";

const CenomarRequest = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cenomarDocs, setCenomarDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCENOMARFormsOpen, setIsCENOMARFormsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedCENOMAR, setSelectedCENOMAR] = useState(null);
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

  const [newCENOMARForm, setNewCENOMARForm] = useState({
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
    fetchCENOMARDocs();
    fetchInquiries();
  }, []);

  const fetchCENOMARDocs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/cenomar");
      if (Array.isArray(res.data)) {
        const mappedData = res.data.map((c) => ({
          ...c,
          id: c._id,
          desc: c.description,
        }));
        setCenomarDocs(mappedData);
      }
    } catch (error) {
      console.error("Error fetching CENOMAR docs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
        const response = await axios.get('http://localhost:5000/api/inquiries');
        if (response.data.success) {
        // Filter: Only CENOMAR requests
        const cenomarRequests = response.data.data.filter(inq => 
            inq.cenomarDocument || 
            (inq.serviceName && inq.serviceName.toUpperCase().includes('CENOMAR'))
        );
        setInquiries(cenomarRequests);
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

  const handleManageService = () => setIsCENOMARFormsOpen(true);
  
  const handleAddNewCENOMAR = () => { 
    setIsCENOMARFormsOpen(false); 
    setIsAddFormOpen(true); 
    setNewCENOMARForm({ documentType: "", desc: "", price: "" }); 
  };
  
  const handleCreateCENOMAR = async () => {
    if (!newCENOMARForm.documentType || !newCENOMARForm.desc || !newCENOMARForm.price) { 
      alert("Please fill in all required fields"); 
      return; 
    }
    try {
      await axios.post("http://localhost:5000/api/cenomar", {
        documentType: newCENOMARForm.documentType,
        description: newCENOMARForm.desc,
        price: newCENOMARForm.price,
      });
      alert("CENOMAR Document created successfully!");
      fetchCENOMARDocs(); 
      setIsAddFormOpen(false); 
      setIsCENOMARFormsOpen(true);
    } catch (error) { 
      console.error(error); 
      alert("Failed to create CENOMAR document"); 
    }
  };

  const handleEditCENOMAR = (cenomar) => {
    setSelectedCENOMAR(cenomar); 
    setIsCENOMARFormsOpen(false); 
    setIsEditorOpen(true);
    
    const loadedReqs = (cenomar.requirements || []).map((reqSection) => ({ 
      id: Math.random(), 
      title: reqSection.title, 
      items: reqSection.items.map((item) => ({ id: Math.random(), label: item })) 
    }));
    setRequirements(loadedReqs);
    
    const loadedForms = (cenomar.downloadForms || []).map((form) => ({ 
      id: Math.random(), 
      label: form.label, 
      fileName: form.fileName, 
      fileUrl: form.fileUrl 
    }));
    setDownloadForms(loadedForms);
    
    const loadedSteps = (cenomar.stepsProcess || []).map((step) => ({ 
      id: Math.random(), 
      label: step 
    }));
    setStepsProcess(loadedSteps);
  };
  
  const handleSaveChanges = async () => {
      if (!selectedCENOMAR) return;
      
      const formattedRequirements = requirements.map((cat) => ({ 
        title: cat.title, 
        items: cat.items.map((item) => item.label).filter((label) => label) 
      }));
      
      const formattedDownloadForms = downloadForms.map((form) => ({ 
        label: form.label, 
        fileName: form.fileName, 
        fileUrl: form.fileUrl 
      }));
      
      const formattedSteps = stepsProcess.map((step) => step.label).filter((label) => label);
      
      try {
        await axios.put(`http://localhost:5000/api/cenomar/${selectedCENOMAR.id}`, { 
          requirements: formattedRequirements, 
          downloadForms: formattedDownloadForms, 
          stepsProcess: formattedSteps 
        });
        alert("Changes saved successfully!"); 
        fetchCENOMARDocs(); 
        setIsEditorOpen(false); 
        setIsCENOMARFormsOpen(true);
      } catch (error) { 
        console.error(error); 
        alert("Failed to save changes"); 
      }
  };
  
  const handleDeleteCENOMAR = async (id) => { 
    if (window.confirm("Delete this?")) { 
      await axios.delete(`http://localhost:5000/api/cenomar/${id}`); 
      fetchCENOMARDocs(); 
    } 
  };
  
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

  const handleDirectFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/cenomar/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const { fileName, fileUrl } = response.data.data;
        setDownloadForms([...downloadForms, {
          id: Date.now(),
          label: fileName,
          fileName: fileName,
          fileUrl: fileUrl
        }]);
        alert('File uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    }
  };

  return (
    <div className="cenomar-page">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className={`cenomar-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="cenomar-container">
          <div className="cenomar-header">
            <div className="cenomar-title">
              <h1>CENOMAR Request</h1>
              <p>Certificate of No Marriage Applications</p>
            </div>
            <button className="cenomar-btn-add" onClick={handleManageService}>
              <FolderOpen size={18} style={{ marginRight: "8px" }} /> Manage Service
            </button>
          </div>

          <div className="cenomar-stats-grid">
            {stats.map((s, i) => (
              <div className="cenomar-card" key={i}>
                <div>
                  <h2>{s.value}</h2>
                  <span>{s.label}</span>
                </div>
                <div className="cenomar-card-icon">{s.icon}</div>
              </div>
            ))}
          </div>

          <div className="cenomar-table-container">
            <table className="cenomar-table">
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
                    <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No CENOMAR requests found.</td>
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
                            <div style={{ width: '24px', height: '24px', background: '#fce7f3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', fontWeight: 'bold', fontSize: '10px' }}>
                                CNM
                            </div>
                            <span style={{ fontWeight: '600', color: '#334155' }}>
                                {/* 👇 DISPLAY specific document requested */}
                                {row.cenomarDocument || row.serviceName}
                            </span>
                        </div>
                        </td>
                        <td>
                            <div style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                {row.message}
                            </div>
                        </td>
                        <td>
                        <span className={`cenomar-badge badge-${(row.status || 'PENDING').toLowerCase()}`}>
                            {row.status || 'PENDING'}
                        </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                        <div style={{display:'flex', justifyContent: 'flex-end'}}>
                            <button 
                                className="cenomar-action-btn cenomar-view-btn" 
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

          {/* Inquiry Modal */}
          {isInquiryModalOpen && selectedInquiry && (
            <div className="cenomar-modal-overlay" onClick={handleCloseInquiryModal}>
              <div className="cenomar-modal-content" onClick={e => e.stopPropagation()}>
                <div className="cenomar-modal-header">
                  <div>
                    <h2>CENOMAR Request Details</h2>
                    <p>Review customer information and submitted documents</p>
                  </div>
                  <button className="cenomar-modal-close-btn" onClick={handleCloseInquiryModal}>
                    <X size={24} />
                  </button>
                </div>

                <div className="cenomar-modal-body">
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>
                      Customer Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Full Name</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{selectedInquiry.fullName}</p></div>
                      <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Email</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{selectedInquiry.email}</p></div>
                      <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Document Type</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{selectedInquiry.cenomarDocument || 'N/A'}</p></div>
                      <div><p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Estimated Price</p><p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>₱{(selectedInquiry.estimatedPrice || 0).toLocaleString()}</p></div>
                      <div>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>Status</p>
                          <span className={`cenomar-badge badge-${(selectedInquiry.status || 'pending').toLowerCase()}`}>{selectedInquiry.status || 'PENDING'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Request Details</h3>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6', border: '1px solid #e2e8f0' }}>
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
                                        <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="cenomar-action-btn cenomar-view-btn" style={{padding:'6px 10px'}}>View</a>
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
                        className="cenomar-action-btn"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, 'PENDING')}
                        disabled={selectedInquiry.status === 'PENDING'}
                      >
                        Set Pending
                      </button>
                      
                      <button 
                        className="cenomar-action-btn"
                        onClick={initiateContactStatus}
                        disabled={selectedInquiry.status === 'CONTACTED'}
                      >
                        Set Contacted (With Remarks)
                      </button>
                      
                      <button 
                        className="cenomar-action-btn btn-approve-payment"
                        onClick={handleRequestPayment}
                        disabled={selectedInquiry.status === 'PAYMENT_PENDING' || selectedInquiry.status === 'PAID'}
                      >
                        <CreditCard size={16} /> Approve & Request Payment
                      </button>

                      <button 
                        className="cenomar-action-btn"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, 'COMPLETED')}
                        disabled={selectedInquiry.status === 'COMPLETED'}
                        style={{background: '#0f172a', color: 'white', borderColor: '#0f172a'}}
                      >
                        Set Completed
                      </button>

                      <button 
                        className="cenomar-action-btn btn-cancel"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, 'CANCELLED')}
                        disabled={selectedInquiry.status === 'CANCELLED'}
                      >
                        Cancel Request
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="cenomar-modal-footer">
                  <button className="cenomar-action-btn" onClick={handleCloseInquiryModal}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Contact Remarks Modal */}
          {showContactRemarks && (
            <div className="cenomar-modal-overlay" style={{ zIndex: 10000 }}> 
                <div className="cenomar-modal-content" style={{ maxWidth: '500px', height: 'auto', padding: '0', background: 'white', borderRadius: '12px' }}>
                    <div className="cenomar-modal-header">
                        <h2 style={{fontSize:'18px'}}>Add Remarks & Evidence</h2>
                        <button className="cenomar-modal-close-btn" onClick={() => setShowContactRemarks(false)}>
                            <X size={24} />
                        </button>
                    </div>
                    <div className="cenomar-modal-body">
                        <div className="cenomar-form-group">
                            <label>Remarks / Issues Found *</label>
                            <textarea 
                                rows="4"
                                value={contactRemarks}
                                onChange={(e) => setContactRemarks(e.target.value)}
                                placeholder="Explain the error in documents..."
                            />
                        </div>
                        <div className="cenomar-form-group">
                            <label>Upload Evidence (Screenshot/Doc)</label>
                            <input 
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setContactEvidence(e.target.files[0])}
                            />
                        </div>
                    </div>
                    <div className="cenomar-modal-footer">
                        <button className="cenomar-modal-cancel-btn" onClick={() => setShowContactRemarks(false)}>Cancel</button>
                        <button className="cenomar-modal-save-btn" onClick={submitContactWithRemarks}>Proceed</button>
                    </div>
                </div>
            </div>
          )}

          {/* CENOMAR Forms Modal */}
          {isCENOMARFormsOpen && (
            <div className="cenomar-modal-overlay" onClick={() => setIsCENOMARFormsOpen(false)}>
              <div className="cenomar-forms-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cenomar-modal-header">
                  <div>
                    <h2>Manage CENOMAR Services</h2>
                    <p>View and edit your offered CENOMAR document services</p>
                  </div>
                  <button className="cenomar-modal-close-btn" onClick={() => setIsCENOMARFormsOpen(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="cenomar-modal-body">
                    <div className="cenomar-forms-grid">
                    {isLoading ? (
                        <p>Loading CENOMAR services...</p>
                    ) : cenomarDocs.length === 0 ? (
                        <p>No CENOMAR documents found. Add one to get started.</p>
                    ) : (
                        cenomarDocs.map((cenomar) => (
                        <div key={cenomar.id} className="cenomar-form-card">
                            <div className="cenomar-form-header">
                            <div className="cenomar-form-icon">📄</div>
                            <div className="cenomar-form-info">
                                <h3 style={{margin: '0 0 4px 0', fontSize:'16px', color: '#0f172a'}}>{cenomar.documentType}</h3>
                                <p style={{margin: '0', fontSize:'13px', color: '#64748b'}}>{cenomar.desc}</p>
                                <span className="cenomar-price-tag">₱{cenomar.price}</span>
                            </div>
                            </div>
                            <div className="cenomar-form-actions">
                            <button
                                className="cenomar-edit-btn"
                                onClick={() => handleEditCENOMAR(cenomar)}
                            >
                                <Edit size={16} /> Edit
                            </button>
                            <button
                                className="cenomar-delete-btn"
                                onClick={() => handleDeleteCENOMAR(cenomar.id)}
                            >
                                <Trash2 size={16} />
                            </button>
                            </div>
                        </div>
                        ))
                    )}
                    </div>

                    <button className="cenomar-req-add-btn" style={{marginTop: '20px'}} onClick={handleAddNewCENOMAR}>
                    <Plus size={18} />
                    Add New CENOMAR Document
                    </button>
                </div>
              </div>
            </div>
          )}

          {/* Add CENOMAR Modal */}
          {isAddFormOpen && (
            <div className="cenomar-modal-overlay" onClick={() => setIsAddFormOpen(false)}>
              <div className="add-cenomar-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cenomar-modal-header">
                  <div>
                    <h2>Add New CENOMAR Document</h2>
                    <p>Create a new CENOMAR service offering</p>
                  </div>
                  <button className="cenomar-modal-close-btn" onClick={() => setIsAddFormOpen(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="cenomar-modal-body">
                    <div className="cenomar-form-group">
                    <label>Document Type *</label>
                    <input
                        type="text"
                        placeholder="e.g. CENOMAR"
                        value={newCENOMARForm.documentType}
                        onChange={(e) => setNewCENOMARForm({ ...newCENOMARForm, documentType: e.target.value })}
                    />
                    </div>

                    <div className="cenomar-form-group">
                    <label>Description *</label>
                    <textarea
                        placeholder="Describe the document service..."
                        value={newCENOMARForm.desc}
                        onChange={(e) => setNewCENOMARForm({ ...newCENOMARForm, desc: e.target.value })}
                    />
                    </div>

                    <div className="cenomar-form-group">
                    <label>Price *</label>
                    <input
                        type="number"
                        placeholder="450"
                        value={newCENOMARForm.price}
                        onChange={(e) => setNewCENOMARForm({ ...newCENOMARForm, price: e.target.value })}
                    />
                    </div>
                </div>

                <div className="cenomar-modal-footer">
                  <button className="cenomar-modal-cancel-btn" onClick={() => setIsAddFormOpen(false)}>
                    Cancel
                  </button>
                  <button className="cenomar-modal-save-btn" onClick={handleCreateCENOMAR}>
                    <Save size={18} />
                    Create Document
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Editor Modal - Styled like the Image */}
          {isEditorOpen && selectedCENOMAR && (
            <div className="cenomar-modal-overlay" onClick={() => setIsEditorOpen(false)}>
              <div className="cenomar-editor-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cenomar-modal-header">
                  <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
                    <div style={{fontSize:'32px', background:'#fffbeb', padding:'12px', borderRadius:'12px'}}>📄</div>
                    <div>
                      <h2>{selectedCENOMAR.documentType}</h2>
                      <p>{selectedCENOMAR.desc} • <span style={{color:'#166534', fontWeight:'bold', background:'#dcfce7', padding:'2px 8px', borderRadius:'4px'}}>₱{selectedCENOMAR.price}</span></p>
                    </div>
                  </div>
                  <button className="cenomar-modal-close-btn" onClick={() => setIsEditorOpen(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="cenomar-modal-body">
                  {/* Requirements Accordion */}
                  <div className="cenomar-accordion-section">
                    <button
                      className={`cenomar-accordion-header ${accordionState.requirements ? "active" : ""}`}
                      onClick={() => toggleAccordion("requirements")}
                    >
                      <div className="cenomar-accordion-title">
                        <FileText size={18} style={{color: '#f59e0b'}} />
                        LIST OF REQUIREMENTS
                        <span className="cenomar-accordion-count">{requirements.length}</span>
                      </div>
                      <span className={`cenomar-accordion-chevron ${accordionState.requirements ? "rotate" : ""}`}>
                        <ChevronDown size={20} />
                      </span>
                    </button>

                    {accordionState.requirements && (
                      <div className="cenomar-accordion-content">
                        {requirements.map((cat) => (
                          <div key={cat.id} className="cenomar-req-category-group">
                            <div className="cenomar-req-category-header">
                              <input
                                type="text"
                                className="cenomar-req-category-title-input"
                                placeholder="Category Title (e.g. Basic Requirements)"
                                value={cat.title}
                                onChange={(e) => handleCategoryTitleChange(cat.id, e.target.value)}
                              />
                              <button className="cenomar-req-delete-btn" onClick={() => removeCategory(cat.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="cenomar-req-items-list">
                              {cat.items.map((item) => (
                                <div key={item.id} className="cenomar-req-item-row">
                                  <input
                                    type="text"
                                    className="cenomar-req-input-text"
                                    placeholder="Requirement item..."
                                    value={item.label}
                                    onChange={(e) => handleLabelChange(cat.id, item.id, e.target.value)}
                                  />
                                  <button className="cenomar-req-delete-btn" onClick={() => removeRequirement(cat.id, item.id)}>
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <button className="cenomar-req-add-btn" onClick={() => addRequirement(cat.id)}>
                              <PlusCircle size={16} />
                              Add Item
                            </button>
                          </div>
                        ))}

                        <button className="cenomar-req-add-btn" style={{borderStyle:'solid', background:'#f1f5f9'}} onClick={addCategory}>
                          <ListPlus size={18} />
                          Add Category
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Download Forms Accordion */}
                  <div className="cenomar-accordion-section">
                    <button
                      className={`cenomar-accordion-header ${accordionState.downloadForms ? "active" : ""}`}
                      onClick={() => toggleAccordion("downloadForms")}
                    >
                      <div className="cenomar-accordion-title">
                        <Download size={18} style={{color: '#f59e0b'}} />
                        DOWNLOAD FORMS HERE
                        <span className="cenomar-accordion-count">{downloadForms.length}</span>
                      </div>
                      <span className={`cenomar-accordion-chevron ${accordionState.downloadForms ? "rotate" : ""}`}>
                        <ChevronDown size={20} />
                      </span>
                    </button>

                    {accordionState.downloadForms && (
                      <div className="cenomar-accordion-content">
                        <div className="uploaded-forms-list">
                          {downloadForms.map((form) => (
                            <div key={form.id} className="cenomar-uploaded-form-card">
                              <span className="cenomar-uploaded-form-icon">📄</span>
                              <div style={{flex:1}}>
                                <span className="cenomar-uploaded-form-name">{form.label}</span>
                              </div>
                              <button className="cenomar-req-delete-btn" onClick={() => removeDownloadForm(form.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <label className="cenomar-upload-btn-label">
                          <Upload size={18} />
                          Upload New Form
                          <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleDirectFileUpload} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Steps Accordion */}
                  <div className="cenomar-accordion-section">
                    <button
                      className={`cenomar-accordion-header ${accordionState.stepsProcess ? "active" : ""}`}
                      onClick={() => toggleAccordion("stepsProcess")}
                    >
                      <div className="cenomar-accordion-title">
                        <ClipboardList size={18} style={{color: '#f59e0b'}} />
                        STEPS AND OTHER PROCESS
                        <span className="cenomar-accordion-count">{stepsProcess.length}</span>
                      </div>
                      <span className={`cenomar-accordion-chevron ${accordionState.stepsProcess ? "rotate" : ""}`}>
                        <ChevronDown size={20} />
                      </span>
                    </button>

                    {accordionState.stepsProcess && (
                      <div className="cenomar-accordion-content">
                        <div className="cenomar-simple-list">
                          {stepsProcess.map((step, index) => (
                            <div key={step.id} style={{display:'flex', gap:'12px', alignItems:'center'}}>
                              <span style={{background:'#f59e0b', color:'white', width:'24px', height:'24px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'bold', flexShrink:0}}>{index + 1}</span>
                              <input
                                type="text"
                                className="cenomar-req-input-text"
                                placeholder="Step description..."
                                value={step.label}
                                onChange={(e) => handleStepChange(step.id, e.target.value)}
                              />
                              <button className="cenomar-req-delete-btn" onClick={() => removeStep(step.id)}>
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button className="cenomar-req-add-btn" style={{ marginTop: '12px' }} onClick={addStep}>
                          <PlusCircle size={16} />
                          Add Step
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="cenomar-modal-footer">
                  <button className="cenomar-modal-cancel-btn" onClick={() => setIsEditorOpen(false)}>
                    Cancel
                  </button>
                  <button className="cenomar-modal-save-btn" onClick={handleSaveChanges}>
                    <Save size={18} /> 
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CenomarRequest;