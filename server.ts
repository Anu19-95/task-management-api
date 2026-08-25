import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Initial sample tasks
const sampleTasks: Task[] = [
  {
    id: "task_1",
    title: "Implement User Authentication Endpoints",
    description: "Build JWT-based authentication with signup, login, and password reset flows.",
    status: "in_progress",
    priority: "high",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    tags: ["Security", "Backend", "Auth"],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "task_2",
    title: "Design Responsive Dashboard Layout",
    description: "Create accessible desktop and mobile grid systems using Tailwind utility styles.",
    status: "todo",
    priority: "medium",
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0],
    tags: ["Frontend", "UI/UX", "Design"],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "task_3",
    title: "Setup Automated CI/CD Pipeline",
    description: "Configure GitHub Actions workflow for linting, testing, and continuous deployment.",
    status: "completed",
    priority: "high",
    dueDate: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0],
    tags: ["DevOps", "CI/CD"],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "task_4",
    title: "Optimize Database Query Latency",
    description: "Add composite indexes to frequently queried columns and profile execution plans.",
    status: "todo",
    priority: "low",
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    tags: ["Database", "Performance"],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

let tasks: Task[] = JSON.parse(JSON.stringify(sampleTasks));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // Request logger for API calls
  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      totalTasks: tasks.length,
    });
  });

  // Statistics endpoint
  app.get("/api/stats", (_req: Request, res: Response) => {
    const today = new Date().toISOString().split("T")[0];
    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      highPriority: tasks.filter((t) => t.priority === "high").length,
      overdue: tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "completed").length,
    };
    res.json({ success: true, stats });
  });

  // GET /api/tasks - list and query tasks
  app.get("/api/tasks", (req: Request, res: Response) => {
    const { status, priority, search, tag, sortBy = "createdAt", order = "desc" } = req.query;

    let filtered = [...tasks];

    if (status && typeof status === "string" && status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }

    if (priority && typeof priority === "string" && priority !== "all") {
      filtered = filtered.filter((t) => t.priority === priority);
    }

    if (tag && typeof tag === "string" && tag !== "all") {
      filtered = filtered.filter((t) => t.tags.some((tTag) => tTag.toLowerCase() === tag.toLowerCase()));
    }

    if (search && typeof search === "string") {
      const query = search.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tg) => tg.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "dueDate") {
        comparison = (a.dueDate || "").localeCompare(b.dueDate || "");
      } else if (sortBy === "priority") {
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      } else {
        // default createdAt
        comparison = a.createdAt.localeCompare(b.createdAt);
      }
      return order === "asc" ? comparison : -comparison;
    });

    res.json({
      success: true,
      count: filtered.length,
      tasks: filtered,
    });
  });

  // GET /api/tasks/:id - retrieve single task
  app.get("/api/tasks/:id", (req: Request, res: Response) => {
    const task = tasks.find((t) => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with id '${req.params.id}' not found.`,
      });
    }
    return res.json({ success: true, task });
  });

  // POST /api/tasks - create new task
  app.post("/api/tasks", (req: Request, res: Response) => {
    const { title, description = "", status = "todo", priority = "medium", dueDate = "", tags = [] } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Task 'title' is required and cannot be empty.",
      });
    }

    const validStatuses = ["todo", "in_progress", "completed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const validPriorities = ["low", "medium", "high"];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: `Invalid priority '${priority}'. Must be one of: ${validPriorities.join(", ")}`,
      });
    }

    const now = new Date().toISOString();
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      status: (status as "todo" | "in_progress" | "completed") || "todo",
      priority: (priority as "low" | "medium" | "high") || "medium",
      dueDate: typeof dueDate === "string" ? dueDate.trim() : "",
      tags: Array.isArray(tags) ? tags.map((tg) => String(tg).trim()).filter(Boolean) : [],
      createdAt: now,
      updatedAt: now,
    };

    tasks.unshift(newTask);

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: newTask,
    });
  });

  // PUT /api/tasks/:id - full update
  app.put("/api/tasks/:id", (req: Request, res: Response) => {
    const index = tasks.findIndex((t) => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: `Task with id '${req.params.id}' not found.`,
      });
    }

    const { title, description, status, priority, dueDate, tags } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Task 'title' is required.",
      });
    }

    const updatedTask: Task = {
      ...tasks[index],
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      status: status || tasks[index].status,
      priority: priority || tasks[index].priority,
      dueDate: dueDate !== undefined ? dueDate : tasks[index].dueDate,
      tags: Array.isArray(tags) ? tags : tasks[index].tags,
      updatedAt: new Date().toISOString(),
    };

    tasks[index] = updatedTask;

    return res.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  });

  // PATCH /api/tasks/:id - partial update (e.g. status toggle, priority shift)
  app.patch("/api/tasks/:id", (req: Request, res: Response) => {
    const index = tasks.findIndex((t) => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: `Task with id '${req.params.id}' not found.`,
      });
    }

    const existing = tasks[index];
    const { title, description, status, priority, dueDate, tags } = req.body;

    if (title !== undefined && (!title || !String(title).trim())) {
      return res.status(400).json({
        success: false,
        error: "Title cannot be empty.",
      });
    }

    const updatedTask: Task = {
      ...existing,
      title: title !== undefined ? String(title).trim() : existing.title,
      description: description !== undefined ? String(description).trim() : existing.description,
      status: status !== undefined ? status : existing.status,
      priority: priority !== undefined ? priority : existing.priority,
      dueDate: dueDate !== undefined ? String(dueDate).trim() : existing.dueDate,
      tags: Array.isArray(tags) ? tags : existing.tags,
      updatedAt: new Date().toISOString(),
    };

    tasks[index] = updatedTask;

    return res.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  });

  // DELETE /api/tasks/:id - delete a task
  app.delete("/api/tasks/:id", (req: Request, res: Response) => {
    const index = tasks.findIndex((t) => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: `Task with id '${req.params.id}' not found.`,
      });
    }

    const [deletedTask] = tasks.splice(index, 1);

    return res.json({
      success: true,
      message: "Task deleted successfully",
      deletedTask,
    });
  });

  // POST /api/tasks/seed - restore initial sample dataset
  app.post("/api/tasks/seed", (_req: Request, res: Response) => {
    tasks = JSON.parse(JSON.stringify(sampleTasks));
    return res.json({
      success: true,
      message: "Task dataset reset to default state.",
      count: tasks.length,
      tasks,
    });
  });

  // GET /api/openapi.json - API specification
  app.get("/api/openapi.json", (_req: Request, res: Response) => {
    res.json({
      openapi: "3.0.0",
      info: {
        title: "Task Management API",
        version: "1.0.0",
        description: "RESTful API for managing tasks, tracking statuses, and query filtering.",
      },
      paths: {
        "/api/tasks": {
          get: {
            summary: "List tasks",
            parameters: [
              { name: "status", in: "query", schema: { type: "string", enum: ["all", "todo", "in_progress", "completed"] } },
              { name: "priority", in: "query", schema: { type: "string", enum: ["all", "low", "medium", "high"] } },
              { name: "search", in: "query", schema: { type: "string" } },
              { name: "sortBy", in: "query", schema: { type: "string", enum: ["createdAt", "dueDate", "priority", "title"] } },
              { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
            ],
            responses: { 200: { description: "List of matching tasks" } },
          },
          post: {
            summary: "Create a task",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["title"],
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      status: { type: "string", enum: ["todo", "in_progress", "completed"] },
                      priority: { type: "string", enum: ["low", "medium", "high"] },
                      dueDate: { type: "string", format: "date" },
                      tags: { type: "array", items: { type: "string" } },
                    },
                  },
                },
              },
            },
            responses: { 201: { description: "Task created" }, 400: { description: "Validation error" } },
          },
        },
        "/api/tasks/{id}": {
          get: { summary: "Get task by ID" },
          put: { summary: "Full update of task" },
          patch: { summary: "Partial update of task" },
          delete: { summary: "Delete task" },
        },
        "/api/stats": {
          get: { summary: "Retrieve task aggregated metrics" },
        },
        "/api/health": {
          get: { summary: "API health status" },
        },
      },
    });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Task Management API Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
