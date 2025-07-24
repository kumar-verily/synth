import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Check, User, Edit2 } from 'lucide-react';

// Mock Data based on the screenshots
const initialPatientData = {
    name: 'Jeanne Brown',
    details: 'Pediatric • Caregiver: Tracy Brown • DOB 08/20/2009 • 14 yo, Female',
    additionalDetails: {
        participantId: 'b11fee10-48b9-46f4-85e8-1605eb2f3ed6',
        email: 'mccullough.j+alpha2test6@verily.com',
        phoneNumber: '4565557201',
        address: '5002 test center, JM, Bishop, CA 97201',
        clientAccount: 'Verily Dogfood',
        accountStatus: 'Active',
    },
    carePlan: {
        careLead: 'L. Rodriguez',
        motivators: 'Tracy indicates that her daughter Je...',
        concerns: 'Concerned about these things. Lore...',
        devices: 'CGM, BGM, Insulin pump, Insulin pen',
        goals: 'High level goals, specific goals mor...',
        language: 'Spanish',
        lastUpdated: 'L. Rodriguez created 1m ago',
    },
    a1cData: [
        { name: 'Jan 2, 2023', a1c: 7.0 },
        { name: 'Apr 2, 2023', a1c: 6.8 },
        { name: 'Jul 5, 2023', a1c: 7.3 },
        { name: 'Oct 1, 2023', a1c: 8.3 },
    ],
    toDo: [
        { id: 1, text: 'Follow up - declined CGM & BGM', priority: 'P0', completed: true },
        { id: 2, text: 'Assess - A1C above 7.0%', priority: 'P1', completed: true },
        { id: 3, text: 'Custom to-do title', priority: 'P1', completed: true },
        { id: 4, text: 'Lower priority longer custom to dos wrap in the initial table', priority: 'P2', completed: false },
        { id: 5, text: 'A new task', priority: 'P1', completed: false },
    ],
    notes: [
        {
            subjective: 'Caregiver Tracy reports that their...',
            objective: 'Survey indicates blood glucose lev...',
            assessment: 'T1D with poor glycemic control, incr...',
            plan: 'Confirm insulin dosage with endo to...',
            updated: 'L. Rodriguez updated 2h ago',
        },
        {
            subjective: 'Caregiver reports that their depend...',
            objective: 'A1C 7.4%, checked 3 months ago.',
            assessment: '',
            plan: '',
            updated: '',
        },
    ],
    surveys: [
        { date: 'Jul 6, 2023', title: 'DDS results', score: 3.5, details: 'High stress: Emotional burden, metrics\nModerate stress: Regimen distress, me' },
        { date: 'Mar 29, 2023', title: 'A1C results', score: 8.7, details: '' },
        { date: 'Jan 29, 2023', title: 'A1C results', score: 8.7, details: '' },
    ],
    messages: [
        { from: 'Caregiver', subject: 'Follow up on your appointment', time: 'Now', unread: true, content: 'Hi, my kid Jeanne received a new insulin pump and I had questions about how t...' },
        { from: 'System', subject: 'Insulin pump questions', time: '3 hr ago', unread: false, content: 'Unreplied' },
    ],
    careTeam: [
        { name: 'Clara Jackson', role: 'Health coach' },
        { name: 'Jane Cameron', role: 'Registered dietitian' },
        { name: 'Jacob Smith', role: 'Nurse practitioner' },
        { name: 'John Smith', role: 'Pharmacist' },
    ],
};

