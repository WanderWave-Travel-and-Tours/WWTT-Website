import "./ServiceDetails.css";

const ServiceDetails = ({ formState, updateField }) => {
  return (
    <section className="svc-section">
      <h2 className="svc-section-title">SERVICE DETAILS</h2>
      <div className="svc-fields">
        <div className="svc-field svc-field--full">
          <label>Service Name</label>
          <input
            type="text"
            placeholder="e.g. Hotel Booking"
            value={formState.title}
            onChange={(e) => updateField("title", e.target.value)}
            required
          />
        </div>

        <div className="svc-field svc-field--full">
          <label>Description</label>
          <textarea
            placeholder="A short description of the service..."
            value={formState.description}
            onChange={(e) => updateField("description", e.target.value)}
            required
            rows="3"
            className="svc-textarea"
          />
        </div>

        <div className="svc-field">
          <label>Category</label>
          <select
            value={formState.category}
            onChange={(e) => updateField("category", e.target.value)}
            required
          >
            <option value="TRAVEL">TRAVEL</option>
            <option value="DOCUMENTATION">DOCUMENTATION</option>
            <option value="FINANCIAL">FINANCIAL</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>

        <div className="svc-field">
          <label>Icon Tag (e.g., 'Hotel', 'Plane')</label>
          <input
            type="text"
            placeholder="e.g. Hotel, Plane, FileText"
            value={formState.icon}
            onChange={(e) => updateField("icon", e.target.value)}
            required
          />
        </div>

        <div className="svc-field">
          <label>Base Price (PHP)</label>
          <input
            type="number"
            placeholder="0.00"
            value={formState.price}
            onChange={(e) => updateField("price", e.target.value)}
            required
            step="0.01"
            min="0"
          />
        </div>

        <div className="svc-field">
          <label>Order/Display Rank</label>
          <input
            type="number"
            placeholder="0"
            value={formState.order}
            onChange={(e) => updateField("order", e.target.value)}
            min="0"
          />
        </div>

        <div className="svc-field svc-field--full">
          <label>Service Status</label>
          <div className="svc-status-radio-group">
            <label>
              <input
                type="radio"
                name="serviceStatus"
                checked={formState.isActive === true}
                onChange={() => updateField("isActive", true)}
              />
              Active (Show on Website)
            </label>
            <label>
              <input
                type="radio"
                name="serviceStatus"
                checked={formState.isActive === false}
                onChange={() => updateField("isActive", false)}
              />
              Coming Soon (Inactive, Blurred on Website)
            </label>
          </div>
        </div>

        <div className="svc-field svc-field--full">
          <label>
            <input
              type="checkbox"
              checked={formState.hasSubCollection}
              onChange={(e) =>
                updateField("hasSubCollection", e.target.checked)
              }
              style={{ marginRight: "8px" }}
            />
            Has Sub Collection (e.g., PSA &gt; Birth Cert, Marriage Cert)
          </label>
        </div>

        {formState.hasSubCollection && (
          <div className="svc-field svc-field--full">
            <label>Sub Collection Name</label>
            <input
              type="text"
              placeholder="e.g. PSA_REQUESTS"
              value={formState.subCollectionName}
              onChange={(e) => updateField("subCollectionName", e.target.value)}
              required={formState.hasSubCollection}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default ServiceDetails;