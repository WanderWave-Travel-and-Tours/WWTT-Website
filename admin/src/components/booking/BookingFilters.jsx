import React, { useState } from 'react';
import { Search, Filter, RefreshCw, ClipboardList, CreditCard, User, X } from 'lucide-react';
import CustomSelect from './CustomSelect';
import './BookingFilters.css';

const BookingFilters = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  statusOptions,
  paymentFilter,
  setPaymentFilter,
  paymentOptions,
  createdByFilter,
  setCreatedByFilter
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleReset = () => {
    setFilterStatus('ALL');
    setPaymentFilter('ALL');
    setCreatedByFilter('ALL');
    setSearchTerm('');
  };

  const hasActiveFilters =
    filterStatus !== 'ALL' ||
    paymentFilter !== 'ALL' ||
    createdByFilter !== 'ALL' ||
    searchTerm.trim() !== '';

  const statusSelectOptions = statusOptions.map((status) => ({
    value: status,
    label: status === 'ALL' ? 'ALL BOOKINGS' : status.toUpperCase().replace('_', ' ')
  }));

  const paymentSelectOptions = paymentOptions.map((option) => ({
    value: option.value,
    label: option.label.toUpperCase()
  }));

  const createdBySelectOptions = [
    { value: 'ALL', label: 'ALL' },
    { value: 'sales', label: 'Sales' },
    { value: 'user', label: 'User' }
  ];

  return (
    <>
      {/* MOBILE ONLY: Floating toggle button */}
      <button
        type="button"
        className="bkm-fab"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open booking filters"
      >
        <Filter size={20} strokeWidth={2.5} />
        {hasActiveFilters && <span className="bkm-fab-dot" />}
      </button>

      {/* MOBILE ONLY: Backdrop, shown while panel is open */}
      {isMobileOpen && (
        <div className="bkm-backdrop" onClick={() => setIsMobileOpen(false)} />
      )}

      <div className={`bkm-filter-card ${isMobileOpen ? 'bkm-filter-card-open' : ''}`}>
      <div className="bkm-filter-wrapper">

        {/* LEFT: Branding */}
        <div className="bkm-brand-section">
            <div className="bkm-brand-icon">
                <Filter size={18} strokeWidth={2.5} />
            </div>
            <div className="bkm-brand-label">
                BOOKING <span>FILTERS</span>
            </div>
            <button type="button" className="bkm-reset-btn" onClick={handleReset}>
                <RefreshCw size={14} strokeWidth={2.5} />
                Reset
            </button>
            {/* MOBILE ONLY: Close panel */}
            <button
                type="button"
                className="bkm-close-btn"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close booking filters"
            >
                <X size={18} strokeWidth={2.5} />
            </button>
        </div>

        <div className="bkm-controls-group">
            {/* MIDDLE: Filter Dropdowns */}
            <div className="bkm-filters-row">
                {/* Status Filter */}
                <div className="bkm-filter-item">
                    <div className="bkm-filter-item-icon bkm-icon-status">
                        <ClipboardList size={18} strokeWidth={2.2} />
                    </div>
                    <div className="bkm-filter-item-body">
                        <label>Status</label>
                        <CustomSelect
                            value={filterStatus}
                            onChange={setFilterStatus}
                            options={statusSelectOptions}
                        />
                    </div>
                </div>

                {/* Payment Filter */}
                <div className="bkm-filter-item">
                    <div className="bkm-filter-item-icon bkm-icon-payment">
                        <CreditCard size={18} strokeWidth={2.2} />
                    </div>
                    <div className="bkm-filter-item-body">
                        <label>Payment</label>
                        <CustomSelect
                            value={paymentFilter}
                            onChange={setPaymentFilter}
                            options={paymentSelectOptions}
                        />
                    </div>
                </div>

                {/* Created By Filter */}
                <div className="bkm-filter-item">
                    <div className="bkm-filter-item-icon bkm-icon-createdby">
                        <User size={18} strokeWidth={2.2} />
                    </div>
                    <div className="bkm-filter-item-body">
                        <label>Created By</label>
                        <CustomSelect
                            value={createdByFilter}
                            onChange={setCreatedByFilter}
                            options={createdBySelectOptions}
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT: Search Box */}
            <div className="bkm-search-box">
                <Search size={16} className="bkm-search-icon" />
                <input
                    type="text"
                    className="bkm-search-input"
                    placeholder="Search by name, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* MOBILE ONLY: Apply Filters button */}
            <button type="button" className="bkm-apply-btn">
                <Filter size={16} strokeWidth={2.5} />
                Apply Filters
            </button>
        </div>

      </div>
      </div>
    </>
  );
};

export default BookingFilters;