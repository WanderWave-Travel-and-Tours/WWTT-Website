import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidebar/sidebar";
import { CreditCard } from "lucide-react";
import {
  Plus,
  FolderOpen,
  Clock,
  CheckCircle,
  RefreshCw,
  FileText,
  X,
  Save,
  Trash2,
  PlusCircle,
  ChevronRight,
  ListPlus,
  ChevronDown,
  ChevronUp,
  Download,
  ClipboardList,
  Upload,
} from "lucide-react";
import "./VisaProcessing.css";

const VisaProcessing = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [visaForms, setVisaForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisaFormsOpen, setIsVisaFormsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState(null);
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

  const [newVisaForm, setNewVisaForm] = useState({
    country: "",
    flagCode: "",
    desc: "",
    price: "",
  });

  const [requirements, setRequirements] = useState([]);
  const [downloadForms, setDownloadForms] = useState([]);
  const [stepsProcess, setStepsProcess] = useState([]);

  const countryCodes = [
    { code: "AE", name: "United Arab Emirates" },
    { code: "AR", name: "Argentina" },
    { code: "AT", name: "Austria" },
    { code: "AU", name: "Australia" },
    { code: "BD", name: "Bangladesh" },
    { code: "BE", name: "Belgium" },
    { code: "BG", name: "Bulgaria" },
    { code: "BH", name: "Bahrain" },
    { code: "BN", name: "Brunei" },
    { code: "BR", name: "Brazil" },
    { code: "CA", name: "Canada" },
    { code: "CH", name: "Switzerland" },
    { code: "CL", name: "Chile" },
    { code: "CN", name: "China" },
    { code: "CO", name: "Colombia" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DE", name: "Germany" },
    { code: "DK", name: "Denmark" },
    { code: "EG", name: "Egypt" },
    { code: "ES", name: "Spain" },
    { code: "FI", name: "Finland" },
    { code: "FR", name: "France" },
    { code: "GB", name: "United Kingdom" },
    { code: "GR", name: "Greece" },
    { code: "HK", name: "Hong Kong" },
    { code: "HR", name: "Croatia" },
    { code: "HU", name: "Hungary" },
    { code: "ID", name: "Indonesia" },
    { code: "IE", name: "Ireland" },
    { code: "IL", name: "Israel" },
    { code: "IN", name: "India" },
    { code: "IT", name: "Italy" },
    { code: "JO", name: "Jordan" },
    { code: "JP", name: "Japan" },
    { code: "KE", name: "Kenya" },
    { code: "KH", name: "Cambodia" },
    { code: "KR", name: "South Korea" },
    { code: "KW", name: "Kuwait" },
    { code: "LA", name: "Laos" },
    { code: "LB", name: "Lebanon" },
    { code: "LK", name: "Sri Lanka" },
    { code: "MA", name: "Morocco" },
    { code: "MM", name: "Myanmar" },
    { code: "MO", name: "Macau" },
    { code: "MV", name: "Maldives" },
    { code: "MX", name: "Mexico" },
    { code: "MY", name: "Malaysia" },
    { code: "NG", name: "Nigeria" },
    { code: "NL", name: "Netherlands" },
    { code: "NO", name: "Norway" },
    { code: "NP", name: "Nepal" },
    { code: "NZ", name: "New Zealand" },
    { code: "OM", name: "Oman" },
    { code: "PE", name: "Peru" },
    { code: "PK", name: "Pakistan" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "QA", name: "Qatar" },
    { code: "RO", name: "Romania" },
    { code: "RS", name: "Serbia" },
    { code: "RU", name: "Russia" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "SE", name: "Sweden" },
    { code: "SG", name: "Singapore" },
    { code: "TH", name: "Thailand" },
    { code: "TR", name: "Turkey" },
    { code: "TW", name: "Taiwan" },
    { code: "UA", name: "Ukraine" },
    { code: "US", name: "United States" },
    { code: "VN", name: "Vietnam" },
    { code: "ZA", name: "South Africa" },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const handleRequestPayment = async () => {
      if (!window.confirm("Are documents correct? This will notify the user to pay.")) return;
      
      await handleUpdateInquiryStatus(selectedInquiry._id, 'PAYMENT_PENDING');
  };

  const initiateContactStatus = () => {
      setShowContactRemarks(true); // Open the specific modal for remarks
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
              // Update local state
              setSelectedInquiry({ 
                  ...selectedInquiry, 
                  status: 'CONTACTED',
                  remarks: contactRemarks,
                  evidenceUrl: response.data.data.evidenceUrl 
              });
              setShowContactRemarks(false); // Close remarks modal
              setContactRemarks("");
              setContactEvidence(null);
          }
      } catch (error) {
          console.error('Error updating status:', error);
          alert('Failed to update status');
      }
  };

  const fetchInquiries = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inquiries');
      if (response.data.success) {
        const visaRequests = response.data.data.filter(inq => 
            (inq.serviceName && inq.serviceName.toUpperCase().includes('VISA')) ||
            inq.visaCountry // Check kung may visa country field
        );
        
        setInquiries(visaRequests);
        console.log('✅ Visa Inquiries loaded:', visaRequests.length);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  const toggleAccordion = (section) => {
    setAccordionState((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const fetchVisas = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/visas");
      if (Array.isArray(res.data)) {
        const mappedData = res.data.map((v) => ({
          ...v,
          id: v._id,
          desc: v.description,
        }));
        setVisaForms(mappedData);
      }
    } catch (error) {
      console.error("Error fetching visas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisas();
    fetchInquiries();
  }, []);

  const fetchDocuments = async (inquiryId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/documents/inquiry/${inquiryId}`);
      if (response.data.success) {
        setDocuments(response.data.documents || []);
        console.log('✅ Documents loaded:', response.data.documents?.length || 0);
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

  const formatDate = (dateString) => {
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

  const handleAddNewVisa = async () => {
    if (
      !newVisaForm.country ||
      !newVisaForm.flagCode ||
      !newVisaForm.desc ||
      !newVisaForm.price
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        country: newVisaForm.country.toUpperCase(),
        flagCode: newVisaForm.flagCode.toUpperCase(),
        description: newVisaForm.desc.toUpperCase(),
        price: newVisaForm.price,
      };

      await axios.post("http://localhost:5000/api/visas/add", payload);
      fetchVisas();
      setNewVisaForm({ country: "", flagCode: "", desc: "", price: "" });
      setIsAddFormOpen(false);
    } catch (error) {
      alert("Failed to add visa. Check database connection.");
      console.error(error);
    }
  };

  const handleDeleteVisa = async (visaId) => {
    if (window.confirm("Are you sure you want to delete this visa?")) {
      try {
        await axios.delete(`http://localhost:5000/api/visas/${visaId}`);
        setVisaForms(visaForms.filter((visa) => visa.id !== visaId));
      } catch (error) {
        alert("Failed to delete visa.");
      }
    }
  };

  const handleOpenVisaForms = () => {
    setIsVisaFormsOpen(true);
  };

  const handleSelectVisaToEdit = (visa) => {
    setSelectedVisa(visa);
    
    const dbReqs = visa.requirements || [];
    const formattedReqs = dbReqs.map((cat, catIdx) => ({
      id: `cat-${catIdx}-${Date.now()}`,
      title: cat.title,
      items: cat.items.map((itemStr, itemIdx) => ({
        id: `item-${catIdx}-${itemIdx}-${Date.now()}`,
        label: itemStr,
      })),
    }));
    setRequirements(formattedReqs);

    const dbForms = Array.isArray(visa.downloadForms) ? visa.downloadForms : [];
    const formattedForms = dbForms.map((form, idx) => ({
      id: `form-${idx}-${Date.now()}`,
      label: typeof form === "string" ? form : form.label || "",
      fileUrl: typeof form === "object" ? form.fileUrl : null,
      fileName: typeof form === "object" ? form.fileName : null,
    }));
    setDownloadForms(formattedForms);

    const dbSteps = Array.isArray(visa.stepsProcess) ? visa.stepsProcess : [];
    const formattedSteps = dbSteps.map((step, idx) => ({
      id: `step-${idx}-${Date.now()}`,
      label: step,
    }));
    setStepsProcess(formattedSteps);

    setAccordionState({
      requirements: false,
      downloadForms: false,
      stepsProcess: false,
    });

    setIsVisaFormsOpen(false);
    setIsEditorOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedVisa) return;

    const apiRequirements = requirements.map((cat) => ({
      title: cat.title,
      items: cat.items.map((i) => i.label).filter((l) => l.trim() !== ""),
    }));

    const apiDownloadForms = downloadForms
      .map((f) => ({
        label: f.label,
        fileUrl: f.fileUrl || null,
        fileName: f.fileName || null,
      }))
      .filter((f) => f.label.trim() !== "");

    const apiStepsProcess = stepsProcess
      .map((s) => s.label)
      .filter((l) => l.trim() !== "");

    try {
      await axios.put(`http://localhost:5000/api/visas/${selectedVisa.id}`, {
        requirements: apiRequirements,
        downloadForms: apiDownloadForms,
        stepsProcess: apiStepsProcess,
      });
      fetchVisas();
      setIsEditorOpen(false);
      setIsVisaFormsOpen(true);
    } catch (error) {
      alert("Error saving requirements");
    }
  };

  const handleLabelChange = (catId, itemId, newText) => {
    setRequirements((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, label: newText } : item
          ),
        };
      })
    );
  };

  const removeRequirement = (catId, itemId) => {
    setRequirements((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.filter((item) => item.id !== itemId),
        };
      })
    );
  };

  const addRequirement = (catId) => {
    setRequirements((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: [...cat.items, { id: `new-item-${Date.now()}`, label: "" }],
        };
      })
    );
  };

  const handleTitleChange = (catId, newTitle) => {
    setRequirements((prev) =>
      prev.map((cat) => (cat.id === catId ? { ...cat, title: newTitle } : cat))
    );
  };

  const removeCategory = (catId) => {
    if (window.confirm("Delete this entire section?")) {
      setRequirements((prev) => prev.filter((cat) => cat.id !== catId));
    }
  };

  const addCategory = () => {
    setRequirements((prev) => [
      ...prev,
      {
        id: `new-cat-${Date.now()}`,
        title: "NEW REQUIREMENT CATEGORY",
        items: [],
      },
    ]);
  };

  const addDownloadForm = () => {
    setDownloadForms((prev) => [
      ...prev,
      { id: `form-${Date.now()}`, label: "", fileUrl: null, fileName: null },
    ]);
  };

  const removeDownloadForm = (formId) => {
    setDownloadForms((prev) => prev.filter((f) => f.id !== formId));
  };

  const handleFormChange = (formId, newText) => {
    setDownloadForms((prev) =>
      prev.map((f) => (f.id === formId ? { ...f, label: newText } : f))
    );
  };

  const handleDirectFileUpload = async (event) => {
  const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Uploading file:', file.name);

      const uploadResponse = await axios.post(
        'http://localhost:5000/api/visas/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (uploadResponse.data.success) {
        const { fileName, fileUrl } = uploadResponse.data.data;

        setDownloadForms((prev) => [
          ...prev,
          {
            id: `form-${Date.now()}`,
            label: fileName,
            fileUrl: fileUrl,
            fileName: fileName,
          },
        ]);

        console.log('✅ File uploaded successfully:', fileName);
      }
    } catch (error) {
      console.error('❌ File upload error:', error);
      alert('Failed to upload file. Please try again.');
    }

    event.target.value = null;
  };

  const addStep = () => {
    setStepsProcess((prev) => [
      ...prev,
      { id: `step-${Date.now()}`, label: "" },
    ]);
  };

  const removeStep = (stepId) => {
    setStepsProcess((prev) => prev.filter((s) => s.id !== stepId));
  };

  const handleStepChange = (stepId, newText) => {
    setStepsProcess((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, label: newText } : s))
    );
  };

  const stats = [
    {
      label: "Total Visas Configured",
      value: visaForms.length,
      icon: <FolderOpen size={28} />,
    },
    { 
      label: "Pending Review", 
      value: inquiries.filter(i => i.status === 'PENDING').length, 
      icon: <Clock size={28} /> 
    },
    {
      label: "Contacted",
      value: inquiries.filter(i => i.status === 'CONTACTED').length, 
      icon: <CheckCircle size={28} />,
    },
    { 
      label: "Completed", 
      value: inquiries.filter(i => i.status === 'COMPLETED').length,
      icon: <RefreshCw size={28} /> 
    },
  ];

  const applications = inquiries.map((inquiry) => ({
    id: inquiry._id.slice(-8).toUpperCase(),
    client: inquiry.fullName,
    country: inquiry.visaCountry || 'N/A',
    flagCode: inquiry.visaCountry ? getCountryCode(inquiry.visaCountry) : null,
    flag: '🌍',
    type: inquiry.serviceName,
    date: formatDate(inquiry.createdAt),
    status: inquiry.status || 'PENDING',
    _original: inquiry 
  }));

  function getCountryCode(countryName) {
    const country = countryCodes.find(
      c => c.name.toUpperCase() === countryName.toUpperCase()
    );
    return country ? country.code : null;
  }

  return (
    <div className="visa-page">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`visa-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="visa-container">
          <div className="visa-header">
            <div className="visa-title">
              <h1>Visa Processing</h1>
              <p>Manage visa requirements and forms</p>
            </div>
            <div className="header-actions">
              <button
                className="visa-btn-edit-req"
                onClick={handleOpenVisaForms}
              >
                <FileText size={18} />
                Manage Visa Forms
              </button>
            </div>
          </div>

          <div className="visa-stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="visa-card">
                <div className="visa-card-content">
                  <h2>{stat.value}</h2>
                  <span>{stat.label}</span>
                </div>
                <div className="visa-card-icon">{stat.icon}</div>
              </div>
            ))}
          </div>

          <div className="visa-table-container">
            <table className="visa-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Applicant</th>
                  <th>Country</th>
                  <th>Visa Type</th>
                  <th>Date Received</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.id}</td>
                    <td>{app.client}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div className="visa-flag-circle-small">
                          {app.flagCode ? (
                            <img
                              className="visa-flag-img"
                              src={`https://flagcdn.com/w40/${app.flagCode.toLowerCase()}.png`}
                              alt={app.country}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <span>{app.flag}</span>
                          )}
                        </div>
                        <span>{app.country}</span>
                      </div>
                    </td>
                    <td>{app.type}</td>
                    <td>{app.date}</td>
                    <td>
                      <span
                        className={`visa-badge badge-${app.status.toLowerCase()}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="visa-action-btn visa-view-btn"
                        onClick={() => handleViewInquiry(app._original)} // ✅ UPDATED
                      >
                        View
                      </button>
                      <button className="visa-action-btn">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isVisaFormsOpen && (
            <div
              className="modal-overlay"
              onClick={(e) => {
                if (e.target.className === "modal-overlay")
                  setIsVisaFormsOpen(false);
              }}
            >
              <div className="modal-content modal-content-large">
                <div className="modal-header">
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#0f172a",
                        textTransform: "uppercase",
                      }}
                    >
                      Visa Forms
                    </h2>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      Select a visa to edit its checklist requirements.
                    </p>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={() => setIsVisaFormsOpen(false)}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="modal-body bg-gray">
                  {!isAddFormOpen ? (
                    <button
                      className="add-visa-toggle-btn"
                      onClick={() => setIsAddFormOpen(true)}
                    >
                      <Plus size={20} />
                      Add New Visa Form
                    </button>
                  ) : (
                    <div className="add-visa-form-container">
                      <div className="add-visa-form-header">
                        <h3>Add New Visa</h3>
                        <button
                          className="form-close-btn"
                          onClick={() => {
                            setIsAddFormOpen(false);
                            setNewVisaForm({
                              country: "",
                              flagCode: "",
                              desc: "",
                              price: "",
                            });
                          }}
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="add-visa-form-grid">
                        <div className="form-group">
                          <label>Country Name *</label>
                          <input
                            type="text"
                            placeholder="e.g., JAPAN"
                            value={newVisaForm.country}
                            onChange={(e) =>
                              setNewVisaForm({
                                ...newVisaForm,
                                country: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Flag Code (2 Letters) *</label>
                          <select
                            value={newVisaForm.flagCode}
                            onChange={(e) =>
                              setNewVisaForm({
                                ...newVisaForm,
                                flagCode: e.target.value,
                              })
                            }
                          >
                            <option value="">e.g., JP</option>
                            {countryCodes.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.code} - {country.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group form-group-full">
                          <label>Description *</label>
                          <input
                            type="text"
                            placeholder="e.g., JAPAN VISA ASSISTANCE (PREMIUM)"
                            value={newVisaForm.desc}
                            onChange={(e) =>
                              setNewVisaForm({
                                ...newVisaForm,
                                desc: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group form-group-full">
                          <label>Price *</label>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span style={{ color: "#64748b", fontWeight: 600 }}>
                              Starts at: ₱
                            </span>
                            <input
                              type="number"
                              placeholder="3,749.00"
                              value={newVisaForm.price}
                              onChange={(e) =>
                                setNewVisaForm({
                                  ...newVisaForm,
                                  price: e.target.value,
                                })
                              }
                              style={{ flex: 1 }}
                            />
                            <span style={{ color: "#64748b", fontWeight: 600 }}>
                              /person
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="add-visa-form-actions">
                        <button
                          className="form-cancel-btn"
                          onClick={() => {
                            setIsAddFormOpen(false);
                            setNewVisaForm({
                              country: "",
                              flagCode: "",
                              desc: "",
                              price: "",
                            });
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="form-save-btn"
                          onClick={handleAddNewVisa}
                        >
                          <Plus size={16} />
                          Add Visa
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="visa-forms-list">
                    {isLoading ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#94a3b8",
                        }}
                      >
                        Loading Visas...
                      </div>
                    ) : visaForms.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#94a3b8",
                        }}
                      >
                        No visas found. Add one above.
                      </div>
                    ) : (
                      visaForms.map((visa) => (
                        <div key={visa.id} className="visa-form-card">
                          <div className="visa-form-left">
                            <div className="visa-flag-circle">
                              <img
                                className="visa-flag-img"
                                src={`https://flagcdn.com/w80/${visa.flagCode.toLowerCase()}.png`}
                                alt={visa.country}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            </div>
                            <div className="visa-form-info">
                              <h3>{visa.country}</h3>
                              <p className="visa-desc">{visa.desc}</p>
                              <p className="visa-price">
                                Starts at: ₱{visa.price}
                              </p>
                            </div>
                          </div>
                          <div className="visa-form-actions">
                            <button
                              className="visa-form-edit-btn"
                              onClick={() => handleSelectVisaToEdit(visa)}
                            >
                              <FileText size={16} />
                              EDIT REQUIREMENTS
                            </button>
                            <button
                              className="visa-form-delete-btn"
                              onClick={() => handleDeleteVisa(visa.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isInquiryModalOpen && selectedInquiry && (
            <div
              className="modal-overlay"
              onClick={(e) => {
                if (e.target.className === "modal-overlay")
                  handleCloseInquiryModal();
              }}
            >
              <div className="modal-content modal-content-large">
                <div className="modal-header">
                  <div>
                    <h2 style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#0f172a",
                      textTransform: "uppercase",
                    }}>
                      Inquiry Details
                    </h2>
                    <p style={{
                      margin: "4px 0 0 0",
                      color: "#64748b",
                      fontSize: "13px",
                    }}>
                      Review customer information and submitted documents
                    </p>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={handleCloseInquiryModal}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      marginBottom: '12px',
                      color: '#0f172a'
                    }}>
                      Customer Information
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '16px',
                      background: '#f8fafc',
                      padding: '16px',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>
                          Full Name
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                          {selectedInquiry.fullName}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>
                          Email
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                          {selectedInquiry.email}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>
                          Service
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                          {selectedInquiry.serviceName}
                        </p>
                      </div>
                      {selectedInquiry.visaCountry && (
                        <div>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>
                            Country
                          </p>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            {selectedInquiry.visaCountry}
                          </p>
                        </div>
                      )}
                      {selectedInquiry.estimatedPrice > 0 && (
                        <div>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>
                            Estimated Price
                          </p>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            ₱{selectedInquiry.estimatedPrice.toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>
                          Status
                        </p>
                        <span className={`visa-badge badge-${(selectedInquiry.status || 'pending').toLowerCase()}`}>
                          {selectedInquiry.status || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      marginBottom: '12px',
                      color: '#0f172a'
                    }}>
                      Customer Message
                    </h3>
                    <div style={{
                      background: '#f8fafc',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#334155',
                      lineHeight: '1.6'
                    }}>
                      {selectedInquiry.message}
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      marginBottom: '12px',
                      color: '#0f172a'
                    }}>
                      Submitted Documents ({documents.length})
                    </h3>
                    
                    {documents.length === 0 ? (
                      <p style={{ 
                        textAlign: 'center', 
                        padding: '32px', 
                        color: '#94a3b8',
                        fontStyle: 'italic'
                      }}>
                        No documents uploaded yet
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Object.entries(
                          documents.reduce((acc, doc) => {
                            const section = doc.section || 'General Documents';
                            if (!acc[section]) acc[section] = [];
                            acc[section].push(doc);
                            return acc;
                          }, {})
                        ).map(([section, docs]) => (
                          <div key={section} style={{
                            background: '#f8fafc',
                            borderRadius: '8px',
                            padding: '16px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <h4 style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#0f172a',
                              marginBottom: '12px'
                            }}>
                              📁 {section} ({docs.length})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {docs.map((doc) => (
                                <div key={doc._id} style={{
                                  background: 'white',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  border: '1px solid #e2e8f0'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                    <span style={{ fontSize: '24px' }}>
                                      {doc.fileType?.includes('pdf') ? '📄' :
                                      doc.fileType?.includes('image') ? '🖼️' : '📎'}
                                    </span>
                                    <div>
                                      <p style={{ 
                                        fontSize: '13px', 
                                        fontWeight: 600, 
                                        color: '#0f172a',
                                        margin: '0 0 4px 0' 
                                      }}>
                                        {doc.originalName}
                                      </p>
                                      <p style={{ 
                                        fontSize: '11px', 
                                        color: '#94a3b8',
                                        margin: 0 
                                      }}>
                                        {formatFileSize(doc.fileSize)} • 
                                        {formatDate(doc.uploadDate)}
                                      </p>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <a
                                      href={`http://localhost:5000${doc.fileUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="visa-action-btn visa-view-btn"
                                      style={{ fontSize: '12px', padding: '6px 12px' }}
                                    >
                                      View
                                    </a>
                                    <a
                                      href={`http://localhost:5000${doc.fileUrl}`}
                                      download={doc.originalName}
                                      className="visa-action-btn"
                                      style={{ fontSize: '12px', padding: '6px 12px' }}
                                    >
                                      Download
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      marginBottom: '12px',
                      color: '#0f172a'
                    }}>
                      Update Status
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="visa-action-btn"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, 'PENDING')}
                        disabled={selectedInquiry.status === 'PENDING'}
                        style={{ 
                          opacity: selectedInquiry.status === 'PENDING' ? 0.5 : 1,
                          cursor: selectedInquiry.status === 'PENDING' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Set Pending
                      </button>
                      <button
                          className="visa-action-btn"
                          onClick={initiateContactStatus} // 👈 Call new function
                          disabled={selectedInquiry.status === 'CONTACTED'}
                          style={{ 
                              opacity: selectedInquiry.status === 'CONTACTED' ? 0.5 : 1,
                              cursor: selectedInquiry.status === 'CONTACTED' ? 'not-allowed' : 'pointer'
                          }}
                      >
                          Set Contacted (With Remarks)
                      </button>
                      <button
                          className="visa-action-btn"
                          onClick={handleRequestPayment}
                          disabled={selectedInquiry.status === 'PAYMENT_PENDING' || selectedInquiry.status === 'PAID'}
                          style={{ 
                              background: '#059669', // Green color
                              color: 'white',
                              borderColor: '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              opacity: (selectedInquiry.status === 'PAYMENT_PENDING' || selectedInquiry.status === 'PAID') ? 0.5 : 1,
                              cursor: (selectedInquiry.status === 'PAYMENT_PENDING' || selectedInquiry.status === 'PAID') ? 'not-allowed' : 'pointer'
                          }}
                      >
                          <CreditCard size={16} />
                          Approve & Request Payment
                      </button>  
                      <button
                        className="visa-action-btn visa-view-btn"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, 'COMPLETED')}
                        disabled={selectedInquiry.status === 'COMPLETED'}
                        style={{ 
                          opacity: selectedInquiry.status === 'COMPLETED' ? 0.5 : 1,
                          cursor: selectedInquiry.status === 'COMPLETED' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Set Completed
                      </button>
                      <button
                        className="visa-action-btn"
                        onClick={() => handleUpdateInquiryStatus(selectedInquiry._id, 'CANCELLED')}
                        disabled={selectedInquiry.status === 'CANCELLED'}
                        style={{ 
                          opacity: selectedInquiry.status === 'CANCELLED' ? 0.5 : 1,
                          cursor: selectedInquiry.status === 'CANCELLED' ? 'not-allowed' : 'pointer',
                          background: '#ef4444',
                          color: 'white'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="visa-action-btn"
                    onClick={handleCloseInquiryModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {showContactRemarks && (
            <div className="modal-overlay" style={{ zIndex: 1100 }}> {/* Higher z-index to sit on top */}
                <div className="modal-content" style={{ maxWidth: '500px', height: 'auto' }}>
                    <div className="modal-header">
                        <h3>Add Remarks & Evidence</h3>
                        <button className="modal-close-btn" onClick={() => setShowContactRemarks(false)}>
                            <X size={24} />
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Remarks / Issues Found *</label>
                            <textarea 
                                rows="4"
                                className="req-input-text"
                                style={{ width: '100%', resize: 'none' }}
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
                    <div className="modal-footer">
                        <button className="modal-cancel-btn" onClick={() => setShowContactRemarks(false)}>
                            Cancel
                        </button>
                        <button className="modal-save-btn" onClick={submitContactWithRemarks}>
                            Proceed & Set Contacted
                        </button>
                    </div>
                </div>
            </div>
        )}

          {isEditorOpen && (
            <div className="modal-overlay">
              <div className="modal-content modal-content-large">
                <div className="modal-header">
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#0f172a",
                        textTransform: "uppercase",
                      }}
                    >
                      Edit Requirements
                    </h2>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      Editing checklist for:{" "}
                      {selectedVisa?.desc || "Unknown Visa"}
                    </p>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={() => setIsEditorOpen(false)}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="modal-body bg-gray">
                  <div className="accordion-section">
                    <button
                      className={`accordion-header ${
                        accordionState.requirements ? "active" : ""
                      }`}
                      onClick={() => toggleAccordion("requirements")}
                    >
                      <span className="accordion-title">
                        <span className="accordion-icon">
                          <FileText size={18} />
                        </span>
                        List Of Requirements
                        {requirements.length > 0 && (
                          <span className="accordion-count">
                            {requirements.length} Categories
                          </span>
                        )}
                      </span>
                      <span
                        className={`accordion-chevron ${
                          accordionState.requirements ? "rotate" : ""
                        }`}
                      >
                        <ChevronDown size={20} />
                      </span>
                    </button>

                    {accordionState.requirements && (
                      <div className="accordion-content">
                        {requirements.map((category) => (
                          <div key={category.id} className="req-category">
                            <div className="req-category-header">
                              <input
                                type="text"
                                className="req-header-input"
                                value={category.title}
                                onChange={(e) =>
                                  handleTitleChange(category.id, e.target.value)
                                }
                                placeholder="CATEGORY TITLE"
                              />
                              <button
                                className="req-header-delete-btn"
                                onClick={() => removeCategory(category.id)}
                                title="Delete this entire section"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="req-list">
                              {category.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="req-item-editable"
                                >
                                  <input
                                    type="text"
                                    className="req-input-text"
                                    value={item.label}
                                    onChange={(e) =>
                                      handleLabelChange(
                                        category.id,
                                        item.id,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter requirement detail..."
                                  />
                                  <button
                                    className="req-delete-btn"
                                    onClick={() =>
                                      removeRequirement(category.id, item.id)
                                    }
                                    title="Remove item"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="req-category-footer">
                              <button
                                className="req-add-btn"
                                onClick={() => addRequirement(category.id)}
                              >
                                <PlusCircle size={16} />
                                Add Item
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          className="req-add-group-btn"
                          onClick={addCategory}
                        >
                          <ListPlus size={20} />
                          Add New Requirement Title
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="accordion-section">
                    <button
                      className={`accordion-header ${
                        accordionState.downloadForms ? "active" : ""
                      }`}
                      onClick={() => toggleAccordion("downloadForms")}
                    >
                      <span className="accordion-title">
                        <span className="accordion-icon">
                          <Download size={18} />
                        </span>
                        Download Forms Here
                        {downloadForms.length > 0 && (
                          <span className="accordion-count">
                            {downloadForms.length} Forms
                          </span>
                        )}
                      </span>
                      <span
                        className={`accordion-chevron ${
                          accordionState.downloadForms ? "rotate" : ""
                        }`}
                      >
                        <ChevronDown size={20} />
                      </span>
                    </button>

                    {accordionState.downloadForms && (
                      <div className="accordion-content">
                        <div className="uploaded-forms-list">
                          {downloadForms.map((form) => (
                            <div key={form.id} className="uploaded-form-card">
                              <div className="uploaded-form-icon">📄</div>
                              <div className="uploaded-form-info">
                                <span className="uploaded-form-name">
                                  {form.fileName || form.label}
                                </span>
                              </div>
                              <button
                                className="req-delete-btn"
                                onClick={() => removeDownloadForm(form.id)}
                                title="Remove form"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <label className="upload-download-form-btn">
                          <Upload size={16} />
                          <span>Upload Download Form</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleDirectFileUpload}
                            style={{ display: "none" }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="accordion-section">
                    <button
                      className={`accordion-header ${
                        accordionState.stepsProcess ? "active" : ""
                      }`}
                      onClick={() => toggleAccordion("stepsProcess")}
                    >
                      <span className="accordion-title">
                        <span className="accordion-icon">
                          <ClipboardList size={18} />
                        </span>
                        Steps and Other Process
                        {stepsProcess.length > 0 && (
                          <span className="accordion-count">
                            {stepsProcess.length} Steps
                          </span>
                        )}
                      </span>
                      <span
                        className={`accordion-chevron ${
                          accordionState.stepsProcess ? "rotate" : ""
                        }`}
                      >
                        <ChevronDown size={20} />
                      </span>
                    </button>

                    {accordionState.stepsProcess && (
                      <div className="accordion-content">
                        <div className="simple-list">
                          {stepsProcess.map((step, index) => (
                            <div key={step.id} className="step-item-editable">
                              <span className="step-number-badge">
                                {index + 1}
                              </span>
                              <input
                                type="text"
                                className="req-input-text"
                                value={step.label}
                                onChange={(e) =>
                                  handleStepChange(step.id, e.target.value)
                                }
                                placeholder={`Step ${
                                  index + 1
                                }: Enter process step...`}
                              />
                              <button
                                className="req-delete-btn"
                                onClick={() => removeStep(step.id)}
                                title="Remove step"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          className="req-add-btn"
                          onClick={addStep}
                          style={{ marginTop: "16px", width: "100%" }}
                        >
                          <ClipboardList size={16} />
                          Add Step
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="modal-cancel-btn"
                    onClick={() => {
                      setIsEditorOpen(false);
                      setIsVisaFormsOpen(true);
                    }}
                  >
                    Back to List
                  </button>
                  <button
                    className="modal-save-btn"
                    onClick={handleSaveChanges}
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisaProcessing;