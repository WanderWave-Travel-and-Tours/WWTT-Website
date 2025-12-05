import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidebar/sidebar";
import {
  Plus,
  FileText,
  Truck,
  AlertTriangle,
  FolderOpen,
  Clock,
  CheckCircle,
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
    { label: "Total Requests", value: "450", icon: <FileText size={24} /> },
    { label: "To Process", value: "12", icon: <AlertTriangle size={24} /> },
    { label: "Delivered", value: "410", icon: <Truck size={24} /> },
    { label: "Issues", value: "3", icon: <AlertTriangle size={24} /> },
  ];

  const data = [
    {
      id: "PSA-101",
      client: "Ana Marie Otin",
      type: "Birth Certificate",
      copies: 2,
      purpose: "Passport App",
      status: "Pending",
    },
    {
      id: "PSA-102",
      client: "Cardo Dalisay",
      type: "Death Certificate",
      copies: 1,
      purpose: "Claims",
      status: "Completed",
    },
  ];

  useEffect(() => {
    fetchPSADocs();
  }, []);

  const toggleAccordion = (section) => {
    setAccordionState((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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

  const handleManageService = () => {
    setIsPSAFormsOpen(true);
  };

  const handleAddNewPSA = () => {
    setIsPSAFormsOpen(false);
    setIsAddFormOpen(true);
    setNewPSAForm({
      documentType: "",
      desc: "",
      price: "",
    });
  };

  const handleCreatePSA = async () => {
    if (!newPSAForm.documentType || !newPSAForm.desc || !newPSAForm.price) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/psa", {
        documentType: newPSAForm.documentType,
        description: newPSAForm.desc,
        price: newPSAForm.price,
      });

      alert("PSA Document created successfully!");
      fetchPSADocs();
      setIsAddFormOpen(false);
      setIsPSAFormsOpen(true);
    } catch (error) {
      console.error("Error creating PSA:", error);
      alert("Failed to create PSA document");
    }
  };

  const handleEditPSA = (psa) => {
    setSelectedPSA(psa);
    setIsPSAFormsOpen(false);
    setIsEditorOpen(true);

    // Load existing requirements
    const loadedReqs = (psa.requirements || []).map((reqSection) => ({
      id: Date.now() + Math.random(),
      title: reqSection.title,
      items: reqSection.items.map((item) => ({
        id: Date.now() + Math.random(),
        label: item,
      })),
    }));
    setRequirements(loadedReqs);

    // Load existing download forms
    const loadedForms = (psa.downloadForms || []).map((form) => ({
      id: Date.now() + Math.random(),
      label: form.label,
      fileName: form.fileName,
      fileUrl: form.fileUrl,
    }));
    setDownloadForms(loadedForms);

    // Load existing steps
    const loadedSteps = (psa.stepsProcess || []).map((step) => ({
      id: Date.now() + Math.random(),
      label: step,
    }));
    setStepsProcess(loadedSteps);

    setAccordionState({
      requirements: false,
      downloadForms: false,
      stepsProcess: false,
    });
  };

  const handleDeletePSA = async (id) => {
    if (!window.confirm("Are you sure you want to delete this PSA document?"))
      return;

    try {
      await axios.delete(`http://localhost:5000/api/psa/${id}`);
      alert("PSA document deleted successfully!");
      fetchPSADocs();
    } catch (error) {
      console.error("Error deleting PSA:", error);
      alert("Failed to delete PSA document");
    }
  };

  // Requirements Management
  const addCategory = () => {
    setRequirements([
      ...requirements,
      {
        id: Date.now(),
        title: "",
        items: [{ id: Date.now() + 1, label: "" }],
      },
    ]);
  };

  const removeCategory = (categoryId) => {
    setRequirements(requirements.filter((cat) => cat.id !== categoryId));
  };

  const handleCategoryTitleChange = (categoryId, newTitle) => {
    setRequirements(
      requirements.map((cat) =>
        cat.id === categoryId ? { ...cat, title: newTitle } : cat
      )
    );
  };

  const addRequirement = (categoryId) => {
    setRequirements(
      requirements.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: [...cat.items, { id: Date.now(), label: "" }],
            }
          : cat
      )
    );
  };

  const removeRequirement = (categoryId, itemId) => {
    setRequirements(
      requirements.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((item) => item.id !== itemId) }
          : cat
      )
    );
  };

  const handleLabelChange = (categoryId, itemId, newLabel) => {
    setRequirements(
      requirements.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, label: newLabel } : item
              ),
            }
          : cat
      )
    );
  };

  // Download Forms Management
  const handleDirectFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/uploads/documents",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        const newForm = {
          id: Date.now(),
          label: response.data.fileName,
          fileName: response.data.fileName,
          fileUrl: response.data.filePath,
        };
        setDownloadForms([...downloadForms, newForm]);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    }
  };

  const removeDownloadForm = (formId) => {
    setDownloadForms(downloadForms.filter((form) => form.id !== formId));
  };

  // Steps Management
  const addStep = () => {
    setStepsProcess([
      ...stepsProcess,
      { id: Date.now(), label: "" },
    ]);
  };

  const removeStep = (stepId) => {
    setStepsProcess(stepsProcess.filter((step) => step.id !== stepId));
  };

  const handleStepChange = (stepId, newLabel) => {
    setStepsProcess(
      stepsProcess.map((step) =>
        step.id === stepId ? { ...step, label: newLabel } : step
      )
    );
  };

  const handleSaveChanges = async () => {
    if (!selectedPSA) return;

    const formattedRequirements = requirements.map((cat) => ({
      title: cat.title,
      items: cat.items.map((item) => item.label).filter((label) => label),
    }));

    const formattedDownloadForms = downloadForms.map((form) => ({
      label: form.label,
      fileName: form.fileName,
      fileUrl: form.fileUrl,
    }));

    const formattedSteps = stepsProcess
      .map((step) => step.label)
      .filter((label) => label);

    try {
      await axios.put(`http://localhost:5000/api/psa/${selectedPSA.id}`, {
        requirements: formattedRequirements,
        downloadForms: formattedDownloadForms,
        stepsProcess: formattedSteps,
      });

      alert("Changes saved successfully!");
      fetchPSADocs();
      setIsEditorOpen(false);
      setIsPSAFormsOpen(true);
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Failed to save changes");
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
              <h1>PSA Serbilis</h1>
              <p>Birth, Marriage, Death Certificate Processing</p>
            </div>
            <button className="psa-btn-add" onClick={handleManageService}>
              <FolderOpen size={18} style={{ marginRight: "8px" }} /> Manage
              Service
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
                {data.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: "700", color: "#0f172a" }}>
                      {row.id}
                    </td>
                    <td>{row.client}</td>
                    <td>
                      <span
                        style={{
                          background: "#fef3c7",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#92400e",
                        }}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td>{row.purpose}</td>
                    <td>
                      <span
                        style={{
                          background: "#dcfce7",
                          color: "#166534",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="psa-action-btn">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PSA Forms Modal */}
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

          {/* Add New PSA Modal */}
          {isAddFormOpen && (
            <div className="modal-overlay" onClick={() => setIsAddFormOpen(false)}>
              <div className="add-psa-modal" onClick={(e) => e.stopPropagation()}>
                <button
                  className="modal-close-btn"
                  onClick={() => {
                    setIsAddFormOpen(false);
                    setIsPSAFormsOpen(true);
                  }}
                >
                  <X size={24} />
                </button>

                <div className="modal-header">
                  <h2>Add New PSA Document</h2>
                  <p>Fill in the details for the new PSA service</p>
                </div>

                <div className="form-group">
                  <label>Document Type *</label>
                  <input
                    type="text"
                    placeholder="e.g. Birth Certificate"
                    value={newPSAForm.documentType}
                    onChange={(e) =>
                      setNewPSAForm({
                        ...newPSAForm,
                        documentType: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    placeholder="e.g. PSA Birth Certificate request and delivery"
                    value={newPSAForm.desc}
                    onChange={(e) =>
                      setNewPSAForm({ ...newPSAForm, desc: e.target.value })
                    }
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Price (₱) *</label>
                  <input
                    type="number"
                    placeholder="350"
                    value={newPSAForm.price}
                    onChange={(e) =>
                      setNewPSAForm({ ...newPSAForm, price: e.target.value })
                    }
                  />
                </div>

                <div className="modal-footer">
                  <button
                    className="modal-cancel-btn"
                    onClick={() => {
                      setIsAddFormOpen(false);
                      setIsPSAFormsOpen(true);
                    }}
                  >
                    Cancel
                  </button>
                  <button className="modal-save-btn" onClick={handleCreatePSA}>
                    <Save size={18} />
                    Create PSA Document
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit PSA Modal */}
          {isEditorOpen && selectedPSA && (
            <div className="modal-overlay">
              <div className="psa-editor-modal">
                <button
                  className="modal-close-btn"
                  onClick={() => {
                    setIsEditorOpen(false);
                    setIsPSAFormsOpen(true);
                  }}
                >
                  <X size={24} />
                </button>

                <div className="editor-header">
                  <div className="editor-psa-info">
                    <div className="editor-psa-icon">📄</div>
                    <div>
                      <h2>{selectedPSA.documentType}</h2>
                      <p>{selectedPSA.desc}</p>
                      <span className="editor-price-badge">
                        ₱{selectedPSA.price}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="editor-content">
                  {/* Requirements Accordion */}
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
                          <div key={category.id} className="req-category-group">
                            <div className="req-category-header">
                              <input
                                type="text"
                                className="req-category-title-input"
                                value={category.title}
                                onChange={(e) =>
                                  handleCategoryTitleChange(
                                    category.id,
                                    e.target.value
                                  )
                                }
                                placeholder="Enter requirement category title..."
                              />
                              <button
                                className="req-delete-btn"
                                onClick={() => removeCategory(category.id)}
                                title="Remove category"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <div className="req-items-list">
                              {category.items.map((item) => (
                                <div key={item.id} className="req-item-row">
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

                  {/* Download Forms Accordion */}
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

                  {/* Steps Accordion */}
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
                      setIsPSAFormsOpen(true);
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
      </main>
    </div>
  );
};

export default PSASerbilis;