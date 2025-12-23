import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Sidebar from "../../sidebar/sidebar";
import {
    BookOpen, Calendar, CheckCircle, RotateCcw,
    FileText, Settings, RefreshCw, X, CreditCard, User,
    ChevronDown, Trash2, PlusCircle, Save, ClipboardList, ListPlus, Download,
    ChevronLeft, ChevronRight, Search, UserPlus, Archive
} from 'lucide-react';
import './PassportAppt.css';
import PassportApplicationModal from './PassportApplicationModal';

const PassportAppt = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('appointments');

    const [showContactRemarks, setShowContactRemarks] = useState(false);
    const [contactRemarks, setContactRemarks] = useState("");
    const [contactEvidence, setContactEvidence] = useState(null);

    const [appointments, setAppointments] = useState([]);
    const [passportData, setPassportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [documents, setDocuments] = useState([]);

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorData, setEditorData] = useState({
        requirements: [],
        additionalDocuments: [],
        stepsProcess: []
    });
    const [accordionState, setAccordionState] = useState({
        requirements: false,
        additionalDocs: false,
        stepsProcess: false
    });

    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false); 
    // --- SEARCH AND FILTER STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // Default to 'ALL'
    // --- END SEARCH AND FILTER STATE ---

    // --- FILTERING LOGIC (Use useMemo for efficient filtering) ---
    const filteredAppointments = useMemo(() => {
        let filtered = appointments;

// Pagination Component
const PassportPagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const [jumpPageInput, setJumpPageInput] = useState("");
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const handleJump = (e) => {
    e.preventDefault();
    const page = parseInt(jumpPageInput, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpPageInput("");
    } else {
      alert(`Please enter a page number between 1 and ${totalPages}.`);
    }
  };

  return (
    <nav className="passport-pagination-nav">
      <div className="passport-pagination-info">
        <span className="passport-pagination-showing">
          Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
          <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{" "}
          <strong>{totalItems}</strong> items
        </span>
      </div>

      <div className="passport-pagination-controls passport-large-only"></div>

      <div className="passport-pagination-jump">
        <button
          type="button"
          className="passport-jump-arrow passport-hide-on-large"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        <form onSubmit={handleJump} className="passport-pagination-jump-form">
          <span className="passport-pagination-jump-label">Page</span>
          <input
            type="number"
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            placeholder={currentPage.toString()}
            min="1"
            max={totalPages}
            className="passport-jump-input"
          />
          <span className="passport-pagination-jump-label">
            of {totalPages}
          </span>
        </form>

        <button
          type="button"
          className="passport-jump-arrow passport-hide-on-large"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
};

// Stats Component
const PassportStats = ({ stats }) => {
  const getStatClass = (label) => {
    return label.toLowerCase().replace(/ /g, "-").replace("/", "-");
  };

  return (
    <div className="passport-stats-grid">
      {stats.map((s, i) => (
        <div
          className={`passport-stat-card passport-stat-card-${getStatClass(
            s.label
          )}`}
          key={i}
          style={{ backgroundImage: `url(${s.image})` }}
        >
          <div className="passport-stat-card-content">
            <h2>{s.value}</h2>
            <span>{s.label}</span>
          </div>
          <div className="passport-stat-card-icon">{s.icon}</div>
        </div>
      ))}
    </div>
  );
};

// Filters Component
const PassportFilters = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  statusOptions,
  getFilterClassName,
}) => {
  return (
    <div className="passport-filter-card">
      <div className="passport-filter-wrapper">
        <div className="passport-brand-label">
          PASSPORT <span>FILTERS</span>
        </div>

        <div className="passport-filter-buttons">
          {statusOptions.map((status) => (
            <button
              key={status}
              className={`passport-filter-btn ${getFilterClassName(status)}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === "ALL" ? "All Requests" : status.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="passport-search-box">
          <Search size={18} className="passport-search-icon" />
          <input
            type="text"
            className="passport-search-input"
            placeholder="Search by Applicant, Type, Ref No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

// Table Component (Added Archive Button)
const PassportTable = ({
  loading,
  filteredInquiriesCount,
  currentInquiries,
  handleViewInquiry,
  handleArchiveInquiry,
  startIndex,
}) => {
  const getStatusBadgeClass = (status) => {
    const normalizedStatus = (status || "PENDING").toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return "passport-badge-pending";
      case "contacted":
        return "passport-badge-contacted";
      case "payment_pending":
        return "passport-badge-payment_pending";
      case "paid":
        return "passport-badge-paid";
      case "confirmed":
        return "passport-badge-confirmed";
      case "completed":
        return "passport-badge-completed";
      case "cancelled":
        return "passport-badge-cancelled";
      case "archived":
        return "passport-badge-cancelled"; // Style archived like cancelled
      default:
        return "passport-badge-pending";
    }
  };

  if (loading) {
    return (
      <tbody>
        <tr>
          <td
            colSpan="7"
            style={{
              textAlign: "center",
              padding: "60px",
              color: "#64748b",
              fontSize: "16px",
            }}
          >
            Loading Passport appointments...
          </td>
        </tr>
      </tbody>
    );
  }

  if (filteredInquiriesCount === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan="7"
            style={{
              textAlign: "center",
              padding: "60px",
              color: "#64748b",
              fontSize: "16px",
            }}
          >
            No Passport requests found
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {currentInquiries.map((row, index) => (
        <tr key={row._id}>
          <td
            style={{ fontWeight: "700", color: "#0f172a", textAlign: "center" }}
          >
            {startIndex + index + 1}
          </td>
          <td className="passport-ref-cell">
            {row._id.slice(-6).toUpperCase()}
          </td>
          <td>
            <div className="passport-requester-name">{row.fullName}</div>
            <div className="passport-requester-email">
              <Mail size={13} />
              <span>{row.email}</span>
            </div>
          </td>
          <td>
            <span className="passport-doc-badge">PPT</span>
            {row.passportDetails?.applicationType ||
              row.serviceName ||
              "Standard"}
          </td>
          <td>
            <div className="passport-truncate-text">
              {row.passportDetails?.dfaLocation || row.message || "N/A"}
            </div>
          </td>
          <td>
            <span
              className={`passport-table-badge ${getStatusBadgeClass(
                row.status
              )}`}
            >
              {row.status || "PENDING"}
            </span>
          </td>
          <td style={{ textAlign: "right" }}>
            <div className="passport-action-group">
              <button
                className="passport-action-btn passport-view-btn"
                onClick={() => handleViewInquiry(row)}
                title="View Details"
              >
                <Eye size={16} />
                View
              </button>
              <button
                className="passport-action-btn passport-archive-btn"
                onClick={() => handleArchiveInquiry(row)}
                title="Archive Request"
              >
                <Archive size={16} />
                Archive
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

// Main Component
const PassportAppt = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [passportServices, setPassportServices] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showContactRemarks, setShowContactRemarks] = useState(false);
  const [contactRemarks, setContactRemarks] = useState("");
  const [contactEvidence, setContactEvidence] = useState(null);
  const [showDeliverDocs, setShowDeliverDocs] = useState(false);
  const [deliveryFiles, setDeliveryFiles] = useState([]);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  // Service Management States
  const [isServiceListOpen, setIsServiceListOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [serviceForm, setServiceForm] = useState({
    documentType: "",
    desc: "",
    price: "",
  });
  const [requirements, setRequirements] = useState([]);
  const [downloadForms, setDownloadForms] = useState([]);
  const [stepsProcess, setStepsProcess] = useState([]);
  const [accordionState, setAccordionState] = useState({
    requirements: true,
    downloadForms: false,
    stepsProcess: false,
  });

  useEffect(() => {
    fetchPassportServices();
    fetchInquiries();
  }, []);

  const fetchPassportServices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/passports");
      if (res.data.success) {
        const mapped = res.data.data.map((d) => ({
          ...d,
          id: d._id,
          desc: d.description,
        }));
        setPassportServices(mapped);
      }
    } catch (error) {
      console.error("Error fetching Passport services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/inquiries");
      if (response.data.success) {
        // Filter for PASSPORT inquiries
        const pptRequests = response.data.data.filter(
          (inq) =>
            inq.inquiryType === "PASSPORT" ||
            (inq.serviceName &&
              inq.serviceName.toUpperCase().includes("PASSPORT"))
        );
        pptRequests.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setInquiries(pptRequests);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    }
  };

  const filteredInquiries = useMemo(() => {
    let list = inquiries;
    const lowerSearchTerm = searchTerm.toLowerCase();

    if (filterStatus !== "ALL") {
      list = list.filter((inq) => (inq.status || "PENDING") === filterStatus);
    }

    if (lowerSearchTerm) {
      list = list.filter(
        (inq) =>
          inq.fullName.toLowerCase().includes(lowerSearchTerm) ||
          (inq.passportDetails?.applicationType || "")
            .toLowerCase()
            .includes(lowerSearchTerm) ||
          (inq.message || "").toLowerCase().includes(lowerSearchTerm) ||
          (inq._id || "").slice(-6).toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (
      currentPage > Math.ceil(list.length / itemsPerPage) &&
      list.length > 0
    ) {
      setCurrentPage(1);
    } else if (list.length === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }

    return list;
  }, [inquiries, searchTerm, filterStatus, itemsPerPage, currentPage]);

  const stats = useMemo(
    () => [
      {
        label: "Total Requests",
        value: inquiries.length,
        icon: <FileText size={24} />,
        image: PASSPORT_STAT_IMAGES.TOTAL_REQUESTS,
      },
      {
        label: "To Process",
        value: inquiries.filter((i) => (i.status || "PENDING") === "PENDING")
          .length,
        icon: <AlertTriangle size={24} />,
        image: PASSPORT_STAT_IMAGES.PENDING,
      },
      {
        label: "Pending Payment",
        value: inquiries.filter((i) => i.status === "PAYMENT_PENDING").length,
        icon: <CreditCard size={24} />,
        image: PASSPORT_STAT_IMAGES.PAYMENT_PENDING,
      },
      {
        label: "Paid/Confirming",
        value: inquiries.filter((i) => i.status === "PAID").length,
        icon: <CheckCircle size={24} />,
        image: PASSPORT_STAT_IMAGES.PAID,
      },
    ],
    [inquiries]
  );

  const getFilterClassName = (status) => {
    return status === filterStatus ? "passport-active-navy" : "";
  };

  const statusOptions = useMemo(() => {
    const statuses = new Set(inquiries.map((i) => i.status || "PENDING"));
    const allPossibleStatuses = [
      "PENDING",
      "CONTACTED",
      "PAYMENT_PENDING",
      "PAID",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "ARCHIVED",
    ];
    const sortedStatuses = allPossibleStatuses.filter((status) =>
      statuses.has(status)
    );
    return ["ALL", ...sortedStatuses];
  }, [inquiries]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInquiries = filteredInquiries.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalItems = filteredInquiries.length;
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const fetchDocuments = async (inquiryId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/documents/inquiry/${inquiryId}`
      );
      if (response.data.success) setDocuments(response.data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    }
  };

  const handleViewInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsViewModalOpen(true);
    fetchDocuments(inquiry._id);
  };

  const handleArchiveInquiry = async (inquiry) => {
    if (
      !window.confirm(
        `Are you sure you want to archive request #${inquiry._id
          .slice(-6)
          .toUpperCase()}?`
      )
    )
      return;

    try {
      // Assuming endpoint for archiving, can be adjusted to your backend route
      const response = await axios.put(
        `http://localhost:5000/api/inquiries/${inquiry._id}/status`,
        { status: "ARCHIVED" }
      );

      if (response.data.success) {
        alert("Request archived successfully.");
        fetchInquiries();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to archive request.");
    }
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setTimeout(() => {
      setSelectedInquiry(null);
      setDocuments([]);
      setShowDeliverDocs(false);
      setDeliveryFiles([]);
      setShowContactRemarks(false);
      setContactRemarks("");
      setContactEvidence(null);
    }, 200);
  };

  const handleUpdateInquiryStatus = async (inquiryId, newStatus) => {
    if (!window.confirm(`Set status to ${newStatus}?`)) return;
    try {
      const response = await axios.put(
        `http://localhost:5000/api/inquiries/${inquiryId}/status`,
        { status: newStatus }
      );
      if (response.data.success) {
        alert("Status updated successfully!");
        fetchInquiries();
        if (selectedInquiry && selectedInquiry._id === inquiryId)
          setSelectedInquiry({ ...selectedInquiry, status: newStatus });
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  const handleRequestPayment = async () => {
    if (!window.confirm("Request payment from user?")) return;
    try {
      const response = await axios.put(
        `http://localhost:5000/api/inquiries/${selectedInquiry._id}/status`,
        { status: "PAYMENT_PENDING" }
      );
      if (response.data.success) {
        alert("Payment requested!");
        fetchInquiries();
        setSelectedInquiry({ ...selectedInquiry, status: "PAYMENT_PENDING" });
      }
    } catch (error) {
      console.error(error);
      alert("Failed to request payment");
    }
  };

  const submitContactWithRemarks = async () => {
    if (!selectedInquiry || !contactRemarks.trim())
      return alert("Please enter remarks");
    try {
      const formData = new FormData();
      formData.append("status", "CONTACTED");
      formData.append("remarks", contactRemarks);
      if (contactEvidence) formData.append("evidence", contactEvidence);
      const response = await axios.put(
        `http://localhost:5000/api/inquiries/${selectedInquiry._id}/status`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (response.data.success) {
        alert("Status updated to CONTACTED!");
        fetchInquiries();
        setSelectedInquiry({ ...selectedInquiry, status: "CONTACTED" });
        setShowContactRemarks(false);
        setContactRemarks("");
        setContactEvidence(null);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  const handleConfirmPayment = async () => {
    if (!window.confirm("Confirm payment received?")) return;
    try {
      const response = await axios.put(
        `http://localhost:5000/api/inquiries/${selectedInquiry._id}/confirm-payment`,
        { adminName: "Admin" }
      );
      if (response.data.success) {
        alert("Payment confirmed!");
        fetchInquiries();
        setSelectedInquiry({ ...selectedInquiry, status: "CONFIRMED" });
      }
    } catch (error) {
      console.error(error);
      alert("Failed to confirm payment");
    }
  };

  const handleDeliverDocuments = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (deliveryFiles.length === 0) return alert("Select files first");

    const formData = new FormData();
    deliveryFiles.forEach((file) => formData.append("documents", file));

    try {
      const response = await axios.put(
        `http://localhost:5000/api/inquiries/${selectedInquiry._id}/deliver-documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        alert("Documents sent successfully!");
        fetchInquiries();
        setSelectedInquiry({ ...selectedInquiry, status: "COMPLETED" });
        await fetchDocuments(selectedInquiry._id);
        setDeliveryFiles([]);
        setShowDeliverDocs(true);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to send documents");
    }
  };

  const handleManageService = () => setIsServiceListOpen(true);

  const handleAddNewService = () => {
    setIsServiceListOpen(false);
    setIsAddFormOpen(true);
    setIsEditorOpen(false);
    setSelectedService(null);
    setServiceForm({ documentType: "", desc: "", price: "" });
    setRequirements([]);
    setDownloadForms([]);
    setStepsProcess([]);
    setAccordionState({
      requirements: true,
      downloadForms: false,
      stepsProcess: false,
    });
  };

  const handleEditService = (service) => {
    setIsServiceListOpen(false);
    setIsAddFormOpen(true);
    setIsEditorOpen(true);
    setSelectedService(service);
    setServiceForm({
      documentType: service.documentType,
      desc: service.description || service.desc,
      price: service.price,
    });
    setRequirements(service.requirements || []);
    setDownloadForms(service.downloadableForms || []);
    setStepsProcess(service.processSteps || []);
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/passports/${id}`);
      fetchPassportServices();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const handleSaveChanges = async () => {
    const payload = {
      documentType: serviceForm.documentType,
      description: serviceForm.desc,
      price: parseFloat(serviceForm.price),
      requirements,
      downloadableForms: downloadForms,
      processSteps: stepsProcess,
    };
    try {
      if (isEditorOpen && selectedService) {
        await axios.put(
          `http://localhost:5000/api/passports/${selectedService._id}`,
          payload
        );
      } else {
        await axios.post(`http://localhost:5000/api/passports`, payload);
      }
      alert("Service saved!");
      setIsAddFormOpen(false);
      setIsServiceListOpen(true);
      fetchPassportServices();
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    }
  };

  // Helper functions for Editor Modal
  const toggleAccordion = (section) =>
    setAccordionState((prev) => ({ ...prev, [section]: !prev[section] }));
  const addCategory = () =>
    setRequirements([
      ...requirements,
      { id: Date.now(), title: "", items: [] },
    ]);
  const removeCategory = (id) =>
    setRequirements(requirements.filter((c) => c.id !== id));
  const handleCategoryTitleChange = (id, v) =>
    setRequirements(
      requirements.map((c) => (c.id === id ? { ...c, title: v } : c))
    );
  const addRequirement = (cId) =>
    setRequirements(
      requirements.map((c) =>
        c.id === cId
          ? { ...c, items: [...c.items, { id: Date.now(), label: "" }] }
          : c
      )
    );
  const removeRequirement = (cId, iId) =>
    setRequirements(
      requirements.map((c) =>
        c.id === cId ? { ...c, items: c.items.filter((i) => i.id !== iId) } : c
      )
    );
  const handleLabelChange = (cId, iId, v) =>
    setRequirements(
      requirements.map((c) =>
        c.id === cId
          ? {
              ...c,
              items: c.items.map((i) =>
                i.id === iId ? { ...i, label: v } : i
              ),
            }
          : c
      )
    );
  const addStep = () =>
    setStepsProcess([...stepsProcess, { id: Date.now(), label: "" }]);
  const removeStep = (id) =>
    setStepsProcess(stepsProcess.filter((s) => s.id !== id));
  const handleStepChange = (id, v) =>
    setStepsProcess(
      stepsProcess.map((s) => (s.id === id ? { ...s, label: v } : s))
    );

  const handleDirectFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/upload",
        formData
      );
      if (res.data.success)
        setDownloadForms([
          ...downloadForms,
          { id: Date.now(), name: file.name, url: res.data.fileUrl },
        ]);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  const removeDownloadForm = (id) =>
    setDownloadForms(downloadForms.filter((f) => f.id !== id));

  return (
    <div className="passport-page">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className={`passport-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="passport-container">
          <div className="passport-header">
            <div className="passport-title">
              <h1>Passport Request</h1>
              <p>Appointment & Document Processing</p>
            </div>
            <div className="passport-header-actions">
              <button
                className="passport-btn-add passport-btn-dark"
                onClick={() => setIsApplicationModalOpen(true)}
              >
                <UserPlus size={18} /> Add Applicant
              </button>

              <button
                className="passport-btn-add"
                onClick={handleManageService}
              >
                <FolderOpen size={18} /> Manage Service
              </button>
            </div>
          </div>

          <PassportStats stats={stats} />

          <PassportFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            statusOptions={statusOptions}
            getFilterClassName={getFilterClassName}
          />

          <div className="passport-table-container">
            <table className="passport-table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>No.</th>
                  <th>Ref No.</th>
                  <th>Applicant</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <PassportTable
                loading={isLoading}
                filteredInquiriesCount={filteredInquiries.length}
                currentInquiries={currentInquiries}
                handleViewInquiry={handleViewInquiry}
                handleArchiveInquiry={handleArchiveInquiry}
                startIndex={startIndex}
              />
            </table>
          </div>

          {filteredInquiries.length > 0 &&
            Math.ceil(filteredInquiries.length / itemsPerPage) > 1 && (
              <PassportPagination
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            )}
        </div>
      </main>

      <PassportApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        refreshData={fetchInquiries}
        passportServices={passportServices}
      />

      {isViewModalOpen && selectedInquiry && (
        <AppointmentViewModal
          appointment={selectedInquiry}
          documents={documents}
          onClose={handleCloseViewModal}
          onUpdateStatus={handleUpdateInquiryStatus}
          onRequestPayment={handleRequestPayment}
          onConfirmPayment={handleConfirmPayment}
          showDeliverDocs={showDeliverDocs}
          setShowDeliverDocs={setShowDeliverDocs}
          deliveryFiles={deliveryFiles}
          setDeliveryFiles={setDeliveryFiles}
          handleDeliverDocuments={handleDeliverDocuments}
          setShowContactRemarks={setShowContactRemarks}
        />
      )}

      {showContactRemarks && (
        <PassportContactRemarksModal
          remarks={contactRemarks}
          setRemarks={setContactRemarks}
          setEvidence={setContactEvidence}
          onSubmit={submitContactWithRemarks}
          onClose={() => {
            setShowContactRemarks(false);
            setContactRemarks("");
            setContactEvidence(null);
          }}
        />
      )}

      {isServiceListOpen && (
        <PassportServiceListModal
          services={passportServices}
          onAdd={handleAddNewService}
          onEdit={handleEditService}
          onDelete={handleDeleteService}
          onClose={() => setIsServiceListOpen(false)}
        />
      )}

      {isAddFormOpen && (
        <PassportServiceEditorModal
          isEditorOpen={isEditorOpen}
          form={serviceForm}
          setForm={setServiceForm}
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
          onSave={handleSaveChanges}
          onClose={() => {
            setIsAddFormOpen(false);
            setIsServiceListOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default PassportAppt;