// CSS Styles - Replaces Tailwind
const styles = `
    .cliniverse-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        background-color: #f9fafb;
        min-height: 100vh;
        color: #111827;
    }
    .cliniverse-padding {
        padding: 2rem;
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        flex-wrap: wrap;
    }
    .header-title h1 {
        font-size: 1.875rem;
        font-weight: bold;
        margin: 0;
    }
    .header-title p {
        font-size: 0.875rem;
        color: #4b5563;
        margin-top: 4px;
    }
    .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
    }
    .button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .button-primary {
        background-color: #2563eb;
        color: white;
    }
    .button-primary:hover {
        background-color: #1d4ed8;
    }
    .button-secondary {
        background-color: #e5e7eb;
        color: #374151;
    }
    .button-secondary:hover {
        background-color: #d1d5db;
    }
    .button-green {
        background-color: #16a34a;
        color: white;
    }
    .button-green:hover {
        background-color: #15803d;
    }
    .main-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
    .col-span-2 {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .card {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
    }
    .card-title {
        font-size: 1.25rem;
        font-weight: bold;
        margin-bottom: 1rem;
    }
    .care-plan-grid {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 1rem 0.5rem;
        font-size: 0.875rem;
    }
    .care-plan-label {
        font-weight: 600;
        color: #4b5563;
        text-transform: capitalize;
    }
    .text-xs {
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 1rem;
    }
    .notes-item {
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }
    .notes-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }
    .care-team-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.75rem;
    }
    .avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 9999px;
        background-color: #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 0.75rem;
    }
    .todo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .todo-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }
    .priority-badge {
        font-size: 0.75rem;
        font-weight: bold;
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
    }
    .p0 { background-color: #fee2e2; color: #991b1b; }
    .p1 { background-color: #fef3c7; color: #92400e; }
    .p2 { background-color: #dbeafe; color: #1e40af; }
    .message-item {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        margin-bottom: 0.75rem;
        position: relative;
    }
    .survey-item {
        margin-bottom: 1rem;
    }
    .survey-title {
        display: flex;
        align-items: center;
        font-size: 0.875rem;
        font-weight: 600;
    }
    .red-dot {
        width: 0.5rem;
        height: 0.5rem;
        background-color: #ef4444;
        border-radius: 9999px;
        margin-right: 0.5rem;
    }
    .input-edit {
        width: 100%;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        border: 1px solid #d1d5db;
        background-color: #f9fafb;
    }
    .textarea-edit {
        width: 100%;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        border: 1px solid #d1d5db;
        background-color: #f9fafb;
        height: 4rem;
        resize: vertical;
    }
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    .modal-content {
        background-color: white;
        padding: 2rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        width: 90%;
        max-width: 500px;
    }
    .modal-title {
        font-size: 1.25rem;
        font-weight: bold;
        margin-bottom: 1.5rem;
    }
    .modal-details-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    .modal-details-item > p:first-child {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        margin-bottom: 0.25rem;
    }
    .modal-details-item > p:last-child {
        font-size: 0.875rem;
        color: #1f2937;
    }
    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 2rem;
    }

    @media (min-width: 1024px) {
        .main-grid {
            grid-template-columns: 2fr 1fr;
        }
    }
    @media (min-width: 768px) {
        .care-plan-grid {
             grid-template-columns: 1fr 3fr;
        }
    }
`;

// Modal Component
const AdditionalDetailsModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Additional details</h3>
                <div className="modal-details-grid">
                    <div className="modal-details-item">
                        <p>Participant ID</p>
                        <p>{data.participantId}</p>
                    </div>
                    <div className="modal-details-item">
                        <p>Email</p>
                        <p>{data.email}</p>
                    </div>
                    <div className="modal-details-item">
                        <p>Phone number</p>
                        <p>{data.phoneNumber}</p>
                    </div>
                    <div className="modal-details-item">
                        <p>Address</p>
                        <p>{data.address}</p>
                    </div>
                    <hr />
                    <div className="modal-details-item">
                        <p>Client account</p>
                        <p>{data.clientAccount}</p>
                    </div>
                    <div className="modal-details-item">
                        <p>Account status</p>
                        <p>{data.accountStatus}</p>
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="button button-secondary">Edit</button>
                    <button className="button button-primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

