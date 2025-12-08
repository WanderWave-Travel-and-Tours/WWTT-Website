import React from "react";
import { Plane } from "lucide-react";
import "./RecentBookings.css";

const RecentBookings = ({ bookings, onViewAll }) => {
  return (
    <section className="dash-section dash-section--wide">
      <div className="dash-section-header">
        <h2 className="dash-section-title">RECENT BOOKINGS</h2>
        <button className="dash-link-btn" onClick={onViewAll}>
          View All
        </button>
      </div>
      <div className="dash-table-wrapper">
        {bookings.length === 0 ? (
          <div className="dash-empty-state">
            <Plane size={48} />
            <p>No bookings yet</p>
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>CLIENT</th>
                <th>PACKAGE</th>
                <th>DATE</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <span className="dash-client">{b.client}</span>
                  </td>
                  <td>{b.package}</td>
                  <td>{b.date}</td>
                  <td>
                    <span className="dash-amount">{b.amount}</span>
                  </td>
                  <td>
                    <span
                      className={`dash-status dash-status--${b.status.toLowerCase()}`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default RecentBookings;