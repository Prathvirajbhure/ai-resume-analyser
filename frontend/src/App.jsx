import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  // --- Auth State ---
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- App State ---
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' or 'history'
  const [file, setFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobText, setJobText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [appError, setAppError] = useState('');
  
  // --- History State ---
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Save token to localStorage
  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  // Fetch history when the history tab is clicked
  useEffect(() => {
    if (token && activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, token]);

  const handleLogout = () => {
    setToken('');
    setResult(null);
    setActiveTab('analyze');
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/analyze/history/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLoginMode) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const res = await axios.post("http://127.0.0.1:8000/api/auth/login", formData);
        setToken(res.data.access_token);
      } else {
        await axios.post("http://127.0.0.1:8000/api/auth/signup", { email, password });
        setIsLoginMode(true);
        setAuthError("Signup successful! Please log in.");
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Authentication failed");
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file || !jobTitle || !jobText) {
      setAppError("Please provide all required fields.");
      return;
    }
    setLoading(true); setAppError(''); setResult(null);

    try {
      const authConfig = { headers: { Authorization: `Bearer ${token}` } };
      
      const formData = new FormData();
      formData.append("file", file);
      const resumeRes = await axios.post("http://127.0.0.1:8000/api/upload-resume/", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
      });

      const jobRes = await axios.post("http://127.0.0.1:8000/api/jobs/", { job_title: jobTitle, job_text: jobText }, authConfig);

      const analysisRes = await axios.post("http://127.0.0.1:8000/api/analyze/", {
        resume_id: resumeRes.data.resume_id,
        job_id: jobRes.data.job_id
      }, authConfig);

      setResult(analysisRes.data);
    } catch (err) {
      setAppError(err.response?.data?.detail || "An error occurred during analysis.");
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // --- UI: Not Logged In ---
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            {isLoginMode ? "Welcome Back" : "Create an Account"}
          </h2>
          {authError && (
            <div className={`p-3 rounded mb-4 text-sm ${authError.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {authError}
            </div>
          )}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required 
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-medium transition">
              {isLoginMode ? "Sign In" : "Sign Up"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-blue-600 hover:underline font-medium">
              {isLoginMode ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // --- UI: Logged In ---
  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Navbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">AI Resume Analyzer</h1>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setActiveTab('analyze')} 
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'analyze' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            New Analysis
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'history' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            History
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <button onClick={handleLogout} className="text-sm bg-gray-800 hover:bg-gray-900 text-white py-2 px-4 rounded-lg transition">
            Log Out
          </button>
        </div>
      </div>

      {/* Tab 1: New Analysis */}
      {activeTab === 'analyze' && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <form onSubmit={handleAnalyze} className="space-y-5">
              <div>
                <label className="block font-semibold text-gray-700 mb-2">1. Upload Resume (PDF)</label>
                <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-2">2. Target Job Title</label>
                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g., Senior Data Scientist"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-2">3. Job Description</label>
                <textarea rows="5" value={jobText} onChange={e => setJobText(e.target.value)} placeholder="Paste the requirements..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button type="submit" disabled={loading} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-blue-300">
                {loading ? 'Analyzing Profile (This may take a minute)...' : 'Run AI Analysis'}
              </button>
              {appError && <p className="text-red-500 text-sm mt-2">{appError}</p>}
            </form>
          </div>

          {result && (
            <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Match Results</h2>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-medium">Score:</span>
                  <span className={`text-3xl font-extrabold ${result.match_score >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
                    {result.match_score}%
                  </span>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Skills to Acquire:</h3>
                <div className="flex flex-wrap gap-2">
                  {result.missing_skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-sm font-medium">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">AI Feedback:</h3>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">{result.feedback}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: History Dashboard */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-6">Past Analyses</h2>
          {loadingHistory ? (
            <p className="text-gray-500">Loading history...</p>
          ) : history.length === 0 ? (
            <div className="text-center p-10 bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-gray-500">No past analyses found. Run your first scan!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-800 line-clamp-2" title={item.job_title}>{item.job_title}</h3>
                    <span className={`text-xl font-extrabold ${item.match_score >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
                      {item.match_score}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4 font-medium">Scanned on {item.date}</p>
                  
                  <div className="mt-auto">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Missing Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.missing_skills.slice(0, 4).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs truncate max-w-[120px]" title={skill}>
                          {skill}
                        </span>
                      ))}
                      {item.missing_skills.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">+{item.missing_skills.length - 4} more</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;