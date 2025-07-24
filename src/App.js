import React, { useState, useEffect } from 'react';

// --- Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000";

// --- Embedded CSS Styles ---
const styles = `
    .app-container { font-family: 'Inter', sans-serif; }
    .sidebar { width: 25%; background-color: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; }
    .sidebar-header { padding: 1rem; border-bottom: 1px solid #e5e7eb; }
    .sidebar-title { font-size: 1.25rem; font-weight: 700; }
    .sidebar-controls { padding: 1rem; }
    .button { width: 100%; padding: 0.5rem 1rem; font-weight: 600; color: white; background-color: #2563eb; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center; gap: 0.5rem; border: none; cursor: pointer; }
    .button:hover { background-color: #1d4ed8; }
    .button:disabled { background-color: #9ca3af; cursor: not-allowed; }
    .status-box { margin: 0 1rem 0.5rem 1rem; padding: 0.5rem; font-size: 0.875rem; border-radius: 0.375rem; background-color: #dbeafe; color: #1e40af; }
    .patient-list { flex-grow: 1; overflow-y: auto; }
    .patient-list-item { padding: 0.75rem 1rem; border-left: 4px solid transparent; cursor: pointer; }
    .patient-list-item:hover { background-color: #f9fafb; }
    .patient-list-item.selected { background-color: #eff6ff; border-left-color: #2563eb; font-weight: 600; }
    .main-content { width: 75%; overflow-y: auto; padding: 2rem; background-color: #f9fafb; }
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
`;

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

    useEffect(() => {
        const fetchPatientList = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/patients/`);
                if (!response.ok) throw new Error('Could not connect to API server.');
                const patients = await response.json();
                setPatientList(patients);
                if (!currentPatientId && patients.length > 0) {
                    setCurrentPatientId(patients[0].id);
                }
            } catch (err) {
                setError(err.message);
            }
        };
        fetchPatientList();
    }, [currentPatientId]);

    useEffect(() => {
        if (!currentPatientId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        const fetchPatientDetails = async () => {
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
        try {
            const response = await fetch(`${API_BASE_URL}/generate-patients/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ num_patients: 1 }),
            });
            if (!response.ok) throw new Error('Generation failed.');
            const newPatients = await response.json();
            const newList = [...patientList, ...newPatients.map(p => ({id: p.id, name: p.name}))];
            setPatientList(newList);
            setCurrentPatientId(newPatients[0].id);
            setStatus('Generated successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setTimeout(() => setStatus(''), 2000);
        }
    };

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

    const renderMainContent = () => {
        if (isLoading) return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>Loading...</div>;
        if (error) return <div style={{color: 'red'}}>{error}</div>;
        if (!selectedPatient) return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>Select a patient.</div>;

        const patientToDisplay = isEditing ? editablePatient : selectedPatient;

        return (
            <>
                <header className="main-header">
                    <div>
                        <h1 className="main-title">{patientToDisplay.name}</h1>
                        <p className="main-subtitle">{patientToDisplay.details}</p>
                    </div>
                    <button onClick={isEditing ? handleSave : () => setIsEditing(true)} className={`edit-button ${isEditing ? 'save' : 'edit'}`}>
                        {isEditing ? 'Save Changes' : 'Edit Patient'}
                    </button>
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
                    <div className="space-y-6">
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
                                            <p className="message-from">{msg.from} replied</p>
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

    return (
        <>
            <style>{styles}</style>
            <div style={{display: 'flex', height: '100vh'}} className="app-container">
                <aside className="sidebar">
                    <div className="sidebar-header"><h1 className="sidebar-title">Patient Cohort</h1></div>
                    <div className="sidebar-controls">
                         <button onClick={handleGenerateClick} disabled={status === 'Generating...'} className="button">Generate New</button>
                    </div>
                    {status && <div className="status-box">{status}</div>}
                    <nav className="patient-list">
                        <ul>
                            {patientList.map(p => (
                                <li key={p.id} onClick={() => { setIsEditing(false); setCurrentPatientId(p.id); }}
                                    className={`patient-list-item ${currentPatientId === p.id ? 'selected' : ''}`}>
                                    {p.name}
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>
                <main className="main-content">
                    {renderMainContent()}
                </main>
            </div>
        </>
    );
}
