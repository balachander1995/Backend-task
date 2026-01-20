// import Link from "next/link";

// import { LatestPost } from "@/app/_components/post";
// import { api, HydrateClient } from "@/trpc/server";

// export default async function Home() {
//   const hello = await api.post.hello({ text: "from tRPC" });

//   void api.post.getLatest.prefetch();

//   return (
//     <HydrateClient>
//       <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//         <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
//           <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
//             Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
//           </h1>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
//             <Link
//               className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
//               href="https://create.t3.gg/en/usage/first-steps"
//               target="_blank"
//             >
//               <h3 className="text-2xl font-bold">First Steps →</h3>
//               <div className="text-lg">
//                 Just the basics - Everything you need to know to set up your
//                 database and authentication.
//               </div>
//             </Link>
//             <Link
//               className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
//               href="https://create.t3.gg/en/introduction"
//               target="_blank"
//             >
//               <h3 className="text-2xl font-bold">Documentation →</h3>
//               <div className="text-lg">
//                 Learn more about Create T3 App, the libraries it uses, and how
//                 to deploy it.
//               </div>
//             </Link>
//           </div>
//           <div className="flex flex-col items-center gap-2">
//             <p className="text-2xl text-white">
//               {hello ? hello.greeting : "Loading tRPC query..."}
//             </p>
//           </div>

//           <LatestPost />
//         </div>
//       </main>
//     </HydrateClient>
//   );
// }

"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

export default function Home() {
  const utils = api.useUtils();
  const { data: tasks } = api.task.getTasks.useQuery();

  const createTask = api.task.createTask.useMutation({
    onSuccess: () => utils.task.getTasks.invalidate(),
  });

  const updateTask = api.task.updateTask.useMutation({
    onSuccess: () => utils.task.getTasks.invalidate(),
  });

  const deleteTask = api.task.deleteTask.useMutation({
    onSuccess: () => utils.task.getTasks.invalidate(),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"pending" | "in-progress" | "completed" | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"pending" | "in-progress" | "completed">("pending");

  const handleAddTask = () => {
    if (status) {
      createTask.mutate({ title, description, status });
      setTitle("");
      setDescription("");
      setStatus("");
    }
  };

  const startEdit = (taskId: string, taskTitle: string, taskDescription: string, taskStatus: "pending" | "in-progress" | "completed") => {
    setEditingId(taskId);
    setEditTitle(taskTitle);
    setEditDescription(taskDescription);
    setEditStatus(taskStatus);
  };

  const saveEdit = (taskId: string) => {
    updateTask.mutate({
      id: taskId,
      title: editTitle,
      description: editDescription,
      status: editStatus,
    });
    setEditingId(null);
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Task Manager</h1>

      {/* Create Task */}
      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 flex-1"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="border p-2 flex-1"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          className="border p-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as "pending" | "in-progress" | "completed" | "")}
        >
          <option value="">Select Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <button
          className="bg-black text-white px-4 cursor-pointer hover:bg-gray-800"
          onClick={handleAddTask}
        >
          Add Task
        </button>
      </div>

      {/* Task List */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-3 text-left">Title</th>
            <th className="border border-gray-300 p-3 text-left">Description</th>
            <th className="border border-gray-300 p-3 text-left">Status</th>
            <th className="border border-gray-300 p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks?.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-3">
                {editingId === task.id ? (
                  <input
                    className="border border-gray-400 p-2 w-full rounded"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                ) : (
                  <span className="block">{task.title}</span>
                )}
              </td>
              <td className="border border-gray-300 p-3">
                {editingId === task.id ? (
                  <input
                    className="border border-gray-400 p-2 w-full rounded"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                ) : (
                  <span className="block">{task.description}</span>
                )}
              </td>
              <td className="border border-gray-300 p-3">
                {editingId === task.id ? (
                  <select
                    className="w-full border border-gray-300 p-2 rounded"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as "pending" | "in-progress" | "completed")
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <span className="block font-semibold text-gray-700">
                    {task.status ?? "pending"}
                  </span>
                )}
              </td>
              <td className="border border-gray-300 p-3">
                <div className="flex gap-2 justify-center">
                  {editingId === task.id ? (
                    <>
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded cursor-pointer hover:bg-green-700"
                        onClick={() => saveEdit(task.id)}
                      >
                        Save
                      </button>
                      <button
                        className="bg-gray-500 text-white px-3 py-1 rounded cursor-pointer hover:bg-gray-700"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded cursor-pointer hover:bg-blue-700"
                        onClick={() => startEdit(task.id, task.title, task.description ?? "", task.status ?? "pending")}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded cursor-pointer hover:bg-red-700"
                        onClick={() => deleteTask.mutate({ id: task.id })}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
