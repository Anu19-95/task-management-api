import { Task, TaskStats, ApiLog } from './types';

type ApiListener = (log: ApiLog) => void;
const listeners: ApiListener[] = [];

export function onApiLog(fn: ApiListener) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  body?: any
): Promise<{ data: T; durationMs: number; status: number }> {
  const start = performance.now();
  let status = 0;
  let responseData: any = null;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    status = res.status;
    responseData = await res.json();
    const durationMs = Math.round(performance.now() - start);

    const log: ApiLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      method,
      endpoint: url,
      status,
      durationMs,
      requestBody: body,
      responseBody: responseData,
    };

    listeners.forEach((fn) => fn(log));

    if (!res.ok) {
      throw new Error(responseData?.error || `Request failed with status ${res.status}`);
    }

    return { data: responseData, durationMs, status };
  } catch (error: any) {
    const durationMs = Math.round(performance.now() - start);
    if (!responseData) {
      const log: ApiLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        method,
        endpoint: url,
        status: status || 500,
        durationMs,
        requestBody: body,
        responseBody: { error: error.message },
      };
      listeners.forEach((fn) => fn(log));
    }
    throw error;
  }
}

export const taskApi = {
  getHealth: async () => {
    return request<{ status: string; version: string; totalTasks: number }>('GET', '/api/health');
  },

  getStats: async () => {
    const res = await request<{ success: boolean; stats: TaskStats }>('GET', '/api/stats');
    return res.data.stats;
  },

  getTasks: async (params?: {
    status?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    order?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.priority && params.priority !== 'all') searchParams.set('priority', params.priority);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.order) searchParams.set('order', params.order);

    const qs = searchParams.toString();
    const url = `/api/tasks${qs ? `?${qs}` : ''}`;
    const res = await request<{ success: boolean; count: number; tasks: Task[] }>('GET', url);
    return res.data.tasks;
  },

  getTaskById: async (id: string) => {
    const res = await request<{ success: boolean; task: Task }>('GET', `/api/tasks/${id}`);
    return res.data.task;
  },

  createTask: async (taskData: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    tags?: string[];
  }) => {
    const res = await request<{ success: boolean; message: string; task: Task }>('POST', '/api/tasks', taskData);
    return res.data.task;
  },

  updateTask: async (id: string, taskData: Partial<Task>) => {
    const res = await request<{ success: boolean; message: string; task: Task }>('PUT', `/api/tasks/${id}`, taskData);
    return res.data.task;
  },

  patchTask: async (id: string, partialData: Partial<Task>) => {
    const res = await request<{ success: boolean; message: string; task: Task }>('PATCH', `/api/tasks/${id}`, partialData);
    return res.data.task;
  },

  deleteTask: async (id: string) => {
    const res = await request<{ success: boolean; message: string }>('DELETE', `/api/tasks/${id}`);
    return res.data;
  },

  resetSampleData: async () => {
    const res = await request<{ success: boolean; message: string; count: number; tasks: Task[] }>('POST', '/api/tasks/seed');
    return res.data.tasks;
  },
};
