import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  BarChart3,
  X,
  RefreshCw,
} from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import {
  useCreateTask,
  useDeleteTask,
  useStatistics,
  useTasks,
  useUpdateTask,
} from "../hooks/useTasks";

const EMPTY_FORM = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
};

// grid staggers its cards in, each one springs up. re-keying the grid by the active
// filter makes the whole reveal replay on every (re)load.
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.18 } },
};

const Dashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);

  const debouncedSearch = useDebounce(searchTerm);

  const filters = useMemo(
    () => ({
      keyword: debouncedSearch || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
    }),
    [debouncedSearch, statusFilter, priorityFilter],
  );

  const {
    data: taskPage,
    isLoading: tasksLoading,
    isError: tasksError,
    isFetching: tasksFetching,
    refetch: refetchTasks,
  } = useTasks(filters);

  // changes with the filter -> re-keys the grid so the reveal animation replays
  const listKey = `${debouncedSearch}|${statusFilter}|${priorityFilter}`;
  const { data: statistics } = useStatistics();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const tasks = useMemo(() => {
    const content = taskPage?.content ?? [];
    return [...content].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [taskPage]);

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, task: formData });
        toast.success("Task updated successfully!");
      } else {
        await createTask.mutateAsync(formData);
        toast.success("Task created successfully!");
      }
      closeModal();
    } catch {
      toast.error(editingTask ? "Failed to update task" : "Failed to create task");
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask.mutateAsync(id);
      toast.success("Task deleted successfully!");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "TODO":
        return "bg-warning text-gray-900";
      case "IN_PROGRESS":
        return "bg-primary text-white";
      case "DONE":
        return "bg-success text-white";
      default:
        return "bg-surfaceHover text-text-primary";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-900/50 border-red-700";
      case "MEDIUM":
        return "bg-yellow-900/50 border-yellow-700";
      case "LOW":
        return "bg-green-900/50 border-green-700";
      default:
        return "bg-surfaceHover border-surfaceHover";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  };

  const renderTasks = () => {
    if (tasksLoading) {
      return (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          role="status"
          aria-label="Loading tasks"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div key={i} variants={cardVariants} className="card p-5">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-1/2 rounded bg-surfaceHover" />
                  <div className="h-5 w-12 rounded bg-surfaceHover" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded bg-surfaceHover" />
                  <div className="h-3 w-2/3 rounded bg-surfaceHover" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded bg-surfaceHover" />
                  <div className="h-5 w-16 rounded bg-surfaceHover" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-9 flex-1 rounded bg-surfaceHover" />
                  <div className="h-9 flex-1 rounded bg-surfaceHover" />
                </div>
              </div>
            </motion.div>
          ))}
          <span className="sr-only">Loading tasks</span>
        </motion.div>
      );
    }

    if (tasksError) {
      return (
        <div className="col-span-full text-center py-12">
          <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">Couldn&apos;t load tasks</h3>
          <p className="text-text-secondary mb-4">
            Something went wrong while fetching your tasks.
          </p>
          <button
            type="button"
            onClick={() => refetchTasks()}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full text-center py-12"
        >
          <CheckCircle2 className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">No tasks found</h3>
          <p className="text-text-secondary">Create your first task to get started!</p>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={listKey}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              variants={cardVariants}
              exit="exit"
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 18 } }}
              className="card p-5 hover:shadow-xl transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-text-primary flex-1">{task.title}</h3>
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityBadge(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                </div>

                {task.description && (
                  <p className="text-sm text-text-secondary line-clamp-2">{task.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-md ${getStatusColor(task.status)}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(task)}
                    aria-label={`Edit ${task.title}`}
                    className="btn-secondary flex-1 flex items-center justify-center space-x-2 text-sm py-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    disabled={deleteTask.isPending}
                    aria-label={`Delete ${task.title}`}
                    className="btn-danger flex-1 flex items-center justify-center space-x-2 text-sm py-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  };

  const isSaving = createTask.isPending || updateTask.isPending;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: "Total Tasks", value: statistics.total, icon: BarChart3, color: "primary" },
              { label: "To Do", value: statistics.todo, icon: Clock, color: "warning" },
              {
                label: "In Progress",
                value: statistics.inProgress,
                icon: AlertCircle,
                color: "primary",
              },
              { label: "Completed", value: statistics.done, icon: CheckCircle2, color: "success" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-full bg-${stat.color}-900/50 flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                    <p className="text-sm text-text-secondary">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <label htmlFor="task-search" className="sr-only">
                Search tasks
              </label>
              <input
                id="task-search"
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex gap-3">
              <label htmlFor="status-filter" className="sr-only">
                Filter by status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input px-4 py-3 cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <label htmlFor="priority-filter" className="sr-only">
                Filter by priority
              </label>
              <select
                id="priority-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input px-4 py-3 cursor-pointer"
              >
                <option value="">All Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {tasksFetching && !tasksLoading && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 text-text-secondary text-sm mb-3"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Refreshing…</span>
            </motion.div>
          )}
        </AnimatePresence>
        {renderTasks()}
      </main>

      <motion.button
        type="button"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={openCreateModal}
        aria-label="Create new task"
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary hover:bg-primaryHover text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all"
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-label={editingTask ? "Edit task" : "Create task"}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card p-4 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">
                  {editingTask ? "Edit Task" : "Create New Task"}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close dialog"
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="task-title"
                    className="block text-sm font-medium text-text-primary mb-1.5"
                  >
                    Title *
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input px-3 py-2"
                    placeholder="Task title"
                    required
                    minLength={3}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-desc"
                    className="block text-sm font-medium text-text-primary mb-1.5"
                  >
                    Description
                  </label>
                  <textarea
                    id="task-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[80px] px-3 py-2"
                    placeholder="Task description"
                    rows={2}
                    maxLength={500}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="task-status"
                      className="block text-sm font-medium text-text-primary mb-1.5"
                    >
                      Status
                    </label>
                    <select
                      id="task-status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input px-3 py-2 cursor-pointer"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="task-priority"
                      className="block text-sm font-medium text-text-primary mb-1.5"
                    >
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="input px-3 py-2 cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="task-due"
                    className="block text-sm font-medium text-text-primary mb-1.5"
                  >
                    Due Date
                  </label>
                  <input
                    id="task-due"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input px-3 py-2"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1 py-2">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary flex-1 py-2 disabled:opacity-50"
                  >
                    {isSaving ? "Saving…" : `${editingTask ? "Update" : "Create"} Task`}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
