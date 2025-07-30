import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css'; // Import the new CSS file
import { API_BASE_URL } from './config'; // Import the config

// Import the new components
import Sidebar from './components/Sidebar';
import PatientView from './components/PatientView';
import CarePathway from './components/CarePathway';
import SyntheticDataGenerator from './components/SyntheticDataGenerator';
import ChatbotWidget from './components/ChatbotWidget';

export default function App() {
    // --- State Management ---
    const [patientList, setPatientList] = useState([]);
    const [currentPatientId, setCurrentPatientId] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('');
    const [activeTab, setActiveTab] = useState('patientView');
    const [populationProfiles, setPopulationProfiles] = useState([]);
    const [selectedProfileName, setSelectedProfileName] = useState('default');
    const [activeFilter, setActiveFilter] = useState(null);

    // --- Data and Memos ---
    const defaultProfile = useMemo(() => ({
        name: 'Generic (US Population)',
        data: { /* ... default profile data ... */ }
    }), []);
    
    // --- Data Fetching ---
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
        //patient detail fetching logic
        const fetchPatientDetails = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/patients/${currentPatientId}`);
                if (!response.ok) throw new Error(`Patient with ID ${currentPatientId} not found.`);
                const patientData = await response.json();
                setSelectedPatient(patientData);
                // setEditablePatient(JSON.parse(JSON.stringify(patientData)));
            } catch (err) {
                setError(err.message);
                setSelectedPatient(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPatientDetails();
    }, [currentPatientId]);

    // --- Event Handlers ---
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
    
    const handleSavePatient = async (updatedPatient) => {
        setStatus('Saving...');
        try {
            await fetch(`${API_BASE_URL}/patients/${updatedPatient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPatient),
            });
            // Update state after successful save
            setSelectedPatient(updatedPatient);
            setPatientList(list => list.map(p => p.id === updatedPatient.id ? updatedPatient : p));
            setStatus('Saved successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setTimeout(() => setStatus(''), 2000);
        }
    };
    
    // --- Filtering ---
    const filteredPatients = useMemo(() => {
        if (!activeFilter) return patientList;
        return patientList.filter(p => p.profile_name === activeFilter);
    }, [activeFilter, patientList]);

    // --- Render Logic ---
    const renderContent = () => {
        switch (activeTab) {
            case 'patientView':
                if (isLoading && !selectedPatient) return <div className="empty-state">Loading...</div>;
                if (error && !status) return <div className="empty-state" style={{color: 'red'}}>{error}</div>;
                return <PatientView patient={selectedPatient} onSave={handleSavePatient} />;
            case 'carePathway':
                return <CarePathway />;
            case 'dataGen':
                return <SyntheticDataGenerator profiles={populationProfiles} onProfileSaved={fetchPopulationProfiles} onSetFilter={setActiveFilter} />;
            default:
                return <PatientView patient={selectedPatient} onSave={handleSavePatient} />;
        }
    };

    return (
        <div className="app-container">
            <ChatbotWidget patient={selectedPatient} />

            {/* This div should WRAP the Sidebar and Main Content */}
            <div style={{ display: 'flex', height: '100vh', width: '100%' }}>

                {/* Sidebar is correctly placed here */}
                {activeTab !== 'dataGen' && activeTab !== 'carePathway' && (
                    <Sidebar
                        profiles={populationProfiles}
                        defaultProfile={defaultProfile}
                        selectedProfileName={selectedProfileName}
                        onProfileChange={setSelectedProfileName}
                        onGenerateClick={handleGenerateClick}
                        status={status}
                        activeFilter={activeFilter}
                        onClearFilter={() => setActiveFilter(null)}
                        filteredPatients={filteredPatients}
                        currentPatientId={currentPatientId}
                        onPatientSelect={setCurrentPatientId}
                    />
                )}

                {/* Main content is correctly placed here */}
                <main className="main-content" style={{ flexGrow: 1 }}>
                    <div className="tab-nav">
                        <button onClick={() => setActiveTab('dataGen')} className={`tab-button ${activeTab === 'dataGen' ? 'active' : ''}`}>Population</button>
                        <button onClick={() => setActiveTab('carePathway')} className={`tab-button ${activeTab === 'carePathway' ? 'active' : ''}`}>Care Pathways</button>
                        <button onClick={() => setActiveTab('patientView')} className={`tab-button ${activeTab === 'patientView' ? 'active' : ''}`}>Patients</button>
                    </div>
                    <div className="tab-content">{renderContent()}</div>
                </main>

            </div> {/* The wrapping div closes here */}
        </div>
    );
}