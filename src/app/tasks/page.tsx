"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const [taskPriority, setTaskPriority] = useState("");
  
  // Search filters
  const [searchTitle, setSearchTitle] = useState("");
  const [searchDescription, setSearchDescription] = useState("");
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchPriority, setSearchPriority] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("pending");
  const [editPriority, setEditPriority] = useState("medium");
  
  const router = useRouter();

  // Get user from localStorage on mount
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      const userData = JSON.parse(userStr) as User;
      setUser(userData);
      void handleFetchTasks();
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      setMessage("❌ Please enter a task title");
      return;
    }

    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          status: taskStatus,
          priority: taskPriority,
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        setMessage("✅ Task created successfully!");
        setTaskTitle("");
        setTaskDescription("");
        setTaskStatus("");
        setTaskPriority("");
        void handleFetchTasks();
      } else {
        const errorData = (await res.json()) as Record<string, unknown>;
        setMessage(
          `❌ Error: ${typeof errorData.error === "string" ? errorData.error : "Unknown error"}`
        );
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  const handleFetchTasks = async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        ...(searchStatus && { status: searchStatus }),
        ...(searchPriority && { priority: searchPriority }),
      });
      const res = await fetch(`/api/tasks/list?${params.toString()}`);

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        if ("data" in data && Array.isArray(data.data)) {
          let filtered = data.data as Task[];
          
          // Client-side filtering for title and description
          if (searchTitle) {
            filtered = filtered.filter(t => 
              t.title.toLowerCase().includes(searchTitle.toLowerCase())
            );
          }
          if (searchDescription) {
            filtered = filtered.filter(t => 
              (t.description?.toLowerCase() ?? "").includes(searchDescription.toLowerCase())
            );
          }
          
          setTasks(filtered);
        }
      } else {
        const errorData = (await res.json()) as Record<string, unknown>;
        setMessage(
          `❌ Error: ${typeof errorData.error === "string" ? errorData.error : "Unknown error"}`
        );
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        setMessage("✅ Task deleted successfully!");
        void handleFetchTasks();
      } else {
        const errorData = (await res.json()) as Record<string, unknown>;
        setMessage(
          `❌ Error: ${typeof errorData.error === "string" ? errorData.error : "Unknown error"}`
        );
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  const handleEditTask = async (id: string, updateData: { status?: string; priority?: string; title?: string; description?: string }) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        setMessage("✅ Task updated successfully!");
        if (editingId === id) {
          setEditingId(null);
          setEditTitle("");
          setEditDescription("");
        }
        void handleFetchTasks();
      } else {
        const errorData = (await res.json()) as Record<string, unknown>;
        setMessage(
          `❌ Error: ${typeof errorData.error === "string" ? errorData.error : "Unknown error"}`
        );
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/trpc/%5Btrpc%5D/auth/logout", { method: "POST" });
      localStorage.removeItem("currentUser");
      setMessage("✅ Logged out successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 500);
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Task Manager</h1>
            {user && (
              <p className="text-gray-600 mt-1">
                Welcome, <span className="font-semibold">{user.fullName}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        {/* Create Task Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ➕ Create New Task
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Task Title
              </label>
              <input
                type="text"
                placeholder="Enter task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Description
              </label>
              <input
                type="text"
                placeholder="Enter task description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Status
              </label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCreateTask}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition"
          >
            Create Task
          </button>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🔍 Search & Filter Tasks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Search Title
              </label>
              <input
                type="text"
                placeholder="Filter by title..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Search Description
              </label>
              <input
                type="text"
                placeholder="Filter by description..."
                value={searchDescription}
                onChange={(e) => setSearchDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Filter Status
              </label>
              <select
                value={searchStatus ?? ""}
                onChange={(e) => setSearchStatus(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Filter Priority
              </label>
              <select
                value={searchPriority ?? ""}
                onChange={(e) => setSearchPriority(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleFetchTasks}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition"
            >
              🔍 Search
            </button>
            <button
              onClick={() => {
                setSearchTitle("");
                setSearchDescription("");
                setSearchStatus(null);
                setSearchPriority(null);
                void handleFetchTasks();
              }}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition"
            >
              ↻ Reset
            </button>
          </div>
        </div>

        {/* Tasks Display */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📋 Your Tasks ({tasks.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Priority</th>
                    <th className="px-4 py-2 text-left">Created</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-t hover:bg-gray-50">
                      {editingId === task.id ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={editPriority}
                              onChange={(e) => setEditPriority(e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </td>
                          <td colSpan={2} className="px-4 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditTask(task.id, {
                                  title: editTitle,
                                  description: editDescription,
                                  status: editStatus,
                                  priority: editPriority,
                                })}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 font-semibold">
                            {task.title}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {task.description ?? "-"}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              task.status === "pending"
                                ? "bg-blue-100 text-blue-800"
                                : task.status === "in-progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace("-", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              task.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-500">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setEditingId(task.id);
                                  setEditTitle(task.title);
                                  setEditDescription(task.description ?? "");
                                  setEditStatus(task.status);
                                  setEditPriority(task.priority);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-lg">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}
