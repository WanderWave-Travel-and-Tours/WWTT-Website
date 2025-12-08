import React from "react";
import { Package, ArrowUp, ArrowDown } from "lucide-react";
import "./TopPackages.css";

const TopPackages = ({ packages }) => {
  return (
    <section className="dash-section dash-section--wide">
      <div className="dash-section-header">
        <h2 className="dash-section-title">TOP PERFORMING PACKAGES</h2>
        <span className="dash-section-badge">By Revenue</span>
      </div>
      <div className="dash-packages-list">
        {packages.length === 0 ? (
          <div className="dash-empty-state">
            <Package size={48} />
            <p>No package data yet</p>
          </div>
        ) : (
          packages.map((pkg, i) => (
            <div key={i} className="dash-package-item">
              <div className="dash-package-rank">{i + 1}</div>
              <div className="dash-package-info">
                <span className="dash-package-name">{pkg.name}</span>
                <span className="dash-package-stats">
                  {pkg.bookings} bookings • {pkg.revenue}
                </span>
              </div>
              <span className="dash-package-trend">
                {pkg.revenueValue > 0 ? (
                  <ArrowUp size={16} color="#10b981" />
                ) : (
                  <ArrowDown size={16} color="#ef4444" />
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default TopPackages;