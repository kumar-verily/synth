import React from 'react';

const Sidebar = ({
    profiles,
    defaultProfile,
    selectedProfileName,
    onProfileChange,
    onGenerateClick,
    status,
    activeFilter,
    onClearFilter,
    filteredPatients,
    currentPatientId,
    onPatientSelect
}) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header"><h1 className="sidebar-title">Patient Cohort</h1></div>
            <div className="sidebar-controls">
                <div style={{ marginBottom: '1rem' }}>
                    <label className='details-label' style={{ display: 'block', marginBottom: '0.5rem' }}>Population Profile</label>
                    <select value={selectedProfileName} onChange={e => onProfileChange(e.target.value)} className='modal-select'>
                        <option value="default">{defaultProfile.name}</option>
                        {profiles.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                </div>
                <button onClick={onGenerateClick} disabled={status.includes('Generating...')} className="button">{status.includes('Generating...') ? 'Generating...' : 'Generate New'}</button>
            </div>
            {status && <div className="status-box">{status}</div>}

            {activeFilter && (
                <div className="filter-bar">
                    <div className='filter-bar-content'>
                        <span className='filter-text'>Filtering by: <strong>{activeFilter}</strong></span>
                        <button onClick={onClearFilter} className="filter-clear-btn">Clear</button>
                    </div>
                </div>
            )}
            
            <nav className="patient-list">
                <ul>
                    {filteredPatients.map(p => (
                        <li key={p.id} onClick={() => onPatientSelect(p.id)} className={`patient-list-item ${currentPatientId === p.id ? 'selected' : ''}`}>
                            {p.name}
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;