import React from 'react';
import { Search, Activity } from 'lucide-react';
import './ActivityLogsFilters.css'; 

const ActivityLogsFilters = ({ 
    searchQuery, 
    setSearchQuery, 
    selectedActionType,       
    setSelectedActionType,    
    selectedModule,    
    setSelectedModule, 
    selectedSeverity,
    setSelectedSeverity,
    actionTypeOptions,      
    moduleOptions,
    severityOptions
}) => {
  
    return (
        <div className="act-filter-card">
            <div className="act-filter-wrapper">
                
                {/* ORDER 1: Branding Label (LEFT CORNER) */}
                <div className="act-brand-label"> 
                    <Activity size={20} style={{marginRight: '8px', color: '#64748b'}}/> 
                    ACTIVITY <span>FILTERS</span>
                </div>
                
                {/* ORDER 2: Action Type Filter */}
                <div className="act-select-group action-filter">
                    <label htmlFor="action-select" className="act-select-label">Action:</label>
                    <select
                        id="action-select"
                        className="act-filter-select"
                        value={selectedActionType}
                        onChange={(e) => setSelectedActionType(e.target.value)}
                    >
                        {actionTypeOptions.map(type => (
                            <option key={type} value={type}>
                                {type === 'ALL' ? 'ALL ACTIONS' : type}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* ORDER 3: Module Filter */}
                <div className="act-select-group module-filter">
                    <label htmlFor="module-select" className="act-select-label">Module:</label>
                    <select
                        id="module-select"
                        className="act-filter-select"
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                    >
                        {moduleOptions.map(module => (
                            <option key={module} value={module}>
                                {module}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ORDER 4: Severity Filter */}
                <div className="act-select-group severity-filter">
                    <label htmlFor="severity-select" className="act-select-label">Severity:</label>
                    <select
                        id="severity-select"
                        className="act-filter-select"
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value)}
                    >
                        {severityOptions.map(severity => (
                            <option key={severity} value={severity}>
                                {severity}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* ORDER 5: SEARCH BOX - Pushed to the right */}
                <div className="search-box">
                    <Search size={18} className="search-icon" /> 
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by ID, action, module, user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
            </div>
        </div>
    );
};

export default ActivityLogsFilters;