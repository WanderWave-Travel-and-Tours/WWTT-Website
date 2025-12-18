import "./ServiceRequirements.css";

const ServiceRequirements = ({ requirements, updateRequirements }) => {
  const addRequirement = () => {
    updateRequirements([...requirements, ""]);
  };

  const removeRequirement = (index) => {
    updateRequirements(requirements.filter((_, idx) => idx !== index));
  };

  const handleRequirementChange = (index, value) => {
    updateRequirements(
      requirements.map((item, idx) => (idx === index ? value : item))
    );
  };

  const filledRequirementsCount = requirements.filter(
    (req) => req.trim()
  ).length;

  return (
    <section className="svc-section">
      <div className="svc-section-header">
        <h2 className="svc-section-title">REQUIREMENTS</h2>
        <span className="svc-count">{filledRequirementsCount} items</span>
      </div>

      <div className="svc-requirements-wrapper">
        {requirements.map((req, i) => (
          <div key={i} className="svc-requirement-row">
            <span className="svc-requirement-bullet"></span>
            <div className="svc-requirement-input-wrapper">
              <input
                type="text"
                placeholder="What document is required?"
                value={req}
                onChange={(e) => handleRequirementChange(i, e.target.value)}
              />
            </div>
            {requirements.length > 1 && (
              <button
                type="button"
                className="svc-requirement-delete-btn"
                onClick={() => removeRequirement(i)}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="svc-add-requirement-btn"
        onClick={addRequirement}
      >
        <span>+</span> Add Requirement
      </button>
    </section>
  );
};

export default ServiceRequirements;