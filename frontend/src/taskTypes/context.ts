import { createContext, useContext } from "react";
import type { IconName } from "../components/Icon";
import type { TaskType } from "../data/taskTypes";
import type { Result } from "../session/context";

export interface TaskTypesStore {
  /** The twelve built-ins. Never empty, never editable. */
  defaults: TaskType[];
  /** User-added types, oldest first. */
  custom: TaskType[];
  /** defaults + custom, in that order — what the tracker scores against. */
  all: TaskType[];
  /** How many custom slots are left. */
  remaining: number;
  /** True while the custom types are being fetched. */
  loading: boolean;
  /** Why the fetch failed, or null. */
  error: string | null;
  /** Runs the fetch again after it failed. */
  reload: () => void;
  /** Checks locally, then saves through the API; returns why it failed. */
  addCustom: (label: string, icon: IconName) => Promise<Result>;
  /** Deletes through the API; returns why it failed. */
  removeCustom: (id: string) => Promise<Result>;
}

export const TaskTypesContext = createContext<TaskTypesStore | null>(null);

export function useTaskTypes(): TaskTypesStore {
  const ctx = useContext(TaskTypesContext);
  if (!ctx) throw new Error("useTaskTypes must be used inside <TaskTypesProvider>");
  return ctx;
}
