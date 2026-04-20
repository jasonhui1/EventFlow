import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';

const API_SERVER_URL = 'http://localhost:4649';
const CATEGORIES = ["top", "bottom", "outerwear", "neckwear", "legwear", "accessories", "sync"];

const formatName = (key) => key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// --- Subcomponents ---

const CostumeSidebar = ({ localDB, selectedCostumeId, onSelect, onAdd }) => (
    <div style={{
        width: '260px',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column'
    }}>
        <div className="modal-header" style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="modal-title" style={{ fontSize: '14px', margin: 0 }}>👗 Costume Templates</h3>
        </div>
        <div style={{ padding: '12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.keys(localDB).map(key => (
                <div 
                    key={key}
                    onClick={() => onSelect(key)}
                    style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: selectedCostumeId === key ? 'rgba(201, 181, 255, 0.15)' : 'transparent',
                        border: `1px solid ${selectedCostumeId === key ? 'rgba(201, 181, 255, 0.3)' : 'transparent'}`,
                        color: selectedCostumeId === key ? '#fff' : 'rgba(255,255,255,0.6)',
                        fontWeight: selectedCostumeId === key ? 600 : 400,
                        fontSize: '13px',
                        transition: 'all 0.2s'
                    }}
                >
                    {formatName(key)}
                </div>
            ))}
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button className="action-btn" onClick={onAdd} style={{ width: '100%', justifyContent: 'center' }}>
                + Add New Template
            </button>
        </div>
    </div>
);

const CostumeHeader = ({ selectedCostumeId, onDelete, onClose }) => (
    <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', justifyContent: 'space-between' }}>
        <h3 className="modal-title">
            {selectedCostumeId ? `Editing: ${formatName(selectedCostumeId)}` : 'No Selection'}
        </h3>
        <div>
            {selectedCostumeId && (
                <button className="action-btn" onClick={onDelete} style={{ borderColor: 'rgba(255, 100, 100, 0.3)', color: '#FFB5B5', marginRight: '16px' }}>
                    Delete
                </button>
            )}
            <button className="modal-close" onClick={onClose} style={{ top: 'auto', right: 'auto', position: 'relative' }}>×</button>
        </div>
    </div>
);

const CategoryGrid = ({ activeCostume, onChange }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {CATEGORIES.filter(c => c !== 'sync').map(cat => (
            <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'capitalize' }}>
                    {cat}
                </label>
                <textarea
                    className="nodrag"
                    value={activeCostume[cat] || ''}
                    onChange={(e) => onChange(cat, e.target.value)}
                    placeholder={`Prompt template for ${cat}...`}
                    spellCheck="false"
                    style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px',
                        resize: 'vertical',
                        fontFamily: 'monospace',
                    }}
                />
            </div>
        ))}
    </div>
);

const CrucialToggles = ({ activeCostume, onToggle }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
            🎯 Crucial Components
        </label>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '-8px' }}>
            Select which parts MUST be generated for this template and stay the same when generated in groups.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORIES.map(cat => {
                const isSelected = (activeCostume.crucial || []).includes(cat);
                return (
                    <button
                        key={cat}
                        onClick={() => onToggle(cat)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: isSelected ? 'var(--pastel-purple)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isSelected ? 'var(--pastel-purple)' : 'rgba(255,255,255,0.1)'}`,
                            color: isSelected ? '#1a1a2e' : 'rgba(255,255,255,0.6)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s',
                        }}
                    >
                        {isSelected ? '✓ ' : ''}{cat}
                    </button>
                );
            })}
        </div>
    </div>
);

const SyncConfig = ({ activeCostume, onChange }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
            🔗 Cross-Part Sync
        </label>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '-8px' }}>
            Define shared prompt modifiers (like color schemas) that should inject into multiple items.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {CATEGORIES.filter(c => c !== 'sync').map(cat => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '100px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize', textAlign: 'right' }}>
                        {cat}
                    </div>
                    <input
                        type="text"
                        value={(activeCostume.sync && activeCostume.sync[cat]) || ''}
                        onChange={(e) => onChange(cat, e.target.value)}
                        placeholder={`e.g., <warm$cool$neutral>`}
                        spellCheck="false"
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                        }}
                    />
                </div>
            ))}
        </div>
    </div>
);

