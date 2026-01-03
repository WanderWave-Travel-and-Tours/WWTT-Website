import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import ServiceImageUpload from "./ServiceImageUpload";
import ServiceDetails from "./ServiceDetails";
import ServiceRequirements from "./ServiceRequirements";
import ServicePreview from "./ServicePreview";
import "./addservice.css";

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

  // Update form field
  const updateField = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Update requirements array
  const updateRequirements = (newRequirements) => {
    setFormState((prev) => ({ ...prev, requirements: newRequirements }));
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
    // 👇 ADDED: KUNIN ANG USER DATA PARA SA ACTIVITY LOGS 👇
    // =========================================================
    try {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
      const activeId = adminData.id || adminData._id || "";

      formData.append("userEmail", activeUser);
      formData.append("adminId", activeId);
      
      console.log("Submitting Service by:", activeUser); // Debug log
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
                    onClick={() => navigate(-1)}
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