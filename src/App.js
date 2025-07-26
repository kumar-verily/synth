import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';

// --- Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000";

// --- Embedded CSS Styles ---
const styles = `
    .app-container { font-family: 'Inter', sans-serif; background-color: #f3f4f6; }
    .sidebar { width: 25%; background-color: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; }
    .sidebar-header { padding: 1rem; border-bottom: 1px solid #e5e7eb; }
    .sidebar-title { font-size: 1.25rem; font-weight: 700; }
    .sidebar-controls { padding: 1rem; border-bottom: 1px solid #e5e7eb; }
    .button { width: 100%; padding: 0.5rem 1rem; font-weight: 600; color: white; background-color: #2563eb; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center; gap: 0.5rem; border: none; cursor: pointer; }
    .button:hover { background-color: #1d4ed8; }
    .button:disabled { background-color: #9ca3af; cursor: not-allowed; }
    .status-box { margin: 1rem; padding: 0.5rem; font-size: 0.875rem; border-radius: 0.375rem; background-color: #dbeafe; color: #1e40af; }
    .patient-list { flex-grow: 1; overflow-y: auto; }
    .patient-list-item { padding: 0.75rem 1rem; border-left: 4px solid transparent; cursor: pointer; }
    .patient-list-item:hover { background-color: #f9fafb; }
    .patient-list-item.selected { background-color: #eff6ff; border-left-color: #2563eb; font-weight: 600; }
    .main-content { overflow-y: auto; padding: 2rem; background-color: #f9fafb; display: flex; flex-direction: column; }
    .main-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .main-title { font-size: 1.875rem; font-weight: 700; color: #111827; }
    .main-subtitle { font-size: 0.875rem; color: #4b5563; }
    .edit-button { padding: 0.5rem 1rem; font-weight: 600; color: white; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); display: flex; align-items: center; gap: 0.5rem; border: none; cursor: pointer; }
    .edit-button.edit { background-color: #4b5563; }
    .edit-button.edit:hover { background-color: #1f2937; }
    .edit-button.save { background-color: #16a34a; }
    .edit-button.save:hover { background-color: #15803d; }
    .content-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .grid-col-span-2 { grid-column: span 2 / span 2; display: flex; flex-direction: column; gap: 1.5rem; }
    .card { background-color: white; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); padding: 1.5rem; }
    .card-title { font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 1rem; }
    .details-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem; align-items: center; }
    .details-label { font-weight: 600; color: #4b5563; text-transform: capitalize; }
    .form-input { width: 100%; padding: 0.25rem 0.5rem; border-radius: 0.25rem; border: 1px solid #d1d5db; background-color: #f9fafb; }
    .form-textarea { width: 100%; padding: 0.25rem 0.5rem; border-radius: 0.25rem; border: 1px solid #d1d5db; background-color: #f9fafb; height: 5rem; resize: vertical; }
    .notes-item { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; }
    .notes-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .message-item { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 0.75rem; position: relative; }
    .message-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .message-subject { font-weight: 600; font-size: 0.875rem; }
    .message-time { font-size: 0.75rem; color: #6b7280; }
    .message-from { font-size: 0.75rem; color: #6b7280; }
    .message-content { font-size: 0.875rem; color: #4b5563; margin-top: 0.5rem; }
    .unread-dot { width: 0.5rem; height: 0.5rem; background-color: #3b82f6; border-radius: 9999px; position: absolute; top: 0.75rem; right: 0.75rem; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: #6b7280; }

    /* --- Tab Styles --- */
    .tab-nav { display: flex; border-bottom: 1px solid #e5e7eb; margin-bottom: 1rem; }
    .tab-button { padding: 0.5rem 1rem; border: none; background: none; cursor: pointer; font-size: 1rem; color: #6b7280; border-bottom: 2px solid transparent; }
    .tab-button.active { color: #1d4ed8; font-weight: 600; border-bottom-color: #1d4ed8; }
    .tab-content { flex-grow: 1; }
    
    /* --- Care Pathway Styles (UI REFINED) --- */
    .pathway-container { padding: 1rem; }
    .pathway-header { text-align: center; margin-bottom: 2rem; }
    .pathway-title { font-size: 2rem; font-weight: 700; color: #111827; }
    .pathway-subtitle { margin-top: 0.5rem; font-size: 1.125rem; color: #4b5563; }
    .pathway-grid-container { overflow-x: auto; background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; padding: 1rem; }
    .pathway-grid { display: grid; gap: 0.5rem; }
    .pathway-grid-header { padding: 0.75rem; font-weight: 600; font-size: 0.875rem; text-align: center; color: #4b5563; position: sticky; top: 0; background-color: rgba(255,255,255,0.8); backdrop-filter: blur(4px); }
    .pathway-month-label { padding: 0.75rem; font-weight: 600; color: #374151; background-color: #f9fafb; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; }
    .pathway-cell { height: 4rem; padding: 0.5rem; text-align: center; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; cursor: pointer; transition: all 0.2s ease-in-out; }
    .pathway-cell:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.08); }
    .pathway-cell svg { width: 1.5rem; height: 1.5rem; }
    .icon-async { color: #b45309; }
    .icon-sync { color: #0369a1; }
    .cell-async { background-color: #fef3c7; border-color: #fde68a; }
    .cell-sync { background-color: #e0f2fe; border-color: #bae6fd; }
    .cell-empty { background-color: #f3f4f6; }
    .cell-empty:hover { background-color: #e5e7eb; }
    .pathway-legend { margin-top: 1.5rem; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 1.5rem; font-size: 0.875rem; color: #4b5563; }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; }
    .legend-icon { width: 1.25rem; height: 1.25rem; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; border: 1px solid; }
    .legend-icon svg { width: 0.875rem; height: 0.875rem; }
    
    /* --- Modal Styles --- */
    .modal-overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal-content { background-color: white; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); width: 100%; max-width: 500px; transform: scale(0.95); transition: transform 0.2s ease-out; }
    .modal-content.open { transform: scale(1); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; border-bottom: 1px solid #e5e7eb; }
    .modal-title { font-size: 1.25rem; font-weight: 700; }
    .modal-close-btn { color: #9ca3af; transition: color 0.2s; }
    .modal-close-btn:hover { color: #1f2937; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-label { font-weight: 500; color: #374151; }
    .modal-select { width: 100%; padding: 0.5rem; border-radius: 0.375rem; border: 1px solid #d1d5db; background-color: #f9fafb; }
    .modal-textarea { width: 100%; height: 10rem; padding: 0.75rem; border-radius: 0.375rem; border: 1px solid #d1d5db; resize: vertical; }
    .modal-footer { padding: 1rem; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 1rem 1rem; display: flex; justify-content: flex-end; gap: 0.75rem; }
    .modal-button { padding: 0.5rem 1rem; font-weight: 600; border-radius: 0.5rem; border: none; cursor: pointer; transition: background-color 0.2s; }
    .modal-button.cancel { background-color: #e5e7eb; color: #1f2937; }
    .modal-button.cancel:hover { background-color: #d1d5db; }
    .modal-button.save { background-color: #2563eb; color: white; }
    .modal-button.save:hover { background-color: #1d4ed8; }

    /* --- Synthetic Data Generator Styles --- */
    .synth-container { max-width: 1200px; margin: auto; }
    .synth-grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .profile-card { background-color: white; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s ease-in-out; border: 1px solid #e5e7eb; }
    .profile-card:hover { transform: translateY(-4px); box-shadow: 0 4px 12px 0 rgba(0,0,0,0.1); }
    .profile-card-title { font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 0.5rem; }
    .profile-card-condition { font-size: 0.875rem; color: #4b5563; }
    .profile-card-new { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border-style: dashed; color: #6b7280; }
    .profile-card-new:hover { background-color: #f9fafb; color: #1d4ed8; }
    .synth-detail-view-header { position: relative; text-align: center; margin-bottom: 2rem; padding: 0.5rem 0; }
    .synth-detail-view-header > .button { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: auto; }
    .synth-detail-view-header .synth-title { margin: 0; }
    .synth-header { text-align: center; margin-bottom: 2rem; }
    .synth-title { font-size: 1.875rem; font-weight: 700; color: #111827; }
    .synth-subtitle { color: #4b5563; margin-top: 0.5rem; }
    .synth-input-group { display: flex; gap: 1rem; }
    .synth-input { flex-grow: 1; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; }
    .synth-button { padding: 0.75rem 1.5rem; font-weight: 600; color: white; background-color: #2563eb; border-radius: 0.5rem; border: none; cursor: pointer; }
    .synth-button:hover { background-color: #1d4ed8; }
    .synth-button.green { background-color: #16a34a; }
    .synth-button.green:hover { background-color: #15803d; }
    .synth-loading { text-align: center; margin-top: 1rem; color: #4b5563; }
    .synth-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; margin-bottom: 2rem; }
    .synth-chart-container { position: relative; height: 300px; width: 100%; }
    .synth-profile-output { background-color: white; border-radius: 0.5rem; padding: 2rem; margin-top: 2rem; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); line-height: 1.6; }
    .synth-profile-output h2 { font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #e5e7eb;}
    .synth-stat-inputs { margin-top: 1rem; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .synth-stat-input-item { display: flex; align-items: center; gap: 0.5rem; }
    .synth-stat-label { font-size: 0.875rem; width: 120px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
    .synth-stat-input { width: 70px; padding: 0.25rem; border: 1px solid #d1d5db; border-radius: 0.25rem; }
    .comorbidity-tags-container { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .comorbidity-tag { background-color: #e0e7ff; color: #3730a3; padding: 0.25rem 0.75rem; border-radius: 9999px; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
    .comorbidity-tag-remove { background: none; border: none; color: #4f46e5; font-size: 1.25rem; line-height: 1; cursor: pointer; padding: 0; }
    .comorbidity-tag-remove:hover { color: #312e81; }
    .comorbidity-input-group { display: flex; gap: 1rem; }

    /* --- Filter Styles --- */
    .filter-bar { padding: 0 1rem 1rem 1rem; border-bottom: 1px solid #e5e7eb; }
    .filter-bar-content { background-color: #eef2ff; color: #4338ca; padding: 0.5rem 0.75rem; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
    .filter-text { font-weight: 500; }
    .filter-clear-btn { background: none; border: none; color: #4f46e5; font-weight: 600; cursor: pointer; }
    .filter-clear-btn:hover { text-decoration: underline; }

`;