const CostumeFooter = ({ onCancel, onSave, isSaving }) => (
    <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
        <button className="action-btn" onClick={onCancel} style={{ marginLeft: 'auto', marginRight: '12px' }}>
            Cancel
        </button>
        <button 
            className="action-btn primary" 
            onClick={onSave} 
            disabled={isSaving}
            style={{ opacity: isSaving ? 0.7 : 1 }}
        >
            {isSaving ? 'Saving...' : '💾 Save Configurations'}
        </button>
    </div>
);

// --- Main Component ---

const ClothesEditorModal = ({ onClose }) => {
    const clothesDB = useStore((state) => state.clothesDB);
    const loadClothesFromServer = useStore((state) => state.loadClothesFromServer);

    const [localDB, setLocalDB] = useState({});
    const [selectedCostumeId, setSelectedCostumeId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        // Deep clone so we can mutate safely
        const clone = JSON.parse(JSON.stringify(clothesDB));
        setLocalDB(clone);
        if (Object.keys(clone).length > 0 && !selectedCostumeId) {
            setSelectedCostumeId(Object.keys(clone)[0]);
        }
    }, [clothesDB]);

    const activeCostume = localDB[selectedCostumeId] || null;

    const handleFieldChange = (field, value) => {
        setLocalDB(prev => ({
            ...prev,
            [selectedCostumeId]: {
                ...prev[selectedCostumeId],
                [field]: value
            }
        }));
    };

    const toggleCrucial = (cat) => {
        if (!activeCostume) return;
        const currentCrucial = activeCostume.crucial || [];
        let newCrucial;
        if (currentCrucial.includes(cat)) {
            newCrucial = currentCrucial.filter(c => c !== cat);
        } else {
            newCrucial = [...currentCrucial, cat];
        }
        handleFieldChange('crucial', newCrucial);
    };

    const handleSyncChange = (cat, value) => {
        if (!activeCostume) return;
        const currentSync = activeCostume.sync || {};
        
        let newSync = { ...currentSync, [cat]: value };
        if (value.trim() === '') {
            delete newSync[cat]; // Remove if empty
        }
        handleFieldChange('sync', newSync);
    };

    const handleAddNew = () => {
        const newName = prompt("Enter a new unique template name (e.g., 'cyber_suit'):");
        if (!newName || !newName.trim()) return;
        const key = newName.trim().replace(/\s+/g, '_').toLowerCase();
        
        if (localDB[key]) {
            alert("A template with that name already exists!");
            return;
        }

        setLocalDB(prev => ({
            ...prev,
            [key]: {
                top: "",
                bottom: "",
                outerwear: "",
                neckwear: "",
                legwear: "",
                accessories: "",
                sync: {},
                crucial: ["top", "bottom"]
            }
        }));
        setSelectedCostumeId(key);
    };

    const handleDelete = () => {
        if (!selectedCostumeId || !confirm(`Delete template '${selectedCostumeId}'?`)) return;
        
        setLocalDB(prev => {
            const next = { ...prev };
            delete next[selectedCostumeId];
            return next;
        });
        
        setSelectedCostumeId(Object.keys(localDB).filter(k => k !== selectedCostumeId)[0] || null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`${API_SERVER_URL}/api/clothes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localDB),
            });
            if (response.ok) {
                await loadClothesFromServer();
                alert("Saved successfully!");
            } else {
                alert("Failed to save changes.");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Error saving: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal nowheel"
                onClick={(e) => e.stopPropagation()}
                style={{ 
                    minWidth: '900px', 
                    maxWidth: '1200px', 
                    height: '85vh', 
                    display: 'flex', 
                    flexDirection: 'row',
                    padding: 0,
                    overflow: 'hidden'
                }}
            >
                <CostumeSidebar 
                    localDB={localDB}
                    selectedCostumeId={selectedCostumeId}
                    onSelect={setSelectedCostumeId}
                    onAdd={handleAddNew}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <CostumeHeader 
                        selectedCostumeId={selectedCostumeId}
                        onDelete={handleDelete}
                        onClose={onClose}
                    />

                    <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                        {activeCostume ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <CategoryGrid activeCostume={activeCostume} onChange={handleFieldChange} />
                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '12px 0' }} />
                                <CrucialToggles activeCostume={activeCostume} onToggle={toggleCrucial} />
                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '12px 0' }} />
                                <SyncConfig activeCostume={activeCostume} onChange={handleSyncChange} />
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                Select a template to edit or add a new one.
                            </div>
                        )}
                    </div>

                    <CostumeFooter 
                        onCancel={onClose}
                        onSave={handleSave}
                        isSaving={isSaving}
                    />
                </div>
            </div>
        </div>
    );
};

export default ClothesEditorModal;
