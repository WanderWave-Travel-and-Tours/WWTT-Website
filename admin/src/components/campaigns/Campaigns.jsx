import React, { useState } from 'react';
import Sidebar from '../sidebar/sidebar.jsx';
import {
  Megaphone,
  PlusCircle,
  Search,
  Filter,
  Facebook,
  Instagram,
  TrendingUp,
  Eye,
  MousePointerClick,
  Users,
  DollarSign,
  ChevronDown,
  MoreHorizontal,
  Play,
  Pause,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Calendar,
  Tag,
} from 'lucide-react';
import './Campaigns.css';

// ─── TIKTOK ICON ──────────────────────────────────────────────────────────────
const TikTokIcon = ({ size = 16, color = '#010101' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.18 8.18 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.01-.31z"/>
  </svg>
);

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const CAMPAIGNS_DATA = [
  {
    id: 1,
    name: 'Summer Beach Getaway Promo',
    platform: 'Facebook',
    status: 'active',
    budget: 15000,
    spent: 9250,
    reach: 42800,
    clicks: 3140,
    conversions: 87,
    startDate: '2025-06-01',
    endDate: '2025-06-30',
    objective: 'Conversions',
  },
  {
    id: 2,
    name: 'Boracay Package — Instagram Reel',
    platform: 'Instagram',
    status: 'active',
    budget: 8000,
    spent: 5600,
    reach: 31500,
    clicks: 2280,
    conversions: 54,
    startDate: '2025-06-10',
    endDate: '2025-07-10',
    objective: 'Traffic',
  },
  {
    id: 3,
    name: 'Japan Tour TikTok Awareness',
    platform: 'TikTok',
    status: 'paused',
    budget: 12000,
    spent: 4300,
    reach: 88200,
    clicks: 5100,
    conversions: 29,
    startDate: '2025-05-15',
    endDate: '2025-06-15',
    objective: 'Awareness',
  },
  {
    id: 4,
    name: 'Holy Week Travel Deals',
    platform: 'Facebook',
    status: 'completed',
    budget: 20000,
    spent: 20000,
    reach: 95600,
    clicks: 7800,
    conversions: 212,
    startDate: '2025-03-20',
    endDate: '2025-04-10',
    objective: 'Conversions',
  },
  {
    id: 5,
    name: 'Palawan Discovery Package',
    platform: 'Instagram',
    status: 'draft',
    budget: 10000,
    spent: 0,
    reach: 0,
    clicks: 0,
    conversions: 0,
    startDate: '2025-07-01',
    endDate: '2025-07-31',
    objective: 'Traffic',
  },
  {
    id: 6,
    name: 'Siargao Surf Camp — August',
    platform: 'TikTok',
    status: 'active',
    budget: 9500,
    spent: 2100,
    reach: 54000,
    clicks: 3900,
    conversions: 41,
    startDate: '2025-07-15',
    endDate: '2025-08-15',
    objective: 'Awareness',
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const PLATFORM_CONFIG = {
  Facebook:  { Icon: Facebook,  color: '#1877F2', bg: '#e7f0fd' },
  Instagram: { Icon: Instagram, color: '#E1306C', bg: '#fde8ef' },
  TikTok:    { Icon: TikTokIcon, color: '#010101', bg: '#f0f0f0' },
};

const STATUS_CONFIG = {
  active:    { label: 'Active',    Icon: Play,        color: '#16a34a', bg: '#dcfce7' },
  paused:    { label: 'Paused',    Icon: Pause,       color: '#d97706', bg: '#fef9c3' },
  completed: { label: 'Completed', Icon: CheckCircle, color: '#2563eb', bg: '#dbeafe' },
  draft:     { label: 'Draft',     Icon: Clock,       color: '#6b7280', bg: '#f3f4f6' },
};

const formatCurrency = (n) =>
  n >= 1000 ? `₱${(n / 1000).toFixed(1)}K` : `₱${n.toLocaleString()}`;

const formatCount = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString();

const ctr = (clicks, reach) =>
  reach > 0 ? ((clicks / reach) * 100).toFixed(2) + '%' : '—';

const budgetPct = (spent, budget) =>
  budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

// ─── SUMMARY STATS ────────────────────────────────────────────────────────────
const buildSummary = (data) => {
  const active = data.filter((c) => c.status === 'active').length;
  const totalBudget = data.reduce((s, c) => s + c.budget, 0);
  const totalSpent = data.reduce((s, c) => s + c.spent, 0);
  const totalReach = data.reduce((s, c) => s + c.reach, 0);
  const totalConversions = data.reduce((s, c) => s + c.conversions, 0);
  return { active, totalBudget, totalSpent, totalReach, totalConversions };
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const Campaigns = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [openMenu, setOpenMenu] = useState(null);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  const filtered = CAMPAIGNS_DATA.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = filterPlatform === 'All' || c.platform === filterPlatform;
    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchSearch && matchPlatform && matchStatus;
  });

  const summary = buildSummary(CAMPAIGNS_DATA);

  return (
    <div className="cp-layout">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      <main
        className="cp-main"
        style={{ marginLeft: isCollapsed ? '88px' : '280px' }}
      >
        <div className="cp-container">

          {/* ── HEADER ── */}
          <div className="cp-header">
            <div className="cp-header-left">
              <div className="cp-header-icon-wrap">
                <Megaphone size={22} color="#001F3F" />
              </div>
              <div>
                <h1 className="cp-title">Campaigns</h1>
                <p className="cp-subtitle">Track and manage your marketing campaigns across all platforms.</p>
              </div>
            </div>
            <button className="cp-btn-new">
              <PlusCircle size={16} />
              New Campaign
            </button>
          </div>

          {/* ── SUMMARY CARDS ── */}
          <div className="cp-summary-grid">
            <div className="cp-summary-card">
              <div className="cp-summary-icon cp-icon--active"><Play size={18} /></div>
              <div className="cp-summary-body">
                <span className="cp-summary-label">Active Campaigns</span>
                <span className="cp-summary-value">{summary.active}</span>
              </div>
            </div>
            <div className="cp-summary-card">
              <div className="cp-summary-icon cp-icon--budget"><DollarSign size={18} /></div>
              <div className="cp-summary-body">
                <span className="cp-summary-label">Total Budget</span>
                <span className="cp-summary-value">{formatCurrency(summary.totalBudget)}</span>
              </div>
            </div>
            <div className="cp-summary-card">
              <div className="cp-summary-icon cp-icon--spent"><BarChart2 size={18} /></div>
              <div className="cp-summary-body">
                <span className="cp-summary-label">Total Spent</span>
                <span className="cp-summary-value">{formatCurrency(summary.totalSpent)}</span>
                <span className="cp-summary-sub">{budgetPct(summary.totalSpent, summary.totalBudget)}% of budget</span>
              </div>
            </div>
            <div className="cp-summary-card">
              <div className="cp-summary-icon cp-icon--reach"><Eye size={18} /></div>
              <div className="cp-summary-body">
                <span className="cp-summary-label">Total Reach</span>
                <span className="cp-summary-value">{formatCount(summary.totalReach)}</span>
              </div>
            </div>
            <div className="cp-summary-card">
              <div className="cp-summary-icon cp-icon--conv"><MousePointerClick size={18} /></div>
              <div className="cp-summary-body">
                <span className="cp-summary-label">Total Conversions</span>
                <span className="cp-summary-value">{summary.totalConversions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* ── FILTERS ── */}
          <div className="cp-filters">
            <div className="cp-search-wrap">
              <Search size={15} className="cp-search-icon" />
              <input
                className="cp-search"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="cp-filter-group">
              <Filter size={14} className="cp-filter-icon" />

              <select
                className="cp-select"
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
              >
                <option value="All">All Platforms</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
              </select>

              <select
                className="cp-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* ── TABLE ── */}
          <div className="cp-table-wrap">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Spent</th>
                  <th>Reach</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Conversions</th>
                  <th>Schedule</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="cp-empty">No campaigns found.</td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const plt = PLATFORM_CONFIG[c.platform];
                    const sts = STATUS_CONFIG[c.status];
                    const pct = budgetPct(c.spent, c.budget);
                    return (
                      <tr key={c.id}>
                        {/* Name + Objective */}
                        <td>
                          <div className="cp-cell-name">{c.name}</div>
                          <div className="cp-cell-obj">
                            <Tag size={11} /> {c.objective}
                          </div>
                        </td>

                        {/* Platform */}
                        <td>
                          <span
                            className="cp-platform-badge"
                            style={{ background: plt.bg, color: plt.color }}
                          >
                            <plt.Icon size={13} color={plt.color} />
                            {c.platform}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className="cp-status-badge"
                            style={{ background: sts.bg, color: sts.color }}
                          >
                            <sts.Icon size={12} />
                            {sts.label}
                          </span>
                        </td>

                        {/* Budget */}
                        <td className="cp-cell-mono">{formatCurrency(c.budget)}</td>

                        {/* Spent + progress */}
                        <td>
                          <div className="cp-spent-wrap">
                            <span className="cp-cell-mono">{formatCurrency(c.spent)}</span>
                            <div className="cp-progress-bar">
                              <div
                                className="cp-progress-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#001F3F',
                                }}
                              />
                            </div>
                            <span className="cp-progress-pct">{pct}%</span>
                          </div>
                        </td>

                        {/* Reach */}
                        <td className="cp-cell-mono">{formatCount(c.reach)}</td>

                        {/* Clicks */}
                        <td className="cp-cell-mono">{formatCount(c.clicks)}</td>

                        {/* CTR */}
                        <td className="cp-cell-mono">{ctr(c.clicks, c.reach)}</td>

                        {/* Conversions */}
                        <td className="cp-cell-mono cp-cell-conv">{c.conversions.toLocaleString()}</td>

                        {/* Schedule */}
                        <td>
                          <div className="cp-cell-date">
                            <Calendar size={11} />
                            {c.startDate} → {c.endDate}
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="cp-actions-wrap">
                            <button
                              className="cp-actions-btn"
                              onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {openMenu === c.id && (
                              <div className="cp-actions-menu">
                                <button className="cp-actions-item">Edit</button>
                                <button className="cp-actions-item">
                                  {c.status === 'active' ? 'Pause' : 'Activate'}
                                </button>
                                <button className="cp-actions-item cp-actions-item--danger">Delete</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Campaigns;
