import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  RotateCcw,
  Terminal,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Code,
  Copy,
  Check,
  Menu,
  X,
  ExternalLink,
  Activity,
  Server,
  Zap,
  Globe
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, TaskStats, ApiLog } from './types';
import { taskApi, onApiLog } from './api';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { StatsBar } from './components/StatsBar';
import { CurlModal } from './components/CurlModal';
import { ApiConsole } from './components/ApiConsole';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view / navigation
  const [activeNav, setActiveNav] = useState<'tasks' | 'stats' | 'health' | 'tester'>('tasks');
  const [selectedTaskForPreview, setSelectedTaskForPreview] = useState<Task | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [curlModalTask, setCurlModalTask] = useState<Task | null>(null);
  const [isCurlModalOpen, setIsCurlModalOpen] = useState(false);

  // Health check state
  const [apiStatus, setApiStatus] = useState<{ healthy: boolean; latency: number } | null>(null);

  // API logs for live console
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [copiedPreview, setCopiedPreview] = useState(false);

  // Subscribe to API request logs
  useEffect(() => {
    const unsubscribe = onApiLog((log) => {
      setApiLogs((prev) => [log, ...prev].slice(0, 50));
    });
    return unsubscribe;
  }, []);

  // Fetch tasks and metrics
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [fetchedTasks, fetchedStats] = await Promise.all([
        taskApi.getTasks({
          status: statusFilter,
          priority: priorityFilter,
          search: searchQuery,
          sortBy,
          order: sortOrder,
        }),
        taskApi.getStats(),
      ]);

      setTasks(fetchedTasks);
      setStats(fetchedStats);
      if (fetchedTasks.length > 0 && !selectedTaskForPreview) {
        setSelectedTaskForPreview(fetchedTasks[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Task Management API');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, searchQuery, sortBy, sortOrder, selectedTaskForPreview]);

  // Initial load & health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const start = performance.now();
        await taskApi.getHealth();
        setApiStatus({
          healthy: true,
          latency: Math.round(performance.now() - start),
        });
      } catch {
        setApiStatus({ healthy: false, latency: 0 });
      }
    };

    checkHealth();
    loadData();
  }, [loadData]);

  // Task creation/update handler
  const handleSaveTask = async (data: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    tags: string[];
  }) => {
    if (editingTask) {
      const updated = await taskApi.updateTask(editingTask.id, data);
      setSelectedTaskForPreview(updated);
    } else {
      const created = await taskApi.createTask(data);
      setSelectedTaskForPreview(created);
    }
    await loadData();
  };

  // Toggle completion
  const handleToggleComplete = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      if (selectedTaskForPreview?.id === task.id) {
        setSelectedTaskForPreview({ ...selectedTaskForPreview, status: nextStatus });
      }
      await taskApi.patchTask(task.id, { status: nextStatus });
      const updatedStats = await taskApi.getStats();
      setStats(updatedStats);
    } catch {
      loadData();
    }
  };

  // Status Change
  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
      if (selectedTaskForPreview?.id === id) {
        setSelectedTaskForPreview({ ...selectedTaskForPreview, status });
      }
      await taskApi.patchTask(id, { status });
      const updatedStats = await taskApi.getStats();
      setStats(updatedStats);
    } catch {
      loadData();
    }
  };

  // Priority Change
  const handlePriorityChange = async (id: string, priority: TaskPriority) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, priority } : t))
      );
      if (selectedTaskForPreview?.id === id) {
        setSelectedTaskForPreview({ ...selectedTaskForPreview, priority });
      }
      await taskApi.patchTask(id, { priority });
      const updatedStats = await taskApi.getStats();
      setStats(updatedStats);
    } catch {
      loadData();
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (selectedTaskForPreview?.id === id) {
          const remaining = tasks.filter((t) => t.id !== id);
          setSelectedTaskForPreview(remaining[0] || null);
        }
        await taskApi.deleteTask(id);
        const updatedStats = await taskApi.getStats();
        setStats(updatedStats);
      } catch {
        loadData();
      }
    }
  };

  // Reset sample dataset
  const handleResetData = async () => {
    if (window.confirm('Reset task database to default sample tasks?')) {
      try {
        await taskApi.resetSampleData();
        await loadData();
      } catch (err: any) {
        alert('Failed to reset dataset: ' + err.message);
      }
    }
  };

  // Preview cURL generation
  const activeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPreviewTask = selectedTaskForPreview || tasks[0] || null;
  const currentPreviewCurl = currentPreviewTask
    ? `curl -X GET "${activeOrigin}/api/tasks/${currentPreviewTask.id}" \\\n  -H "Accept: application/json"`
    : `curl -X GET "${activeOrigin}/api/tasks" \\\n  -H "Accept: application/json"`;

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(currentPreviewCurl);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
              T
            </div>
            <div>
              <span className="font-semibold text-slate-100 tracking-tight text-base block">
                TaskCore API
              </span>
              <span className="text-[10px] text-slate-400 font-mono">v1.0.0 (Express/REST)</span>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-3 py-2">
            Endpoints
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveNav('tasks');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              activeNav === 'tasks'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="font-mono text-xs">/v1/tasks</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeNav === 'tasks' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveNav('stats');
              setStatusFilter('all');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              activeNav === 'stats'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="font-mono text-xs">/v1/stats</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveNav('health');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              activeNav === 'health'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="font-mono text-xs">/v1/health</span>
          </button>

          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-3 py-2 mt-4">
            Developer Tools
          </div>
          <button
            type="button"
            onClick={() => {
              setCurlModalTask(currentPreviewTask);
              setIsCurlModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-slate-400" />
            <span>cURL Generator</span>
          </button>

          <a
            href="/api/openapi.json"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-slate-400" />
              <span>OpenAPI Spec</span>
            </div>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>

        {/* Sidebar Status Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
              <span>API Gateway Status</span>
              {apiStatus?.latency && (
                <span className="font-mono text-[10px] text-slate-400">{apiStatus.latency}ms</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-200">
                {apiStatus?.healthy ? '99.9% Uptime (LIVE)' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 lg:px-8 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span>Dashboard</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">
                {activeNav === 'tasks'
                  ? 'Task Explorer'
                  : activeNav === 'stats'
                  ? 'Metrics & Analytics'
                  : 'Health Gateway'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* API Key Pill */}
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 mr-1.5">KEY:</span>
              <span>sk_live_••••4f2a</span>
            </div>

            {/* Reset Seed Button */}
            <button
              type="button"
              id="reset-sample-data-btn"
              onClick={handleResetData}
              title="Reset Sample Data"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Seed
            </button>

            {/* Generate New Task Primary Button */}
            <button
              type="button"
              id="create-task-btn"
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-md font-medium shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Generate New Task
            </button>
          </div>
        </header>

        {/* Dashboard Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {/* Top Metrics Row */}
          <StatsBar
            stats={stats}
            activeStatus={statusFilter}
            onSelectStatus={(status) => {
              setStatusFilter(status);
              setActiveNav('tasks');
            }}
          />

          {/* 12-Column Main Workspace Grid */}
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Left Col: Task Data Table / Cards (8 cols on desktop) */}
            <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
              {/* Task Data Container */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col overflow-hidden">
                {/* Header & Controls */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                      Current Tasks Data
                    </h2>
                    <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                      GET /api/tasks
                    </span>
                  </div>

                  {/* Search box */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="task-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title, tag, or desc..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Filter and sorting pill bar */}
                <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {[
                      { id: 'all', label: 'All Tasks' },
                      { id: 'todo', label: 'Pending' },
                      { id: 'in_progress', label: 'In Progress' },
                      { id: 'completed', label: 'Completed' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        id={`status-tab-${tab.id}`}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          statusFilter === tab.id
                            ? 'bg-slate-900 text-white dark:bg-blue-600 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Priority & Sorting Dropdowns */}
                  <div className="flex items-center gap-2">
                    <select
                      id="priority-filter-select"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">Critical / High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    <select
                      id="sort-select"
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [sb, so] = e.target.value.split('-');
                        setSortBy(sb);
                        setSortOrder(so as 'asc' | 'desc');
                      }}
                      className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="createdAt-desc">Newest First</option>
                      <option value="createdAt-asc">Oldest First</option>
                      <option value="dueDate-asc">Due Date (Soonest)</option>
                      <option value="priority-desc">Priority (High to Low)</option>
                      <option value="title-asc">Title (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Task List / Content View */}
                <div className="p-4 space-y-3">
                  {error && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-medium">{error}</span>
                      </div>
                      <button
                        type="button"
                        onClick={loadData}
                        className="text-xs underline font-semibold hover:text-red-900 cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center bg-slate-50/50 dark:bg-slate-900/50">
                      <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2 stroke-[1.5]" />
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        No tasks match the active filter
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                        Adjust status filters, clear search terms, or create a new task.
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter('all');
                            setPriorityFilter('all');
                            setSearchQuery('');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 cursor-pointer"
                        >
                          Clear Filters
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTask(null);
                            setIsModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-500 cursor-pointer"
                        >
                          Create Task
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isSelected={selectedTaskForPreview?.id === task.id}
                          onSelectPreview={(t) => setSelectedTaskForPreview(t)}
                          onToggleComplete={handleToggleComplete}
                          onStatusChange={handleStatusChange}
                          onPriorityChange={handlePriorityChange}
                          onEdit={(t) => {
                            setEditingTask(t);
                            setIsModalOpen(true);
                          }}
                          onDelete={handleDeleteTask}
                          onViewCurl={(t) => {
                            setCurlModalTask(t);
                            setIsCurlModalOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Request Preview Terminal & cURL CLI (4 cols on desktop) */}
            <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
              {/* Request Preview / cURL Output Card */}
              <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl flex flex-col border border-slate-800">
                {/* Terminal Header with dots */}
                <div className="p-3 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                    <span className="text-xs font-mono text-slate-300 ml-2 font-semibold">
                      Request Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded font-bold">
                    {currentPreviewTask ? `ID: ${currentPreviewTask.id}` : 'ALL'}
                  </span>
                </div>

                {/* Terminal Body */}
                <div className="p-4 font-mono text-[11px] space-y-3">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                      cURL Command
                    </div>
                    <pre className="p-2.5 bg-slate-950 rounded-lg text-blue-300 overflow-x-auto border border-slate-800">
                      {currentPreviewCurl}
                    </pre>
                  </div>

                  {currentPreviewTask && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        JSON Response Body
                      </div>
                      <pre className="p-2.5 bg-slate-950 rounded-lg text-emerald-400 overflow-x-auto max-h-56 border border-slate-800 text-[11px]">
                        {JSON.stringify(currentPreviewTask, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Terminal Action Footer */}
                <div className="p-3 bg-slate-800/80 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCopyPreview}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedPreview ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>COPIED TO CLIPBOARD</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>COPY ENDPOINT / cURL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Endpoints Reference Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 text-xs">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-500" />
                  REST API Endpoints Reference
                </h3>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">GET</span>
                    <span className="text-slate-700 dark:text-slate-300">/api/tasks</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">POST</span>
                    <span className="text-slate-700 dark:text-slate-300">/api/tasks</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">PATCH</span>
                    <span className="text-slate-700 dark:text-slate-300">/api/tasks/:id</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                    <span className="text-red-600 dark:text-red-400 font-bold">DELETE</span>
                    <span className="text-slate-700 dark:text-slate-300">/api/tasks/:id</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">GET</span>
                    <span className="text-slate-700 dark:text-slate-300">/api/stats</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Live API Traffic & Tester Console */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Live HTTP Traffic Inspector & Request Console
              </h2>
              <a
                href="/api/openapi.json"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline"
              >
                /api/openapi.json
              </a>
            </div>
            <ApiConsole logs={apiLogs} onClearLogs={() => setApiLogs([])} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveTask}
        initialTask={editingTask}
      />

      <CurlModal
        isOpen={isCurlModalOpen}
        onClose={() => setIsCurlModalOpen(false)}
        task={curlModalTask}
      />
    </div>
  );
}
