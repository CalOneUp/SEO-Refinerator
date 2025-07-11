import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Loader, AlertCircle, UploadCloud, Settings, Users, Lightbulb, CheckSquare, LogOut, Mail, KeyRound, TrendingUp, Trash2, X } from 'lucide-react';
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
    deleteDoc,
    query,
    where,
    getDocs
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

// Hardcoded API key as a fallback
const GEMINI_API_KEY = "AIzaSyBXs2tz6mecFwCoY6Z1Qh1n0xljPn7jcHo";

// --- Helper function to dynamically load PapaParse ---
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

// --- Custom Hook for Core State ---
const useAppCore = () => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance);
        setDb(dbInstance);

        const unsubscribeAuth = onAuthStateChanged(authInstance, (user) => {
            setUser(user);
            setIsAuthReady(true);
        });
        return () => unsubscribeAuth();
    }, []);

    return { db, auth, user, isAuthReady };
};


// --- Auth Screen Component ---
const AuthScreen = ({ auth }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    const handleGoogleSignIn = () => {
        const provider = new GoogleAuthProvider();
        signInWithRedirect(auth, provider).catch(err => setAuthError(err.message));
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setAuthError(err.message);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8 flex flex-col items-center">
                    <img src="/click-or-it-didn-t-happen.png" alt="Logo" className="w-24 h-24 mb-4" />
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Click or It Didn't Happen</h1>
                    <p className="text-slate-600">{isSignUp ? 'Create an account to get started.' : 'Sign in to your account.'}</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg border">
                    <form onSubmit={handleEmailAuth}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 pr-3 py-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Password</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-10 pr-3 py-2 border rounded-lg" />
                            </div>
                        </div>
                        {authError && <p className="text-red-500 text-sm mb-4">{authError}</p>}
                        <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </button>
                    </form>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-slate-500">Or continue with</span></div>
                    </div>
                    <button onClick={handleGoogleSignIn} className="w-full inline-flex items-center justify-center gap-3 bg-white text-slate-800 font-semibold py-2 px-4 rounded-lg shadow-md border hover:bg-slate-50 transition">
                        <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19-5.238C42.021 35.637 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                        Google
                    </button>
                </div>
                <p className="text-center text-sm text-slate-600 mt-6">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-blue-600 hover:underline ml-1">
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
};

// --- Main App: Logged In View ---
const LoggedInApp = ({ db, auth, user }) => {
    // Workspace State
    const [workspaces, setWorkspaces] = useState([]);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null);

    // Data State
    const [snapshots, setSnapshots] = useState([]);
    const [activeSnapshotId, setActiveSnapshotId] = useState(null);
    const [apiKey, setApiKey] = useState(null);

    // UI State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isManageSnapshotsOpen, setIsManageSnapshotsOpen] = useState(false);
    const [uiError, setUiError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'Impressions', direction: 'descending' });
    const [showOnlyOpportunities, setShowOnlyOpportunities] = useState(false);

    const setError = (msg) => { setUiError(msg); setSuccessMessage(''); };
    const setSuccess = (msg) => { setSuccessMessage(msg); setUiError(null); };

    // Derived State
    const currentWorkspace = useMemo(() => workspaces.find(w => w.id === currentWorkspaceId), [workspaces, currentWorkspaceId]);
    const activeSnapshot = useMemo(() => snapshots.find(s => s.id === activeSnapshotId), [snapshots, activeSnapshotId]);
    const error = uiError;
    
    // --- Workspace Initialization ---
    useEffect(() => {
        if (!db || !user) return;
        
        const q = query(collection(db, "workspaces"), where("members", "array-contains", user.email));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            if (querySnapshot.empty && user) {
                const newWorkspace = {
                    name: `${user.displayName || user.email.split('@')[0]}'s Workspace`,
                    ownerId: user.uid,
                    members: [user.email]
                };
                const workspaceRef = await addDoc(collection(db, "workspaces"), newWorkspace);
                setCurrentWorkspaceId(workspaceRef.id);
                localStorage.setItem('lastWorkspaceId', workspaceRef.id);
            } else {
                const userWorkspaces = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setWorkspaces(userWorkspaces);
                const lastWorkspaceId = localStorage.getItem('lastWorkspaceId');
                if (lastWorkspaceId && userWorkspaces.some(w => w.id === lastWorkspaceId)) {
                    setCurrentWorkspaceId(lastWorkspaceId);
                } else if (userWorkspaces.length > 0) {
                    setCurrentWorkspaceId(userWorkspaces[0].id);
                }
            }
        });

        return () => unsubscribe();
    }, [db, user]);

    // --- Data Subscriptions based on Workspace ---
    useEffect(() => {
        if (!db || !currentWorkspaceId) {
            setSnapshots([]);
            setApiKey(null);
            setActiveSnapshotId(null);
            return;
        }

        const workspacePath = `workspaces/${currentWorkspaceId}`;
        const unsubSnapshots = onSnapshot(query(collection(db, workspacePath, 'snapshots')), (snap) => setSnapshots(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("Snapshot listener error:", err));
        
        const settingsRef = doc(db, workspacePath, 'settings');
        const unsubSettings = onSnapshot(settingsRef, (doc) => {
            if(doc.exists()){
                setApiKey(doc.data().apiKey || null);
                setActiveSnapshotId(doc.data().activeSnapshotId || null);
            } else {
                setApiKey(null);
                setActiveSnapshotId(null);
            }
        });
        
        return () => {
            unsubSnapshots();
            unsubSettings();
        };
    }, [db, currentWorkspaceId]);
    
    // --- UI and Core Logic Handlers ---
    const handleWorkspaceSwitch = (workspaceId) => {
        setCurrentWorkspaceId(workspaceId);
        localStorage.setItem('lastWorkspaceId', workspaceId);
    };

    const handleSetActiveSnapshot = useCallback(async (id) => {
        if (!db || !currentWorkspaceId) return;
        const settingsDocRef = doc(db, `workspaces/${currentWorkspaceId}`, 'settings');
        try {
            await setDoc(settingsDocRef, { activeSnapshotId: id }, { merge: true });
        } catch (err) { setError("Could not set active snapshot."); }
    }, [db, currentWorkspaceId]);
    
    const handleDeleteSnapshot = async (snapshotIdToDelete) => {
        if (!db || !currentWorkspaceId) return;
        if (window.confirm("Are you sure you want to delete this snapshot? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, `workspaces/${currentWorkspaceId}/snapshots`, snapshotIdToDelete));
                setSuccess("Snapshot deleted successfully.");
            } catch (err) { setError("Error deleting snapshot: " + err.message); }
        }
    };
    
    const handleInviteMember = async (email) => {
        if (!db || !currentWorkspaceId || !currentWorkspace) return;
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !trimmedEmail.includes('@')) {
            setError("Please enter a valid email address.");
            return;
        }
        if (currentWorkspace.members.includes(trimmedEmail)) {
            setError("This user is already a member of the workspace.");
            return;
        }
        const updatedMembers = [...currentWorkspace.members, trimmedEmail];
        const workspaceRef = doc(db, 'workspaces', currentWorkspaceId);
        try {
            await updateDoc(workspaceRef, { members: updatedMembers });
            setSuccess(`${trimmedEmail} has been invited to the workspace.`);
        } catch (err) {
            setError("Failed to invite member.");
        }
    };
    
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setFileToUpload(file);
        setIsUploadModalOpen(true);
        event.target.value = '';
    };

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
                    const loadedPagesData = results.data.map(row => ({ Page: row[pageHeader], Clicks: Number(row.Clicks) || 0, Impressions: Number(row.Impressions) || 0, title: null, description: null })).filter(p => p.Page);
                    const newSnapshotData = { createdAt: new Date().toISOString(), fileName: fileToUpload.name, pages: loadedPagesData, dateRange: { start: dateRange.startDate.toISOString(), end: dateRange.endDate.toISOString() } };
                    const newDocRef = await addDoc(collection(db, `workspaces/${currentWorkspaceId}/snapshots`), newSnapshotData);
                    await handleSetActiveSnapshot(newDocRef.id);
                    setSuccess(`"${fileToUpload.name}" processed successfully!`);
                }
            });
        } catch (err) { setError(err.message || "Failed to process file."); }
        finally { setFileToUpload(null); }
    };
    
    const handleSignOut = () => {
        signOut(auth).catch(err => setError("Failed to sign out."));
    }

    const generateAISummary = async () => {
        if (!activeSnapshot?.pages || !currentWorkspaceId) { setError("No active data to analyze."); return; }
        setIsProcessing(true);
        setError(null);
        setSuccessMessage('');

        const sortedSnapshots = [...snapshots].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const currentIndex = sortedSnapshots.findIndex(s => s.id === activeSnapshotId);
        const previousSnapshot = currentIndex > -1 && currentIndex + 1 < sortedSnapshots.length ? sortedSnapshots[currentIndex + 1] : null;

        const baseSchema = {
            totalImpressions: { type: "NUMBER" },
            totalClicks: { type: "NUMBER" },
            averageCtr: { type: "STRING" },
            keyInsights: { type: "ARRAY", items: { type: "STRING" } },
            recommendations: { type: "ARRAY", items: { type: "STRING" } },
            opportunityPages: { type: "ARRAY", items: { type: "OBJECT", properties: { page: { type: "STRING" }, reasoning: { type: "STRING" } } } }
        };
        let finalSchema = baseSchema;
        let summaryPrompt = `Analyze the provided Google Search Console data for the period ${activeSnapshot.dateRange?.start} to ${activeSnapshot.dateRange?.end}. Calculate total impressions, clicks, and average CTR. Identify key insights, actionable recommendations, and opportunity pages. `;

        if (previousSnapshot && previousSnapshot.dateRange) {
            finalSchema = { ...baseSchema, trendAnalysis: { type: "ARRAY", items: { type: "STRING" } } };
            summaryPrompt += `\n\nAdditionally, compare this data to the previous period (${previousSnapshot.dateRange?.start} to ${previousSnapshot.dateRange?.end}). Provide a "Trend Analysis" section detailing changes in key metrics. Previous period data sample: ${JSON.stringify(previousSnapshot.pages.slice(0, 50))}.`;
        }
        summaryPrompt += `\n\nCurrent data sample: ${JSON.stringify(activeSnapshot.pages.slice(0, 100))}. Provide the response in the specified JSON format.`;

        try {
            const effectiveApiKey = apiKey || GEMINI_API_KEY;
            const summaryJsonString = await callGemini(summaryPrompt, { generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: finalSchema } } }, effectiveApiKey);
            const snapshotDocRef = doc(db, `workspaces/${currentWorkspaceId}/snapshots`, activeSnapshotId);
            await updateDoc(snapshotDocRef, { performanceSummary: summaryJsonString });
            setSuccess(`AI summary generated for ${activeSnapshot.fileName}!`);
        } catch (err) {
            setError(err.message || "Error during summary generation.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const callGemini = async (prompt, options, key) => {
        if (!key) throw new Error("Gemini API key is missing. Please add it in Settings.");
        let payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        if (options && options.contents) payload.contents = options.contents;
        if (options && options.generationConfig) payload.generationConfig = options.generationConfig;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API request failed: ${response.status} - ${errorBody.error?.message || 'Unknown error'}`);
        }
        const result = await response.json();
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) return result.candidates[0].content.parts[0].text;
        throw new Error("Invalid response from API.");
    };

    const parsedSummary = useMemo(() => {
        if (activeSnapshot?.performanceSummary) {
            try { return JSON.parse(activeSnapshot.performanceSummary); } catch (e) { return null; }
        }
        return null;
    }, [activeSnapshot]);

    const sortedAndFilteredPages = useMemo(() => {
        if (!activeSnapshot?.pages) return [];
        let filtered = [...activeSnapshot.pages];
        const opportunityPageUrls = new Set(parsedSummary?.opportunityPages?.map(p => p.page) || []);
        filtered = filtered.map(page => ({ ...page, isTopOpportunity: opportunityPageUrls.has(page.Page) }));
        if (searchTerm) filtered = filtered.filter(p => p.Page?.toLowerCase().includes(searchTerm.toLowerCase()));
        if (showOnlyOpportunities) filtered = filtered.filter(p => p.isTopOpportunity);
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const valA = a[sortConfig.key] || 0;
                const valB = b[sortConfig.key] || 0;
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [activeSnapshot, searchTerm, sortConfig, parsedSummary, showOnlyOpportunities]);
    
    return (
        <>
            <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} workspace={currentWorkspace} onInvite={handleInviteMember} />
            <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleFileUpload} />
            <ManageSnapshotsModal isOpen={isManageSnapshotsOpen} onClose={() => setIsManageSnapshotsOpen(false)} snapshots={snapshots} onDelete={handleDeleteSnapshot} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentApiKey={apiKey} onSave={(key) => {if(db && currentWorkspaceId) setDoc(doc(db, `workspaces/${currentWorkspaceId}/settings`), { apiKey: key }, { merge: true });}} />
            
            <div className="bg-slate-50 min-h-screen font-sans text-slate-800 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-6">
                        <div className="flex justify-between items-center">
                            <div className="w-52">
                                {workspaces.length > 0 && (
                                    <div className="relative">
                                        <select value={currentWorkspaceId || ''} onChange={(e) => handleWorkspaceSwitch(e.target.value)} className="w-full p-2 bg-white border rounded-lg font-semibold truncate">
                                            {workspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <img src="/click-or-it-didn-t-happen.png" alt="Logo" className="w-12 h-12"/>
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">Click or It Didn't Happen</h1>
                            </div>
                            <div className="w-52 flex justify-end items-center gap-2">
                                {currentWorkspace && <>
                                    <button onClick={() => setIsTeamModalOpen(true)} className="p-2 hover:bg-slate-200 rounded-full" title="Manage Team"><Users size={20}/></button>
                                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-200 rounded-full" title="Settings"><Settings size={20}/></button>
                                </>}
                                <button onClick={handleSignOut} className="p-2 hover:bg-slate-200 rounded-full" title="Sign Out"><LogOut size={20}/></button>
                            </div>
                        </div>
                    </header>
                    
                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-6 rounded-lg max-w-3xl mx-auto flex items-center gap-3"><AlertCircle size={20} />{error}</div>}
                    {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-6 rounded-lg max-w-3xl mx-auto">{successMessage}</div>}

                    {currentWorkspaceId ? (
                        <>
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
                                            {snapshots.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(s => <option key={s.id} value={s.id}>{s.fileName}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={() => setIsManageSnapshotsOpen(true)} className="p-2 h-10 bg-white border rounded-lg hover:bg-slate-100" title="Manage Snapshots">Manage</button>
                                </div>
                            )}

                            {activeSnapshot && !activeSnapshot.performanceSummary && (
                                <div className="text-center my-4">
                                    <button onClick={generateAISummary} disabled={isProcessing} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">
                                        {isProcessing ? <><Loader size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate AI Summary</>}
                                    </button>
                                </div>
                            )}
                            {parsedSummary && (
                                <SummaryDisplay summary={parsedSummary} />
                            )}
                            
                            {/* Further UI components for displaying data would go here */}

                        </>
                    ) : (
                        <div className="text-center py-10">
                            <Loader className="animate-spin w-10 h-10 mx-auto text-blue-600" />
                            <p className="mt-4 text-slate-600">Loading your workspaces...</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// --- App Entry Point ---
const App = () => {
    const { db, auth, user, isAuthReady } = useAppCore();

    if (!isAuthReady) {
        return <div className="bg-slate-50 min-h-screen flex items-center justify-center"><Loader className="animate-spin w-12 h-12 text-blue-600" /></div>;
    }

    return user ? <LoggedInApp db={db} auth={auth} user={user} /> : <AuthScreen auth={auth} />;
};

// --- All Modal and Other Components ---

const TeamModal = ({ isOpen, onClose, workspace, onInvite }) => {
    const [inviteEmail, setInviteEmail] = useState('');
    if (!isOpen || !workspace) return null;

    const handleInvite = () => {
        if (inviteEmail) {
            onInvite(inviteEmail);
            setInviteEmail('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
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
                        <button onClick={handleInvite} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Invite</button>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Current Members</h3>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {workspace.members.map(email => (
                            <li key={email} className="p-2 bg-slate-100 rounded-lg text-sm">{email}</li>
                        ))}
                    </ul>
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">Close</button>
                </div>
            </div>
        </div>
    );
};

const UploadModal = ({ isOpen, onClose, onUpload }) => {
    const [timePeriod, setTimePeriod] = useState('28days');
    const [customStartDate, setCustomStartDate] = useState(null);
    const [customEndDate, setCustomEndDate] = useState(new Date());

    if (!isOpen) return null;

    const calculateDateRange = () => {
        const endDate = timePeriod === 'custom' ? customEndDate : new Date();
        let startDate = new Date(endDate);
        switch (timePeriod) {
            case '7days': startDate.setDate(endDate.getDate() - 7); break;
            case '28days': startDate.setDate(endDate.getDate() - 28); break;
            case '3months': startDate.setMonth(endDate.getMonth() - 3); break;
            case '6months': startDate.setMonth(endDate.getMonth() - 6); break;
            case '12months': startDate.setFullYear(endDate.getFullYear() - 1); break;
            case '16months': startDate.setMonth(endDate.getMonth() - 16); break;
            case 'custom': return { startDate: customStartDate, endDate: customEndDate };
            default: startDate.setDate(endDate.getDate() - 28);
        }
        return { startDate, endDate };
    };

    const handleUploadClick = () => {
        const dateRange = calculateDateRange();
        onUpload({ dateRange });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Upload CSV Details</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Time Period for CSV</label>
                    <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} className="w-full p-2 border rounded">
                        <option value="7days">Last 7 days</option>
                        <option value="28days">Last 28 days</option>
                        <option value="3months">Last 3 months</option>
                        <option value="6months">Last 6 months</option>
                        <option value="12months">Last 12 months</option>
                        <option value="16months">Last 16 months</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>

                {timePeriod === 'custom' && (
                    <div className="flex gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                            <DatePicker selected={customStartDate} onChange={(date) => setCustomStartDate(date)} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                            <DatePicker selected={customEndDate} onChange={(date) => setCustomEndDate(date)} className="w-full p-2 border rounded" />
                        </div>
                    </div>
                )}
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="py-2 px-4 rounded bg-slate-200">Cancel</button>
                    <button onClick={handleUploadClick} className="py-2 px-4 bg-blue-600 text-white rounded">Confirm & Upload</button>
                </div>
            </div>
        </div>
    );
};

const ManageSnapshotsModal = ({ isOpen, onClose, snapshots, onDelete }) => {
    if (!isOpen) return null;
    const sortedSnapshots = [...snapshots].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Manage Snapshots</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200"><X size={20}/></button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                    {sortedSnapshots.map(snapshot => (
                        <div key={snapshot.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-semibold">{snapshot.fileName}</p>
                                <p className="text-sm text-slate-500">Uploaded: {new Date(snapshot.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => onDelete(snapshot.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Delete Snapshot"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, currentApiKey, onSave }) => {
    const [key, setKey] = useState('');
    useEffect(() => {
        if(isOpen) setKey(currentApiKey || '');
    }, [isOpen, currentApiKey]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Settings</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="apiKey">Gemini API Key</label>
                    <input id="apiKey" type="password" value={key} onChange={e => setKey(e.target.value)} className="w-full p-2 border rounded" placeholder="Enter your API key"/>
                    <p className="text-xs text-slate-500 mt-1">Your key is stored securely per workspace.</p>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="py-2 px-4 rounded">Cancel</button>
                    <button onClick={() => { onSave(key); onClose(); }} className="py-2 px-4 bg-blue-600 text-white rounded">Save</button>
                </div>
            </div>
        </div>
    );
};

const SummaryDisplay = ({ summary }) => {
    if(!summary) return null;
    return (
        <div className="my-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-sm font-semibold text-slate-500">Total Impressions</h3><p className="text-3xl font-bold">{summary.totalImpressions?.toLocaleString() || 'N/A'}</p></div>
                <div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-sm font-semibold text-slate-500">Total Clicks</h3><p className="text-3xl font-bold">{summary.totalClicks?.toLocaleString() || 'N/A'}</p></div>
                <div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-sm font-semibold text-slate-500">Average CTR</h3><p className="text-3xl font-bold">{summary.averageCtr || 'N/A'}</p></div>
            </div>
            {summary.trendAnalysis && <div className="bg-white p-4 rounded-lg shadow border">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><TrendingUp size={20}/> Trend Analysis</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">{summary.trendAnalysis?.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Lightbulb size={20}/> Key Insights</h3><ul className="list-disc pl-5 space-y-1 text-slate-700">{summary.keyInsights?.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                <div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-lg font-bold mb-2 flex items-center gap-2"><CheckSquare size={20}/> Recommendations</h3><ul className="list-disc pl-5 space-y-1 text-slate-700">{summary.recommendations?.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
            </div>
            {summary.opportunityPages && summary.opportunityPages.length > 0 && (<div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-lg font-bold mb-2">Top Opportunities</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="p-2">Page</th><th className="p-2">Reasoning</th></tr></thead><tbody>{summary.opportunityPages.map((page, i) => <tr key={i} className="border-t"><td className="p-2 text-blue-600 font-medium">{page.page}</td><td className="p-2 text-slate-600">{page.reasoning}</td></tr>)}</tbody></table></div></div>)}
        </div>
    )
};


export default App;
