import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, XCircle, RotateCcw, AlertCircle, Search } from 'lucide-react';
import { destinationsMatch, matchInclusionsWithPrices } from '../utils/inclusionMatcher';

const API_BASE = '';

const DEST_API_TOKENS = [
  'siargao', 'siquijor', 'bohol', 'cebu',
  'el nido', 'coron', 'puerto princesa',
].sort((a, b) => b.length - a.length);

const extractApiSearchTerm = (destination) => {
  const lower = (destination || '').toLowerCase();
  const match = DEST_API_TOKENS.find(token => lower.includes(token));
  if (!match) return destination;
  const DISPLAY = {
    'puerto princesa': 'Puerto Princesa',
    'el nido': 'El Nido',
    siargao: 'Siargao',
    siquijor: 'Siquijor',
    bohol: 'Bohol',
    cebu: 'Cebu',
    coron: 'Coron',
  };
  return DISPLAY[match] || destination;
};

// Compact, admin-styled port of the customer-facing PackageCustomizer —
// same fetch + fuzzy-matching engine (inclusionMatcher.js), same
// customizationData shape sent back via onCustomizationChange, but a
// smaller UI that fits inside the sales booking Trip Details panel.
const PackageCustomizer = ({ pkg, onCustomizationChange }) => {
  const [customizedInclusions, setCustomizedInclusions] = useState([]);
  const [availableActivities, setAvailableActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchedCount, setMatchedCount] = useState(0);

  const sellerRatesCacheRef = useRef({});
  const availActCacheRef = useRef({});

  const fetchSellerRates = useCallback(async (destination) => {
    const apiDest = extractApiSearchTerm(destination);
    const destKey = (apiDest || '').toLowerCase().trim();

    const skeleton = (pkg.inclusions || []).map((inc, idx) => ({
      id: `original-${idx}`,
      name: inc,
      price: 0,
      isOriginal: true,
      isChecked: true,
      source: 'package',
    }));
    setCustomizedInclusions(skeleton);
    setError('');

    try {
      let matchingRates = sellerRatesCacheRef.current[destKey];

      if (!matchingRates || matchingRates.length === 0) {
        setIsLoading(true);
        const useBroadFetch = destKey.includes('siargao');
        const fetchUrl = useBroadFetch
          ? `${API_BASE}/api/seller-rates?status=active`
          : `${API_BASE}/api/seller-rates?destination=${encodeURIComponent(apiDest)}&status=active`;

        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error('Failed to fetch seller rates');
        const allRates = await res.json();

        matchingRates = (Array.isArray(allRates) ? allRates : []).filter(rate =>
          rate.status === 'active' && destinationsMatch(rate.destination, destination)
        );

        const deduped = Object.values(
          matchingRates.reduce((acc, rate) => {
            const paxKey = (rate.pax || '').trim().toLowerCase().replace(/\s+/g, ' ');
            const key = `${rate.activity.trim().toLowerCase()}||${paxKey}`;
            if (!acc[key] || rate.sellingPrice < acc[key].sellingPrice) acc[key] = rate;
            return acc;
          }, {})
        );

        sellerRatesCacheRef.current[destKey] = matchingRates;
        availActCacheRef.current[destKey] = deduped;
        setAvailableActivities(deduped);
        setFilteredActivities(deduped);
      } else {
        setAvailableActivities(availActCacheRef.current[destKey] || []);
        setFilteredActivities(availActCacheRef.current[destKey] || []);
      }

      const { matched, matchCount } = matchInclusionsWithPrices(
        pkg.inclusions || [],
        matchingRates,
        destination,
        pkg.tourType || 'private',
        pkg.minPax || null,
        pkg.duration || null,
        pkg.title || ''
      );
      setCustomizedInclusions(matched);
      setMatchedCount(matchCount);
    } catch (err) {
      setError(err.message);
      setAvailableActivities([]);
      setFilteredActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [pkg.inclusions, pkg.tourType, pkg.minPax, pkg.duration, pkg.title]);

  useEffect(() => {
    const dest = pkg.destination || '';
    if (dest) fetchSellerRates(dest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg._id]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredActivities(availableActivities);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredActivities(
      availableActivities.filter(a =>
        a.activity.toLowerCase().includes(q) ||
        a.supplierName?.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, availableActivities]);

  useEffect(() => {
    let deductions = 0;
    let additions = 0;
    customizedInclusions.forEach(inc => {
      if (inc.price > 0) {
        if (inc.isOriginal && !inc.isChecked) deductions += inc.price;
        else if (!inc.isOriginal && inc.isChecked) additions += inc.price;
      }
    });

    const originalPkgPrice = pkg.price || 0;
    const pricedOriginals = customizedInclusions.filter(inc => inc.isOriginal && inc.price > 0);
    const allPricedUnchecked = pricedOriginals.length > 0 && pricedOriginals.every(inc => !inc.isChecked);
    const adjustedDeductions = allPricedUnchecked ? originalPkgPrice : deductions;
    const totalChange = additions - adjustedDeductions;

    if (onCustomizationChange) {
      onCustomizationChange({
        inclusions: customizedInclusions,
        additionalPrice: totalChange,
        deductions: adjustedDeductions,
        additions,
        totalPrice: Math.max(0, originalPkgPrice + totalChange),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customizedInclusions]);

  const toggleInclusion = (id) => {
    setCustomizedInclusions(prev => {
      const target = prev.find(inc => inc.id === id);
      if (target?.isChecked) {
        const checkedCount = prev.filter(inc => inc.isChecked).length;
        if (checkedCount === 1) {
          setError('At least one inclusion must remain selected.');
          setTimeout(() => setError(''), 4000);
          return prev;
        }
      }
      setError('');
      return prev.map(inc => inc.id === id ? { ...inc, isChecked: !inc.isChecked } : inc);
    });
  };

  const addInclusion = (rate) => {
    setCustomizedInclusions(prev => [
      ...prev,
      {
        id: `added-${Date.now()}`,
        name: rate.activity,
        price: rate.sellingPrice,
        supplierRate: rate.supplierRate,
        markup: rate.markup,
        markupType: rate.markupType,
        supplier: rate.supplierName,
        destination: rate.destination,
        pax: rate.pax,
        notes: rate.notes,
        isOriginal: false,
        isChecked: true,
        source: 'seller-rate',
        sellerRateId: rate._id,
      },
    ]);
  };

  const removeInclusion = (id) => {
    setCustomizedInclusions(prev => prev.filter(inc => inc.id !== id));
  };

  const resetCustomization = () => {
    const dest = pkg.destination || '';
    const apiDest = extractApiSearchTerm(dest);
    const destKey = (apiDest || '').toLowerCase().trim();
    delete sellerRatesCacheRef.current[destKey];
    delete availActCacheRef.current[destKey];
    fetchSellerRates(dest);
    setSearchQuery('');
    setShowAddPanel(false);
  };

  return (
    <div className="nbm-pkgcust">
      <div className="nbm-pkgcust-header">
        <div>
          <div className="nbm-pkgcust-title">Customize Inclusions</div>
          {matchedCount > 0 && (
            <div className="nbm-pkgcust-matchcount">{matchedCount} of {pkg.inclusions?.length || 0} have pricing data</div>
          )}
        </div>
        <button type="button" className="nbm-pkgcust-reset-btn" onClick={resetCustomization} title="Reset to original package">
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {error && (
        <div className="nbm-pkgcust-error">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="nbm-pkgcust-list">
        {customizedInclusions.map(inc => {
          const checkedCount = customizedInclusions.filter(i => i.isChecked).length;
          const isLastRemaining = inc.isChecked && checkedCount === 1;
          return (
            <div key={inc.id} className={`nbm-pkgcust-item ${inc.isChecked ? 'checked' : 'unchecked'}`}>
              <label className="nbm-pkgcust-item-main">
                <input
                  type="checkbox"
                  checked={inc.isChecked}
                  onChange={() => toggleInclusion(inc.id)}
                  disabled={isLastRemaining}
                />
                <span className="nbm-pkgcust-item-name">
                  {inc.name}
                  {!inc.isOriginal && <span className="nbm-pkgcust-badge">Added</span>}
                </span>
              </label>
              <div className="nbm-pkgcust-item-actions">
                {inc.price > 0 && (
                  <span className={`nbm-pkgcust-item-price ${inc.isOriginal ? '' : 'positive'}`}>
                    {inc.isOriginal ? (inc.isChecked ? '' : `-₱${inc.price.toLocaleString()}`) : `+₱${inc.price.toLocaleString()}`}
                  </span>
                )}
                {!inc.isOriginal && (
                  <button type="button" className="nbm-pkgcust-remove-btn" onClick={() => removeInclusion(inc.id)} title="Remove">
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="nbm-pkgcust-add-toggle"
        onClick={() => setShowAddPanel(prev => !prev)}
        disabled={isLoading}
      >
        <Plus size={14} /> {isLoading ? 'Loading activities...' : 'Add More Inclusions'}
      </button>

      {showAddPanel && (
        <div className="nbm-pkgcust-addpanel">
          {availableActivities.length > 0 && (
            <div className="nbm-pkgcust-search">
              <Search size={13} className="nbm-pkgcust-search-icon" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {filteredActivities.length > 0 ? (
            <div className="nbm-pkgcust-activities">
              {filteredActivities.map(rate => (
                <div key={rate._id} className="nbm-pkgcust-activity">
                  <span className="nbm-pkgcust-activity-name">{rate.activity}</span>
                  <button type="button" className="nbm-pkgcust-add-btn" onClick={() => addInclusion(rate)}>
                    <Plus size={13} /> Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="nbm-pkgcust-empty">
                {availableActivities.length === 0 ? 'No add-on activities available for this destination.' : 'No activities match your search.'}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PackageCustomizer;
