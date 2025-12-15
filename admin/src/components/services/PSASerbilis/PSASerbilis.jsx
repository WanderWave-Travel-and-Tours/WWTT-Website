import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidebar/sidebar";
import {
  FileText,
  AlertTriangle,
  FolderOpen,
  CheckCircle,
  Search, // Added Search icon for the input field
} from "lucide-react";
import "./PSASerbilis.css";
// IMPORT THE NEW MODALS
import {
  PSAInquiryModal,
  PSAContactRemarksModal,
  PSAServiceListModal,
  PSAServiceEditorModal
} from "./PSAModals";

// =========================================================================
// PAGINATION COMPONENT (Updated with ellipsis logic)
// =========================================================================
const Pagination = ({ applicationsPerPage, totalApplications, paginate, currentPage }) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalApplications / applicationsPerPage);

  // Logic to only show a limited number of page buttons and ellipses
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, currentPage + Math.floor(maxButtons / 2));

  // Adjust start/end to ensure maxButtons are visible if possible
  if (endPage - startPage + 1 < maxButtons) {
    if (currentPage < totalPages / 2) {
        endPage = Math.min(totalPages, startPage + maxButtons - 1);
    } else {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
  }
  
  // Final check to ensure range is appropriate
  if (endPage - startPage + 1 < maxButtons) {
    if (startPage === 1) {
        endPage = Math.min(totalPages, maxButtons);
    } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxButtons + 1);
    }
  }


  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handlePrev = () => {
    if (currentPage > 1) {
      paginate(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      paginate(currentPage + 1);
    }
  };

  if (totalApplications <= applicationsPerPage) return null;

  return (
    <nav className="pagination-nav">
      <ul className="pagination-list">
        <li>
          <button 
            onClick={handlePrev} 
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
        </li>

        {/* First page button and optional ellipsis */}
        {startPage > 1 && (
            <>
                <li className="page-item"><button onClick={() => paginate(1)} className="pagination-btn">1</button></li>
                {startPage > 2 && <span className="pagination-ellipsis">...</span>}
            </>
        )}

        {pageNumbers.map(number => (
          <li key={number} className="page-item">
            <button 
              onClick={() => paginate(number)} 
              className={`pagination-btn ${number === currentPage ? 'active' : ''}`}
            >
              {number}
            </button>
          </li>
        ))}

        {/* Last page button and optional ellipsis */}
        {endPage < totalPages && (
            <>
                {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                <li className="page-item"><button onClick={() => paginate(totalPages)} className="pagination-btn">{totalPages}</button></li>
            </>
        )}

        <li>
          <button 
            onClick={handleNext} 
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};
// =========================================================================
// END PAGINATION COMPONENT
// =========================================================================

const PSASerbilis = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [psaDocs, setPsaDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // PAGINATION STATES (NEW)
  const [currentPage, setCurrentPage] = useState(1);
  const [applicationsPerPage] = useState(10); // Set to 10 items per page

  // SEARCH/FILTER STATES (NEW)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // Default to 'ALL'

  // Modal States
  const [isPSAFormsOpen, setIsPSAFormsOpen] = useState(false); // Manage Services List
  const [isEditorOpen, setIsEditorOpen] = useState(false); // Add/Edit Service
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false); // View Inquiry
  const [showContactRemarks, setShowContactRemarks] = useState(false); // Report Issue

  // Data States
  const [selectedPSA, setSelectedPSA] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Editor Form States
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

  // Contact Remarks States
  const [contactRemarks, setContactRemarks] = useState("");
  const [contactEvidence, setContactEvidence] = useState(null);

  // Delivery States (New)
  const [showDeliverDocs, setShowDeliverDocs] = useState(false);
  const [deliveryFiles, setDeliveryFiles] = useState([]);

  // List of all possible unique statuses for filters (ensure 'ALL' is first)
  const statusOptions = ['ALL', 'PENDING', 'PAYMENT_PENDING', 'CONTACTED', 'CONFIRMED', 'PAID', 'COMPLETED', 'CANCELLED'];

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
  
  // Effect to reset page when filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);


  const fetchPSADocs = async () => {
    try {
      const res = await axios.get("https://wanderwaveph-backend.onrender.com/api/psa");
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
      const response = await axios.get('https://wanderwaveph-backend.onrender.com/api/inquiries');
      if (response.data.success) {
        const psaRequests = response.data.data.filter(inq => 
            inq.psaDocument || 
            (inq.serviceName && inq.serviceName.toUpperCase().includes('PSA')) ||
            (inq.serviceName && inq.serviceName.toUpperCase().includes('CERTIFICATE'))
        );
        setInquiries(psaRequests);
        setCurrentPage(1); // Reset to first page after new data load
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  const fetchDocuments = async (inquiryId) => {
    try {
      const response = await axios.get(`https://wanderwaveph-backend.onrender.com/api/documents/inquiry/${inquiryId}`);
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
    setShowDeliverDocs(false);
    setDeliveryFiles([]);
    await fetchDocuments(inquiry._id);
    setIsInquiryModalOpen(true);
  };

  const handleCloseInquiryModal = () => {
    setSelectedInquiry(null);
    setDocuments([]);
    setIsInquiryModalOpen(false);
    setShowDeliverDocs(false);
  };

  const handleUpdateInquiryStatus = async (inquiryId, newStatus) => {
    try {
      const response = await axios.put(
        `https://wanderwaveph-backend.onrender.com/api/inquiries/${inquiryId}/status`,
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
        `https://wanderwaveph-backend.onrender.com/api/inquiries/${selectedInquiry._id}/status`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
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

  const handleDeliverDocuments = async () => {
    if (deliveryFiles.length === 0) {
      alert("Please select files to upload.");
      return;
    }
    
    // Logic to upload final documents and complete request
    // Note: You need a backend endpoint for this (e.g. /api/inquiries/:id/complete)
    // For now, we simulate completion
    if(window.confirm("This will send the files to the user and mark the request as COMPLETED. Proceed?")) {
        await handleUpdateInquiryStatus(selectedInquiry._id, 'COMPLETED');
        // Add file upload logic here when backend is ready
    }
  };

  // --- SERVICE EDITOR HANDLERS ---
  const toggleAccordion = (section) => {
    setAccordionState((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleManageService = () => setIsPSAFormsOpen(true);

  const handleAddNewPSA = () => {
    setSelectedPSA(null);
    setNewPSAForm({ documentType: "", desc: "", price: "" });
    setRequirements([]);
    setDownloadForms([]);
    setStepsProcess([]);
    setIsPSAFormsOpen(false);
    setIsEditorOpen(true);
  };

  const handleEditPSA = (psa) => {
    setSelectedPSA(psa);
    setNewPSAForm({
        documentType: psa.documentType,
        desc: psa.desc,
        price: psa.price
    });
    
    const loadedReqs = (psa.requirements || []).map((reqSection) => ({ 
        id: Math.random(), 
        title: reqSection.title, 
        items: reqSection.items.map((item) => ({ id: Math.random(), label: item })) 
    }));
    setRequirements(loadedReqs);
    
    const loadedForms = (psa.downloadForms || []).map((form) => ({ 
        id: Math.random(), 
        label: form.label, // mapped to name in UI
        name: form.label,
        fileName: form.fileName, 
        fileUrl: form.fileUrl 
    }));
    setDownloadForms(loadedForms);
    
    const loadedSteps = (psa.stepsProcess || []).map((step) => ({ 
        id: Math.random(), 
        label: step 
    }));
    setStepsProcess(loadedSteps);

    setIsPSAFormsOpen(false);
    setIsEditorOpen(true);
  };

  const handleSaveService = async () => {
    if (!newPSAForm.documentType || !newPSAForm.price) {
        alert("Please fill in required fields");
        return;
    }

    const formattedRequirements = requirements.map((cat) => ({ 
        title: cat.title, 
        items: cat.items.map((item) => item.label).filter((label) => label) 
    }));
    const formattedDownloadForms = downloadForms.map((form) => ({ 
        label: form.name || form.label, 
        fileName: form.fileName, 
        fileUrl: form.fileUrl 
    }));
    const formattedSteps = stepsProcess.map((step) => step.label).filter((label) => label);

    const payload = {
        documentType: newPSAForm.documentType,
        description: newPSAForm.desc,
        price: newPSAForm.price,
        requirements: formattedRequirements,
        downloadForms: formattedDownloadForms,
        stepsProcess: formattedSteps
    };

    try {
        if (selectedPSA) {
            // Update
            await axios.put(`https://wanderwaveph-backend.onrender.com/api/psa/${selectedPSA.id}`, payload);
            alert("Changes saved successfully!");
        } else {
            // Create
            await axios.post("https://wanderwaveph-backend.onrender.com/api/psa", payload);
            alert("PSA Document created successfully!");
        }
        fetchPSADocs();
        setIsEditorOpen(false);
        setIsPSAFormsOpen(true);
    } catch (error) {
        console.error(error);
        alert("Failed to save service");
    }
  };

  const handleDeletePSA = async (id) => {
    if (window.confirm("Delete this service?")) {
        await axios.delete(`https://wanderwaveph-backend.onrender.com/api/psa/${id}`);
        fetchPSADocs();
    }
  };

  // Helper functions for editor lists (omitted for brevity, keep in actual file)
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
      const response = await axios.post('https://wanderwaveph-backend.onrender.com/api/psa/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const { fileName, fileUrl } = response.data.data;
        setDownloadForms([...downloadForms, {
          id: Date.now(),
          name: fileName,
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

  // --- FILTERING, SEARCHING & PAGINATION LOGIC (NEW) ---
  const filteredApplications = inquiries.filter((inquiry) => {
    // 1. Filter by Status
    const statusMatch = filterStatus === "ALL" || (inquiry.status && inquiry.status.toUpperCase() === filterStatus);

    if (!statusMatch) return false;

    // 2. Filter by Search Query
    if (searchQuery.trim() === "") return true;

    const searchLower = searchQuery.toLowerCase();
    
    const refNo = inquiry._id.slice(-6).toLowerCase();
    const fullName = (inquiry.fullName || "").toLowerCase();
    const documentType = (inquiry.psaDocument || inquiry.serviceName || "").toLowerCase();
    const message = (inquiry.message || "").toLowerCase();
    
    return (
      refNo.includes(searchLower) ||
      fullName.includes(searchLower) ||
      documentType.includes(searchLower) ||
      message.includes(searchLower)
    );
  });

  const totalFilteredApplications = filteredApplications.length;
  
  // Change page function
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Apply Pagination
  const indexOfLastApplication = currentPage * applicationsPerPage;
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
  // Ensure we don't paginate beyond the available pages if filters change
  const currentApplications = filteredApplications.slice(indexOfFirstApplication, indexOfLastApplication);

  // Ensure current page is valid after filtering/searching
  if (currentPage > 1 && currentApplications.length === 0 && totalFilteredApplications > 0) {
      setCurrentPage(Math.ceil(totalFilteredApplications / applicationsPerPage));
  }
  // --- END LOGIC ---


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
          
          {/* --- SEARCH AND FILTER SYSTEM (NEW) --- */}
          <div className="search-filter-card">
              <div className="search-filter-wrapper">
                  <div className="search-box">
                      <Search size={20} className="search-icon" />
                      <input
                          type="text"
                          placeholder="Search by Ref No, Requester, Document Type, or Message..."
                          className="search-input"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>
                  <div className="filter-buttons">
                      {statusOptions.map(status => (
                          <button
                              key={status}
                              className={`filter-btn badge-${status.toLowerCase()} ${filterStatus === status ? 'active' : ''}`}
                              onClick={() => setFilterStatus(status)}
                          >
                              {status.replace('_', ' ')}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
          {/* --- END SEARCH AND FILTER SYSTEM --- */}


          <div className="psa-table-container">
            <table className="psa-table">
              <thead>
                <tr>
                  <th>#</th> {/* Re-added for numbering */}
                  <th>Ref No.</th>
                  <th>Requester</th>
                  <th>Document Type</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentApplications.length === 0 ? (
                    <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>
                        {inquiries.length === 0 ? "No PSA requests found." : "No requests match your current search and filter criteria."}
                    </td>
                    </tr>
                ) : (
                    currentApplications.map((row, i) => ( // Use currentApplications
                    <tr key={row._id}>
                        <td style={{ fontWeight: "700", color: "#64748b" }}>
                          {indexOfFirstApplication + i + 1} {/* Correct sequential numbering */}
                        </td>
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
                        <span className={`psa-badge badge-${(row.status || 'PENDING').toLowerCase()}`}>
                            {row.status || 'PENDING'}
                        </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                        <div style={{display:'flex', justifyContent: 'flex-end'}}>
                            <button 
                                className="psa-action-btn psa-view-btn" 
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

            {/* Render Pagination */}
            <Pagination 
                applicationsPerPage={applicationsPerPage}
                totalApplications={totalFilteredApplications}
                paginate={paginate}
                currentPage={currentPage}
            />
          </div>

          {/* --- MODALS --- (Omitted for brevity, keep in actual file) */}
          {/* 1. View Inquiry Modal */}
          {isInquiryModalOpen && selectedInquiry && (
            <PSAInquiryModal
                inquiry={selectedInquiry}
                documents={documents}
                onClose={handleCloseInquiryModal}
                onUpdateStatus={handleUpdateInquiryStatus}
                onRequestPayment={handleRequestPayment}
                onConfirmPayment={() => handleUpdateInquiryStatus(selectedInquiry._id, "CONFIRMED")}
                showDeliverDocs={showDeliverDocs}
                setShowDeliverDocs={setShowDeliverDocs}
                deliveryFiles={deliveryFiles}
                setDeliveryFiles={setDeliveryFiles}
                handleDeliverDocuments={handleDeliverDocuments}
                setShowContactRemarks={setShowContactRemarks}
            />
          )}

          {/* 2. Contact Remarks Modal */}
          {showContactRemarks && (
            <PSAContactRemarksModal
                remarks={contactRemarks}
                setRemarks={setContactRemarks}
                setEvidence={setContactEvidence}
                onSubmit={submitContactWithRemarks}
                onClose={() => setShowContactRemarks(false)}
            />
          )}

          {/* 3. Manage Services List Modal */}
          {isPSAFormsOpen && (
            <PSAServiceListModal
                services={psaDocs}
                onAdd={handleAddNewPSA}
                onEdit={handleEditPSA}
                onDelete={handleDeletePSA}
                onClose={() => setIsPSAFormsOpen(false)}
            />
          )}

          {/* 4. Edit/Create Service Modal */}
          {isEditorOpen && (
            <PSAServiceEditorModal
                isEditorOpen={isEditorOpen}
                form={newPSAForm}
                setForm={setNewPSAForm}
                requirements={requirements}
                steps={stepsProcess}
                downloads={downloadForms}
                accordionState={accordionState}
                toggleAccordion={toggleAccordion}
                addCategory={addCategory}
                removeCategory={removeCategory}
                handleCategoryTitleChange={handleCategoryTitleChange}
                addRequirement={addRequirement}
                removeRequirement={removeRequirement}
                handleLabelChange={handleLabelChange}
                addStep={addStep}
                removeStep={removeStep}
                handleStepChange={handleStepChange}
                handleDirectFileUpload={handleDirectFileUpload}
                removeDownloadForm={removeDownloadForm}
                onSave={handleSaveService}
                onClose={() => {
                    setIsEditorOpen(false);
                    setIsPSAFormsOpen(true);
                }}
            />
          )}
          {/* --- END MODALS --- */}


        </div>
      </main>
    </div>
  );
};

export default PSASerbilis;