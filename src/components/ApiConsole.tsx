import React, { useState } from 'react';
import {
  Activity,
  Code2,
  Play,
  Trash2,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { ApiLog } from '../types';

interface ApiConsoleProps {
  logs: ApiLog[];
  onClearLogs: () => void;
}

export const ApiConsole: React.FC<ApiConsoleProps> = ({ logs, onClearLogs }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'tester'>('logs');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // API Tester state
  const [testMethod, setTestMethod] = useState<'GET' | 'POST' | 'PATCH' | 'DELETE'>('GET');
  const [testEndpoint, setTestEndpoint] = useState('/api/tasks');
  const [testPayload, setTestPayload] = useState('{\n  "title": "API Test Task",\n  "priority": "high"\n}');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<number | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const handleExecuteTest = async () => {
    setIsExecuting(true);
    setTestResponse(null);
    setTestStatus(null);
    const start = performance.now();

    try {
      let body: any = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(testMethod) && testPayload.trim()) {
        body = JSON.parse(testPayload);
      }

      const res = await fetch(testEndpoint, {
        method: testMethod,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      setTestStatus(res.status);
      const data = await res.json();
      setTestResponse(data);
    } catch (err: any) {
      setTestResponse({ error: err.message || 'Request failed' });
      setTestStatus(500);
    } finally {
      setTestLatency(Math.round(performance.now() - start));
      setIsExecuting(false);
    }
  };

  const methodColors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold',
    POST: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-bold',
    PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-bold',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 font-bold',
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      {/* Tab Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tab-live-traffic"
            onClick={() => setActiveTab('logs')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live API Traffic ({logs.length})
          </button>
          <button
            type="button"
            id="tab-request-tester"
            onClick={() => setActiveTab('tester')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'tester'
                ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            API Request Tester
          </button>
        </div>

        {activeTab === 'logs' && logs.length > 0 && (
          <button
            type="button"
            onClick={onClearLogs}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Tab 1: Live API Logs */}
      {activeTab === 'logs' && (
        <div className="p-4 max-h-[380px] overflow-y-auto space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No API requests logged yet. Perform an action above to see real-time HTTP traffic.
            </div>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isCopied = copiedLogId === log.id;
              const isSuccess = log.status >= 200 && log.status < 300;

              return (
                <div
                  key={log.id}
                  className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={`font-mono px-1.5 py-0.5 rounded text-[10px] ${
                          methodColors[log.method] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.method}
                      </span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 truncate">
                        {log.endpoint}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          isSuccess
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                        {log.durationMs}ms
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                        {log.timestamp}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-900 space-y-3 font-mono">
                      {log.requestBody && (
                        <div>
                          <p className="text-[10px] font-sans font-bold uppercase text-slate-400 mb-1">
                            Request Body
                          </p>
                          <pre className="p-2.5 rounded bg-slate-950 text-slate-200 text-[11px] overflow-x-auto border border-slate-800">
                            {JSON.stringify(log.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-sans font-bold uppercase text-slate-400">
                            Response Payload
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(JSON.stringify(log.responseBody, null, 2), log.id)
                            }
                            className="inline-flex items-center gap-1 text-[10px] font-sans text-slate-400 hover:text-white cursor-pointer"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy JSON</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-2.5 rounded bg-slate-950 text-blue-300 text-[11px] overflow-x-auto border border-slate-800">
                          {JSON.stringify(log.responseBody, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Interactive API Tester */}
      {activeTab === 'tester' && (
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={testMethod}
              onChange={(e) => setTestMethod(e.target.value as any)}
              className="px-3 py-2 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <input
              type="text"
              value={testEndpoint}
              onChange={(e) => setTestEndpoint(e.target.value)}
              placeholder="/api/tasks"
              className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="button"
              onClick={handleExecuteTest}
              disabled={isExecuting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isExecuting ? 'Sending...' : 'Send Request'}
            </button>
          </div>

          {/* Quick preset links */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Presets:</span>
            <button
              type="button"
              onClick={() => {
                setTestMethod('GET');
                setTestEndpoint('/api/tasks');
              }}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono text-[11px] cursor-pointer"
            >
              GET /api/tasks
            </button>
            <button
              type="button"
              onClick={() => {
                setTestMethod('GET');
                setTestEndpoint('/api/stats');
              }}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono text-[11px] cursor-pointer"
            >
              GET /api/stats
            </button>
            <button
              type="button"
              onClick={() => {
                setTestMethod('GET');
                setTestEndpoint('/api/health');
              }}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono text-[11px] cursor-pointer"
            >
              GET /api/health
            </button>
            <button
              type="button"
              onClick={() => {
                setTestMethod('POST');
                setTestEndpoint('/api/tasks');
                setTestPayload('{\n  "title": "Build Integration Test Suite",\n  "priority": "high",\n  "status": "todo"\n}');
              }}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono text-[11px] cursor-pointer"
            >
              POST /api/tasks
            </button>
          </div>

          {/* Body Payload (if POST/PUT/PATCH) */}
          {['POST', 'PUT', 'PATCH'].includes(testMethod) && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                JSON Request Payload
              </label>
              <textarea
                rows={4}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="w-full p-3 text-xs font-mono bg-slate-950 text-slate-200 rounded-md border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Test Response Output */}
          {testResponse !== null && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Response
                  </span>
                  {testStatus !== null && (
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                        testStatus >= 200 && testStatus < 300
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      Status: {testStatus}
                    </span>
                  )}
                  {testLatency !== null && (
                    <span className="text-xs font-mono text-slate-400">
                      ({testLatency}ms)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(JSON.stringify(testResponse, null, 2), 'test-res')
                  }
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  {copiedLogId === 'test-res' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-blue-300 font-mono text-xs rounded-md border border-slate-800 overflow-x-auto max-h-60">
                {JSON.stringify(testResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
