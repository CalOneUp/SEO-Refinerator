import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Loader, AlertCircle, UploadCloud, Search, ArrowUpDown, RefreshCw, Settings, Share2, Copy, BarChart2, Lightbulb, CheckSquare, LogOut, Mail, KeyRound, BookText, Wand2, History, TrendingUp } from 'lucide-react';
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
    query
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

// --- Main App Component ---
const App = () => {
    const { db, auth, user, isAuthReady, error: coreError, apiKey } = useAppCore();
    const [snapshots, setSnapshots] = useState([]);
    const [activeSnapshotId, setActiveSnapshotId] = useState(null);
    const [sharedSnapshotData, setSharedSnapshotData] = useState(null);

    // New state for SEO Experiments
    const [seoExperiments, setSeoExperiments] = useState([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);

    const [fetchingMetadata, setFetchingMetadata] = useState({});
    const [isBulkFetching, setIsBulkFetching] = useState(false);
    const [bulkFetchProgress, setBulkFetchProgress] = useState({ current: 0, total: 0 });

    const [uiError, setUiError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'Impressions', direction: 'descending' });
    const [fileName, setFileName] = useState('');

    const [knowledgeBaseItems, setKnowledgeBaseItems] = useState([]);
    const [isUploadingKnowledgeBase, setIsUploadingKnowledgeBase] = useState(false);

    const [isSuggestingMeta, setIsSuggestingMeta] = useState({});

    const [showOnlyOpportunities, setShowOnlyOpportunities] = useState(false);

    const [changelogItems, setChangelogItems] = useState([
        {
            id: 'v1.1.1',
            version: '1.1.1',
            timestamp: '2025-07-11T10:00:00.000Z',
            changes: [
                {type: "Bug Fix", description: "Fixed a critical build error caused by a misplaced React Hook in the Changelog modal."},
            ]
        },
        {
            id: 'v1.1.0',
            version: '1.1.0',
            timestamp: '2025-07-11T09:00:00.000Z',
            changes: [
                {type: "New Feature", description: "Introduced 'Pre-Post Analysis' for SEO experiments to track metadata changes over time."},
                {type: "New Feature", description: "Added an 'SEO Experiments' dashboard to view running and completed tests."},
                {type: "Improvement", description: "Updated file upload process with a modal to specify GSC date ranges."},
                {type: "Improvement", description: "Date range selector now mimics Google Search Console options for better usability."}
            ]
        },
    ]);

    const isSharedView = !!sharedSnapshotData;
    const setError = (msg) => { setUiError(msg); setSuccessMessage(''); };
    const setSuccess = (msg) => { setSuccessMessage(msg); setUiError(null); };

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
        const unsubscribeSettings = onSnapshot(settingsDocRef, (doc) => {
            if (doc.exists()) setActiveSnapshotId(doc.data().activeSnapshotId || null);
        }, () => setError("Could not load saved settings."));
        
        const snapshotsColRef = collection(db, 'users', user.uid, 'snapshots');
        const qSnapshots = query(snapshotsColRef);
        const unsubscribeSnapshots = onSnapshot(qSnapshots, (querySnapshot) => {
            const fetchedSnapshots = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setSnapshots(fetchedSnapshots);
            if (!activeSnapshotId && fetchedSnapshots.length > 0) handleSetActiveSnapshot(fetchedSnapshots[0].id);
        }, () => setError("Could not load snapshot data."));
        
        const experimentsColRef = collection(db, 'users', user.uid, 'seoExperiments');
        const qExperiments = query(experimentsColRef);
        const unsubscribeExperiments = onSnapshot(qExperiments, (querySnapshot) => {
            const fetchedExperiments = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setSeoExperiments(fetchedExperiments);
        }, (err) => {
            setError("Could not load SEO experiments.");
            console.error("SEO experiments load error:", err);
        });
        
        const knowledgeBaseColRef = collection(db, 'users', user.uid, 'knowledgeBase');
        const qKnowledgeBase = query(knowledgeBaseColRef);
        const unsubscribeKnowledgeBase = onSnapshot(qKnowledgeBase, (querySnapshot) => {
            const fetchedItems = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setKnowledgeBaseItems(fetchedItems);
        }, (err) => {
            setError("Could not load knowledge base items.");
            console.error("Knowledge base load error:", err);
        });

        return () => {
            unsubscribeSettings();
            unsubscribeSnapshots();
            unsubscribeExperiments();
            unsubscribeKnowledgeBase();
        };
    }, [isAuthReady, db, user, activeSnapshotId, isSharedView, handleSetActiveSnapshot]);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.name.endsWith('.csv')) {
            setError("Please upload a valid CSV (.csv) file.");
            return;
        }
        setFileToUpload(file);
        setIsUploadModalOpen(true);
        event.target.value = '';
    };
    
    const handleFileUpload = async (uploadSettings) => {
        if (isSharedView || !fileToUpload) return;
        const { dateRange, experimentId } = uploadSettings;
        if (!dateRange.startDate || !dateRange.endDate) {
            setError("Please select a valid date range for the CSV.");
            return;
        }
        if (!db || !user?.uid) {
            setError("You must be signed in to upload a file.");
            return;
        }
        setFileName(fileToUpload.name);
        setSuccess("File processing started...");
        setError(null);
        setIsUploadModalOpen(false);

        try {
            await loadScript('https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js');
            window.Papa.parse(fileToUpload, {
                header: true, skipEmptyLines: true,
                complete: async (results) => {
                    const pageHeader = results.meta.fields.find(h => h.toLowerCase() === 'page' || h.toLowerCase() === 'top pages');
                    if (!results.data || !pageHeader) { setError("Invalid CSV format: 'Page' or 'Top pages' column not found."); return; }
                    const loadedPagesData = results.data.map(row => ({ Page: row[pageHeader], Clicks: Number(row.Clicks) || 0, Impressions: Number(row.Impressions) || 0, title: null, description: null })).filter(p => p.Page);
                    
                    const newSnapshotData = {
                        createdAt: new Date().toISOString(),
                        fileName: fileToUpload.name,
                        pages: loadedPagesData,
                        performanceSummary: null,
                        dateRange: {
                            start: dateRange.startDate.toISOString(),
                            end: dateRange.endDate.toISOString()
                        }
                    };
                    
                    const snapshotsColRef = collection(db, 'users', user.uid, 'snapshots');
                    const newDocRef = await addDoc(snapshotsColRef, newSnapshotData);
                    await handleSetActiveSnapshot(newDocRef.id);
                    setSuccess(`"${fileToUpload.name}" processed and saved successfully!`);
                    
                    if (experimentId) {
                        await confirmExperimentChange(experimentId, {id: newDocRef.id, ...newSnapshotData});
                    }
                },
                error: (err) => setError(`CSV Parsing Error: ${err.message}`)
            });
        } catch (err) { setError(err.message || "Failed to load or parse the file."); }
        finally { setFileToUpload(null); }
    };
    
    const handleKnowledgeBaseFileUpload = async (event) => {
        if (!db || !user?.uid) { setError("You must be signed in to upload a file."); return; }
        const file = event.target.files[0];
        if (!file || file.type !== 'application/pdf') { setError("Please upload a valid PDF (.pdf) file."); return; }
        setIsUploadingKnowledgeBase(true);
        setSuccess("Processing document...");
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Pdf = btoa(new Uint8Array(e.target.result).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                const contentsForExtraction = [{ role: "user", parts: [{ text: "Extract all text content from this document." }, { inlineData: { mimeType: 'application/pdf', data: base64Pdf } }] }];
                const extractedText = await callGemini("Extract text", { contents: contentsForExtraction });
                const summary = await callGemini(`Provide a concise summary of the key information from the following text:\n\n${extractedText.substring(0, 10000)}`, {});
                const knowledgeBaseColRef = collection(db, 'users', user.uid, 'knowledgeBase');
                await addDoc(knowledgeBaseColRef, { fileName: file.name, uploadedAt: new Date().toISOString(), extractedContent: extractedText, summary: summary });
                setSuccess(`"${file.name}" added to knowledge base!`);
            };
            reader.readAsArrayBuffer(file);
        } catch (err) { setError(err.message || "Error processing PDF."); }
        finally { setIsUploadingKnowledgeBase(false); event.target.value = ''; }
    };

    const callGemini = async (prompt, options) => {
        const geminiApiKey = apiKey || GEMINI_API_KEY;
        if (!geminiApiKey) throw new Error("Gemini API key is missing. Please add it in Settings.");
        let payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        if (options && options.contents) payload.contents = options.contents;
        if (options && options.generationConfig) payload.generationConfig = options.generationConfig;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API request failed: ${response.status} - ${errorBody.error?.message || 'Unknown error'}`);
        }
        const result = await response.json();
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) return result.candidates[0].content.parts[0].text;
        throw new Error("Invalid response from API.");
    };

    const generateAISummary = async () => {
        if (isSharedView || !activeSnapshot?.pages) { setError("No active data to analyze."); return; }
        setIsProcessing(true);
        setError(null);
        setSuccessMessage('');
        const schema = {type: "OBJECT", properties: {totalImpressions: { type: "NUMBER" }, totalClicks: { type: "NUMBER" }, totalPages: { type: "NUMBER" }, averageCtr: { type: "STRING" }, keyInsights: { type: "ARRAY", items: { type: "STRING" } }, recommendations: { type: "ARRAY", items: { type: "STRING" } }, opportunityPages: { type: "ARRAY", items: { type: "OBJECT", properties: { page: { type: "STRING" }, reasoning: { type: "STRING" } } } } }, required: ["totalImpressions", "totalClicks", "averageCtr", "keyInsights", "recommendations", "opportunityPages"]};
        try {
            const summaryPrompt = `Analyze the provided Google Search Console data. Calculate total impressions, total clicks, and average CTR. Identify 2-3 key insights, 2-3 actionable recommendations, and up to 10 optimization opportunity pages. Provide the response in the specified JSON format. Data sample: ${JSON.stringify(activeSnapshot.pages.slice(0, 100))}`;
            const summaryJsonString = await callGemini(summaryPrompt, { generationConfig: { responseMimeType: "application/json", responseSchema: schema } });
            const snapshotDocRef = doc(db, 'users', user.uid, 'snapshots', activeSnapshotId);
            await updateDoc(snapshotDocRef, { performanceSummary: summaryJsonString });
            setSuccess(`AI summary generated for ${activeSnapshot.fileName}!`);
        } catch (err) { setError(err.message || "Error during summary generation."); }
        finally { setIsProcessing(false); }
    };

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

    const handleFetchMetadata = async (pageUrl) => {
        if (isSharedView || fetchingMetadata[pageUrl]) return;
        setFetchingMetadata(prev => ({ ...prev, [pageUrl]: true }));
        const metadata = await fetchSinglePageMetadata(pageUrl);
        const currentActiveSnapshot = snapshots.find(s => s.id === activeSnapshotId);
        if (currentActiveSnapshot) {
            const updatedPages = currentActiveSnapshot.pages.map(p => p.Page === pageUrl ? { ...p, ...metadata } : p);
            const snapshotDocRef = doc(db, 'users', user.uid, 'snapshots', activeSnapshotId);
            await updateDoc(snapshotDocRef, { pages: updatedPages });
        }
        setFetchingMetadata(prev => ({ ...prev, [pageUrl]: false }));
    };

    const handleBulkFetchMetadata = async () => {
        if (isSharedView || !activeSnapshot?.pages) return;
        setIsBulkFetching(true);
        const pagesToFetch = activeSnapshot.pages.filter(p => !p.title);
        setBulkFetchProgress({ current: 0, total: pagesToFetch.length });
        let updatedPages = [...activeSnapshot.pages];
        for (let i = 0; i < pagesToFetch.length; i++) {
            const page = pagesToFetch[i];
            setBulkFetchProgress({ current: i + 1, total: pagesToFetch.length });
            const metadata = await fetchSinglePageMetadata(page.Page);
            updatedPages = updatedPages.map(p => p.Page === page.Page ? { ...p, ...metadata } : p);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        const snapshotDocRef = doc(db, 'users', user.uid, 'snapshots', activeSnapshotId);
        await updateDoc(snapshotDocRef, { pages: updatedPages });
        setIsBulkFetching(false);
        setSuccess("Successfully fetched all metadata!");
    };

    const suggestMetaData = useCallback(async (pageToUpdate) => {
        if (isSharedView || isSuggestingMeta[pageToUpdate.Page]) return;
        setIsSuggestingMeta(prev => ({ ...prev, [pageToUpdate.Page]: true }));
        try {
            const metaSuggestionSchema = { type: "OBJECT", properties: { title: { type: "STRING" }, description: { type: "STRING" }, reasoning: { type: "STRING" } }, required: ["title", "description", "reasoning"] };
            const metaPrompt = `Given the page URL: ${pageToUpdate.Page}, existing title: "${pageToUpdate.title || 'N/A'}", and description: "${pageToUpdate.description || 'N/A'}", suggest an optimized SEO title (max 60 chars), meta description (max 160 chars), and a brief explanation for the suggestions. Provide this in the specified JSON format.`;
            const suggestionsJsonString = await callGemini(metaPrompt, { generationConfig: { responseMimeType: "application/json", responseSchema: metaSuggestionSchema } });
            const suggestions = JSON.parse(suggestionsJsonString);
            const currentActiveSnapshot = snapshots.find(s => s.id === activeSnapshotId);
            if (currentActiveSnapshot) {
                const updatedPages = currentActiveSnapshot.pages.map(p => p.Page === pageToUpdate.Page ? { ...p, suggestedTitle: suggestions.title, suggestedDescription: suggestions.description, suggestedReasoning: suggestions.reasoning } : p);
                const snapshotDocRef = doc(db, 'users', user.uid, 'snapshots', activeSnapshotId);
                await updateDoc(snapshotDocRef, { pages: updatedPages });
                setSuccess(`New meta data suggested for "${pageToUpdate.Page}"!`);
            }
        } catch (err) { setError(err.message || `Error suggesting meta data.`); }
        finally { setIsSuggestingMeta(prev => ({ ...prev, [pageToUpdate.Page]: false })); }
    }, [isSharedView, db, user?.uid, isSuggestingMeta, activeSnapshotId, snapshots, apiKey]);

    const startExperiment = async (page) => {
        if (!activeSnapshot || !activeSnapshot.dateRange) {
            setError("The active snapshot must have a date range to start an experiment.");
            return;
        }
        const experimentData = {
            pageUrl: page.Page,
            status: "running",
            startDate: new Date().toISOString(),
            before: {
                snapshotId: activeSnapshotId,
                title: page.title || 'N/A',
                description: page.description || 'N/A',
                impressions: page.Impressions,
                clicks: page.Clicks,
                ctr: page.Impressions > 0 ? (page.Clicks / page.Impressions * 100).toFixed(2) + '%' : '0%',
                dateRange: activeSnapshot.dateRange
            }
        };
        try {
            const experimentsColRef = collection(db, 'users', user.uid, 'seoExperiments');
            await addDoc(experimentsColRef, experimentData);
            setSuccess(`Experiment started for ${page.Page}. Update the page in your CMS, then upload a new CSV to see the results.`);
        } catch (err) { setError("Could not start the experiment. " + err.message); }
    };
    
    const confirmExperimentChange = async (experimentId, newSnapshot) => {
        const experimentRef = doc(db, 'users', user.uid, 'seoExperiments', experimentId);
        const experimentDoc = await getDoc(experimentRef);
        if (!experimentDoc.exists()) { setError("Could not find the experiment to update."); return; }
        const experiment = experimentDoc.data();
        const pageUrl = experiment.pageUrl;
        const liveMetadata = await fetchSinglePageMetadata(pageUrl);
        const newPageData = newSnapshot.pages.find(p => p.Page === pageUrl);
        if (!newPageData) { setError(`Could not find the page ${pageUrl} in the new CSV. The experiment cannot be completed.`); return; }
        const afterData = {
            snapshotId: newSnapshot.id,
            title: liveMetadata.title,
            description: liveMetadata.description,
            impressions: newPageData.Impressions,
            clicks: newPageData.Clicks,
            ctr: newPageData.Impressions > 0 ? (newPageData.Clicks / newPageData.Impressions * 100).toFixed(2) + '%' : '0%',
            dateRange: newSnapshot.dateRange
        };
        try {
            await updateDoc(experimentRef, { status: "completed", endDate: new Date().toISOString(), after: afterData });
            setSuccess(`Experiment for ${pageUrl} has been completed! Check the dashboard for results.`);
        } catch (err) { setError("Failed to update experiment. " + err.message); }
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
    
    const requestSort = (key) => {
        const direction = (sortConfig.key === key && sortConfig.direction === 'descending') ? 'ascending' : 'descending';
        setSortConfig({ key, direction });
    };

    // --- Components ---
    const UploadModal = ({ isOpen, onClose, onUpload, pendingExperiments }) => {
        const [timePeriod, setTimePeriod] = useState('28days');
        const [customStartDate, setCustomStartDate] = useState(null);
        const [customEndDate, setCustomEndDate] = useState(new Date());
        const [selectedExperiment, setSelectedExperiment] = useState('');

        useEffect(() => {
            if(isOpen){
                setTimePeriod('28days');
                setCustomStartDate(null);
                setCustomEndDate(new Date());
                setSelectedExperiment('');
            }
        }, [isOpen]);

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
            if (timePeriod === 'custom' && (!dateRange.startDate || !dateRange.endDate)) {
                alert("Please select both a start and end date for the custom range.");
                return;
            }
            onUpload({ dateRange, experimentId: selectedExperiment });
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
                        <p className="text-xs text-slate-500 mt-1">For experiments, a 28-day or 3-month period is recommended.</p>
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

                    {pendingExperiments.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Is this upload for a running experiment?</label>
                            <select value={selectedExperiment} onChange={(e) => setSelectedExperiment(e.target.value)} className="w-full p-2 border rounded">
                                <option value="">No, this is a new snapshot</option>
                                {pendingExperiments.map(exp => <option key={exp.id} value={exp.id}>{exp.pageUrl}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={onClose} className="py-2 px-4 rounded bg-slate-200 hover:bg-slate-300">Cancel</button>
                        <button onClick={handleUploadClick} className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">Confirm & Upload</button>
                    </div>
                </div>
            </div>
        );
    };
    
    const ExperimentsDashboard = ({ experiments }) => {
        const runningExperiments = experiments.filter(e => e.status === 'running');
        const completedExperiments = experiments.filter(e => e.status === 'completed').sort((a,b) => new Date(b.endDate) - new Date(a.endDate));

        const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
        const formatRange = (range) => (range && range.start && range.end) ? `${formatDate(range.start)} - ${formatDate(range.end)}` : 'N/A';

        return (
            <div className="bg-white rounded-2xl shadow-lg border p-6">
                <h2 className="text-2xl font-bold mb-4">SEO Experiments</h2>
                <div>
                    <h3 className="text-xl font-semibold mb-2">Running Experiments ({runningExperiments.length})</h3>
                    {runningExperiments.length > 0 ? (
                        <div className="space-y-4">
                            {runningExperiments.map(exp => (
                                <div key={exp.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="font-semibold text-blue-800">{exp.pageUrl}</p>
                                    <p className="text-sm text-slate-600">Started on: {formatDate(exp.startDate)}</p>
                                    <p className="text-sm text-slate-600 mt-2">To complete, update the page in your CMS, then upload a new GSC export and select this experiment from the upload modal.</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-slate-500">No experiments are currently running. Start one from the pages list below!</p>}
                </div>
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-2">Completed Experiments ({completedExperiments.length})</h3>
                    {completedExperiments.length > 0 ? (
                        <div className="space-y-4">
                            {completedExperiments.map(exp => {
                                const beforeCtr = parseFloat(exp.before.ctr);
                                const afterCtr = parseFloat(exp.after.ctr);
                                const ctrChange = (afterCtr - beforeCtr).toFixed(2);
                                const isPositive = ctrChange >= 0;

                                return (
                                    <div key={exp.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <p className="font-semibold text-slate-800 break-all">{exp.pageUrl}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                            <div className="p-3 bg-white rounded border">
                                                <h4 className="font-bold text-sm">Before ({formatRange(exp.before.dateRange)})</h4>
                                                <p className="text-xs mt-1 truncate" title={exp.before.title}><strong>Title:</strong> {exp.before.title}</p>
                                                <p className="text-xs mt-2"><strong>Clicks:</strong> {exp.before.clicks?.toLocaleString()}</p>
                                                <p className="text-xs"><strong>Impressions:</strong> {exp.before.impressions?.toLocaleString()}</p>
                                                <p className="text-sm font-semibold mt-1"><strong>CTR:</strong> {exp.before.ctr}</p>
                                            </div>
                                            <div className="p-3 bg-white rounded border">
                                                <h4 className="font-bold text-sm">After ({formatRange(exp.after.dateRange)})</h4>
                                                <p className="text-xs mt-1 truncate" title={exp.after.title}><strong>Title:</strong> {exp.after.title}</p>
                                                <p className="text-xs mt-2"><strong>Clicks:</strong> {exp.after.clicks?.toLocaleString()}</p>
                                                <p className="text-xs"><strong>Impressions:</strong> {exp.after.impressions?.toLocaleString()}</p>
                                                <p className="text-sm font-semibold mt-1"><strong>CTR:</strong> {exp.after.ctr}</p>
                                            </div>
                                            <div className={`p-3 rounded flex flex-col justify-center items-center ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                                                <h4 className="font-bold text-sm">Result</h4>
                                                <p className={`text-3xl font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>{isPositive ? '+' : ''}{ctrChange}%</p>
                                                <p className="text-sm">CTR Change</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : <p className="text-slate-500">No experiments have been completed yet.</p>}
                </div>
            </div>
        );
    }

    const SettingsModal = ({ isOpen, onClose, currentApiKey, onSave, knowledgeBaseItems, handleKnowledgeBaseFileUpload, isUploadingKnowledgeBase }) => {
        const [key, setKey] = useState('');
        const [activeTab, setActiveTab] = useState('api');

        useEffect(() => { if(isOpen) setKey(currentApiKey || ''); }, [isOpen, currentApiKey]); 
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
                <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">Settings</h2>
                    <div className="flex border-b border-slate-200 mb-4">
                        <button className={`px-4 py-2 text-sm font-medium ${activeTab === 'api' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('api')}>API Settings</button>
                        <button className={`px-4 py-2 text-sm font-medium ${activeTab === 'knowledgeBase' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('knowledgeBase')}>Knowledge Base</button>
                    </div>
                    {activeTab === 'api' && (<>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="apiKey">Gemini API Key</label>
                            <input id="apiKey" type="password" value={key} onChange={e => setKey(e.target.value)} className="w-full p-2 border rounded" placeholder="Enter your API key"/>
                            <p className="text-xs text-slate-500 mt-1">Your key is stored securely and only used for your requests.</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={onClose} className="py-2 px-4 rounded">Cancel</button>
                            <button onClick={() => { onSave(key); onClose(); }} className="py-2 px-4 bg-blue-600 text-white rounded">Save</button>
                        </div>
                    </>)}
                    {activeTab === 'knowledgeBase' && (<div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Upload Document</h3>
                            <label htmlFor="kb-upload-modal" className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                <BookText className={`w-10 h-10 mb-2 ${isUploadingKnowledgeBase ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                                <span className={`font-semibold ${isUploadingKnowledgeBase ? 'text-blue-600' : 'text-purple-600'}`}>{isUploadingKnowledgeBase ? 'Processing...' : 'Click to upload PDF (max 20MB)'}</span>
                            </label>
                            <input id="kb-upload-modal" type="file" accept=".pdf" className="hidden" onChange={handleKnowledgeBaseFileUpload} disabled={isUploadingKnowledgeBase} />
                        </div>
                        {knowledgeBaseItems.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-3">Your Documents ({knowledgeBaseItems.length})</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">{knowledgeBaseItems.map(item => (
                                    <div key={item.id} className="p-3 bg-slate-50 rounded-lg border"><p className="font-semibold text-blue-700">{item.fileName}</p></div>
                                ))}</div>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="py-2 px-4 rounded bg-slate-200 hover:bg-slate-300">Close</button></div>
                    </div>)}
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

    const ChangelogModal = ({ isOpen, onClose, changelogItems }) => {
        const sortedChangelogItems = useMemo(() => [...changelogItems].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)), [changelogItems]);
        
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
                <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">Changelog <History size={20} className="inline-block ml-2"/></h2>
                    <div className="max-h-96 overflow-y-auto pr-2">
                        {sortedChangelogItems.map((entry) => (
                            <div key={entry.id} className="border-b border-slate-200 pb-3 mb-3">
                                <p className="text-sm font-semibold text-slate-800">{entry.version} - {new Date(entry.timestamp).toLocaleDateString()}</p>
                                <ul className="list-disc pl-5 text-slate-700 mt-1">{entry.changes.map((change, idx) => (
                                    <li key={idx}><span className={`font-medium ${change.type === 'New Feature' ? 'text-green-600' : change.type === 'Bug Fix' ? 'text-red-600' : 'text-blue-600'}`}>[{change.type}]</span> {change.description}</li>
                                ))}</ul>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end mt-4"><button onClick={onClose} className="py-2 px-4 rounded bg-slate-200 hover:bg-slate-300">Close</button></div>
                </div>
            </div>
        );
    };

    const SummaryDisplay = ({ summary }) => {
        if(!summary) return null;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-sm font-semibold text-slate-500">Total Impressions</h3><p className="text-3xl font-bold">{summary.totalImpressions?.toLocaleString() || 'N/A'}</p></div>
                    <div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-sm font-semibold text-slate-500">Total Clicks</h3><p className="text-3xl font-bold">{summary.totalClicks?.toLocaleString() || 'N/A'}</p></div>
                    <div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-sm font-semibold text-slate-500">Average CTR</h3><p className="text-3xl font-bold">{summary.averageCtr || 'N/A'}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-lg font-bold mb-2">Key Insights</h3><ul className="list-disc pl-5 space-y-1 text-slate-700">{summary.keyInsights?.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                    <div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-lg font-bold mb-2">Recommendations</h3><ul className="list-disc pl-5 space-y-1 text-slate-700">{summary.recommendations?.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                </div>
                 {summary.opportunityPages && summary.opportunityPages.length > 0 && (<div className="bg-white p-4 rounded-lg shadow border"><h3 className="text-lg font-bold mb-2">Top Opportunities</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="p-2">Page</th><th className="p-2">Reasoning</th></tr></thead><tbody>{summary.opportunityPages.map((page, i) => <tr key={i} className="border-t"><td className="p-2 text-blue-600 font-medium">{page.page}</td><td className="p-2 text-slate-600">{page.reasoning}</td></tr>)}</tbody></table></div></div>)}
            </div>
        )
    }

    if (!isAuthReady) return <div className="bg-slate-50 min-h-screen flex items-center justify-center"><Loader className="animate-spin w-12 h-12 text-blue-600" /></div>;
    
    if (!user && !isSharedView) return <AuthScreen auth={auth} />;

    return (
        <>
            <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleFileUpload} pendingExperiments={seoExperiments.filter(e => e.status === 'running')} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={(key) => {if(db && user?.uid) setDoc(doc(db, 'users', user.uid, 'settings', 'apiSettings'), { apiKey: key }, { merge: true });}} currentApiKey={apiKey} knowledgeBaseItems={knowledgeBaseItems} handleKnowledgeBaseFileUpload={handleKnowledgeBaseFileUpload} isUploadingKnowledgeBase={isUploadingKnowledgeBase} />
            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} snapshotId={activeSnapshotId} />
            <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} changelogItems={changelogItems} />
            
            <div className="bg-slate-50 min-h-screen font-sans text-slate-800 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-6">
                        <div className="flex justify-between items-center">
                            <div className="w-24"></div>
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">SEO Performance Analyzer</h1>
                            <div className="w-24 flex justify-end items-center gap-2">
                                {user && !isSharedView && <>
                                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-200 rounded-full" title="Settings"><Settings size={20}/></button>
                                    <button onClick={() => setIsChangelogOpen(true)} className="p-2 hover:bg-slate-200 rounded-full" title="Changelog"><History size={20}/></button>
                                    <button onClick={handleSignOut} className="p-2 hover:bg-slate-200 rounded-full" title="Sign Out"><LogOut size={20}/></button>
                                </>}
                            </div>
                        </div>
                    </header>
                    
                    {!isSharedView && (
                         <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 mb-8 max-w-3xl mx-auto">
                            <label htmlFor="csv-upload" className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                <UploadCloud className={`w-12 h-12 mb-2 ${fileToUpload ? 'text-blue-500' : 'text-slate-400'}`} />
                                <span className={`font-semibold ${fileToUpload ? 'text-blue-600' : 'text-slate-600'}`}>{fileToUpload ? `Ready to upload: ${fileToUpload.name}` : 'Click to upload CSV file'}</span>
                                <span className="text-sm text-slate-500 mt-1">GSC 'Pages' export (.csv format)</span>
                            </label>
                            <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                        </div>
                    )}
                    
                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-6 rounded-lg max-w-3xl mx-auto flex items-center gap-3"><AlertCircle size={20} />{error}</div>}
                    {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-6 rounded-lg max-w-3xl mx-auto">{successMessage}</div>}

                    {snapshots.length > 0 && !isSharedView && 
                        <div className="mb-6 max-w-3xl mx-auto flex items-end gap-4">
                            <div><label htmlFor="snapshot-select" className="block text-sm font-medium text-slate-700 mb-1">Select Analysis Snapshot:</label><select id="snapshot-select" value={activeSnapshotId || ''} onChange={(e) => handleSetActiveSnapshot(e.target.value)} className="w-full max-w-xs p-2 border border-slate-300 rounded-lg">{snapshots.map(s => <option key={s.id} value={s.id}>{s.fileName} ({new Date(s.createdAt).toLocaleDateString()})</option>)}</select></div>
                            <button onClick={() => setIsShareModalOpen(true)} className="p-2 bg-white border rounded-lg hover:bg-slate-100" title="Share Snapshot"><Share2 size={20}/></button>
                        </div>
                    }
                    
                    {activeSnapshot && !isSharedView && !parsedSummary && (
                        <div className="text-center mb-8"><button onClick={generateAISummary} disabled={isProcessing} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-slate-400">
                            {isProcessing ? <><Loader size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16}/> Generate AI Summary</>}
                        </button></div>
                    )}

                    {isProcessing && <div className="text-center mb-8"><Loader className="animate-spin w-10 h-10 mx-auto text-blue-600" /></div>}
                    {parsedSummary && !isProcessing && <div className="mb-8"><SummaryDisplay summary={parsedSummary} /></div>}

                    <div className="my-8"><ExperimentsDashboard experiments={seoExperiments} /></div>
                    
                    {activeSnapshot && sortedAndFilteredPages.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden mt-8">
                            <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="relative flex-grow w-full md:w-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Search by page URL..." onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-lg"/></div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="showOpportunities" checked={showOnlyOpportunities} onChange={(e) => setShowOnlyOpportunities(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                                    <label htmlFor="showOpportunities" className="text-sm font-medium text-slate-700">Show only Top Opportunities</label>
                                </div>
                                {!isSharedView && <button onClick={handleBulkFetchMetadata} disabled={isBulkFetching} className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400">
                                    {isBulkFetching ? <><Loader size={16} className="animate-spin" /> Fetching {bulkFetchProgress.current}/{bulkFetchProgress.total}</> : <><RefreshCw size={16} /> Fetch All Metadata</>}
                                </button>}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 font-bold">Page & Metadata</th>
                                            <th scope="col" className="px-6 py-3 font-bold cursor-pointer" onClick={() => requestSort('Impressions')}>Impressions <ArrowUpDown size={14} className="inline ml-1"/></th>
                                            <th scope="col" className="px-6 py-3 font-bold cursor-pointer" onClick={() => requestSort('Clicks')}>Clicks <ArrowUpDown size={14} className="inline ml-1"/></th>
                                            <th scope="col" className="px-6 py-3 font-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>{sortedAndFilteredPages.map((page) => <tr key={page.Page} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            {page.isTopOpportunity && <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 mb-1">Top Opportunity</span>}
                                            <a href={page.Page} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline break-all">{page.Page}</a>
                                            <div className="mt-2 p-2 bg-slate-50 rounded">
                                                {page.title ? <><p className="font-semibold text-xs text-slate-800">{page.title}</p><p className="text-xs text-slate-500 mt-1">{page.description}</p></> : 
                                                <button onClick={() => handleFetchMetadata(page.Page)} disabled={fetchingMetadata[page.Page] || isSharedView} className="text-xs text-blue-600 hover:underline disabled:text-slate-400">
                                                    {fetchingMetadata[page.Page] ? <><Loader size={12} className="animate-spin" /> Fetching...</> : <> <RefreshCw size={12} /> Fetch Info</>}
                                                </button>}
                                                {page.suggestedTitle && <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                                                    <p className="font-semibold text-xs text-purple-800">Suggested Meta:</p>
                                                    <p className="text-xs text-purple-700">Title: {page.suggestedTitle}</p>
                                                    <p className="text-xs text-purple-700">Description: {page.suggestedDescription}</p>
                                                    {page.suggestedReasoning && <p className="text-xs text-purple-600 mt-1">Reasoning: {page.suggestedReasoning}</p>}
                                                </div>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{(page.Impressions || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4">{(page.Clicks || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            {!isSharedView && (
                                                <div className="flex flex-col items-start gap-2">
                                                    <button onClick={() => suggestMetaData(page)} disabled={isSuggestingMeta[page.Page]} className="inline-flex items-center justify-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition disabled:opacity-50 text-xs w-full">
                                                        {isSuggestingMeta[page.Page] ? <Loader size={12} className="animate-spin" /> : <Wand2 size={12} />} Suggest Meta
                                                    </button>
                                                    <button onClick={() => startExperiment(page)} disabled={!activeSnapshot.dateRange || seoExperiments.some(e => e.pageUrl === page.Page && e.status === 'running')} className="inline-flex items-center justify-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition disabled:opacity-50 text-xs w-full">
                                                        <TrendingUp size={12} /> Track Change
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>)}</tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default App;
