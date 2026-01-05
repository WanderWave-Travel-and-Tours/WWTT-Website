import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import ServiceImageUpload from "./ServiceImageUpload";
import ServiceDetails from "./ServiceDetails";
import ServiceRequirements from "./ServiceRequirements";
import ServicePreview from "./ServicePreview";
import "./addservice.css";

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

const AddService = () => {
  const navigate = useNavigate();

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // Service form state
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    icon: "",
    category: "DOCUMENTATION",
    price: "",
    order: "",
    isActive: true,
    hasSubCollection: false,
    subCollectionName: "",
    requirements: [""],
  });

  // Image state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // =========================================================
  // ✅ AUTO-DRAFT LOGIC START
  // =========================================================

  // 1. Helper: File <-> Base64 Converters
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const base64ToFile = async (base64String, fileName, mimeType) => {
    const res = await fetch(base64String);
    const blob = await res.blob();
    return new File([blob], fileName, { type: mimeType });
  };

  // 2. Draft Payload State
  const [draftPayload, setDraftPayload] = useState(null);

  // 3. Listen to state changes and update Draft Payload
  useEffect(() => {
    const updateDraft = async () => {
      // 🛑 FIX: Check if form is completely empty/default before saving
      // This prevents the modal from appearing if the user cleared the form or just visited
      const isFormEmpty = 
        !formState.title && 
        !formState.description && 
        !formState.icon && 
        !formState.price && 
        !formState.order && 
        !formState.hasSubCollection && 
        !formState.subCollectionName && 
        formState.category === "DOCUMENTATION" && // Check against default
        (formState.requirements.length === 1 && formState.requirements[0] === "") && // Empty reqs
        !file;

      if (isFormEmpty) {
        setDraftPayload(null); // Do not save anything
        return;
      }

      let imageBase64 = null;
      let imageMeta = null;

      // Handle Image Conversion
      if (file) {
        try {
          // Limit draft image size (~3MB limit safety)
          if (file.size < 3 * 1024 * 1024) { 
            imageBase64 = await fileToBase64(file);
            imageMeta = { name: file.name, type: file.type };
          }
        } catch (err) {
          console.warn("Image too large for draft, saving text only.");
        }
      }

      setDraftPayload({
        ...formState,
        image: imageBase64, // Saved as Base64 string
        imageMeta: imageMeta
      });
    };

    const timeoutId = setTimeout(() => {
      updateDraft();
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [formState, file]);

  // 4. Restore Function
  const restoreDraftData = async (data) => {
    if (!data) return;

    // Restore Form Fields
    setFormState({
      title: data.title || "",
      description: data.description || "",
      icon: data.icon || "",
      category: data.category || "DOCUMENTATION",
      price: data.price || "",
      order: data.order || "",
      isActive: data.isActive !== undefined ? data.isActive : true,
      hasSubCollection: data.hasSubCollection || false,
      subCollectionName: data.subCollectionName || "",
      requirements: data.requirements || [""],
    });

    // Restore Image
    if (data.image && data.imageMeta) {
      try {
        const restoredFile = await base64ToFile(data.image, data.imageMeta.name, data.imageMeta.type);
        setFile(restoredFile);
        setPreviewUrl(URL.createObjectURL(restoredFile));
      } catch (err) {
        console.error("Failed to restore image:", err);
      }
    }
  };

  // 5. Initialize Hook
  const { 
    clearDraft, 
    hasDraft, 
    restoreDraft, 
    discardDraft,
    draftInfo 
  } = useAutoDraft({
    module: 'add-service', // Unique ID
    formData: draftPayload,
    setFormData: restoreDraftData,
    imagePreview: previewUrl, 
    autoRestore: false // Manual via modal
  });

  // 6. Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    if (hasDraft) {
      setShowRestoreModal(true);
    }
  }, [hasDraft]);

  const handleRestoreDraft = () => {
    restoreDraft();
    setShowRestoreModal(false);
  };

  const handleDiscardDraft = async () => {
    await discardDraft(); // Ensure storage is cleared
    setShowRestoreModal(false);
  };

  // =========================================================
  // ✅ AUTO-DRAFT LOGIC END
  // =========================================================

  // Update form field
  const updateField = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Update requirements array
  const updateRequirements = (newRequirements) => {
    setFormState((prev) => ({ ...prev, requirements: newRequirements }));
  };

  // Handle Cancel
  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      // ✅ CLEAR DRAFT ON CANCEL
      await clearDraft();
      navigate(-1);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const processedRequirements = formState.requirements.filter(
      (item) => item.trim().length > 0
    );

    const priceNum = parseFloat(formState.price) || 0;
    const orderNum = parseInt(formState.order) || 0;

    const formData = new FormData();
    formData.append("title", formState.title);
    formData.append("description", formState.description);
    formData.append("icon", formState.icon);
    formData.append("category", formState.category);
    formData.append("price", priceNum.toString());
    formData.append("order", orderNum.toString());
    formData.append("isActive", formState.isActive.toString());
    formData.append("hasSubCollection", formState.hasSubCollection.toString());
    formData.append(
      "subCollectionName",
      formState.hasSubCollection ? formState.subCollectionName : ""
    );
    formData.append("requirements", JSON.stringify(processedRequirements));

    if (file) {
      formData.append("image", file);
    } else {
      alert("Please upload an image for the service.");
      return;
    }

    // =========================================================
    // USER DATA HANDLING
    // =========================================================
    try {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
      const activeId = adminData.id || adminData._id || "";

      formData.append("userEmail", activeUser);
      formData.append("adminId", activeId);
      
      console.log("Submitting Service by:", activeUser); 
    } catch (err) {
      console.error("Error parsing admin data:", err);
    }
    // =========================================================

    try {
      const response = await fetch("https://wanderwaveph-backend.onrender.com/api/services", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        alert("✅ Service Added Successfully!");
        
        // ✅ CLEAR DRAFT ON SUCCESS
        await clearDraft();

        // Reset form
        setFormState({
          title: "",
          description: "",
          icon: "",
          category: "DOCUMENTATION",
          price: "",
          order: "",
          isActive: true,
          hasSubCollection: false,
          subCollectionName: "",
          requirements: [""],
        });
        setFile(null);
        setPreviewUrl(null);
      } else {
        console.error("Server error:", data);
        alert("❌ Error: " + (data.message || "Server error"));
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("❌ Error connecting to server");
    }
  };

  return (
    <div className="svc-page">
      
      {/* ✅ RESTORE DRAFT MODAL */}
      <RestoreDraftModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftInfo={draftInfo}
      />

      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main
        className={`svc-main ${
          isSidebarCollapsed ? "svc-main--collapsed" : ""
        }`}
      >
        <div className="svc-container">
          <header className="svc-header">
            <div className="svc-header-content">
              <h1 className="svc-title">ADD SERVICE</h1>
              <p className="svc-subtitle">
                Create a new service offering (e.g., VISA, PSA, etc.)
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="svc-form">
            <div className="svc-grid">
              <div className="svc-left">
                <ServiceImageUpload
                  file={file}
                  setFile={setFile}
                  previewUrl={previewUrl}
                  setPreviewUrl={setPreviewUrl}
                />

                <ServiceDetails
                  formState={formState}
                  updateField={updateField}
                />

                <ServiceRequirements
                  requirements={formState.requirements}
                  updateRequirements={updateRequirements}
                />
              </div>

              <aside className="svc-right">
                <ServicePreview
                  formState={formState}
                  previewUrl={previewUrl}
                />
                <div className="svc-actions">
                  <button
                    type="button"
                    className="svc-btn svc-btn--cancel"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="svc-btn svc-btn--submit">
                    Publish
                  </button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddService;