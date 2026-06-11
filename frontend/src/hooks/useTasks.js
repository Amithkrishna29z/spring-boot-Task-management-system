import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTask, deleteTask, getTaskStatistics, getTasks, updateTask } from "../services/api";

const TASKS_KEY = "tasks";
const STATS_KEY = "statistics";

export const useTasks = (filters) =>
  useQuery({
    queryKey: [TASKS_KEY, filters],
    queryFn: async () => (await getTasks(filters)).data,
    placeholderData: (previous) => previous, // keep prior page while refetching
  });

export const useStatistics = () =>
  useQuery({
    queryKey: [STATS_KEY],
    queryFn: async () => (await getTaskStatistics()).data,
  });

const useTaskMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      queryClient.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
};

export const useCreateTask = () => useTaskMutation((task) => createTask(task));
export const useUpdateTask = () => useTaskMutation(({ id, task }) => updateTask(id, task));
export const useDeleteTask = () => useTaskMutation((id) => deleteTask(id));
