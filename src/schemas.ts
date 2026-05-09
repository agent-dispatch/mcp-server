import { z } from "zod";

export const dispatchTaskInputSchema = z.object({
  provider: z.string(),
  account_profile: z.string(),
  capability: z.string(),
  task_type: z.string(),
  target: z.object({
    mode: z.string(),
    details: z.record(z.unknown()).optional()
  }),
  input: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional()
});

export const listCapabilitiesInputSchema = z.object({
  provider: z.string().optional()
});

export const taskIdInputSchema = z.object({
  task_id: z.string()
});

export const getTaskLogsInputSchema = z.object({
  task_id: z.string(),
  cursor: z.number().optional(),
  limit: z.number().optional()
});

export const mcpToolSchemas = {
  list_providers: z.object({}),
  list_capabilities: listCapabilitiesInputSchema,
  list_account_profiles: z.object({}),
  dispatch_task: dispatchTaskInputSchema,
  get_task_status: taskIdInputSchema,
  get_task_logs: getTaskLogsInputSchema,
  get_task_result: taskIdInputSchema,
  cancel_task: taskIdInputSchema
};
