import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { API_BASE_URL } from '../config'; // Import from config file


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

export default SyntheticDataGenerator;