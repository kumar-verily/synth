import React, { useState, useEffect, useCallback, useMemo } from 'react';


// --- Care Pathway Component ---
const CarePathway = () => {
    const professionalRoles = ['MD', 'PharmD', 'NP/PA', 'RN', 'RD', 'Coach', 'AI Coach', 'System'];
    const ASYNC_PREFIX = 'Async:';
    const defaultCareData = useMemo(() => [
        {"Month in the Program":"Month 1","MD":"Med Optimization\nCGM Rx (for insulin/sunfonylureas)\nFirst fill med adherence & counselling (side effect education, self-administering)\nFulfillment options (ePrescribe local/mail-order)\nLab Ordering","PharmD":"Async:\n- Review new participant\n- Review Medications regimen, available adherence data, and optimization triggers\n- if needed do an outreach (scheduling)","NP/PA":"","RN":"","RD":"Async\nNew Participant review\nReview nutrition plan, progress on habits/missions/ goals and foodlogs","Coach":"","AI Coach":"","System":"Mission on CGM Rx (wearing)\nMission on Insulin/sulfonylurea\nMission on new Meds"},
        {"Month in the Program":"Month 2","MD":"","PharmD":"","NP/PA":"","RN":"Appointment\nHabits/Missions/Activities\nBarriers\nSet next Habit(s)","RD":"Appointment\nReview nutrition\nSet goals\nDevelop Plan","Coach":"","AI Coach":"SMART goal tracking & achievement","System":""},
        {"Month in the Program":"Month 3","MD":"","PharmD":"Appointment:\n- Review Med therapy mgmt \n- Recommendations on best use of meds, optimization ","NP/PA":"Async:\n- CGM review\n- Review first 1-2 sensor wears\n- Progress during a1C vs. baseline\n- Outreach & Med adjust as necessary","RN":"Appointment\nHabits/Missions/Activities\nBarriers\nSet next Habit(s)","RD":"Appointment\nReview nutrition\nSet goals\nDevelop Plan","Coach":"","AI Coach":"SMART goal tracking & achievement","System":""},
        {"Month in the Program":"Month 4","MD":"Review progress since Medical changes\nAdditional Medical changes\nLab Ordering","PharmD":"Async:\n- Review Medications & Progress\nIf needed do an outreach","NP/PA":"","RN":"Appointment\nHabits/Missions/Activities\nBarriers\nSet next Habit(s)\n\nGive Headsup: Warm hand off to Health Coach","RD":"Appointment\nReview nutrition\nSet goals\nDevelop Plan","Coach":"","AI Coach":"SMART goal tracking & achievement","System":"Trigger & Follow up on \nPROMs (DDAS, PROMIS-10)"},
        {"Month in the Program":"Month 5","MD":"","PharmD":"","NP/PA":"Async:\n- CGM review\n- Review first 1-2 sensor wears\n- Progress during a1C vs. baseline","RN":"Hand off to Coach","RD":"","Coach":"Appointment\n- Review progress & reset goals\n- Review Habits/Missions/Activities\n- Set next Habits\n- Discuss next CGM use","AI Coach":"SMART goal tracking & achievement","System":""},
        {"Month in the Program":"Month 6","MD":"","PharmD":"","NP/PA":"","RN":"","RD":"","Coach":"Appointment:\n- Review Habits/Missions/Activities\n- Discuss barriers\n- Set next Habits","AI Coach":"SMART goal tracking & achievement","System":""},
        {"Month in the Program":"Month 7","MD":"Review progress since Medical changes\nAdditional Medical changes\nLab Ordering","PharmD":"","NP/PA":"","RN":"","RD":"","Coach":"Appointment:\n- Review Habits/Missions/Activities\n- Discuss barriers\n- Set next Habits","AI Coach":"SMART goal tracking & achievement","System":""},
        {"Month in the Program":"Month 8","MD":"","PharmD":"","NP/PA":"","RN":"","RD":"","Coach":"Appointment:\n- Review Habits/Missions/Activities\n- Discuss barriers\n- Set next Habits","AI Coach":"SMART goal tracking & achievement","System":""},
        {"Month in the Program":"Month 9","MD":"","PharmD":"","NP/PA":"","RN":"","RD":"","Coach":"Appointment:\n- Review Habits/Missions/Activities\n- Discuss barriers\n- Set next Habits","AI Coach":"SMART goal tracking & achievement","System":""},
        {"Month in the Program":"Month 10","MD":"","PharmD":"","NP/PA":"Async:\n- CGM review\n- Review first 1-2 sensor wears\n- Progress during a1C vs. baseline","RN":"","RD":"","Coach":"Appointment:\n- Review Habits/Missions/Activities\n- Discuss barriers\n- Set next Habits","AI Coach":"SMART goal tracking & achievement","System":""},
        {"Month in the Program":"Month 11","MD":"Review progress since Medical changes\nAdditional Medical changes\nLab Ordering","PharmD":"","NP/PA":"","RN":"","RD":"","Coach":"Appointment:\n- Review Habits/Missions/Activities\n- Discuss barriers\n- Set next Habits","AI Coach":"SMART goal tracking & achievement","System":""},
        {"Month in the Program":"Month 12","MD":"","PharmD":"","NP/PA":"","RN":"","RD":"","Coach":"Appointment:\n- Review Habits/Missions/Activities\n- Discuss barriers\n- Set next Habits","AI Coach":"SMART goal tracking & achievement","System":"Graduation\n- Care team to review progress\n- Confirm next steps"}
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
                <h1 className="pathway-title">Chronic Care Program Pathway (Template)</h1>
                <p className="pathway-subtitle">An interactive and editable guide to Care Pathways</p>
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

export default CarePathway;
