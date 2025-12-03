import React from "react";
import { Wallet, TrendingUp, DollarSign, PieChart } from "lucide-react";
import "./FinancialOverview.css";

const FinancialOverview = ({ stats }) => {
  // Safe math to prevent NaN
  const totalSales = stats.totalSales || 0;
  const totalCost = stats.totalSellerCost || 0;
  const totalMarkup = stats.totalMarkup || 0;
  
  // Calculate percentages for the bar
  const costPercent = totalSales > 0 ? (totalCost / totalSales) * 100 : 0;
  const profitPercent = totalSales > 0 ? (totalMarkup / totalSales) * 100 : 0;

  const financialCards = [
    {
      icon: Wallet,
      theme: "red",
      label: "Total Seller Cost",
      value: totalCost,
      sublabel: "Cost from suppliers",
    },
    {
      icon: TrendingUp,
      theme: "green",
      label: "Total Markup",
      value: totalMarkup,
      sublabel: "Net profit earned",
    },
    {
      icon: DollarSign,
      theme: "blue",
      label: "Total Sales",
      value: totalSales,
      sublabel: "Gross revenue",
    },
    {
      icon: PieChart,
      theme: "purple",
      label: "Profit Margin",
      value: `${stats.profitMargin}%`,
      sublabel: "Avg. markup %",
      isPercent: true,
    },
  ];

  return (
    <div className="fin-widget">
      {/* Header */}
      <div className="fin-header">
        <div>
          <h2 className="fin-title">Financial Performance</h2>
          <p className="fin-subtitle">Revenue breakdown and profitability analysis</p>
        </div>
        <span className="fin-badge">Confirmed Bookings</span>
      </div>

      {/* 4 Main Stats Grid */}
      <div className="fin-grid">
        {financialCards.map((card, index) => (
          <div key={index} className="fin-card">
            <div className={`fin-icon-box theme-${card.theme}`}>
              <card.icon size={24} strokeWidth={2} />
            </div>
            <div className="fin-card-content">
              <span className="fin-label">{card.label}</span>
              <h3 className="fin-value">
                {card.isPercent 
                  ? card.value 
                  : `₱${card.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                }
              </h3>
              <span className="fin-sublabel">{card.sublabel}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Cost vs Profit Visualization */}
      <div className="fin-breakdown-container">
        <div className="fin-breakdown-header">
          <span className="fin-breakdown-title">Profitability Ratio</span>
          <div className="fin-legend-group">
            <div className="fin-legend">
              <span className="dot dot-red"></span>
              <span>Seller Cost ({costPercent.toFixed(1)}%)</span>
            </div>
            <div className="fin-legend">
              <span className="dot dot-green"></span>
              <span>Net Profit ({profitPercent.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* The Progress Bar */}
        <div className="fin-progress-track">
          <div 
            className="fin-progress-bar bar-cost" 
            style={{ width: `${costPercent}%` }}
          />
          <div 
            className="fin-progress-bar bar-profit" 
            style={{ width: `${profitPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default FinancialOverview;