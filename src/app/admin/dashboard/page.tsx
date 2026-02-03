"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserTasks, setSelectedUserTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if user is admin and fetch users
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      const userData = JSON.parse(userStr) as User;
      setCurrentUser(userData);
      if (userData.role === "admin") {
        void fetchUsers();
      } else {
        router.push("/tasks");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = (await res.json()) as { data: User[] };
        setUsers(data.data);
      } else {
        setMessage("❌ Failed to fetch users");
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  const fetchUserTasks = async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${userId}/tasks`);
      if (res.ok) {
        const data = (await res.json()) as { data: Task[] };
        setSelectedUserTasks(data.data);
        setSelectedUserId(userId);
      } else {
        setMessage("❌ Failed to fetch user tasks");
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/trpc/%5Btrpc%5D/auth/logout", { method: "POST" });
      localStorage.removeItem("currentUser");
      router.push("/login");
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
            {currentUser && (
              <p className="text-gray-600 mt-1">
                Welcome, <span className="font-semibold">{currentUser.fullName}</span>
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/tasks")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              My Tasks
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-md border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 All Users</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => void fetchUserTasks(user.id)}
                    className={`p-4 rounded-lg cursor-pointer transition ${
                      selectedUserId === user.id
                        ? "bg-purple-200 border-2 border-purple-500"
                        : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{user.fullName}</div>
                    <div className="text-sm text-gray-600">@{user.username}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Role: <span className="font-semibold">{user.role}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No users found</p>
              )}
            </div>
          </div>

          {/* User Details & Tasks */}
          {selectedUserId && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                📋 User Tasks
              </h2>
              {loading ? (
                <p className="text-gray-500">Loading tasks...</p>
              ) : selectedUserTasks.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedUserTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-400 transition"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <div className="text-xs whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded mr-1 ${
                              task.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`px-2 py-1 rounded ${
                              task.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : task.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Created: {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No tasks for this user</p>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{users.length}</div>
            <div className="text-gray-600 mt-2">Total Users</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {selectedUserTasks.length}
            </div>
            <div className="text-gray-600 mt-2">
              {selectedUserId ? "Selected User Tasks" : "Select a user"}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {users.filter((u) => u.role === "admin").length}
            </div>
            <div className="text-gray-600 mt-2">Admin Users</div>
          </div>
        </div>
      </div>
    </div>
  );
}
