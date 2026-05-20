import React from "react";

const ActionsCard = ({ submitting, handleCancel }) => (
  <div className="ea-card-sidebar ea-actions-card">
    <button
      type="submit"
      className="ea-btn ea-btn--submit"
      disabled={submitting}
    >
      {submitting ? "Updating..." : "Save Changes"}
    </button>
    <button
      type="button"
      className="ea-btn ea-btn--cancel"
      onClick={handleCancel}
      disabled={submitting}
    >
      Cancel
    </button>
  </div>
);

export default ActionsCard;
