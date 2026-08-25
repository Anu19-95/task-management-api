import React, { useState } from 'react';
import { X, Copy, Check, Terminal } from 'lucide-react';
import { Task } from '../types';

interface CurlModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export const CurlModal: React.FC<CurlModalProps> = ({ isOpen, onClose, task }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const origin = window.location.origin;

  const curlGet = `curl -X GET "${origin}/api/tasks/${task.id}" \\
  -H "Accept: application/json"`;

  const curlPatch = `curl -X PATCH "${origin}/api/tasks/${task.id}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "${task.status === 'completed' ? 'todo' : 'completed'}"
  }'`;

  const curlDelete = `curl -X DELETE "${origin}/api/tasks/${task.id}" \\
  -H "Accept: application/json"`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        id="curl-modal-container"
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                cURL CLI Generator — {task.id}
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-md">{task.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Commands Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* GET Command */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                GET /api/tasks/{task.id}
              </span>
              <button
                type="button"
                id="copy-curl-get"
                onClick={() => handleCopy(curlGet, 'get')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedType === 'get' ? (
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
            <pre className="p-3 bg-slate-950 text-blue-300 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto">
              {curlGet}
            </pre>
          </div>

          {/* PATCH Command */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                PATCH /api/tasks/{task.id} (Toggle Status)
              </span>
              <button
                type="button"
                id="copy-curl-patch"
                onClick={() => handleCopy(curlPatch, 'patch')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedType === 'patch' ? (
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
            <pre className="p-3 bg-slate-950 text-purple-300 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto">
              {curlPatch}
            </pre>
          </div>

          {/* DELETE Command */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                DELETE /api/tasks/{task.id}
              </span>
              <button
                type="button"
                id="copy-curl-delete"
                onClick={() => handleCopy(curlDelete, 'delete')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedType === 'delete' ? (
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
            <pre className="p-3 bg-slate-950 text-rose-300 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto">
              {curlDelete}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
