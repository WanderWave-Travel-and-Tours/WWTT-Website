// cbf/steps/Step2SelectServices.jsx
import React from 'react';
import { Compass, ChevronRight, Plus } from 'lucide-react';
import TourList from '../components/TourList';
import TransferList from '../components/TransferList';
import SelectedPanel from '../components/SelectedPanel';
import { fmt } from '../utils';

/**
 * Step 2 — Select Services
 * 4-phase flow:
 *   A: Pick service type (tours | transfers)
 *   B: Browse & select from first-chosen type
 *   C: Ask whether to also add the other type
 *   D: Browse & select from second type
 *
 * Props (all from parent state):
 *   info, availableTours, availableTransfers, fetchingServices
 *   firstChoice, secondPhase, addSecond
 *   selectedTours, selectedTransfers, transferTypes, tourDates
 *   grandTotal, pax
 *   tourBg, transferBg
 *   setFirstChoice, setSecondPhase, setAddSecond
 *   toggleTour, toggleTransfer, setTransferType
 */
export default function Step2SelectServices({
  info,
  availableTours,
  availableTransfers,
  fetchingServices,
  firstChoice,
  secondPhase,
  addSecond,
  selectedTours,
  selectedTransfers,
  transferTypes,
  tourDates,
  grandTotal,
  pax,
  tourBg,
  transferBg,
  setFirstChoice,
  setSecondPhase,
  setAddSecond,
  toggleTour,
  toggleTransfer,
  setTransferType,
}) {
  const secondType = firstChoice === 'tour' ? 'transfer' : 'tour';

  if (fetchingServices) {
    return (
      <div className="cbf-section">
        <div className="cbf-loading">
          <div className="cbf-spinner" />
          <p>
            Loading available services for <strong>{info.destination}</strong>...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cbf-section">

      {/* ── Phase A: Pick first service type ── */}
      {!firstChoice && (
        <>
          <div className="cbf-section-title">
            <Compass size={16} /> What would you like to book?
          </div>
          <p className="cbf-section-desc">
            Choose a service type to start building your trip for{' '}
            <strong>{info.destination}</strong>.
          </p>
          <div className="cbf-service-type-grid">
            <button
              type="button"
              className={`cbf-service-type-card ${availableTours.length === 0 ? 'disabled' : ''}`}
              onClick={() => availableTours.length > 0 && setFirstChoice('tour')}
              style={{ backgroundImage: `url(${tourBg})` }}
            >
              <div className="cbf-stc-overlay">
                <div className="cbf-stc-label">Tours</div>
                <div className="cbf-stc-count">{availableTours.length} available</div>
                {availableTours.length === 0 && (
                  <div className="cbf-stc-none">None in this destination</div>
                )}
              </div>
            </button>

            <button
              type="button"
              className={`cbf-service-type-card ${availableTransfers.length === 0 ? 'disabled' : ''}`}
              onClick={() => availableTransfers.length > 0 && setFirstChoice('transfer')}
              style={{ backgroundImage: `url(${transferBg})` }}
            >
              <div className="cbf-stc-overlay">
                <div className="cbf-stc-label">Transfers</div>
                <div className="cbf-stc-count">{availableTransfers.length} available</div>
                {availableTransfers.length === 0 && (
                  <div className="cbf-stc-none">None in this destination</div>
                )}
              </div>
            </button>
          </div>
        </>
      )}

      {/* ── Phase B: Show list of first-chosen type ── */}
      {firstChoice && !secondPhase && (
        <>
          <div
            className="cbf-section-title"
            style={{ justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {firstChoice === 'tour' ? 'Select Tours' : 'Select Transfers'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              {((firstChoice === 'tour' && selectedTours.length > 0) ||
                (firstChoice === 'transfer' && selectedTransfers.length > 0)) && (
                <span style={{
                  background: '#e2e8f0', color: '#475569',
                  fontSize: '0.65rem', fontWeight: 700,
                  padding: '2px 10px', borderRadius: '20px',
                }}>
                  {firstChoice === 'tour' ? selectedTours.length : selectedTransfers.length} selected
                </span>
              )}
              {((firstChoice === 'tour' && selectedTours.length > 0) ||
                (firstChoice === 'transfer' && selectedTransfers.length > 0)) && (
                <button
                  type="button"
                  className="cbf-change-type-btn"
                  onClick={() => setFirstChoice(null)}
                >
                  Change
                </button>
              )}
            </div>
          </div>

          {firstChoice === 'tour' && (
            <TourList
              tours={availableTours}
              selected={selectedTours}
              onToggle={toggleTour}
              paxCount={info.paxCount}
            />
          )}
          {firstChoice === 'transfer' && (
            <TransferList
              transfers={availableTransfers}
              selected={selectedTransfers}
              transferTypes={transferTypes}
              onToggle={toggleTransfer}
              onTypeChange={setTransferType}
              paxCount={info.paxCount}
            />
          )}
        </>
      )}

      {/* ── Phase C: Ask about second service type ── */}
      {firstChoice && secondPhase && addSecond === null &&
        !(selectedTours.length > 0 && selectedTransfers.length > 0) && (
        <>
          <div className="cbf-section-title">
            Would you also like to add{' '}
            {secondType === 'tour' ? 'tours 🏔️' : 'transfers 🚐'}?
          </div>
          <p className="cbf-section-desc">
            You've selected{' '}
            {firstChoice === 'tour'
              ? `${selectedTours.length} tour(s)`
              : `${selectedTransfers.length} transfer(s)`}.
            {' '}Want to also add {secondType === 'tour' ? 'a tour' : 'transfers'}?
          </p>
          <div className="cbf-yesno-grid">
            <button
              type="button"
              className="cbf-yesno-btn yes"
              onClick={() => setAddSecond(true)}
            >
              <Plus size={18} /> Yes, add {secondType}s
            </button>
            <button
              type="button"
              className="cbf-yesno-btn no"
              onClick={() => setAddSecond(false)}
            >
              <ChevronRight size={18} /> No, proceed
            </button>
          </div>
        </>
      )}

      {/* ── Phase D: Show second service type list ── */}
      {firstChoice && secondPhase && addSecond === true && (
        <>
          <div className="cbf-section-title">
            {secondType === 'tour' ? '🏔️ Select Tours' : '🚐 Select Transfers'}
            <button
              type="button"
              className="cbf-change-type-btn"
              onClick={() => setAddSecond(null)}
            >
              Back
            </button>
          </div>

          {secondType === 'tour' && (
            <TourList
              tours={availableTours}
              selected={selectedTours}
              onToggle={toggleTour}
              paxCount={info.paxCount}
            />
          )}
          {secondType === 'transfer' && (
            <TransferList
              transfers={availableTransfers}
              selected={selectedTransfers}
              transferTypes={transferTypes}
              onToggle={toggleTransfer}
              onTypeChange={setTransferType}
              paxCount={info.paxCount}
            />
          )}
        </>
      )}

      {/* ── Selected Items Panel ── */}
      {(selectedTours.length > 0 || selectedTransfers.length > 0) && (
        <SelectedPanel
          selectedTours={selectedTours}
          selectedTransfers={selectedTransfers}
          transferTypes={transferTypes}
          tourDates={tourDates}
          paxCount={info.paxCount}
          grandTotal={grandTotal}
          firstChoice={firstChoice}
          secondPhase={secondPhase}
          onToggleTour={toggleTour}
          onToggleTransfer={toggleTransfer}
          onAddSecond={() => { setSecondPhase(true); setAddSecond(true); }}
        />
      )}
    </div>
  );
}
