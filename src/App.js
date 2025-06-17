import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Loader, AlertCircle, UploadCloud, Search, ArrowUpDown, RefreshCw, Settings, Share2, Copy, BarChart2, Lightbulb, CheckSquare, LogOut, Mail, KeyRound, BookText, Wand2, History } from 'lucide-react'; // Added History icon for changelog

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
    // Removed orderBy as it's not needed for static data
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
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isChangelogOpen, setIsChangelogOpen] = useState(false); // New state for Changelog Modal

    const [fetchingMetadata, setFetchingMetadata] = useState({});
    const [isBulkFetching, setIsBulkFetching] = useState(false);
    const [bulkFetchProgress, setBulkFetchProgress] = useState({ current: 0, total: 0 });
    
    const [uiError, setUiError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'Impressions', direction: 'descending' });
    const [fileName, setFileName] = useState('');

    // New state for Knowledge Base
    const [knowledgeBaseItems, setKnowledgeBaseItems] = useState([]);
    const [isUploadingKnowledgeBase, setIsUploadingKnowledgeBase] = useState(false);
    
    // State for Meta Data Suggestion
    const [isSuggestingMeta, setIsSuggestingMeta] = useState({}); // Stores loading state for each page by URL
    
    // New state for filtering by Top Opportunities
    const [showOnlyOpportunities, setShowOnlyOpportunities] = useState(false);

    // Initial Changelog Data (Static)
    // Note: This changelog will be updated directly in the code by the model.
    const [changelogItems, setChangelogItems] = useState([
        {
            id: 'v1.0.4', // New version ID
            version: '1.0.4',
            timestamp: '2025-06-17T' + new Date().toTimeString().split(' ')[0] + ':00Z', // Current timestamp
            changes: [
                {type: "Bug Fix", description: "Resolved `SyntaxError: Unexpected token` due to plain text/Markdown block accidentally placed in `App.js` code."}
            ]
        },
        {
            id: 'v1.0.3', 
            version: '1.0.3',
            timestamp: '2025-06-17T16:30:00.000Z', 
            changes: [
                {type: "Bug Fix", description: "Attempted to resolve Netlify build failure due to deprecated npm package warnings by adding `.npmrc` to suppress warning logs."}
            ]
        },
        {
            id: 'v1.0.2', 
            version: '1.0.2',
            timestamp: '2025-06-17T16:30:00.000Z', 
            changes: [
                {type: "Bug Fix", description: "Attempted to resolve persistent Netlify build failure related to deprecated npm package warnings by removing package-lock.json to force a fresh dependency resolution."}
            ]
        },
        {
            id: 'v1.0.1', 
            version: '1.0.1',
            timestamp: '2025-06-17T16:30:00.000Z', 
            changes: [
                {type: "Bug Fix", description: "Resolved Netlify build failure caused by deprecated npm package warnings by forcing a clean dependency resolution."}
            ]
        },
        {
            id: 'v1.0.0', 
            version: '1.0.0',
            timestamp: '2025-06-17T16:30:00.000Z', 
            changes: [
                {type: "New Feature", description: "Core Functionality: Upload Google Search Console CSV, generate AI performance summaries, and fetch basic page metadata."},
                {type: "New Feature", description: "User Authentication implemented (Email/Password, Google Sign-in)."},
                {type: "Improvement", description: "Centralized 'Settings' modal for API Key management and other user preferences."},
                {type: "Bug Fix", description: "Resolved Netlify build issues (SyntaxError, missing catch/finally, CI=false configuration)."},
                {type: "Improvement", description: "Enhanced API error handling for clearer user feedback."},
                {type: "New Feature", description: "Knowledge Base: Upload PDF documents directly, Gemini extracts text and provides summaries, stored persistently in your settings."},
                {type: "Improvement", description: "Knowledge Base upload and display are now integrated into the Settings Modal."},
                {type: "New Feature", description: "Automated SEO Meta Data Suggestions: Generate optimized titles/descriptions for individual pages using Gemini AI."},
                {type: "Improvement", description: "Meta Data Suggestions now include AI-generated reasoning for clarity on why suggestions were made."},
                {type: "Bug Fix", description: "Corrected issue where 'Suggest Meta' applied suggestions to incorrect pages."},
                {type: "New Feature", description: "Top Opportunities Filter: Easily view pages identified by AI as best for improvement in the pages list."},
                {type: "New Feature", description: "Implemented Changelog: View application updates within the app via a dedicated modal."}
            ]
        }
    ]);


    const isSharedView = !!sharedSnapshotData;
    // Modified setError to also clear successMessage, and vice-versa
    const setError = (msg) => { setUiError(msg); setSuccessMessage(''); };
    const setSuccess = (msg) => { setSuccessMessage(msg); setUiError(null); };
    
    const calculatedActiveSnapshot = useMemo(() => snapshots.find(s => s.id === activeSnapshotId), [snapshots, activeSnapshotId]);
    const activeSnapshot = isSharedView ? sharedSnapshotData : calculatedActiveSnapshot;
    const error = uiError || coreError; // Consolidate errors
    
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
    }, [isAuthReady, db, user, isSharedView, handleSetActiveSnapshot]);

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

    // Re-added useEffect for Knowledge Base Items as it still uses Firestore
    useEffect(() => {
        if (!isAuthReady || !db || !user?.uid || isSharedView) return;
        const knowledgeBaseColRef = collection(db, 'users', user.uid, 'knowledgeBase');
        const q = query(knowledgeBaseColRef);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedItems = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setKnowledgeBaseItems(fetchedItems);
        }, (err) => {
            setError("Could not load knowledge base items.");
            console.error("Knowledge base load error:", err);
        });
        return () => unsubscribe();
    }, [isAuthReady, db, user, isSharedView]);


    // --- Core Application Logic ---
    const handleFileUpload = async (event) => {
        if(isSharedView) return;
        const file = event.target.files[0];
        if (!file || !file.name.endsWith('.csv')) { setError("Please upload a valid CSV (.csv) file."); return; }
        if (!db || !user?.uid) { setError("You must be signed in to upload a file."); return; }
        setFileName(file.name);
        setSuccess("File processing started..."); // User feedback
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
                    setSuccess(`"${file.name}" processed and saved successfully!`);
                },
                error: (err) => setError(`CSV Parsing Error: ${err.message}`)
            });
        } catch (err) { setError(err.message || "Failed to load or parse the file."); }
        finally { event.target.value = ''; } // Clear file input
    };

    // New handleKnowledgeBaseFileUpload
    const handleKnowledgeBaseFileUpload = async (event) => {
        if (!db || !user?.uid) { setError("You must be signed in to upload a file."); return; }
        const file = event.target.files[0];
        
        setError(null); // Clear previous errors
        setSuccessMessage(''); // Clear previous success messages
        
        if (!file || file.type !== 'application/pdf') { setError("Please upload a valid PDF (.pdf) file for the knowledge base."); return; }
        if (file.size > 20 * 1024 * 1024) { // 20 MB limit for inline data
            setError("PDF file is too large. Please upload files under 20MB for direct processing.");
            return;
        }

        setIsUploadingKnowledgeBase(true);
        setSuccess("Processing document...");

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Pdf = btoa(new Uint8Array(e.target.result).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                
                // Corrected structure for multimodal content in Gemini API call
                const textExtractionPrompt = "Extract all text content from this document.";
                const contentsForExtraction = [{ // This is the 'contents' array for the API payload
                    role: "user",
                    parts: [
                        { text: textExtractionPrompt }, // First part: text prompt
                        { // Second part: inlineData for the PDF
                            inlineData: {
                                mimeType: 'application/pdf',
                                data: base64Pdf
                            }
                        }
                    ]
                }];
                
                setSuccess("Extracting text from PDF...");
                // Pass the correctly structured contents directly
                const extractedText = await callGemini(textExtractionPrompt, { contents: contentsForExtraction }); 

                // Second call to Gemini to summarize the extracted text
                // Truncate text if it's extremely long, to stay within prompt limits for the summary call
                const summaryPromptText = `Provide a concise summary of the key information and main topics from the following text:\n\n${extractedText.substring(0, 10000)}`; // Using a reasonable chunk
                setSuccess("Summarizing document content...");
                const summary = await callGemini(summaryPromptText, {}); // No inlineData needed for text-only summary

                // Store extracted text and summary in Firestore
                const knowledgeBaseColRef = collection(db, 'users', user.uid, 'knowledgeBase');
                await addDoc(knowledgeBaseColRef, {
                    fileName: file.name,
                    uploadedAt: new Date().toISOString(),
                    extractedContent: extractedText, // Storing full extracted text
                    summary: summary, // Storing AI generated summary
                    sourceType: file.type
                });
                setSuccess(`"${file.name}" processed and added to knowledge base!`);
            };
            reader.onerror = () => { setError("Failed to read PDF file."); };
            reader.readAsArrayBuffer(file);

        } catch (err) {
            setError(err.message || "Error processing PDF for knowledge base.");
        } finally {
            setIsUploadingKnowledgeBase(false);
            event.target.value = ''; // Clear file input after upload attempt
        }
    };
    
    // --- API and Data Processing Logic ---
    const callGemini = async (prompt, options) => { // Modified to accept an options object
        const geminiApiKey = apiKey || GEMINI_API_KEY;
        if (!geminiApiKey) throw new Error("Gemini API key is missing. Please add it in Settings.");
        
        // Default payload structure for text-only prompts
        // This default structure is correct: contents is an array with one object for the user role
        let payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        // If options.contents is provided, it means it's a multimodal request (like PDF)
        // In this case, options.contents should already be in the correct structure
        if (options && options.contents) {
            payload.contents = options.contents; 
        }
        
        // Add generationConfig if provided
        if (options && options.generationConfig) {
            payload.generationConfig = options.generationConfig;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorBody.error?.message || 'Unknown error'}`);
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
        // Updated callGemini to pass generationConfig in an options object
        const schema = {type: "OBJECT", properties: {totalImpressions: { type: "NUMBER" }, totalClicks: { type: "NUMBER" }, totalPages: { type: "NUMBER" }, averageCtr: { type: "STRING" }, keyInsights: { type: "ARRAY", items: { type: "STRING" } }, recommendations: { type: "ARRAY", items: { type: "STRING" } }, opportunityPages: { type: "ARRAY", items: { type: "OBJECT", properties: { page: { type: "STRING" }, reasoning: { type: "STRING" } } } } }, required: ["totalImpressions", "totalClicks", "averageCtr", "keyInsights", "recommendations", "opportunityPages"]};
        try {
            const summaryPrompt = `Analyze the provided Google Search Console data. From the data, calculate the total impressions, total clicks, and the average CTR (as a percentage string, e.g., '2.51%'). Identify 2-3 key insights and 2-3 actionable recommendations. Also, identify up to 10 pages with high impressions but low CTR that represent good optimization opportunities, providing a short reason for each. Provide the entire response in the specified JSON format. Data sample: ${JSON.stringify(activeSnapshot.pages.slice(0, 100))}`;
            const summaryJsonString = await callGemini(summaryPrompt, { generationConfig: { responseMimeType: "application/json", responseSchema: schema } });
            const snapshotDocRef = doc(db, 'users', user.uid, 'snapshots', activeSnapshotId);
            await updateDoc(snapshotDocRef, { performanceSummary: summaryJsonString });
            setSuccess(`AI summary generated for ${activeSnapshot.fileName}!`);
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
        setSuccessMessage('');
        const metadata = await fetchSinglePageMetadata(pageUrl);
        const currentActiveSnapshot = snapshots.find(s => s.id === activeSnapshotId);
        if (currentActiveSnapshot) {
            const updatedPages = [...currentActiveSnapshot.pages];
            const originalIndex = updatedPages.findIndex(p => p.Page === pageUrl); // Find original index
            if (originalIndex !== -1) {
                updatedPages[originalIndex] = { ...updatedPages[originalIndex], ...metadata };
                const snapshotDocRef = doc(db, 'users', user.uid, 'snapshots', activeSnapshotId);
                await updateDoc(snapshotDocRef, { pages: updatedPages });
            }
        }
        setFetchingMetadata(prev => ({ ...prev, [pageUrl]: false }));
    };
    
    const handleBulkFetchMetadata = async () => {
        if (isSharedView) return;
        const currentActiveSnapshot = snapshots.find(s => s.id === activeSnapshotId);
        if (!currentActiveSnapshot?.pages) { setError("No pages to fetch metadata for."); return; }
        setIsBulkFetching(true);
        setError(null);
        setSuccessMessage('');
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
            setSuccess("Successfully fetched all metadata!");
        } catch (err) { 
            setError("Failed to save updated metadata.");
        } finally {
            setIsBulkFetching(false);
        }
    };

    // --- New Function: Suggest Meta Data ---
    const suggestMetaData = useCallback(async (pageToUpdate) => { // Changed param name from 'page' to 'pageToUpdate' for clarity
        if (isSharedView || !db || !user?.uid || isSuggestingMeta[pageToUpdate.Page]) return; // Use pageToUpdate.Page for unique key

        setIsSuggestingMeta(prev => ({ ...prev(this), [33m<[39m[33mLoader[39m size[33m=[39m{[35m16[39m} className[33m=[39m[32m"animate-spin"[39m [33m/[39m[33m>[39m [33mGenerating[39m...[33m<[39m[33m/[39m[33m>[39m : [33m<[39m[33m>[39m[33m<[39m[33mSparkles[39m size[33m=[39m{[35m16[39m}[33m/[39m[33m>[39m [33mGenerate[39m [33mAI[39m [33mSummary[39m[33m<[39m[33m/[39m[33m>[39m}
Line 924:                              [33m<[39m[33m/button[39m[33m>[39m
