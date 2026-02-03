"use client";

import { useState } from "react";

interface UserData {
  username: string;
  role: "admin" | "user";
  id?: string;
}

interface Task {
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function TestPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskStatus, setTaskStatus] = useState("pending");
  const [taskPriority, setTaskPriority] = useState("medium");

  const handleSignup = async () => {
    try {
      const res = await fetch("/api/trpc/%5Btrpc%5D/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as UserData & { error?: string };
      if (res.ok) {
        setMessage(`✅ Signup successful: ${data.username}`);
        setUserData(data);
      } else {
        setMessage(`❌ Signup failed: ${data.error ?? "Unknown error"}`);
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/trpc/%5Btrpc%5D/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as UserData & { error?: string };
      if (res.ok) {
        setMessage(`✅ Login successful: ${data.username}`);
        setUserData(data);
      } else {
        setMessage(`❌ Login failed: ${data.error ?? "Unknown error"}`);
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  const handleCreateTask = async () => {
    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          status: taskStatus,
          priority: taskPriority,
        }),
      });
      if (!res.ok) {
        const errorData = (await res.json()) as Record<string, unknown>;
        setMessage(
          `❌ Error creating task: ${
            typeof errorData.error === "string" ? errorData.error : "Unknown error"
          }`
        );
        return;
      }
      const data = (await res.json()) as Task;
      setMessage(`✅ Task created: ${data.title}`);
      setTaskTitle("");
      void handleGetTasks();
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  const handleGetTasks = async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "10",
      });
      const res = await fetch(`/api/tasks/list?${params.toString()}`);
      if (!res.ok) {
        const errorData = (await res.json()) as Record<string, unknown>;
        setMessage(
          `❌ Error fetching tasks: ${
            typeof errorData.error === "string" ? errorData.error : "Unknown error"
          }`
        );
        return;
      }
      const data = (await res.json()) as Record<string, unknown>;
      if ("data" in data && Array.isArray(data.data)) {
        const taskArray = data.data as Task[];
        setTasks(taskArray);
        setMessage(`✅ Fetched ${taskArray.length} tasks`);
      } else {
        setMessage(`❌ Error fetching tasks: Unexpected response format`);
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/trpc/%5Btrpc%5D/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        setMessage("✅ Logged out successfully");
        setUserData(null);
      } else {
        setMessage("❌ Logout failed");
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Task Manager Test Suite
        </h1>

        {/* Message Display */}
        {message && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        {/* User Info */}
        {userData && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg shadow-md border-l-4 border-green-500">
            <p className="font-semibold text-gray-800">Logged in as:</p>
            <p className="text-gray-600">Username: {userData.username}</p>
            <p className="text-gray-600">Role: {userData.role}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Authentication Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              1️⃣ Authentication
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSignup}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition"
              >
                Sign Up
              </button>
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded-lg transition"
              >
                Login
              </button>
              {userData && (
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  Logout
                </button>
              )}
            </div>
            <p className="mt-4 text-xs text-gray-500">
              ✅ Lucia Auth with session management
            </p>
          </div>

          {/* Task Creation Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              3️⃣ & 4️⃣ Tasks & Filtering
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <button
                onClick={handleCreateTask}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition"
              >
                Create Task
              </button>
              <button
                onClick={handleGetTasks}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded-lg transition"
              >
                Fetch Tasks
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              ✅ Priority field, filtering, and pagination
            </p>
          </div>
        </div>

        {/* Tasks Display */}
        {tasks && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📋 Tasks
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Priority</th>
                    <th className="px-4 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task: Task, idx: number) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{task.title}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Features Checklist */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ✅ Features Implemented
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ 1️⃣ User Authentication (Lucia Auth)</li>
            <li>✅ 2️⃣ Role-based Access Control (Admin/User roles)</li>
            <li>✅ 3️⃣ Task Prioritization (low, medium, high)</li>
            <li>✅ 4️⃣ Advanced Filtering & Pagination</li>
            <li>✅ 5️⃣ Error Handling & Logging</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
