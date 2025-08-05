import React, { useState, useEffect } from 'react';
// Import necessary components from Recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PatientView = ({ patient, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editablePatient, setEditablePatient] = useState(null);

    // When the patient prop changes, update the local editable state
    useEffect(() => {
        // Create a deep copy to avoid mutating the original prop
        setEditablePatient(patient ? JSON.parse(JSON.stringify(patient)) : null);
        setIsEditing(false); // Reset editing mode when patient changes
    }, [patient]);

    const handleSave = () => {
        onSave(editablePatient);
        setIsEditing(false);
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
            // Ensure A1C values are stored as numbers for the chart
            if (path.includes('a1cData') && path.endsWith('a1c')) {
                current[keys[keys.length - 1]] = parseFloat(value) || 0; // Convert to number, default to 0 if NaN
            }
            else {
            current[keys[keys.length - 1]] = value;
            }
            return newPatient;
        });
    };

    if (!patient) {
        return <div className="empty-state"><h3>No Patient Selected</h3><p>Select a patient from the list or generate a new one.</p></div>;
    }

    const patientToDisplay = isEditing ? editablePatient : patient;

        // Make sure a1c data is numeric for charting
    const chartData = patientToDisplay.a1cData.map(d => ({ ...d, a1c: Number(d.a1c) }));


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
                        {/* --- NEW: Chart Component --- */}
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <LineChart
                                    data={chartData}
                                    margin={{
                                        top: 5,
                                        right: 20,
                                        left: -10,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="a1c" stroke="#8884d8" activeDot={{ r: 8 }} name="A1C Level" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* <div className="card">
                        <h2 className="card-title">A1C History</h2>
                        <ul>{patientToDisplay.a1cData.map((d, i) => <li key={i}>{d.name}: <strong>{d.a1c}</strong></li>)}</ul>
                    </div> */}
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

export default PatientView;