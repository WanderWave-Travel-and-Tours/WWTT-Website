import React from "react";
import { ArrowLeft } from "lucide-react";

import Sidebar             from "../../sidebar/sidebar";
import CustomConfirmModal  from "../../confirmationModal/CustomConfirmModal";

import useEditTourBooking  from "./useEditTourBooking";

// Sections (left column)
import ClientInfoSection   from "./sections/ClientInfoSection";
import TourDetailsSection  from "./sections/TourDetailsSection";
import ScheduleSection     from "./sections/ScheduleSection";
import PricingSection      from "./sections/PricingSection";
import NotesSection        from "./sections/NotesSection";

// Right-sidebar components
import BookingSummary      from "./components/BookingSummary";
import ActionsCard         from "./components/ActionsCard";

import "./EditTourBooking.css";

// ─────────────────────────────────────────────────────────────────────────────
const EditTourBooking = () => {
  const hook = useEditTourBooking();

  const {
    isSidebarCollapsed, toggleSidebar,
    loading, submitting,
    formData, handleChange,
    pkgOpen, setPkgOpen, pkgQuery, setPkgQuery, pkgHi, setPkgHi, pkgRef,
    filteredTours, handlePackageSelect, handlePkgKeyDown,
    destOpen, setDestOpen, destQuery, setDestQuery, destHi, setDestHi, destRef,
    filteredDestinations, handleDestinationSelect, handleDestKeyDown,
    setFormData,
    handleCancel, handleSubmit,
    modalConfig, closeModal,
    totalPax,
  } = hook;

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="ea-page">
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
        <main className={`ea-main ${isSidebarCollapsed ? "ea-main--collapsed" : ""}`}>
          <div className="ea-loading">
            <div className="spinner" />
            <p>Loading booking data...</p>
          </div>
        </main>
      </div>
    );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="ea-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`ea-main ${isSidebarCollapsed ? "ea-main--collapsed" : ""}`}>
        <div className="ea-container">

          {/* Header */}
          <header className="ea-header etbk-header">
            <div className="ea-header-content">
              <button className="ea-back-btn" onClick={handleCancel}>
                <ArrowLeft size={18} /> Back
              </button>
              <h1 className="ea-title">Edit Tour Booking</h1>
              <p className="ea-subtitle">
                Modify tour package, schedule, pax, and payment details
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="ea-grid-layout">

              {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
              <div className="ea-form-left">
                <ClientInfoSection
                  formData={formData}
                  handleChange={handleChange}
                />

                <TourDetailsSection
                  formData={formData}
                  handleChange={handleChange}
                  setFormData={setFormData}
                  // Destination dropdown
                  destRef={destRef}
                  destQuery={destQuery}
                  setDestQuery={setDestQuery}
                  destOpen={destOpen}
                  setDestOpen={setDestOpen}
                  destHi={destHi}
                  setDestHi={setDestHi}
                  filteredDestinations={filteredDestinations}
                  handleDestinationSelect={handleDestinationSelect}
                  handleDestKeyDown={handleDestKeyDown}
                  setPkgQuery={setPkgQuery}
                  // Package dropdown
                  pkgRef={pkgRef}
                  pkgQuery={pkgQuery}
                  pkgOpen={pkgOpen}
                  setPkgOpen={setPkgOpen}
                  pkgHi={pkgHi}
                  setPkgHi={setPkgHi}
                  filteredTours={filteredTours}
                  handlePackageSelect={handlePackageSelect}
                  handlePkgKeyDown={handlePkgKeyDown}
                />

                <ScheduleSection
                  formData={formData}
                  handleChange={handleChange}
                />

                <PricingSection
                  formData={formData}
                  handleChange={handleChange}
                />

                <NotesSection
                  formData={formData}
                  handleChange={handleChange}
                />
              </div>

              {/* ── RIGHT SIDEBAR ──────────────────────────────────────── */}
              <div className="ea-form-right">
                <div className="ea-sticky-sidebar">
                  <BookingSummary formData={formData} totalPax={totalPax} />
                  <ActionsCard submitting={submitting} handleCancel={handleCancel} />
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>

      <CustomConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
};

export default EditTourBooking;
