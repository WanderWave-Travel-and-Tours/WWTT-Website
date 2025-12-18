import "./ServicePreview.css";

const ServicePreview = ({ formState, previewUrl }) => {
  const formatPrice = (price) => {
    if (!price) return "0.00";
    return Number(price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const truncateDescription = (text, maxLength = 70) => {
    if (!text) return "Affordable and fast document processing.";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const filledRequirementsCount = formState.requirements.filter(
    (req) => req.trim()
  ).length;

  return (
    <div className="svc-preview">
      <span className="svc-preview-label">SERVICE PREVIEW</span>
      <div className="svc-card">
        <div className="svc-card-image">
          {previewUrl ? (
            <img src={previewUrl} alt="Service Preview" />
          ) : (
            <span>No Image</span>
          )}
        </div>
        <div className="svc-card-body">
          <span className="svc-card-badge">{formState.category}</span>
          <h3 className="svc-card-title">
            {formState.title || "Service Title"}
          </h3>
          <p className="svc-card-description">
            {truncateDescription(formState.description)}
          </p>
          <div className="svc-card-divider"></div>
          <div className="svc-card-meta">
            <div>
              <span>Starting Price</span>
              <strong>₱{formatPrice(formState.price)}</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="svc-stats">
        <div className="svc-stat">
          <strong>{filledRequirementsCount}</strong>
          <span>Requirements</span>
        </div>
        <div className="svc-stat">
          <strong>{formState.order || "0"}</strong>
          <span>Order</span>
        </div>
      </div>
    </div>
  );
};

export default ServicePreview;