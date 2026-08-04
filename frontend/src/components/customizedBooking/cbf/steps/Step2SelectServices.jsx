// cbf/steps/Step2SelectServices.jsx
import React, { useState, useEffect } from 'react';
import { Mountain, Bus, MapPin } from 'lucide-react';
import TourList from '../components/TourList';
import TransferList from '../components/TransferList';
import SelectedPanel from '../components/SelectedPanel';

export default function Step2SelectServices({
  info,
  availableTours,
  availableTransfers,
  fetchingServices,
  selectedTours,
  selectedTransfers,
  transferTypes,
  tourDates,
  grandTotal,
  pax,
  initialTab,
  toggleTour,
  toggleTransfer,
  setTransferType,
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'tours');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  if (fetchingServices) {
    return (
      <div className="cbf-section">
        <div className="cbf-loading">
          <div className="cbf-spinner" />
          <p>
            Loading services for <strong>{info.destination}</strong>…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cbf-section">

      {/* Destination context */}
      <div className="cbf-s2-context">
        <MapPin size={14} className="cbf-s2-context-icon" />
        <span>
          Pumili ng services para sa <strong>{info.destination}</strong>.
          Maaaring mag-add ng tours at transfers.
        </span>
      </div>

      {/* Tab switcher */}
      <div className="cbf-tab-switcher">
        <button
          type="button"
          className={`cbf-tab-btn ${activeTab === 'tours' ? 'active' : ''}`}
          onClick={() => setActiveTab('tours')}
        >
          {selectedTours.length > 0 && (
            <span className="cbf-tab-sel-badge">{selectedTours.length}</span>
          )}
          <Mountain size={22} strokeWidth={2} />
          <span className="cbf-tab-label">Tours</span>
          <span className="cbf-tab-count">
            {availableTours.length} available
          </span>
        </button>

        <button
          type="button"
          className={`cbf-tab-btn ${activeTab === 'transfers' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfers')}
        >
          {selectedTransfers.length > 0 && (
            <span className="cbf-tab-sel-badge">{selectedTransfers.length}</span>
          )}
          <Bus size={22} strokeWidth={2} />
          <span className="cbf-tab-label">Transfers</span>
          <span className="cbf-tab-count">
            {availableTransfers.length} available
          </span>
        </button>
      </div>

      {/* Selected items bar — compact strip above the grid */}
      {(selectedTours.length > 0 || selectedTransfers.length > 0) && (
        <SelectedPanel
          selectedTours={selectedTours}
          selectedTransfers={selectedTransfers}
          transferTypes={transferTypes}
          tourDates={tourDates}
          paxCount={info.paxCount}
          grandTotal={grandTotal}
          onToggleTour={toggleTour}
          onToggleTransfer={toggleTransfer}
        />
      )}

      {/* Tour list */}
      {activeTab === 'tours' && (
        availableTours.length === 0
          ? <p className="cbf-empty-tab">Walang tours para sa destination na ito.</p>
          : <TourList
              tours={availableTours}
              selected={selectedTours}
              onToggle={toggleTour}
              paxCount={info.paxCount}
            />
      )}

      {/* Transfer list */}
      {activeTab === 'transfers' && (
        availableTransfers.length === 0
          ? <p className="cbf-empty-tab">Walang transfers para sa destination na ito.</p>
          : <TransferList
              transfers={availableTransfers}
              selected={selectedTransfers}
              transferTypes={transferTypes}
              onToggle={toggleTransfer}
              onTypeChange={setTransferType}
              paxCount={info.paxCount}
            />
      )}
    </div>
  );
}
