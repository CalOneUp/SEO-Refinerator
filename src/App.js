import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Loader, AlertCircle, UploadCloud, Search, ArrowUpDown, RefreshCw, Settings, Share2, Copy, BarChart2, Lightbulb, CheckSquare, LogOut, Mail, KeyRound } from 'lucide-react';

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
    query
} from 'firebase/firestore';

// --- Firebase Configuration ---
// This configuration is now hardcoded to make the app deployable.
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

// --- Custom Hook for Core State & Firebase ---
const useAppCore = () => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [error, setError] = useState(null);
    const [apiKey, setApiKey] = useState(null);

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            setAuth(authInstance);
            setDb(getFirestore(app));

            onAuthStateChanged(authInstance, (user) => {
                setUser(user);
                setIsAuthReady(true);
            });
        } catch (e) {
            setError("Could not connect to the backend service.");
            setIsAuthReady(true);
        }
    }, []);

    useEffect(() => {
        if (!user || !db) return;
        const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'apiSettings');
        const unsubscribe = onSnapshot(settingsDocRef, (doc) => {
            if (doc.exists() && doc.data().apiKey) {
                setApiKey(doc.data().apiKey);
            } else {
                setApiKey(null);
            }
        }, (err) => {
            console.error("Could not load API key settings. This is likely a Firestore security rule issue.", err);
        });
        return () => unsubscribe();
    }, [user, db]);
    
    return { db, auth, user, isAuthReady, error, apiKey };
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
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">SEO Performance Analyzer</h1>
                    <p className="text-slate-600">{isSignUp ? 'Create an account to get started.' : 'Sign in to your account.'}</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg border">
                    <form onSubmit={handleEmailAuth}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 pr-3 py-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Password</label>
                             <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
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
                        <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.637 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
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