// Main App Component
export default function App() {
    const [patient, setPatient] = useState(initialPatientData);
    const [isEditing, setIsEditing] = useState(false);
    const [editablePatient, setEditablePatient] = useState(JSON.parse(JSON.stringify(patient)));
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEditToggle = () => {
        if (isEditing) {
            setPatient(editablePatient);
        } else {
            setEditablePatient(JSON.parse(JSON.stringify(patient)));
        }
        setIsEditing(!isEditing);
    };

    const handleInputChange = (e, section, index, field) => {
        const { value } = e.target;
        const updatedPatient = { ...editablePatient };

        if (section === 'carePlan') {
            updatedPatient.carePlan[field] = value;
        } else if (section === 'notes') {
            updatedPatient.notes[index][field] = value;
        }
        
        setEditablePatient(updatedPatient);
    };
    
    return (
        <>
            <style>{styles}</style>
            <AdditionalDetailsModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={patient.additionalDetails}
            />
            <div className="cliniverse-container">
                <div className="cliniverse-padding">
                    <header className="header">
                        <div className="header-title">
                            <h1>{patient.name}</h1>
                            <p>{patient.details} <button onClick={() => setIsModalOpen(true)} style={{color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit'}}>See more</button></p>
                        </div>
                        <div className="header-actions">
                            <button onClick={handleEditToggle} className={`button ${isEditing ? 'button-green' : 'button-secondary'}`}>
                                {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                                {isEditing ? 'Save Changes' : 'Edit Patient'}
                            </button>
                            <button className="button button-primary">
                                <Plus size={16} /> Create note
                            </button>
                        </div>
                    </header>

                    <main className="main-grid">
                        <div className="col-span-2">
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                                <div className="card">
                                    <h2 className="card-title">Care plan</h2>
                                    <div className="care-plan-grid">
                                        {Object.entries(patient.carePlan).map(([key, value]) => {
                                            if (key === 'lastUpdated') return null;
                                            return (
                                                <React.Fragment key={key}>
                                                    <span className="care-plan-label">{key}</span>
                                                    {isEditing ? (
                                                        <input type="text" value={editablePatient.carePlan[key]} onChange={(e) => handleInputChange(e, 'carePlan', null, key)} className="input-edit" />
                                                    ) : (
                                                        <span>{value}</span>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs">{patient.carePlan.lastUpdated}</p>
                                </div>
                                <div className="card">
                                    <h2 className="card-title">A1C</h2>
                                    <div style={{ width: '100%', height: 200 }}>
                                        <ResponsiveContainer>
                                            <LineChart data={patient.a1cData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[6, 9]} ticks={[6, 7, 8, 9]} />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="a1c" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <h2 className="card-title">Notes</h2>
                                {patient.notes.map((note, index) => (
                                    <div key={index} className="notes-item">
                                        <div className="care-plan-grid">
                                            {Object.entries(note).map(([key, value]) => {
                                                if (key === 'updated' || !value) return null;
                                                return (
                                                    <React.Fragment key={key}>
                                                        <span className="care-plan-label">{key}</span>
                                                        {isEditing ? (
                                                           <textarea value={editablePatient.notes[index][key]} onChange={(e) => handleInputChange(e, 'notes', index, key)} className="textarea-edit" />
                                                        ) : (
                                                            <span>{value}</span>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                        {note.updated && <p className="text-xs">{note.updated}</p>}
                                    </div>
                                ))}
                            </div>
                             <div className="card">
                                <h2 className="card-title">Care team</h2>
                                {patient.careTeam.map((member, index) => (
                                    <div key={index} className="care-team-item">
                                        <div className="avatar"><User size={16} color="#6b7280" /></div>
                                        <div>
                                            <p style={{fontWeight: 600, fontSize: '0.875rem'}}>{member.name}</p>
                                            <p style={{fontSize: '0.75rem', color: '#6b7280'}}>{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-1" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                           <div className="card">
                                <div className="todo-header">
                                    <h2 className="card-title">To do</h2>
                                    <button style={{background: '#e5e7eb', borderRadius: '9999px', padding: '0.25rem', border: 'none', cursor: 'pointer'}}><Plus size={16} color="#4b5563" /></button>
                                </div>
                                {patient.toDo.map(item => (
                                    <div key={item.id} className="todo-item">
                                        <div style={{display: 'flex', alignItems: 'center'}}>
                                            <input type="checkbox" checked={item.completed} readOnly style={{marginRight: '0.75rem'}} />
                                            <span style={{textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#6b7280' : 'inherit'}}>{item.text}</span>
                                        </div>
                                        <span className={`priority-badge ${item.priority.toLowerCase()}`}>{item.priority}</span>
                                    </div>
                                ))}
                                <p className="text-xs">{patient.toDo.filter(i => i.completed).length} COMPLETED</p>
                            </div>
                            <div className="card">
                                <h2 className="card-title">Messages</h2>
                                {patient.messages.map((msg, index) => (
                                    <div key={index} className="message-item">
                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                            <div>
                                                <p style={{fontWeight: 600, fontSize: '0.875rem'}}>{msg.subject}</p>
                                                <p style={{fontSize: '0.75rem', color: '#6b7280'}}>{msg.from} replied</p>
                                            </div>
                                            <p style={{fontSize: '0.75rem', color: '#6b7280'}}>{msg.time}</p>
                                        </div>
                                        <p style={{fontSize: '0.875rem', color: '#4b5563', marginTop: '0.5rem'}}>{msg.content}</p>
                                        {msg.unread && <div style={{width: '0.5rem', height: '0.5rem', backgroundColor: '#3b82f6', borderRadius: '9999px', position: 'absolute', top: '0.75rem', right: '0.75rem'}}></div>}
                                    </div>
                                ))}
                            </div>
                            <div className="card">
                                <h2 className="card-title">Surveys</h2>
                                <p style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem'}}>3 missed A1C surveys</p>
                                {patient.surveys.map((survey, index) => (
                                    <div key={index} className="survey-item">
                                        <p className="survey-title">
                                            <span className="red-dot"></span>
                                            {survey.title} from {survey.date}
                                        </p>
                                        {survey.details && <pre style={{fontSize: '0.75rem', color: '#4b5563', marginTop: '0.25rem', marginLeft: '1rem', fontFamily: 'inherit', whiteSpace: 'pre-wrap'}}>{survey.details}</pre>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

