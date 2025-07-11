import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Loader, AlertCircle, UploadCloud, Search, ArrowUpDown, RefreshCw, Settings, Share2, Copy, BarChart2, Lightbulb, CheckSquare, LogOut, Mail, KeyRound, BookText, Wand2, History, TrendingUp, Trash2, X, Users, ChevronsUpDown } from 'lucide-react';
import DatePicker from 'react-datepicker';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithRedirect,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    getDoc,
    deleteDoc,
    query,
    where,
    writeBatch
} from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyAew1jnmeRVlSW1ChFolLRAHMgqQy1qr3w",
    authDomain: "seo-refinerator.firebaseapp.com",
    projectId: "seo-refinerator",
    storageBucket: "seo-refinerator.firebasestorage.app",
    messagingSenderId: "141956882546",
    appId: "1:141956882546:web:fb20748bceca66269722eb"
};

// --- Helper Functions ---
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Script load error for ${src}`));
        document.head.appendChild(script);
    });
};

const GEMINI_API_KEY = "AIzaSyBXs2tz6mecFwCoY6Z1Qh1n0xljPn7jcHo";

// --- Main App Component ---
const App = () => {
    // Core State
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // Workspace State
    const [workspaces, setWorkspaces] = useState([]);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null);

    // Data State
    const [snapshots, setSnapshots] = useState([]);
    const [activeSnapshotId, setActiveSnapshotId] = useState(null);
    const [seoExperiments, setSeoExperiments] = useState([]);
    const [knowledgeBaseItems, setKnowledgeBaseItems] = useState([]);
    const [apiKey, setApiKey] = useState(null);

    // UI State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);
    const [isManageSnapshotsOpen, setIsManageSnapshotsOpen] = useState(false);
    const [uiError, setUiError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'Impressions', direction: 'descending' });

    const setError = (msg) => { setUiError(msg); setSuccessMessage(''); };
    const setSuccess = (msg) => { setSuccessMessage(msg); setUiError(null); };

    // Derived State
    const currentWorkspace = useMemo(() => workspaces.find(w => w.id === currentWorkspaceId), [workspaces, currentWorkspaceId]);
    const activeSnapshot = useMemo(() => snapshots.find(s => s.id === activeSnapshotId), [snapshots, activeSnapshotId]);
    const error = uiError;

    // --- Auth and Workspace Initialization ---
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance);
        setDb(dbInstance);

        const unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                setUser(user);
                // Fetch workspaces for the logged-in user
                const q = query(collection(dbInstance, "workspaces"), where("members", "array-contains", user.email));
                const querySnapshot = await getDocs(q);
                const userWorkspaces = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                if (userWorkspaces.length > 0) {
                    setWorkspaces(userWorkspaces);
                    const lastWorkspaceId = localStorage.getItem('lastWorkspaceId');
                    if (lastWorkspaceId && userWorkspaces.some(w => w.id === lastWorkspaceId)) {
                        setCurrentWorkspaceId(lastWorkspaceId);
                    } else {
                        setCurrentWorkspaceId(userWorkspaces[0].id);
                    }
                } else {
                    // First time sign-in, create a default workspace
                    const newWorkspace = {
                        name: `${user.displayName || user.email.split('@')[0]}'s Workspace`,
                        ownerId: user.uid,
                        members: [user.email]
                    };
                    const workspaceRef = await addDoc(collection(dbInstance, "workspaces"), newWorkspace);
                    setWorkspaces([{ id: workspaceRef.id, ...newWorkspace }]);
                    setCurrentWorkspaceId(workspaceRef.id);
                }
            } else {
                setUser(null);
                setWorkspaces([]);
                setCurrentWorkspaceId(null);
            }
            setIsAuthReady(true);
        });
        return () => unsubscribeAuth();
    }, []);

    // --- Data Subscriptions based on Workspace ---
    useEffect(() => {
        if (!db || !currentWorkspaceId) {
            setSnapshots([]);
            setSeoExperiments([]);
            setKnowledgeBaseItems([]);
            setApiKey(null);
            return;
        }

        const workspacePath = `workspaces/${currentWorkspaceId}`;

        const unsubSnapshots = onSnapshot(collection(db, workspacePath, 'snapshots'), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setSnapshots(data);
        });

        const unsubExperiments = onSnapshot(collection(db, workspacePath, 'seoExperiments'), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setSeoExperiments(data);
        });
        
        const unsubKnowledgeBase = onSnapshot(collection(db, workspacePath, 'knowledgeBase'), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setKnowledgeBaseItems(data);
        });
        
        const unsubSettings = onSnapshot(doc(db, workspacePath, 'settings', 'apiSettings'), (doc) => {
            setApiKey(doc.exists() ? doc.data().apiKey : null);
        });
        
        const settingsDocRef = doc(db, workspacePath, 'settings', 'workspaceSettings');
        const unsubWorkspaceSettings = onSnapshot(settingsDocRef, (doc) => {
            if (doc.exists()) {
                setActiveSnapshotId(doc.data().activeSnapshotId || null);
            }
        });

        return () => {
            unsubSnapshots();
            unsubExperiments();
            unsubKnowledgeBase();
            unsubSettings();
            unsubWorkspaceSettings();
        };
    }, [db, currentWorkspaceId]);
    
    // --- Workspace and Snapshot Management ---
    const handleWorkspaceSwitch = (workspaceId) => {
        setCurrentWorkspaceId(workspaceId);
        localStorage.setItem('lastWorkspaceId', workspaceId);
    };

    const handleSetActiveSnapshot = useCallback(async (id) => {
        if (!db || !currentWorkspaceId) return;
        const settingsDocRef = doc(db, `workspaces/${currentWorkspaceId}/settings`, 'workspaceSettings');
        try {
            await setDoc(settingsDocRef, { activeSnapshotId: id }, { merge: true });
            setActiveSnapshotId(id);
        } catch (err) {
            setError("Could not switch snapshots.");
        }
    }, [db, currentWorkspaceId]);

    const handleDeleteSnapshot = async (snapshotIdToDelete) => {
        if (!db || !currentWorkspaceId) return;
        if (window.confirm("Are you sure you want to delete this snapshot? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, `workspaces/${currentWorkspaceId}/snapshots`, snapshotIdToDelete));
                setSuccess("Snapshot deleted successfully.");
            } catch (err) {
                setError("Error deleting snapshot: " + err.message);
            }
        }
    };
    
    // --- Core Functions ---
    const handleFileUpload = async (uploadSettings) => {
        if (!fileToUpload || !currentWorkspaceId) return;
        const { dateRange } = uploadSettings;
        if (!dateRange.startDate || !dateRange.endDate) { setError("Please select a valid date range."); return; }
        
        setSuccess("File processing started...");
        setError(null);
        setIsUploadModalOpen(false);

        try {
            await loadScript('https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js');
            window.Papa.parse(fileToUpload, {
                header: true, skipEmptyLines: true,
                complete: async (results) => {
                    const pageHeader = results.meta.fields.find(h => h.toLowerCase() === 'page' || h.toLowerCase() === 'top pages');
                    if (!results.data || !pageHeader) { setError("Invalid CSV format."); return; }
                    const loadedPagesData = results.data.map(row => ({ Page: row[pageHeader], Clicks: Number(row.Clicks) || 0, Impressions: Number(row.Impressions) || 0 })).filter(p => p.Page);
                    const newSnapshotData = { createdAt: new Date().toISOString(), fileName: fileToUpload.name, pages: loadedPagesData, dateRange: { start: dateRange.startDate.toISOString(), end: dateRange.endDate.toISOString() } };
                    const newDocRef = await addDoc(collection(db, `workspaces/${currentWorkspaceId}/snapshots`), newSnapshotData);
                    await handleSetActiveSnapshot(newDocRef.id);
                    setSuccess(`"${fileToUpload.name}" processed successfully!`);
                }
            });
        } catch (err) { setError(err.message || "Failed to process file."); }
        finally { setFileToUpload(null); }
    };
    
    const generateAISummary = async () => {
        // ... (This function remains largely the same but uses currentWorkspaceId)
    };

    // --- Components ---
    const Header = () => (
        <header className="mb-6">
            <div className="flex justify-between items-center">
                {workspaces.length > 1 ? (
                    <WorkspaceSwitcher />
                ) : (
                    <div className="w-48 font-semibold">{currentWorkspace?.name}</div>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">SEO Analyzer</h1>
                <div className="w-48 flex justify-end items-center gap-2">
                    <button onClick={() => setIsTeamModalOpen(true)} className="p-2 hover:bg-slate-200 rounded-full" title="Manage Team"><Users size={20}/></button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-200 rounded-full" title="Settings"><Settings size={20}/></button>
                    <button onClick={() => setIsChangelogOpen(true)} className="p-2 hover:bg-slate-200 rounded-full" title="Changelog"><History size={20}/></button>
                    <button onClick={handleSignOut} className="p-2 hover:bg-slate-200 rounded-full" title="Sign Out"><LogOut size={20}/></button>
                </div>
            </div>
        </header>
    );

    const WorkspaceSwitcher = () => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className="relative w-48">
                <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-2 bg-white border rounded-lg">
                    <span className="font-semibold truncate">{currentWorkspace?.name}</span>
                    <ChevronsUpDown size={16} />
                </button>
                {isOpen && (
                    <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
                        {workspaces.map(ws => (
                            <button 
                                key={ws.id} 
                                onClick={() => { handleWorkspaceSwitch(ws.id); setIsOpen(false); }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-100"
                            >
                                {ws.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };
    
    const TeamModal = ({ isOpen, onClose, workspace, onInvite }) => {
        const [inviteEmail, setInviteEmail] = useState('');
        if (!isOpen || !workspace) return null;

        const handleInvite = () => {
            if (inviteEmail && !workspace.members.includes(inviteEmail)) {
                onInvite(inviteEmail);
                setInviteEmail('');
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
                    <h2 className="text-xl font-bold mb-4">Manage Team for {workspace.name}</h2>
                    <div className="mb-4">
                        <h3 className="font-semibold mb-2">Invite New Member</h3>
                        <div className="flex gap-2">
                            <input 
                                type="email" 
                                value={inviteEmail} 
                                onChange={e => setInviteEmail(e.target.value)} 
                                placeholder="Enter email address"
                                className="flex-grow p-2 border rounded-lg"
                            />
                            <button onClick={handleInvite} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Invite</button>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Current Members</h3>
                        <ul className="space-y-2">
                            {workspace.members.map(email => (
                                <li key={email} className="p-2 bg-slate-100 rounded-lg">{email}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex justify-end mt-6">
                        <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg">Close</button>
                    </div>
                </div>
            </div>
        );
    };
    
    const handleInviteMember = async (email) => {
        if (!db || !currentWorkspaceId || !currentWorkspace) return;
        const updatedMembers = [...currentWorkspace.members, email];
        const workspaceRef = doc(db, 'workspaces', currentWorkspaceId);
        try {
            await updateDoc(workspaceRef, { members: updatedMembers });
            setSuccess(`${email} has been invited to the workspace.`);
        } catch (err) {
            setError("Failed to invite member.");
        }
    };

    if (!isAuthReady) {
        return <div className="bg-slate-50 min-h-screen flex items-center justify-center"><Loader className="animate-spin w-12 h-12 text-blue-600" /></div>;
    }

    if (!user) {
        return <AuthScreen auth={auth} />;
    }

    return (
        <>
            <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} workspace={currentWorkspace} onInvite={handleInviteMember} />
            {/* Other modals go here */}
            
            <div className="bg-slate-50 min-h-screen font-sans text-slate-800 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Header />
                    
                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-6 rounded-lg max-w-3xl mx-auto flex items-center gap-3"><AlertCircle size={20} />{error}</div>}
                    {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-6 rounded-lg max-w-3xl mx-auto">{successMessage}</div>}

                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 mb-8 max-w-3xl mx-auto">
                        <label htmlFor="csv-upload" className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                            <UploadCloud className={`w-12 h-12 mb-2 ${fileToUpload ? 'text-blue-500' : 'text-slate-400'}`} />
                            <span className={`font-semibold ${fileToUpload ? 'text-blue-600' : 'text-slate-600'}`}>{fileToUpload ? `Ready: ${fileToUpload.name}` : 'Click to upload CSV'}</span>
                        </label>
                        <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                    </div>
                    
                    {snapshots.length > 0 && (
                        <div className="mb-6 max-w-3xl mx-auto flex items-end gap-2">
                            <div className="flex-grow">
                                <label htmlFor="snapshot-select" className="block text-sm font-medium text-slate-700 mb-1">Active Snapshot:</label>
                                <select id="snapshot-select" value={activeSnapshotId || ''} onChange={(e) => handleSetActiveSnapshot(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg">
                                    {snapshots.map(s => <option key={s.id} value={s.id}>{s.fileName}</option>)}
                                </select>
                            </div>
                            <button onClick={() => setIsManageSnapshotsOpen(true)} className="p-2 bg-white border rounded-lg hover:bg-slate-100" title="Manage Snapshots">Manage</button>
                        </div>
                    )}
                    
                    {/* Rest of the UI (AI Summary button, Dashboards, Tables) goes here */}
                </div>
            </div>
        </>
    );
};

export default App;