// --- Main App Component ---
const App = () => {
    const { db, auth, user, isAuthReady, error: coreError, apiKey } = useAppCore();
    const [snapshots, setSnapshots] = useState([]);
    const [activeSnapshotId, setActiveSnapshotId] = useState(null);
    const [sharedSnapshotData, setSharedSnapshotData] = useState(null);
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const [fetchingMetadata, setFetchingMetadata] = useState({});
    const [isBulkFetching, setIsBulkFetching] = useState(false);
    const [bulkFetchProgress, setBulkFetchProgress] = useState({ current: 0, total: 0 });
    
    const [uiError, setUiError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'Impressions', direction: 'descending' });
    const [fileName, setFileName] = useState('');
    
    const isSharedView = !!sharedSnapshotData;
    const setError = (msg) => { setUiError(msg); setSuccessMessage(''); };
    
    const calculatedActiveSnapshot = useMemo(() => snapshots.find(s => s.id === activeSnapshotId), [snapshots, activeSnapshotId]);
    const activeSnapshot = isSharedView ? sharedSnapshotData : calculatedActiveSnapshot;
    const error = uiError || coreError;
    
    const handleSignOut = () => { signOut(auth); };

    const handleSetActiveSnapshot = useCallback(async (id) => {
        if (isSharedView || !db || !user?.uid) return;
        const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
        try {
            await setDoc(settingsDocRef, { activeSnapshotId: id }, { merge: true });
            setActiveSnapshotId(id);
        } catch (err) {
            setError("Could not switch snapshots.");
        }
    }, [isSharedView, db, user?.uid]);

    // --- Data Fetching and Initialization ---
    useEffect(() => {
        const shareId = new URLSearchParams(window.location.search).get('share');
        if (shareId && db) {
            const fetchShared = async () => {
                const shareDocRef = doc(db, 'publicShares', shareId);
                const shareDoc = await getDoc(shareDocRef);
                if (shareDoc.exists()) {
                    const { ownerId, snapshotId } = shareDoc.data();
                    const snapshotDocRef = doc(db, 'users', ownerId, 'snapshots', snapshotId);
                    const snapshotDoc = await getDoc(snapshotDocRef);
                    if (snapshotDoc.exists()) setSharedSnapshotData({ id: snapshotDoc.id, ...snapshotDoc.data() });
                    else setError("The shared snapshot could not be found.");
                } else setError("This share link is invalid or has been removed.");
            };
            fetchShared();
        }
    }, [db]);


    useEffect(() => {
        if (!isAuthReady || !db || !user?.uid || isSharedView) return;
        const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'userSettings');
        const unsubscribe = onSnapshot(settingsDocRef, (doc) => {
            if (doc.exists()) setActiveSnapshotId(doc.data().activeSnapshotId || null);
        }, () => setError("Could not load saved settings."));
        return () => unsubscribe();
    }, [isAuthReady, db, user, isSharedView]);

    useEffect(() => {
        if (!isAuthReady || !db || !user?.uid || isSharedView) return;
        const snapshotsColRef = collection(db, 'users', user.uid, 'snapshots');
        const q = query(snapshotsColRef);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedSnapshots = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setSnapshots(fetchedSnapshots);
            if (!activeSnapshotId && fetchedSnapshots.length > 0) handleSetActiveSnapshot(fetchedSnapshots[0].id);
        }, () => setError("Could not load snapshot data."));
        return () => unsubscribe();
    }, [isAuthReady, db, user, activeSnapshotId, isSharedView, handleSetActiveSnapshot]);


    // --- Core Application Logic ---
    const handleFileUpload = async (event) => {
        if(isSharedView) return;
        const file = event.target.files[0];
        if (!file || !file.name.endsWith('.csv')) { setError("Please upload a valid CSV (.csv) file."); return; }
        if (!db || !user?.uid) { setError("You must be signed in to upload a file."); return; }
        setFileName(file.name);
        setSuccessMessage('');
        setError(null);
        try {
            await loadScript('https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js');
            window.Papa.parse(file, {
                header: true, skipEmptyLines: true,
                complete: async (results) => {
                    const pageHeader = results.meta.fields.find(h => h.toLowerCase() === 'page' || h.toLowerCase() === 'top pages');
                    if (!results.data || !pageHeader) { setError("Invalid CSV format: 'Page' or 'Top pages' column not found."); return; }
                    const loadedPagesData = results.data.map(row => ({ Page: row[pageHeader], Clicks: Number(row.Clicks) || 0, Impressions: Number(row.Impressions) || 0, title: null, description: null })).filter(p => p.Page);
                    const newSnapshotData = { createdAt: new Date().toISOString(), fileName: file.name, pages: loadedPagesData, performanceSummary: null };
                    const snapshotsColRef = collection(db, 'users', user.uid, 'snapshots');
                    const newDocRef = await addDoc(snapshotsColRef, newSnapshotData);
                    await handleSetActiveSnapshot(newDocRef.id);
                    setSuccessMessage("File processed and saved successfully!");
                },
                error: (err) => setError(`CSV Parsing Error: ${err.message}`)
            });
        } catch (err) { setError(err.message || "Failed to load or parse the file."); }
    };
    
    // --- API and Data Processing Logic ---
    const callGemini = async (prompt, generationConfig) => {
        const geminiApiKey = apiKey || GEMINI_API_KEY;
        if (!geminiApiKey) throw new Error("Gemini API key is missing. Please add it in Settings.");
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        const result = await response.json();
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) return result.candidates[0].content.parts[0].text;
        throw new Error("Invalid response from API.");
    };

    const generateAISummary = async () => {
        if (isSharedView || !activeSnapshot?.pages) { setError("No active data to analyze."); return; }
        setIsProcessing(true);
        setError(null);
        const schema = {type: "OBJECT", properties: {totalImpressions: { type: "NUMBER" }, totalClicks: { type: "NUMBER" }, averageCtr: { type: "STRING" }, keyInsights: { type: "ARRAY", items: { type: "STRING" } }, recommendations: { type: "ARRAY", items: { type: "STRING" } }, opportunityPages: { type: "ARRAY", items: { type: "OBJECT", properties: { page: { type: "STRING" }, reasoning: { type: "STRING" } } } } }, required: ["totalImpressions", "totalClicks", "averageCtr", "keyInsights", "recommendations", "opportunityPages"]};
        try {
            const summaryPrompt = `Analyze the provided Google Search Console data. From the data, calculate the total impressions, total clicks, and the average CTR (as a percentage string, e.g., '2.51%'). Identify 2-3 key insights and 2-3 actionable recommendations. Also, identify up to 5 pages with high impressions but low CTR that represent good optimization opportunities, providing a short reason for each. Provide the entire response in the specified JSON format. Data sample: ${JSON.stringify(activeSnapshot.pages.slice(0, 100))}`;
            const summaryJsonString = await callGemini(summaryPrompt, { responseMimeType: "application/json", responseSchema: schema });
            const snapshotDocRef = doc(db, 'users', user.uid, 'snapshots', activeSnapshotId);
            await updateDoc(snapshotDocRef, { performanceSummary: summaryJsonString });
            setSuccessMessage(`AI summary generated for ${activeSnapshot.fileName}!`);
        } catch (err) {
            setError(err.message || "Error during summary generation.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    // --- Metadata Fetching ---
    const fetchSinglePageMetadata = async (pageUrl) => {
        const proxies = [`https://corsproxy.io/?${encodeURIComponent(pageUrl)}`,`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(pageUrl)}`,`https://api.allorigins.win/raw?url=${encodeURIComponent(pageUrl)}`];
        for (const proxyUrl of proxies) {
            try {
                const response = await fetch(proxyUrl, { headers: { 'Origin': window.location.origin } });
                if (!response.ok) continue;
                const html = await response.text();
                if (!html || !html.toLowerCase().includes('<title>')) continue;
                const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
                const title = titleMatch ? titleMatch[1].trim() : 'No title found';
                const descriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
                const description = descriptionMatch ? descriptionMatch[1] : 'No description found.';
                if (title !== 'No title found' || description !== 'No description found.') return { title, description };
            } catch (err) { console.warn(`Proxy failed for ${pageUrl} with error:`, err); }
        }
        return { title: 'Fetch Error', description: 'Could not retrieve metadata.' };
    };

    const handleFetchMetadata = async (pageUrl, pageIndex) => {
        if (isSharedView || !pageUrl || fetchingMetadata[pageUrl]) return;
        setFetchingMetadata(prev => ({ ...prev, [pageUrl]: true }));
        setError(null);
        const metadata = await fetchSinglePageMetadata(pageUrl);
        const currentActiveSnapshot = snapshots.find(s => s.id === activeSnapshotId);
        if (currentActiveSnapshot) {
            const updatedPages = [...currentActiveSnapshot.pages];
            updatedPages[pageIndex] = { ...updatedPages[pageIndex], ...metadata };
            const snapshotDocRef = doc(db, 'users', user.uid, 'snapshots', activeSnapshotId);
            await updateDoc(snapshotDocRef, { pages: updatedPages });
        }
        setFetchingMetadata(prev => ({ ...prev, [pageUrl]: false }));
    };
    
    const handleBulkFetchMetadata = async () => {
        if (isSharedView) return;
        const currentActiveSnapshot = snapshots.find(s => s.id === activeSnapshotId);
        if (!currentActiveSnapshot?.pages) { setError("No pages to fetch metadata for."); return; }
        setIsBulkFetching(true);
        setError(null);
        const pagesToFetch = currentActiveSnapshot.pages.filter(p => !p.title);
        setBulkFetchProgress({ current: 0, total: pagesToFetch.length });
        let updatedPages = [...currentActiveSnapshot.pages];
        for (let i = 0; i < pagesToFetch.length; i++) {
            const page = pagesToFetch[i];
            const originalIndex = updatedPages.findIndex(p => p.Page === page.Page);
            setBulkFetchProgress({ current: i + 1, total: pagesToFetch.length });
            const metadata = await fetchSinglePageMetadata(page.Page);
            if(originalIndex !== -1) { updatedPages[originalIndex] = { ...updatedPages[originalIndex], ...metadata }; }
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        try {
            const snapshotDocRef = doc(db, 'users', user.uid, 'snapshots', activeSnapshotId);
            await updateDoc(snapshotDocRef, { pages: updatedPages });
            setSuccessMessage("Successfully fetched all metadata!");
        } catch (err) {
            setError("Failed to save updated metadata.");
        } finally {
            setIsBulkFetching(false);
        }
    };

    // --- Derived State & UI Components ---
    const parsedSummary = useMemo(() => {
        if (activeSnapshot?.performanceSummary) {
            try { return JSON.parse(activeSnapshot.performanceSummary); } catch (e) { return null; }
        }
        return null;
    }, [activeSnapshot]);

    const sortedAndFilteredPages = useMemo(() => {
        if (!activeSnapshot?.pages) return [];
        let sorted = [...activeSnapshot.pages];
        if (sortConfig.key) {
            sorted.sort((a, b) => {
                const valA = a[sortConfig.key] || 0; const valB = b[sortConfig.key] || 0;
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return searchTerm ? sorted.filter(p => p.Page?.toLowerCase().includes(searchTerm.toLowerCase())) : sorted;
    }, [activeSnapshot, searchTerm, sortConfig]);
    
    const requestSort = (key) => {
        const direction = (sortConfig.key === key && sortConfig.direction === 'descending') ? 'ascending' : 'descending';
        setSortConfig({ key, direction });
    };

    const SettingsModal = ({ isOpen, onClose, currentApiKey, onSave }) => {
        const [key, setKey] = useState('');
        useEffect(() => { if(isOpen) setKey(currentApiKey || '') }, [isOpen, currentApiKey]);
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
                <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">Settings</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="apiKey">Gemini API Key</label>
                        <input id="apiKey" type="password" value={key} onChange={e => setKey(e.target.value)} className="w-full p-2 border rounded" placeholder="Enter your API key"/>
                        <p className="text-xs text-slate-500 mt-1">Your key is stored securely and only used for your requests.</p>
                    </div>
                    <div className="flex justify-end gap-2"><button onClick={onClose} className="py-2 px-4 rounded">Cancel</button><button onClick={() => { onSave(key); onClose(); }} className="py-2 px-4 bg-blue-600 text-white rounded">Save</button></div>
                </div>
            </div>
        );
    };

    const ShareModal = ({ isOpen, onClose, snapshotId }) => {
        const [shareUrl, setShareUrl] = useState('');
        const [isCopied, setIsCopied] = useState(false);
        useEffect(() => {
            if (isOpen && snapshotId && user?.uid && db) {
                const generateLink = async () => {
                    const shareId = `share_${user.uid.substring(0, 4)}_${Date.now()}`;
                    const shareDocRef = doc(db, 'publicShares', shareId);
                    await setDoc(shareDocRef, { ownerId: user.uid, snapshotId });
                    setShareUrl(`${window.location.origin}${window.location.pathname}?share=${shareId}`);
                };
                generateLink();
            }
        }, [isOpen, snapshotId, user?.uid, db]);
        
        const copyToClipboard = () => { navigator.clipboard.writeText(shareUrl).then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }); };
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
                <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">Share Dashboard</h2>
                    {shareUrl ? <>
                        <p className="text-sm text-slate-600 mb-2">Anyone with this link can view a read-only version of this snapshot.</p>
                        <div className="flex items-center gap-2">
                            <input type="text" readOnly value={shareUrl} className="w-full p-2 border rounded bg-slate-100" />
                            <button onClick={copyToClipboard} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"><Copy size={16}/></button>
                        </div>
                        {isCopied && <p className="text-sm text-green-600 mt-2">Copied!</p>}
                    </> : <Loader className="animate-spin" />}
                     <div className="flex justify-end mt-4"><button onClick={onClose} className="py-2 px-4 rounded">Close</button></div>
                </div>
            </div>
        );
    };

    const SummaryDisplay = ({ summary }) => {
        if(!summary) return null;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-sm font-semibold text-slate-500 flex items-center gap-2"><BarChart2 size={14}/> Total Impressions</h3><p className="text-3xl font-bold">{summary.totalImpressions?.toLocaleString() || 'N/A'}</p></div><div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-sm font-semibold text-slate-500 flex items-center gap-2"><BarChart2 size={14}/> Total Clicks</h3><p className="text-3xl font-bold">{summary.totalClicks?.toLocaleString() || 'N/A'}</p></div><div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-sm font-semibold text-slate-500 flex items-center gap-2"><BarChart2 size={14}/> Average CTR</h3><p className="text-3xl font-bold">{summary.averageCtr || 'N/A'}</p></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-lg font-bold flex items-center gap-2 mb-2"><Lightbulb size={20}/> Key Insights</h3><ul className="list-disc pl-5 space-y-1 text-slate-700">{summary.keyInsights?.map((item, i) => <li key={i}>{item}</li>)}</ul></div><div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-lg font-bold flex items-center gap-2 mb-2"><CheckSquare size={20}/> Recommendations</h3><ul className="list-disc pl-5 space-y-1 text-slate-700">{summary.recommendations?.map((item, i) => <li key={i}>{item}</li>)}</ul></div></div>
                 {summary.opportunityPages && summary.opportunityPages.length > 0 && (<div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-lg font-bold mb-2">Top Opportunities</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left"><tr><th className="p-2">Page</th><th className="p-2">Reasoning</th></tr></thead><tbody>{summary.opportunityPages.map((page, i) => <tr key={i} className="border-t"><td className="p-2 text-blue-600 font-medium">{page.page}</td><td className="p-2 text-slate-600">{page.reasoning}</td></tr>)}</tbody></table></div></div>)}
            </div>
        )
    }

    if (!isAuthReady) return <div className="bg-slate-50 min-h-screen flex items-center justify-center"><Loader className="animate-spin w-12 h-12 text-blue-600" /></div>;
    
    if (!user && !isSharedView) return <AuthScreen auth={auth} />;

    return (
        <>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentApiKey={apiKey} onSave={(key) => {
                if(db && user?.uid) {
                    const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'apiSettings');
                    setDoc(settingsDocRef, { apiKey: key }, { merge: true });
                }
            }} />
            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} snapshotId={activeSnapshotId} />

            <div className="bg-slate-50 min-h-screen font-sans text-slate-800 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="text-center mb-6">
                        <div className="flex justify-between items-center">
                            <div className="w-24"></div>
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">SEO Performance Analyzer</h1>
                            <div className="w-24 flex justify-end items-center gap-2">
                                {user && !isSharedView && <>
                                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-200 rounded-full" title="Settings"><Settings size={20}/></button>
                                    <button onClick={handleSignOut} className="p-2 hover:bg-slate-200 rounded-full" title="Sign Out"><LogOut size={20}/></button>
                                </>}
                            </div>
                        </div>
                        {isSharedView ? 
                             <p className="text-slate-600 mt-2 text-lg">Viewing shared report: {activeSnapshot?.fileName || ''}</p> :
                             user && <p className="text-slate-600 mt-2 text-lg">Welcome, {user.displayName || user.email || 'User'}!</p>
                        }
                    </header>
                    
                    {!isSharedView && (
                         <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 mb-8 max-w-3xl mx-auto"><label htmlFor="csv-upload" className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition"><UploadCloud className={`w-12 h-12 mb-2 ${fileName ? 'text-green-500' : 'text-slate-400'}`} /><span className={`font-semibold ${fileName ? 'text-green-600' : 'text-blue-600'}`}>{fileName ? `Loaded: ${fileName}` : 'Click to upload CSV file'}</span><span className="text-sm text-slate-500 mt-1">GSC 'Pages' export (.csv format)</span></label><input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} /></div>
                    )}
                    
                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-6 rounded-lg max-w-3xl mx-auto flex items-center gap-3"><AlertCircle size={20} />{error}</div>}
                    {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-6 rounded-lg max-w-3xl mx-auto">{successMessage}</div>}

                    {snapshots.length > 0 && !isSharedView && 
                        <div className="mb-6 max-w-3xl mx-auto flex items-end gap-4">
                            <div><label htmlFor="snapshot-select" className="block text-sm font-medium text-slate-700 mb-1">Select Analysis Snapshot:</label><select id="snapshot-select" value={activeSnapshotId || ''} onChange={(e) => handleSetActiveSnapshot(e.target.value)} className="w-full max-w-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">{snapshots.map(s => <option key={s.id} value={s.id}>{s.fileName}</option>)}</select></div>
                            <button onClick={() => setIsShareModalOpen(true)} className="p-2 bg-white border rounded-lg hover:bg-slate-100" title="Share Snapshot"><Share2 size={20}/></button>
                        </div>
                    }
                    
                    {activeSnapshot && !isSharedView && (
                        <div className="text-center mb-8 flex justify-center items-center gap-4">
                           {!parsedSummary && (
                             <button onClick={generateAISummary} disabled={isProcessing} className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:bg-slate-400">
                                {isProcessing ? <><Loader size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16}/> Generate AI Summary</>}
                             </button>
                           )}
                        </div>
                    )}

                    {isProcessing && <div className="text-center mb-8"><Loader className="animate-spin w-10 h-10 mx-auto text-blue-600" /><p className="mt-4 text-slate-600 font-semibold">Generating AI Summary...</p></div>}
                    
                    {parsedSummary && !isProcessing && <div className="mb-8"><SummaryDisplay summary={parsedSummary} /></div>}
                    
                    {activeSnapshot && sortedAndFilteredPages.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden mt-8">
                            <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="relative flex-grow w-full md:w-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Search by page URL..." onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"/></div>
                                {!isSharedView && <button onClick={handleBulkFetchMetadata} disabled={isBulkFetching} className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:bg-slate-400 w-full md:w-auto">{isBulkFetching ? <><Loader size={16} className="animate-spin" /> {`Fetching... ${bulkFetchProgress.current} of ${bulkFetchProgress.total}`}</> : <><RefreshCw size={16} /> Fetch All Metadata</>}</button>}
                            </div>
                            <div className="md:hidden">{sortedAndFilteredPages.map((page, index) => <div key={`${page.Page}-${index}`} className="border-t border-slate-200 p-4"><a href={page.Page} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline break-all">{page.Page}</a><div className="flex justify-between mt-3 text-sm"><div><span className="font-semibold text-slate-600">Impressions:</span> {(page.Impressions || 0).toLocaleString()}</div><div><span className="font-semibold text-slate-600">Clicks:</span> {(page.Clicks || 0).toLocaleString()}</div></div><div className="mt-4 p-3 bg-slate-50 rounded-lg">{page.title || page.description ? <><p className="font-semibold text-sm text-slate-800">{page.title}</p><p className="text-xs text-slate-600 mt-1">{page.description}</p></> : <button onClick={() => handleFetchMetadata(page.Page, index)} disabled={fetchingMetadata[page.Page] || isSharedView} className="text-sm text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline inline-flex items-center gap-2">{fetchingMetadata[page.Page] ? <><Loader size={14} className="animate-spin" /> Fetching...</> : <> <RefreshCw size={14} /> Fetch Info </>}</button>}</div></div>)}</div>
                            <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left text-slate-500"><thead className="text-xs text-slate-700 uppercase bg-slate-50"><tr><th scope="col" className="px-6 py-3 font-bold">Page & Metadata</th><th scope="col" className="px-6 py-3 font-bold cursor-pointer" onClick={() => requestSort('Impressions')}>Impressions <ArrowUpDown size={14} className="inline ml-1"/></th><th scope="col" className="px-6 py-3 font-bold cursor-pointer" onClick={() => requestSort('Clicks')}>Clicks <ArrowUpDown size={14} className="inline ml-1"/></th></tr></thead><tbody>{sortedAndFilteredPages.map((page, index) => <tr key={`${page.Page}-${index}`} className="bg-white border-b hover:bg-slate-50"><td className="px-6 py-4"><a href={page.Page} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline break-all">{page.Page}</a><div className="mt-2 p-2 bg-slate-50 rounded">{page.title || page.description ? <><p className="font-semibold text-xs text-slate-800">{page.title}</p><p className="text-xs text-slate-500 mt-1">{page.description}</p></> : <button onClick={() => handleFetchMetadata(page.Page, index)} disabled={fetchingMetadata[page.Page] || isSharedView} className="text-xs text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline inline-flex items-center gap-1">{fetchingMetadata[page.Page] ? <><Loader size={12} className="animate-spin" /> Fetching...</> : <> <RefreshCw size={12} /> Fetch Info</>}</button>}</div></td><td className="px-6 py-4">{(page.Impressions || 0).toLocaleString()}</td><td className="px-6 py-4">{(page.Clicks || 0).toLocaleString()}</td></tr>)}</tbody></table></div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default App;
