import React from "react";
import { PlusCircle, Tag, MessageSquare, Package } from "lucide-react";
import "./QuickActions.css";

const QuickActions = ({ navigate }) => {
  const quickActionsData = [
    {
      name: "Add Package",
      icon: PlusCircle,
      path: "/add-package",
      desc: "Create new tour",
      color: "blue",
    },
    {
      name: "Create Promo",
      icon: Tag,
      path: "/add-promo",
      desc: "Special offers",
      color: "orange",
    },
    {
      name: "Add Testimonial",
      icon: MessageSquare,
      path: "/add-testimonial",
      desc: "Client feedback",
      color: "purple",
    },
    {
      name: "View Packages",
      icon: Package,
      path: "/view-packages",
      desc: "Manage list",
      color: "green",
    },
  ];

  return (
    <section className="dash-section dash-section--wide">
      <div className="dash-section-header">
        <h2 className="dash-section-title">QUICK ACTIONS</h2>
      </div>
      <div className="dash-actions-grid">
        {quickActionsData.map((action, i) => (
          <button
            key={i}
            className={`dash-action-btn dash-action-btn--${action.color}`}
            onClick={() => navigate(action.path)}
          >
            <div className="dash-action-icon-wrapper">
              <action.icon size={28} />
            </div>
            <div className="dash-action-text">
              <span className="dash-action-title">{action.name}</span>
              <span className="dash-action-sub">{action.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuickActions;