import React from 'react';
import './TransferPreview.css';

const IconTransfer = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6l4-4 4 4M8 18l4 4 4-4M4 10h16M4 14h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const IconPeso = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const TransferPreview = ({
    previewUrl,
    title,
    category,
    packageDestination,
    oneWaySupplierRate,
    oneWayMarkupValue,
    oneWayMarkupType,
    oneWayPrice,
    roundtripSupplierRate,
    roundtripMarkupValue,
    roundtripMarkupType,
    roundtripPrice,
}) => {
    const fmt = (val) =>
        val
            ? Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0.00';

    const hasOneWay = !!oneWayPrice && parseFloat(oneWayPrice) > 0;
    const hasRoundtrip = !!roundtripPrice && parseFloat(roundtripPrice) > 0;

    // Markup breakdown helpers
    const oneWaySupplierNum = parseFloat(oneWaySupplierRate) || 0;
    const oneWayMarkupNum = parseFloat(oneWayMarkupValue) || 0;
    const oneWayMarkupInPeso = oneWayMarkupType === 'percentage'
        ? (oneWaySupplierNum * oneWayMarkupNum) / 100
        : oneWayMarkupNum;

    const roundtripSupplierNum = parseFloat(roundtripSupplierRate) || 0;
    const roundtripMarkupNum = parseFloat(roundtripMarkupValue) || 0;
    const roundtripMarkupInPeso = roundtripMarkupType === 'percentage'
        ? (roundtripSupplierNum * roundtripMarkupNum) / 100
        : roundtripMarkupNum;

    return (
        <div className="atrn-preview">
            <span className="atrn-preview-label">PREVIEW</span>

            <div className="atrn-card">
                {/* Cover Image */}
                <div className="atrn-card-image">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Cover" />
                    ) : (
                        <span>No Image</span>
                    )}
                </div>

                <div className="atrn-card-body">
                    {/* Category Badge */}
                    <div className="atrn-card-badges">
                        <span className="atrn-card-badge">{category || 'Local Transfer'}</span>
                    </div>

                    {/* Transfer Title */}
                    <div className="atrn-card-title">
                        {title || <span className="atrn-card-title--placeholder">Transfer title will appear here</span>}
                    </div>

                    {/* Package Destination */}
                    {packageDestination && (
                        <div className="atrn-card-pkg-dest">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            {packageDestination}
                        </div>
                    )}

                    <div className="atrn-card-divider" />

                    {/* Pricing Section */}
                    {(hasOneWay || hasRoundtrip) ? (
                        <div className="atrn-card-pricing">
                            {hasOneWay && (
                                <div className="atrn-card-price-row">
                                    <div className="atrn-card-price-info">
                                        <span className="atrn-card-price-type">🚗 One Way</span>
                                        {oneWaySupplierNum > 0 && (
                                            <span className="atrn-card-price-breakdown">
                                                ₱{fmt(oneWaySupplierNum)} + ₱{fmt(oneWayMarkupInPeso)} markup
                                                {oneWayMarkupType === 'percentage' && oneWayMarkupNum > 0 && ` (${oneWayMarkupNum}%)`}
                                            </span>
                                        )}
                                    </div>
                                    <strong className="atrn-card-price-amount">₱{fmt(oneWayPrice)}</strong>
                                </div>
                            )}
                            {hasRoundtrip && (
                                <div className="atrn-card-price-row atrn-card-price-row--roundtrip">
                                    <div className="atrn-card-price-info">
                                        <span className="atrn-card-price-type">🔄 Roundtrip</span>
                                        {roundtripSupplierNum > 0 && (
                                            <span className="atrn-card-price-breakdown">
                                                ₱{fmt(roundtripSupplierNum)} + ₱{fmt(roundtripMarkupInPeso)} markup
                                                {roundtripMarkupType === 'percentage' && roundtripMarkupNum > 0 && ` (${roundtripMarkupNum}%)`}
                                            </span>
                                        )}
                                    </div>
                                    <strong className="atrn-card-price-amount">₱{fmt(roundtripPrice)}</strong>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="atrn-card-pricing atrn-card-pricing--empty">
                            <span>Set pricing to see rates here</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="atrn-stats">
                <div className="atrn-stat">
                    <strong>
                        {hasOneWay ? `₱${fmt(oneWayPrice)}` : '--'}
                    </strong>
                    <span>One Way</span>
                </div>
                <div className="atrn-stat">
                    <strong>
                        <IconTransfer />
                    </strong>
                    <span>Transfer</span>
                </div>
                <div className="atrn-stat">
                    <strong>
                        {hasRoundtrip ? `₱${fmt(roundtripPrice)}` : '--'}
                    </strong>
                    <span>Roundtrip</span>
                </div>
            </div>
        </div>
    );
};

export default TransferPreview;