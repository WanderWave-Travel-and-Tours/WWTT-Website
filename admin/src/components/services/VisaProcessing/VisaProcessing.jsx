import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidebar/sidebar";
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
  // Layout State
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // API State
  const [visaForms, setVisaForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals State
  const [isVisaFormsOpen, setIsVisaFormsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Accordion State for Edit Requirements Modal
  const [accordionState, setAccordionState] = useState({
    requirements: false,
    downloadForms: false,
    stepsProcess: false,
  });

  // Form State for Adding New Visa
  const [newVisaForm, setNewVisaForm] = useState({
    country: "",
    flagCode: "",
    desc: "",
    price: "",
  });

  // State: Editable Requirements Categories
  const [requirements, setRequirements] = useState([]);

  // State: Download Forms (with file upload)
  const [downloadForms, setDownloadForms] = useState([]);

  // State: Steps and Process
  const [stepsProcess, setStepsProcess] = useState([]);

  // Country codes list
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

  // Toggle Accordion
  const toggleAccordion = (section) => {
    setAccordionState((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // --- FETCH DATA FROM BACKEND ---
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
  }, []);

  // --- HANDLER: ADD NEW VISA ---
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

  // --- HANDLER: DELETE VISA ---
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

  // --- HANDLERS FOR REQUIREMENTS EDITOR ---
  const handleOpenVisaForms = () => {
    setIsVisaFormsOpen(true);
  };

  const handleSelectVisaToEdit = (visa) => {
    setSelectedVisa(visa);

    // Load Requirements
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

    // Load Download Forms
    const dbForms = Array.isArray(visa.downloadForms) ? visa.downloadForms : [];
    const formattedForms = dbForms.map((form, idx) => ({
      id: `form-${idx}-${Date.now()}`,
      label: typeof form === "string" ? form : form.label || "",
      fileUrl: typeof form === "object" ? form.fileUrl : null,
      fileName: typeof form === "object" ? form.fileName : null,
    }));
    setDownloadForms(formattedForms);

    // Load Steps and Process
    const dbSteps = Array.isArray(visa.stepsProcess) ? visa.stepsProcess : [];
    const formattedSteps = dbSteps.map((step, idx) => ({
      id: `step-${idx}-${Date.now()}`,
      label: step,
    }));
    setStepsProcess(formattedSteps);

    // Reset accordion state
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

  // --- REQUIREMENTS HANDLERS ---
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

  // --- DOWNLOAD FORMS HANDLERS ---
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
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);

    console.log('📤 Uploading file:', file.name);

    // Upload file to server
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

      // Add new form to the list with actual uploaded file data
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

  // Reset file input
  event.target.value = null;
};

  // --- STEPS AND PROCESS HANDLERS ---
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

  // Static Dashboard Data
  const stats = [
    {
      label: "Total Visas Configured",
      value: visaForms.length,
      icon: <FolderOpen size={28} />,
    },
    { label: "Pending Review", value: "15", icon: <Clock size={28} /> },
    {
      label: "Visas Approved",
      value: "1,180",
      icon: <CheckCircle size={28} />,
    },
    { label: "In Processing", value: "45", icon: <RefreshCw size={28} /> },
  ];

  const applications = [
    {
      id: "VISA-101",
      client: "Juan Dela Cruz",
      country: "Japan",
      flag: "🇯🇵",
      flagCode: "JP",
      type: "Tourist Visa",
      date: "Nov 20, 2025",
      status: "Pending",
    },
    {
      id: "VISA-102",
      client: "Maria Clara",
      country: "USA",
      flag: "🇺🇸",
      flagCode: "US",
      type: "F1 Student",
      date: "Nov 18, 2025",
      status: "Approved",
    },
    {
      id: "VISA-103",
      client: "Jose Rizal",
      country: "Spain",
      flag: "🇪🇸",
      flagCode: "ES",
      type: "Work Visa",
      date: "Nov 19, 2025",
      status: "Process",
    },
  ];

  return (
    <div className="visa-page">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`visa-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="visa-container">
          {/* Header */}
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

          {/* Stats Grid */}
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

          {/* Applications Table */}
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
                      <button className="visa-action-btn visa-view-btn">
                        View
                      </button>
                      <button className="visa-action-btn">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- MODAL 1: VISA FORMS LIST --- */}
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
                  {/* ADD NEW VISA FORM TOGGLE */}
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
                        {/* Country Name - Manual Input */}
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

                        {/* Flag Code - Dropdown */}
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

                        {/* Description */}
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

                        {/* Price */}
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

                  {/* VISA FORMS LIST */}
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

          {/* --- MODAL 2: EDIT CHECKLIST WITH ACCORDIONS --- */}
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
                  {/* ACCORDION 1: LIST OF REQUIREMENTS */}
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

                  {/* ACCORDION 2: DOWNLOAD FORMS HERE WITH FILE UPLOAD */}
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
                        {/* LIST OF UPLOADED FORMS */}
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

                        {/* UPLOAD BUTTON */}
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

                  {/* ACCORDION 3: STEPS AND OTHER PROCESS WITH NUMBERING */}
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
