import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Sidebar from "../../sidebar/sidebar";
import {
  FileText,
  AlertTriangle,
  CreditCard,
  CheckCircle,
  FolderOpen,
  UserPlus,
  Archive,
  Search,
  Eye,
  Mail,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import "./PSASerbilis.css";
import {
  PSAInquiryModal,
  PSAContactRemarksModal,
  PSAServiceListModal,
  PSAServiceEditorModal
} from "./PSAModals";
import PSAApplicationModal from "./PSAApplicationModal";

// Placeholder Images for Stats (Use same logic as CENOMAR if available, else placeholders)
const PSA_STAT_IMAGES = {
    TOTAL_REQUESTS: 'https://picsum.photos/seed/psa-total/800/600',
    PENDING: 'https://picsum.photos/seed/psa-pending/800/600',
    PAYMENT_PENDING: 'https://picsum.photos/seed/psa-payment/800/600',
    PAID: 'https://picsum.photos/seed/psa-paid/800/600'
};

// Pagination Component (Matching CenomarPagination)
const PSAPagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const [jumpPageInput, setJumpPageInput] = useState('');
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const handleJump = (e) => {
      e.preventDefault();
      const page = parseInt(jumpPageInput, 10);
      if (page >= 1 && page <= totalPages) {
          onPageChange(page);
          setJumpPageInput('');
      } else {
          alert(`Please enter a page number between 1 and ${totalPages}.`);
      }
  };

  return (
    <nav className="psa-pagination-nav">
      <div className="psa-pagination-info">
        <span className="psa-pagination-showing">
          Showing <strong>{totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
          <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
          <strong>{totalItems}</strong> items
        </span>
      </div>

      <div className="psa-pagination-jump">
        <button
          type="button"
          className="psa-jump-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={18} />
        </button>
        
        <form onSubmit={handleJump} className="psa-pagination-jump-form">
          <span className="psa-pagination-jump-label">Page</span>
          <input 
            type="number" 
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            placeholder={currentPage.toString()}
            min="1" 
            max={totalPages}
            className="psa-jump-input"
          />
          <span className="psa-pagination-jump-label">of {totalPages}</span>
        </form>
        
        <button
          type="button"
          className="psa-jump-arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
};

// Stats Component (Matching CenomarStats)
const PSAStats = ({ stats }) => {
    const getStatClass = (label) => {
        return label.toLowerCase().replace(/ /g, '-');
    }
    
    return (
        <div className="psa-stats-grid">
            {stats.map((s, i) => (
                <div 
                    className={`psa-stat-card psa-stat-card-${getStatClass(s.label)}`} 
                    key={i}
                    style={{backgroundImage: `url(${s.image})`}}
                >
                    <div className="psa-stat-card-content">
                        <h2>{s.value}</h2>
                        <span>{s.label}</span>
                    </div>
                    <div className="psa-stat-card-icon">{s.icon}</div>
                </div>
            ))}
        </div>
    );
};

// Filters Component (Matching CenomarFilters)
const PSAFilters = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, statusOptions, getFilterClassName }) => {
  return (
    <div className="psa-filter-card">
      <div className="psa-filter-wrapper">
        <div className="psa-brand-label">
            PSA <span>FILTERS</span>
        </div>
        
        <div className="psa-filter-buttons">
          {statusOptions.map(status => (
            <button
              key={status}
              className={`psa-filter-btn ${getFilterClassName(status)}`} 
              onClick={() => setFilterStatus(status)}
            >
              {status === 'ALL' ? 'All Requests' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="psa-search-box">
          <Search size={18} className="psa-search-icon" /> 
          <input
            type="text"
            className="psa-search-input"
            placeholder="Search by Requester, Document, Ref No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

// Table Component (Matching CenomarTable)
const PSATable = ({ loading, filteredInquiriesCount, currentInquiries, handleViewInquiry, handleArchiveInquiry, startIndex }) => {
    const getStatusBadgeClass = (status) => {
        const normalizedStatus = (status || 'PENDING').toLowerCase();
        switch (normalizedStatus) {
            case 'pending': return 'psa-badge-pending';
            case 'contacted': return 'psa-badge-contacted';
            case 'payment_pending': return 'psa-badge-payment_pending';
            case 'paid': return 'psa-badge-paid';
            case 'confirmed': return 'psa-badge-confirmed';
            case 'completed': return 'psa-badge-completed';
            case 'cancelled': return 'psa-badge-cancelled';
            default: return 'psa-badge-pending';
        }
    };

    if (loading) {
        return (
            <tbody>
                <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                        Loading PSA requests...
                    </td>
                </tr>
            </tbody>
        );
    }

    if (filteredInquiriesCount === 0) {
        return (
            <tbody>
                <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                        No PSA requests found
                    </td>
                </tr>
            </tbody>
        );
    }

    return (
        <tbody>
            {currentInquiries.map((row, index) => (
                <tr key={row._id}>
                    <td style={{ fontWeight: "700", color: '#0f172a', textAlign: 'center', width: '60px' }}>
                        {startIndex + index + 1}
                    </td>
                    <td className="psa-ref-cell">{row._id.slice(-6).toUpperCase()}</td>
                    <td>
                        <div className="psa-requester-name">{row.fullName}</div>
                        <div className="psa-requester-email">
                            <Mail size={13} />
                            <span>{row.email}</span>
                        </div>
                    </td>
                    <td>
                        <span className="psa-doc-badge">PSA</span>
                        {row.psaDocument || row.serviceName}
                    </td>
                    <td>
                        <span className={`psa-table-badge ${getStatusBadgeClass(row.status)}`}>
                            {row.status || 'PENDING'}
                        </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                        <div className="psa-action-group">
                            <button 
                                className="psa-action-btn psa-view-btn" 
                                onClick={() => handleViewInquiry(row)}
                                title="View Details"
                            >
                                <Eye size={16} /> View
                            </button>
                            <button 
                                className="psa-action-btn psa-archive-btn" 
                                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                onClick={() => handleArchiveInquiry(row._id)}
                                title="Archive Request"
                            >
                                <Archive size={16} /> Archive
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};

const PSASerbilis = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [psaDocs, setPsaDocs] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); 

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal States
  const [isPSAFormsOpen, setIsPSAFormsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [showContactRemarks, setShowContactRemarks] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  // Data States
  const [selectedPSA, setSelectedPSA] = useState(null);
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

  // Delivery States
  const [showDeliverDocs, setShowDeliverDocs] = useState(false);
  const [deliveryFiles, setDeliveryFiles] = useState([]);

  useEffect(() => {
    fetchPSADocs();
    fetchInquiries();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

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
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/inquiries');
      if (response.data.success) {
        // Filter: inquiryType ay PSA at isArchive ay No
        const psaRequests = response.data.data.filter(inq => 
            inq.inquiryType === 'PSA' && inq.isArchive === 'No'
        );
        // Sort newest first
        psaRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInquiries(psaRequests);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredInquiries = useMemo(() => {
    let list = inquiries;
    const lowerSearchTerm = searchTerm.toLowerCase();

    if (filterStatus !== "ALL") {
      list = list.filter(inq => (inq.status || 'PENDING') === filterStatus);
    }

    if (lowerSearchTerm) {
      list = list.filter(inq =>
        inq.fullName.toLowerCase().includes(lowerSearchTerm) ||
        (inq.psaDocument || inq.serviceName || '').toLowerCase().includes(lowerSearchTerm) ||
        (inq.message || '').toLowerCase().includes(lowerSearchTerm) ||
        (inq._id || '').slice(-6).toLowerCase().includes(lowerSearchTerm) 
      );
    }
    
    return list;
  }, [inquiries, searchTerm, filterStatus]);

  const stats = useMemo(() => [
    { 
        label: "Total Requests", 
        value: inquiries.length, 
        icon: <FileText size={24} />, 
        image: PSA_STAT_IMAGES.TOTAL_REQUESTS 
    },
    { 
        label: "To Process", 
        value: inquiries.filter(i => (i.status || 'PENDING') === 'PENDING').length, 
        icon: <AlertTriangle size={24} />, 
        image: PSA_STAT_IMAGES.PENDING 
    },
    { 
        label: "Pending Payment", 
        value: inquiries.filter(i => i.status === 'PAYMENT_PENDING').length, 
        icon: <CreditCard size={24} />, 
        image: PSA_STAT_IMAGES.PAYMENT_PENDING 
    },
    { 
        label: "Paid/Confirming", 
        value: inquiries.filter(i => i.status === 'PAID').length, 
        icon: <CheckCircle size={24} />, 
        image: PSA_STAT_IMAGES.PAID 
    },
  ], [inquiries]);

  const getFilterClassName = (status) => {
    return status === filterStatus ? 'psa-active-navy' : '';
  }

  const statusOptions = useMemo(() => {
    const statuses = new Set(inquiries.map(i => i.status || 'PENDING')); 
    const allPossibleStatuses = [
      'PENDING', 'CONTACTED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED'
    ];
    const sortedStatuses = allPossibleStatuses.filter(status => statuses.has(status));
    return ['ALL', ...sortedStatuses];
  }, [inquiries]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInquiries = filteredInquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalItems = filteredInquiries.length;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // --- ACTIONS ---

  const handleArchiveInquiry = async (id) => {
    if (window.confirm("Are you sure you want to archive this request?")) {
      try {
        const response = await axios.put(`http://localhost:5000/api/inquiries/${id}/archive`, {
          isArchive: "Yes"
        });
        if (response.data.success) {
          alert("Inquiry archived successfully.");
          fetchInquiries(); 
        }
      } catch (error) {
        console.error("Error archiving inquiry:", error);
        alert("Failed to archive inquiry.");
      }
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
    setShowDeliverDocs(false);
    setDeliveryFiles([]);
    await fetchDocuments(inquiry._id);
    setIsInquiryModalOpen(true);
  };

  const handleCloseInquiryModal = () => {
    setIsInquiryModalOpen(false);
    setTimeout(() => {
        setSelectedInquiry(null);
        setDocuments([]);
        setShowDeliverDocs(false);
    }, 200);
  };

  const handleUpdateInquiryStatus = async (inquiryId, newStatus) => {
    if(newStatus === 'CANCELLED' && !window.confirm("Are you sure you want to cancel this request?")) return;
    
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

  const handleDeliverDocuments = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (deliveryFiles.length === 0) {
      alert("Please select files to upload.");
      return;
    }
    
    const formData = new FormData();
    deliveryFiles.forEach(file => formData.append('documents', file));

    try {
      const response = await axios.put(`http://localhost:5000/api/inquiries/${selectedInquiry._id}/deliver-documents`, formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      if (response.data.success) {
        alert('Documents sent successfully!');
        fetchInquiries(); 
        setSelectedInquiry({ ...selectedInquiry, status: 'COMPLETED' });
        await fetchDocuments(selectedInquiry._id);
        setDeliveryFiles([]);
        setShowDeliverDocs(true); 
      }
    } catch (error) { console.error(error); alert('Failed to send documents'); }
  };

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
        label: form.label,
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
            await axios.put(`http://localhost:5000/api/psa/${selectedPSA.id}`, payload);
            alert("Changes saved successfully!");
        } else {
            await axios.post("http://localhost:5000/api/psa", payload);
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
        await axios.delete(`http://localhost:5000/api/psa/${id}`);
        fetchPSADocs();
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
      const response = await axios.post('http://localhost:5000/api/psa/upload', formData, {
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
              <h1>PSA Services</h1>
              <p>Birth, Marriage, Death Certificate Processing</p>
            </div>
            {/* UPDATED BUTTON CONTAINER */}
            <div className="psa-header-actions">
              <button 
                className="psa-btn-add psa-btn-dark" 
                onClick={() => setIsApplicationModalOpen(true)}
              >
                <UserPlus size={18} /> Add Requester
              </button>
              
              <button className="psa-btn-add" onClick={handleManageService}>
                <FolderOpen size={18} /> Manage Service
              </button>
            </div>
          </div>

          <PSAStats stats={stats} />

          <PSAFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            statusOptions={statusOptions}
            getFilterClassName={getFilterClassName}
          />

          <div className="psa-table-container">
            <table className="psa-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '60px' }}>#</th>
                  <th>Ref No.</th>
                  <th>Requester</th>
                  <th>Document</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <PSATable 
                loading={isLoading}
                filteredInquiriesCount={filteredInquiries.length}
                currentInquiries={currentInquiries}
                handleViewInquiry={handleViewInquiry}
                handleArchiveInquiry={handleArchiveInquiry}
                startIndex={startIndex}
              />
            </table>
          </div>

          {filteredInquiries.length > 0 && Math.ceil(filteredInquiries.length / itemsPerPage) > 1 && (
            <PSAPagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}

          <PSAApplicationModal 
            isOpen={isApplicationModalOpen}
            onClose={() => setIsApplicationModalOpen(false)}
            psaDocs={psaDocs}
            refreshData={fetchInquiries}
          />

          {/* MODALS */}
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

          {showContactRemarks && (
            <PSAContactRemarksModal
                remarks={contactRemarks}
                setRemarks={setContactRemarks}
                setEvidence={setContactEvidence}
                onSubmit={submitContactWithRemarks}
                onClose={() => setShowContactRemarks(false)}
            />
          )}

          {isPSAFormsOpen && (
            <PSAServiceListModal
                services={psaDocs}
                onAdd={handleAddNewPSA}
                onEdit={handleEditPSA}
                onDelete={handleDeletePSA}
                onClose={() => setIsPSAFormsOpen(false)}
            />
          )}

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
        </div>
      </main>
    </div>
  );
};

export default PSASerbilis;