// --- Care Pathway Component ---
const CarePathway = () => {
    const professionalRoles = ['MD', 'PharmD', 'NP/PA', 'RN', 'RD', 'Coach', 'AI Coach', 'System'];
    const ASYNC_PREFIX = 'Async:';
    const defaultCareData = useMemo(() => [
        {"Month in the Program":"Month 1","MD":"Med Optimization\nCGM Rx (for insulin/sunfonylureas)\nFirst fill med adherence & counselling (side effect education, self-administering)\nFulfillment options (ePrescribe local/mail-order)\nLab Ordering","PharmD":"Async:\n- Review new participant\n- Review Medications regimen, available adherence data, and optimization triggers\n- if needed do an outreach (scheduling)","NP/PA":"","RN":"","RD":"Async\nNew Participant review\nReview nutrition plan, progress on habits/missions/ goals and foodlogs","Coach":"","AI Coach":"","System":"Mission on CGM Rx (wearing)\nMission on Insulin/sulfonylurea\nMission on new Meds"},
        {"Month in the Program":"Month 2","MD":"","PharmD":"","NP/PA":"","RN":"Appointment\nHabits/Missions/Activities\nBarriers\nSet next Habit(s)","RD":"Appointment\nReview nutrition\nSet goals\nDevelop Plan","Coach":"","AI Coach":"SMART goal tracking & achievement","System":""},
        // ... other months can be added here
    ], []);
    const [careData, setCareData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCell, setEditingCell] = useState(null);
    const [editedContent, setEditedContent] = useState('');
    const [editedType, setEditedType] = useState('sync');

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('carePathwayData');
            setCareData(savedData ? JSON.parse(savedData) : defaultCareData);
        } catch (error) { setCareData(defaultCareData); }
    }, [defaultCareData]);

    const openModal = useCallback((role, month, content) => {
        const isAsync = content.toLowerCase().trim().startsWith(ASYNC_PREFIX.toLowerCase());
        const details = isAsync ? content.replace(new RegExp(`^${ASYNC_PREFIX}\\s*\\n?`, 'i'), '') : content;
        setEditingCell({ role, month, content });
        setEditedType(isAsync ? 'async' : 'sync');
        setEditedContent(details);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => setIsModalOpen(false), []);

    const handleSave = useCallback(() => {
        if (!editingCell) return;
        let newContent = editedContent.trim();
        if (newContent && editedType === 'async') newContent = `${ASYNC_PREFIX}\n${newContent}`;
        const updatedData = careData.map(d => d['Month in the Program'] === editingCell.month ? { ...d, [editingCell.role]: newContent } : d);
        setCareData(updatedData);
        localStorage.setItem('carePathwayData', JSON.stringify(updatedData));
        closeModal();
    }, [editingCell, editedContent, editedType, careData, closeModal]);

    useEffect(() => {
        const handleKeyDown = (e) => e.key === 'Escape' && closeModal();
        if (isModalOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, closeModal]);

    return (
        <div className="pathway-container">
            <header className="pathway-header">
                <h1 className="pathway-title">Chronic Care Program Pathway T1D (A1C > 10%)</h1>
                <p className="pathway-subtitle">An interactive and editable guide to team responsibilities.</p>
            </header>

            <div className="pathway-grid-container">
                <div className="pathway-grid" style={{ gridTemplateColumns: `auto repeat(${professionalRoles.length}, minmax(100px, 1fr))`}}>
                    {/* Headers */}
                    <div className="pathway-grid-header">Month</div>
                    {professionalRoles.map(role => <div key={role} className="pathway-grid-header">{role}</div>)}

                    {/* Grid Data */}
                    {careData.map(monthData => (
                        <React.Fragment key={monthData['Month in the Program']}>
                            <div className="pathway-month-label">{monthData['Month in the Program'].replace('Month ', '')}</div>
                            {professionalRoles.map(role => {
                                const task = monthData[role] || '';
                                const isAsync = task.toLowerCase().trim().startsWith('async');
                                const cellClass = task ? (isAsync ? 'cell-async' : 'cell-sync') : 'cell-empty';
                                
                                return (
                                    <div key={`${role}-${monthData.month}`} className={`pathway-cell ${cellClass}`} onClick={() => openModal(role, monthData['Month in the Program'], task)}>
                                         {task && (
                                            isAsync ?
                                            <svg className="icon-async" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> :
                                            <svg className="icon-sync" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                         )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="pathway-legend">
                <div className="legend-item">
                    <div className="legend-icon cell-async">
                        <svg className="icon-async" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <span>Async Task</span>
                </div>
                <div className="legend-item">
                    <div className="legend-icon cell-sync">
                       <svg className="icon-sync" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <span>Appointment / Sync Task</span>
                </div>
                <div className="legend-item">
                    <div className="legend-icon cell-empty"></div>
                    <span>No scheduled task</span>
                </div>
            </div>
            
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className={`modal-content ${isModalOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                             <h3 className="modal-title">Edit Task: {editingCell?.role} - {editingCell?.month}</h3>
                             <button onClick={closeModal} className="modal-close-btn">
                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                             </button>
                        </div>
                        <div className="modal-body">
                             <div>
                                <label htmlFor="modal-type-select" className="modal-label">Task Type</label>
                                <select id="modal-type-select" className="modal-select" value={editedType} onChange={e => setEditedType(e.target.value)}>
                                    <option value="sync">Sync / Appointment</option>
                                    <option value="async">Async</option>
                                </select>
                             </div>
                             <div>
                                <label htmlFor="modal-textarea" className="modal-label">Task Details</label>
                                <textarea id="modal-textarea" className="modal-textarea" value={editedContent} onChange={e => setEditedContent(e.target.value)}></textarea>
                             </div>
                        </div>
                        <div className="modal-footer">
                             <button onClick={closeModal} className="modal-button cancel">Cancel</button>
                             <button onClick={handleSave} className="modal-button save">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Synthetic Data Generator Component ---
const SyntheticDataGenerator = ({ profiles, onProfileSaved, onSetFilter }) => {
    const [view, setView] = useState('grid'); // 'grid' or 'details'
    const [activeProfile, setActiveProfile] = useState(null); // The profile being viewed or created
    const [isCreating, setIsCreating] = useState(false);

    // State for the details view form
    const [condition, setCondition] = useState('');
    const [comorbidities, setComorbidities] = useState([]);
    const [newComorbidityInput, setNewComorbidityInput] = useState('');
    const [stats, setStats] = useState(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [error, setError] = useState('');
    const [profileName, setProfileName] = useState('');
    
    const chartRefs = useRef({});
    const chartInstances = useRef({});

    const cardOrder = useMemo(() => ['genderDistribution', 'ageDistribution', 'raceEthnicityDistribution', 'insuranceDistribution', 'educationDistribution', 'incomeDistribution', 'geographicDistribution'], []);
    const cardTitles = useMemo(() => ({ genderDistribution: 'Gender', ageDistribution: 'Age', raceEthnicityDistribution: 'Race/Ethnicity', insuranceDistribution: 'Insurance', educationDistribution: 'Education', incomeDistribution: 'Income', geographicDistribution: 'Geography' }), []);

    const resetForm = () => {
        setCondition('');
        setComorbidities([]);
        setNewComorbidityInput('');
        setStats(null);
        setError('');
        setProfileName('');
        Object.values(chartInstances.current).forEach(chart => chart.destroy());
        chartInstances.current = {};
    };
    
    const handleViewProfile = (profile) => {
        setActiveProfile(profile);
        setStats(profile.data);
        setCondition(profile.data.condition);
        setComorbidities(profile.data.comorbidities || []);
        setIsCreating(false);
        setView('details');
    };
    
    const handleCreateNew = () => {
        resetForm();
        setActiveProfile(null);
        setIsCreating(true);
        setView('details');
    };
    
    const handleBackToGrid = () => {
        resetForm();
        setView('grid');
    };

    // FIX: Combined handler for viewing and filtering
    const handleProfileCardClick = (profile) => {
        handleViewProfile(profile);
        onSetFilter(profile.name);
    };

    useEffect(() => {
        const instances = chartInstances.current;
        return () => Object.values(instances).forEach(chart => chart.destroy());
    }, []);

    const handleStatChange = (category, key, value) => {
        setStats(prev => {
            const newStats = { ...prev };
            newStats[category] = { ...newStats[category], [key]: parseFloat(value) || 0 };
             if (category === 'genderDistribution' && key === 'female') {
                newStats[category].male = 100 - (parseFloat(value) || 0);
            }
            return newStats;
        });
    };
    
    useEffect(() => {
        if (!stats) return;
        cardOrder.forEach(key => {
            if (stats[key] && key !== 'genderDistribution') {
                const chartCanvas = chartRefs.current[key];
                if (!chartCanvas) return;
                const labels = Object.keys(stats[key]);
                const data = Object.values(stats[key]);
                if (chartInstances.current[key]) {
                    chartInstances.current[key].data.datasets[0].data = data;
                    chartInstances.current[key].update();
                } else {
                    chartInstances.current[key] = new Chart(chartCanvas, { type: 'pie', data: { labels, datasets: [{ data, backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
                }
            }
        });
    }, [stats, cardOrder, cardTitles]);

    const handleAddComorbidity = () => {
        if (newComorbidityInput && !comorbidities.includes(newComorbidityInput)) {
            setComorbidities([...comorbidities, newComorbidityInput]);
            setNewComorbidityInput('');
        }
    };

    const handleRemoveComorbidity = (morbidity) => setComorbidities(comorbidities.filter(m => m !== morbidity));
    
    const handleSearch = async () => {
        if (!condition) return setError("Please enter a condition.");
        setIsLoadingStats(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/population-stats/${condition}`);
            if (!response.ok) throw new Error((await response.json()).detail);
            const data = await response.json();
            setStats(data);
            setComorbidities(data.commonComorbidities || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleSaveClick = async () => {
        if (!profileName) return setError("Please enter a profile name.");
        if (!stats) return setError("Please generate stats first.");
        const profileData = { name: profileName, data: { condition, comorbidities, ...stats } };
        try {
            const response = await fetch(`${API_BASE_URL}/population-profiles/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            if (!response.ok) throw new Error((await response.json()).detail);
            onProfileSaved(); // Callback to refresh list in parent
            handleBackToGrid();
        } catch (err) {
            setError(err.message);
        }
    };

    if (view === 'grid') {
        return (
            <div className="synth-container">
                <div className="synth-grid-view">
                    <div className="profile-card profile-card-new" onClick={handleCreateNew}>
                         <h2 className="profile-card-title">+ Create New Profile</h2>
                         <p>Define a new population from scratch.</p>
                    </div>
                    {profiles.map(profile => (
                        <div key={profile.name} className="profile-card" onClick={() => handleProfileCardClick(profile)}>
                            <h2 className="profile-card-title">{profile.name}</h2>
                            <p className="profile-card-condition">{profile.data.condition}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="synth-container">
            <div className="synth-detail-view-header">
                <button onClick={handleBackToGrid} className="button">&larr; Back to Profiles</button>
                 <h1 className="synth-title">{isCreating ? "Create New Profile" : `Viewing: ${activeProfile?.name}`}</h1>
            </div>
            {isCreating && (
                <div className="card" style={{marginBottom: '2rem'}}>
                    <label className="details-label" style={{display: 'block', marginBottom: '0.5rem'}}>Condition</label>
                    <div className="synth-input-group">
                        <input type="text" value={condition} onChange={e => setCondition(e.target.value)} className="synth-input" placeholder="e.g., Type 2 Diabetes" />
                        <button onClick={handleSearch} disabled={isLoadingStats} className="synth-button">{isLoadingStats ? 'Searching...' : 'Search'}</button>
                    </div>
                </div>
            )}
            {error && <div style={{color: 'red', textAlign: 'center', marginBottom: '1rem'}}>{error}</div>}
            {isLoadingStats && <div className="synth-loading">Fetching statistics...</div>}
            {stats && (
                <div>
                    <div className="synth-stats-grid">
                        {cardOrder.map(key => stats[key] && (
                            <div key={key} className="card">
                                <h2 className="card-title">{cardTitles[key]}</h2>
                                {key === 'genderDistribution' ? (
                                    <div style={{textAlign: 'center'}}>
                                         <input type="range" min="0" max="100" value={stats.genderDistribution.female} onChange={e => handleStatChange('genderDistribution', 'female', e.target.value)} disabled={!isCreating} />
                                         <div>Female: {stats.genderDistribution.female}% | Male: {(100 - stats.genderDistribution.female).toFixed(0)}%</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="synth-chart-container"><canvas ref={el => chartRefs.current[key] = el}></canvas></div>
                                        <div className="synth-stat-inputs">
                                            {Object.keys(stats[key]).map(subKey => (
                                                <div key={subKey} className="synth-stat-input-item">
                                                    <label className="synth-stat-label" title={subKey}>{subKey}</label>
                                                    <input type="number" value={stats[key][subKey]} onChange={e => handleStatChange(key, subKey, e.target.value)} className="synth-stat-input" disabled={!isCreating}/>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                     <div className="card" style={{marginBottom: '2rem'}}>
                         <h2 className="card-title">Co-morbidities</h2>
                         <div className="comorbidity-tags-container">
                             {comorbidities.map(m => (<div key={m} className="comorbidity-tag">{m}{isCreating && <button onClick={() => handleRemoveComorbidity(m)} className="comorbidity-tag-remove">&times;</button>}</div>))}
                         </div>
                         {isCreating && (<div className="comorbidity-input-group"><input type="text" value={newComorbidityInput} onChange={e => setNewComorbidityInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddComorbidity()} placeholder="Add new" className="synth-input"/><button onClick={handleAddComorbidity} className="synth-button">Add</button></div>)}
                    </div>
                    {isCreating && (
                        <div className="card">
                            <h2 className="card-title">Save Population Profile</h2>
                            <div className="synth-input-group"><input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Enter unique profile name" className="synth-input"/><button onClick={handleSaveClick} className="synth-button">Save Profile</button></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


// --- Main App Component ---
export default function App() {
    const [patientList, setPatientList] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [editablePatient, setEditablePatient] = useState(null);
    const [currentPatientId, setCurrentPatientId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('');
    const [activeTab, setActiveTab] = useState('patientView');
    const [populationProfiles, setPopulationProfiles] = useState([]);
    const [selectedProfileName, setSelectedProfileName] = useState('default');
    const [activeFilter, setActiveFilter] = useState(null); // State for filtering patients

    const defaultProfile = useMemo(() => ({
        name: 'Generic (US Population)',
        data: {
            condition: 'General Population',
            comorbidities: [],
            genderDistribution: { female: 50, male: 50 },
            ageDistribution: { "0-17": 22, "18-44": 37, "45-64": 25, "65+": 16 },
            raceEthnicityDistribution: { "White": 59, "Black or African American": 13, "Hispanic or Latino": 19, "Asian": 6, "Other": 3 },
            insuranceDistribution: { "Private": 65, "Medicare": 18, "Medicaid": 21, "Uninsured": 9 },
            educationDistribution: { "Less than High School": 11, "High School Graduate": 27, "Some College": 29, "Bachelor's or Higher": 33 },
            incomeDistribution: { "Below Poverty": 12, "Low Income": 25, "Middle Income": 43, "High Income": 20 },
            geographicDistribution: { "Urban": 83, "Suburban": 0, "Rural": 17 }
        }
    }), []);
    
    const fetchPopulationProfiles = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/population-profiles/`);
            if (!response.ok) throw new Error('Failed to fetch population profiles');
            const data = await response.json();
            setPopulationProfiles(data);
        } catch (err) {
            console.error(err);
            setError("Could not load population profiles from database.");
        }
    }, []);

    const fetchPatientList = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/patients/`);
            if (!response.ok) throw new Error('Could not connect to API server.');
            const patients = await response.json();
            setPatientList(patients);
            if (patients.length > 0 && !currentPatientId) {
                setCurrentPatientId(patients[0].id);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentPatientId]);


    useEffect(() => {
        fetchPopulationProfiles();
        fetchPatientList();
    }, [fetchPopulationProfiles, fetchPatientList]);
    
    useEffect(() => {
        if (!currentPatientId) {
            setSelectedPatient(null);
            return;
        }
        const fetchPatientDetails = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/patients/${currentPatientId}`);
                if (!response.ok) throw new Error(`Patient with ID ${currentPatientId} not found.`);
                const patientData = await response.json();
                setSelectedPatient(patientData);
                setEditablePatient(JSON.parse(JSON.stringify(patientData)));
            } catch (err) {
                setError(err.message);
                setSelectedPatient(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPatientDetails();
    }, [currentPatientId]);

    const handleGenerateClick = async () => {
        setStatus('Generating...');
        setError(null);
        let profileData = selectedProfileName === 'default' ? defaultProfile.data : populationProfiles.find(p => p.name === selectedProfileName)?.data;
        if (!profileData) return setError("Selected profile not found.");
        try {
            // Send the profile name along with the data
            const response = await fetch(`${API_BASE_URL}/generate-patients/`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    num_patients: 1, 
                    profile: profileData, 
                    profile_name: selectedProfileName 
                }) 
            });
            if (!response.ok) throw new Error(`Generation failed: ${await response.text()}`);
            
            // Refetch patient list to include the new one with its profile tag
            await fetchPatientList(); 
            // The list will update, and if it's the first patient, they'll be selected
            setStatus('Generated successfully!');
            setActiveTab('patientView');

        } catch (err) {
            setError(err.message);
        } finally {
            setTimeout(() => setStatus(''), 2000);
        }
    };
    
    // FIX: This function now ONLY sets the filter.
    const handleSetPatientFilter = (profileName) => {
        setActiveFilter(profileName);
    };

    const filteredPatients = useMemo(() => {
        if (!activeFilter) {
            return patientList;
        }
        return patientList.filter(p => p.profile_name === activeFilter);
    }, [activeFilter, patientList]);


    const handleSave = async () => {
        setStatus('Saving...');
        try {
            await fetch(`${API_BASE_URL}/patients/${editablePatient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editablePatient),
            });
            setSelectedPatient(editablePatient);
            setIsEditing(false);
            setStatus('Saved successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setTimeout(() => setStatus(''), 2000);
        }
    };
    
    const handleInputChange = (e, path) => {
        const { value } = e.target;
        const keys = path.split('.');
        setEditablePatient(prev => {
            const newPatient = JSON.parse(JSON.stringify(prev));
            let current = newPatient;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newPatient;
        });
    };

    const renderPatientView = () => {
        if (isLoading && !selectedPatient) return <div className="empty-state">Loading...</div>;
        if (error && !status) return <div className="empty-state" style={{color: 'red'}}>{error}</div>;
        if (!selectedPatient) return <div className="empty-state"><h3>No Patient Selected</h3><p>Select a patient from the list or generate a new one.</p></div>;
        const patientToDisplay = isEditing ? editablePatient : selectedPatient;
        return (
            <>
                <header className="main-header">
                    <div><h1 className="main-title">{patientToDisplay.name}</h1><p className="main-subtitle">{patientToDisplay.details}</p></div>
                    <button onClick={isEditing ? handleSave : () => setIsEditing(true)} className={`edit-button ${isEditing ? 'save' : 'edit'}`}>{isEditing ? 'Save Changes' : 'Edit Patient'}</button>
                </header>
                <div className="content-grid">
                    <div className="grid-col-span-2">
                        <div className="card">
                            <h2 className="card-title">Care Plan</h2>
                            {Object.entries(patientToDisplay.carePlan).map(([key, value]) => (
                                <div key={key} className="details-grid">
                                    <span className="details-label">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    {isEditing ? <input className="form-input" value={value} onChange={(e) => handleInputChange(e, `carePlan.${key}`)} /> : <span>{value}</span>}
                                </div>
                            ))}
                        </div>
                        <div className="card">
                             <h2 className="card-title">Notes</h2>
                             {patientToDisplay.notes.map((note, noteIndex) => (
                                <div key={noteIndex} className="notes-item">
                                    {Object.entries(note).map(([key, value]) => (
                                        <div key={key} className="details-grid">
                                            <span className="details-label">{key}</span>
                                            {isEditing ? <textarea className="form-textarea" value={value} onChange={(e) => handleInputChange(e, `notes.${noteIndex}.${key}`)} /> : <span>{value}</span>}
                                        </div>
                                    ))}
                                </div>
                             ))}
                        </div>
                    </div>
                    <div>
                        <div className="card">
                            <h2 className="card-title">A1C History</h2>
                            <ul>{patientToDisplay.a1cData.map((d, i) => <li key={i}>{d.name}: <strong>{d.a1c}</strong></li>)}</ul>
                        </div>
                        <div className="card">
                            <h2 className="card-title">To Do</h2>
                            {patientToDisplay.toDo.map(item => <p key={item.id}>{item.text}</p>)}
                        </div>
                        <div className="card">
                            <h2 className="card-title">Messages</h2>
                            {patientToDisplay.messages && patientToDisplay.messages.map((msg, index) => (
                                <div key={index} className="message-item">
                                    <div className="message-header">
                                        <div>
                                            <p className="message-subject">{msg.subject}</p>
                                            <p className="message-from">{msg.from}</p>
                                        </div>
                                        <p className="message-time">{msg.time}</p>
                                    </div>
                                    <p className="message-content">{msg.content}</p>
                                    {msg.unread && <div className="unread-dot"></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    };
    
    const renderContent = () => {
        switch (activeTab) {
            case 'patientView': return renderPatientView();
            case 'carePathway': return <CarePathway />;
            case 'dataGen': return <SyntheticDataGenerator profiles={populationProfiles} onProfileSaved={fetchPopulationProfiles} onSetFilter={handleSetPatientFilter} />;
            default: return renderPatientView();
        }
    };

    return (
        <>
            <style>{styles}</style>
            <div style={{display: 'flex', height: '100vh'}} className="app-container">
                 {activeTab !== 'dataGen' && (
                    <aside className="sidebar">
                        <div className="sidebar-header"><h1 className="sidebar-title">Patient Cohort</h1></div>
                        <div className="sidebar-controls">
                            <div style={{marginBottom: '1rem'}}>
                                <label className='details-label' style={{display:'block', marginBottom:'0.5rem'}}>Population Profile</label>
                                <select value={selectedProfileName} onChange={e => setSelectedProfileName(e.target.value)} className='modal-select'>
                                    <option value="default">{defaultProfile.name}</option>
                                    {populationProfiles.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <button onClick={handleGenerateClick} disabled={status.includes('Generating...')} className="button">{status.includes('Generating...') ? 'Generating...' : 'Generate New'}</button>
                        </div>
                        {status && <div className="status-box">{status}</div>}

                        {/* Filter Bar */}
                        {activeFilter && (
                            <div className="filter-bar">
                               <div className='filter-bar-content'>
                                 <span className='filter-text'>Filtering by: <strong>{activeFilter}</strong></span>
                                 <button onClick={() => setActiveFilter(null)} className="filter-clear-btn">Clear</button>
                               </div>
                            </div>
                        )}
                        
                        <nav className="patient-list">
                            <ul>{filteredPatients.map(p => (<li key={p.id} onClick={() => { setIsEditing(false); setCurrentPatientId(p.id); }} className={`patient-list-item ${currentPatientId === p.id ? 'selected' : ''}`}>{p.name}</li>))}</ul>
                        </nav>
                    </aside>
                 )}
                <main className="main-content" style={{ width: activeTab !== 'dataGen' ? '75%' : '100%' }}>
                    <div className="tab-nav">
                        <button onClick={() => setActiveTab('patientView')} className={`tab-button ${activeTab === 'patientView' ? 'active' : ''}`}>Patients</button>
                        <button onClick={() => setActiveTab('carePathway')} className={`tab-button ${activeTab === 'carePathway' ? 'active' : ''}`}>Care Pathways</button>
                        <button onClick={() => setActiveTab('dataGen')} className={`tab-button ${activeTab === 'dataGen' ? 'active' : ''}`}>Population</button>
                    </div>
                    <div className="tab-content">{renderContent()}</div>
                </main>
            </div>
        </>
    );
}
