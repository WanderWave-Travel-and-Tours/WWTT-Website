import React from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import './CustomBookingFilters.css';

const CustomBookingFilters = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  statusOptions,
  paymentFilter,
  setPaymentFilter,
  paymentOptions,
  typeFilter,
  setTypeFilter,
  typeOptions,
  createdByFilter,
  setCreatedByFilter,
}) => {
  return (
    <div className="cbk-filter-card">
      <div className="cbk-filter-inner">

        {/* Brand */}
        <div className="cbk-filter-brand">
          <div className="cbk-filter-brand-icon">
            <SlidersHorizontal size={17} strokeWidth={2.5} />
          </div>
          <div className="cbk-filter-brand-label">
            BOOKING <span>FILTERS</span>
          </div>
        </div>

        <div className="cbk-filter-controls">
          <div className="cbk-filter-row">

            {/* Status */}
            <div className="cbk-filter-item">
              <label>Status</label>
              <div className="cbk-select-wrap">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="cbk-select"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s === 'ALL' ? 'ALL BOOKINGS' : s.toUpperCase().replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="cbk-select-icon" size={13} />
              </div>
            </div>

            {/* Payment */}
            <div className="cbk-filter-item">
              <label>Payment</label>
              <div className="cbk-select-wrap">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="cbk-select"
                >
                  {paymentOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="cbk-select-icon" size={13} />
              </div>
            </div>

            {/* Type */}
            <div className="cbk-filter-item">
              <label>Type</label>
              <div className="cbk-select-wrap">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="cbk-select"
                >
                  {typeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="cbk-select-icon" size={13} />
              </div>
            </div>

            {/* Created By */}
            <div className="cbk-filter-item">
              <label>Created By</label>
              <div className="cbk-select-wrap">
                <select
                  value={createdByFilter}
                  onChange={(e) => setCreatedByFilter(e.target.value)}
                  className="cbk-select"
                >
                  <option value="ALL">ALL</option>
                  <option value="sales">SALES</option>
                  <option value="user">USER</option>
                </select>
                <ChevronDown className="cbk-select-icon" size={13} />
              </div>
            </div>

          </div>

          {/* Search */}
          <div className="cbk-search-wrap">
            <Search size={15} className="cbk-search-icon" />
            <input
              type="text"
              className="cbk-search-input"
              placeholder="Search by name, ID, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomBookingFilters;
