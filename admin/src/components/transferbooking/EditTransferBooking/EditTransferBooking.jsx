import React from "react";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../../sidebar/sidebar";
import CustomConfirmModal from "../../confirmationModal/CustomConfirmModal";

import useEditTransferBooking from "./useEditTransferBooking";
import ClientInfoSection      from "./ClientInfoSection";
import TransferDetailsSection from "./TransferDetailsSection";
import ScheduleSection        from "./ScheduleSection";
import RouteSection           from "./RouteSection";
import PricingSection         from "./PricingSection";
import NotesSection           from "./NotesSection";
import BookingSummaryCard     from "./BookingSummaryCard";

import "./EditTransferBooking.css";

// ─────────────────────────────────────────────────────────────────────────────
// EditTransferBooking
// ─────────────────────────────────────────────────────────────────────────────
const EditTransferBooking = () => {
  const {
    // state
    isSidebarCollapsed,
    loading,
    submitting,
    formData,
    setFormData,
    modalConfig,
    // destination dropdown
    destOpen, setDestOpen, destQuery, setDestQuery, destHi, setDestHi, destRef,
    // activity dropdown
    actOpen,  setActOpen,  actQuery,  setActQuery,  actHi,  setActHi,  actRef,
    // derived
    filteredDestinations,
    filteredActivities,
    isRoundtrip,
    summaryLateNightCharge,
    summaryLateNightReasons,
    // handlers
    toggleSidebar,
    closeModal,
    handleChange,
    handleTransferTypeChange,
    handleDestinationSelect,
    handleDestKeyDown,
    handleActivitySelect,
    handleActKeyDown,
    handleCancel,
    handleSubmit,
  } = useEditTransferBooking();

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
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
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="ea-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`ea-main ${isSidebarCollapsed ? "ea-main--collapsed" : ""}`}>
        <div className="ea-container">

          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <header className="ea-header etb-header">
            <div className="ea-header-content">
              <button className="ea-back-btn" onClick={handleCancel}>
                <ArrowLeft size={18} /> Back
              </button>
              <h1 className="ea-title">Edit Transfer Booking</h1>
              <p className="ea-subtitle">
                Modify transfer schedule, route, and payment details
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="ea-grid-layout">

              {/* ── LEFT COLUMN ───────────────────────────────────────── */}
              <div className="ea-form-left">

                <ClientInfoSection
                  formData={formData}
                  handleChange={handleChange}
                />

                <TransferDetailsSection
                  formData={formData}
                  handleChange={handleChange}
                  handleTransferTypeChange={handleTransferTypeChange}
                  isRoundtrip={isRoundtrip}
                  destRef={destRef}
                  destQuery={destQuery}
                  setDestQuery={setDestQuery}
                  setFormData={setFormData}
                  destOpen={destOpen}
                  setDestOpen={setDestOpen}
                  destHi={destHi}
                  setDestHi={setDestHi}
                  handleDestKeyDown={handleDestKeyDown}
                  handleDestinationSelect={handleDestinationSelect}
                  filteredDestinations={filteredDestinations}
                  actRef={actRef}
                  actQuery={actQuery}
                  setActQuery={setActQuery}
                  actOpen={actOpen}
                  setActOpen={setActOpen}
                  actHi={actHi}
                  setActHi={setActHi}
                  handleActKeyDown={handleActKeyDown}
                  handleActivitySelect={handleActivitySelect}
                  filteredActivities={filteredActivities}
                />

                <ScheduleSection
                  formData={formData}
                  handleChange={handleChange}
                  setFormData={setFormData}
                  isRoundtrip={isRoundtrip}
                />

                <RouteSection
                  formData={formData}
                  setFormData={setFormData}
                  isRoundtrip={isRoundtrip}
                />

                <PricingSection
                  formData={formData}
                  handleChange={handleChange}
                />

                <NotesSection
                  formData={formData}
                  handleChange={handleChange}
                />

              </div>{/* end ea-form-left */}

              {/* ── RIGHT SIDEBAR ─────────────────────────────────────── */}
              <div className="ea-form-right">
                <BookingSummaryCard
                  formData={formData}
                  isRoundtrip={isRoundtrip}
                  summaryLateNightCharge={summaryLateNightCharge}
                  summaryLateNightReasons={summaryLateNightReasons}
                  submitting={submitting}
                  handleCancel={handleCancel}
                />
              </div>

            </div>
          </form>
        </div>
      </main>

      {/* Confirmation Modal */}
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

export default EditTransferBooking;