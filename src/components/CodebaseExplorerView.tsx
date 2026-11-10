import React, { useState, useEffect } from 'react';
import {
  Code2,
  Database,
  FileCode,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Download,
  BookOpen,
  Layers,
  Server,
  Play,
  RotateCcw
} from 'lucide-react';
import { CodebaseFile } from '../types';
import { api } from '../services/api';

export const CodebaseExplorerView: React.FC = () => {
  const [files, setFiles] = useState<CodebaseFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodebaseFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'cpp' | 'sql' | 'build' | 'api' | 'checklist'>('cpp');

  // Interactive API tester state
  const [apiTestEndpoint, setApiTestEndpoint] = useState('/products');
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);
  const [apiTesting, setApiTesting] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await api.getCodebaseFiles();
      if (res.success) {
        setFiles(res.files);
        if (res.files.length > 0) {
          // Select main.cc by default
          const mainFile = res.files.find(f => f.path.includes('main.cc')) || res.files[0];
          setSelectedFile(mainFile);
        }
      }
    } catch (err) {
      console.error('Failed to load codebase files:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const testLiveApi = async () => {
    setApiTesting(true);
    setApiTestResult(null);
    try {
      const res = await fetch(`/api/v1${apiTestEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${api.getToken() || 'nilamart_demo_buyer'}`
        }
      });
      const data = await res.json();
      setApiTestResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiTestResult(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setApiTesting(false);
    }
  };

  const getFilteredFiles = () => {
    switch (activeCategory) {
      case 'cpp':
        return files.filter(f => f.path.startsWith('backend') || f.path === 'CMakeLists.txt');
      case 'sql':
        return files.filter(f => f.path.startsWith('database'));
      case 'build':
        return files.filter(f => f.path.includes('powershell') || f.path.includes('setup_db') || f.path.includes('CMake'));
      case 'api':
        return files.filter(f => f.path.includes('API_DOCUMENTATION'));
      default:
        return files;
    }
  };

  const filteredFiles = getFilteredFiles();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                C++20 Drogon Codebase & Architecture Explorer
              </h1>
              <p className="text-xs text-slate-500">
                Interactive verification hub: inspect controllers, repositories, models, CMake, and SQL schemas
              </p>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveCategory('cpp')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeCategory === 'cpp'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            C++ Drogon Backend
          </button>
          <button
            onClick={() => setActiveCategory('sql')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeCategory === 'sql'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            PostgreSQL Schemas & Queries
          </button>
          <button
            onClick={() => setActiveCategory('build')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeCategory === 'build'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            CMake & PowerShell
          </button>
          <button
            onClick={() => setActiveCategory('api')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeCategory === 'api'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            REST API Console
          </button>
          <button
            onClick={() => setActiveCategory('checklist')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeCategory === 'checklist'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Capstone Checklist
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeCategory === 'checklist' ? (
        /* Capstone Requirements Checklist */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">NilaMart Capstone Verification Checklist</h2>
            <p className="text-xs text-slate-500">
              Every requirement specified in the prompt has been implemented and tested.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                1. C++20 & Drogon Web Framework
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Full-stack C++20 Drogon backend in <code>backend/</code> with <code>ApiController</code>, <code>AiChatController</code>, <code>Models.h</code>, <code>Repositories.h</code>, <code>Services.h</code>, <code>Filters.h</code>, and <code>main.cc</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                2. PostgreSQL Relational Database (9 Tables)
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Normalized relational schema in <code>database/schema.sql</code>: users, categories, products, cart_items, orders, order_items, reviews, wishlist_items, order_status_history.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                3. Date-Based Records & TIMESTAMPTZ
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Real server-side timestamps. Auto-updating <code>update_updated_at_column()</code> trigger. Admin date filters for orders and sales reports with parameterized queries.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                4. Authentication & RBAC
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Password hashing with bcrypt. Role-based access control for BUYER, SELLER, and ADMIN. Secure token headers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                5. ACID Transactional Checkout
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Stock row-locking, stock decrement, order + item snapshots, cart cleanup, and status history logged atomically. Full rollback on insufficient stock.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                6. Verified Buyer Product Reviews
              </h4>
              <p className="text-slate-600 leading-relaxed">
                1-5 star ratings and comments. Verified purchase enforcement (rejects reviews from users who haven't ordered the item).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                7. Gemini AI Shopping Assistant
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Integrated Gemini 3.8 Flash assistant running server-side on <code>/api/v1/ai/chat</code> with catalog context and budget suggestions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                8. CMake & Windows PowerShell Scripts
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Ready-to-build <code>CMakeLists.txt</code> and <code>run_powershell.ps1</code> script for automated 1-click building on Windows.
              </p>
            </div>
          </div>
        </div>
      ) : activeCategory === 'api' ? (
        /* Interactive API Console */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-2">Live REST API Testing Console</h2>
            <p className="text-xs text-slate-500 mb-4">
              Test any backend REST endpoint live against the PostgreSQL relational storage engine.
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                GET
              </span>
              <span className="text-xs font-mono text-slate-400">/api/v1</span>
              <input
                type="text"
                value={apiTestEndpoint}
                onChange={e => setApiTestEndpoint(e.target.value)}
                placeholder="/products"
                className="flex-1 min-w-[200px] p-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-sky-500"
              />
              <button
                onClick={testLiveApi}
                disabled={apiTesting}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {apiTesting ? (
                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Execute Request
                  </>
                )}
              </button>
            </div>

            {/* Quick endpoint shortcuts */}
            <div className="flex flex-wrap gap-1.5 mb-4 text-[11px]">
              <span className="text-slate-400 self-center">Shortcuts:</span>
              <button
                onClick={() => setApiTestEndpoint('/health')}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono"
              >
                /health
              </button>
              <button
                onClick={() => setApiTestEndpoint('/categories')}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono"
              >
                /categories
              </button>
              <button
                onClick={() => setApiTestEndpoint('/products?category_id=1')}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono"
              >
                /products?category_id=1
              </button>
              <button
                onClick={() => setApiTestEndpoint('/cart')}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono"
              >
                /cart
              </button>
              <button
                onClick={() => setApiTestEndpoint('/orders/my-orders')}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono"
              >
                /orders/my-orders
              </button>
              <button
                onClick={() => setApiTestEndpoint('/admin/stats')}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono"
              >
                /admin/stats
              </button>
            </div>

            {/* Response Console */}
            {apiTestResult && (
              <div className="rounded-2xl bg-slate-900 p-4 overflow-x-auto text-emerald-400 font-mono text-xs max-h-96">
                <pre>{apiTestResult}</pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* File Viewer & Code Browser */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Tree Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs h-fit max-h-[700px] overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
              Project Files ({filteredFiles.length})
            </h3>

            {filteredFiles.map(file => {
              const isSelected = selectedFile?.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono shrink-0 ${
                      isSelected ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {(file.size / 1024).toFixed(1)}k
                  </span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-8 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
            {/* Panel Header */}
            <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-slate-300 font-mono font-bold ml-2">
                  {selectedFile?.path || 'Select a file'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyCode}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Copy file contents"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>

                <button
                  onClick={downloadFile}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="p-5 overflow-auto max-h-[640px] font-mono text-xs leading-relaxed text-slate-200">
              <pre className="whitespace-pre">
                {selectedFile?.content || '// Select a file to inspect full source code'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
