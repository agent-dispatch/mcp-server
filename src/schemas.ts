import { z } from "zod";

export const dispatchTaskInputSchema = z.object({
  provider: z.string(),
  account_profile: z.string(),
  capability: z.string(),
  backend: z.string().optional(),
  task_type: z.string(),
  target: z.object({
    mode: z.string(),
    protocol: z.string().optional(),
    details: z.record(z.unknown()).optional()
  }),
  input: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional()
});

export const listCapabilitiesInputSchema = z.object({
  provider: z.string().optional()
});

export const spawnCloudAgentInputSchema = z.object({
  instruction: z.string().optional(),
  runtime: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  protocol: z.string().optional(),
  framework: z.string().optional(),
  model: z.union([z.string(), z.record(z.unknown())]).optional(),
  runtime_tools: z.record(z.unknown()).optional(),
  runtimeArn: z.string().optional(),
  runtime_arn: z.string().optional(),
  ecrImageUri: z.string().optional(),
  ecr_image_uri: z.string().optional(),
  executionRoleArn: z.string().optional(),
  execution_role_arn: z.string().optional(),
  environmentVariables: z.record(z.unknown()).optional(),
  environment_variables: z.record(z.unknown()).optional(),
  provider: z.string().optional(),
  account_profile: z.string().optional(),
  target: z.object({
    mode: z.string().optional(),
    protocol: z.string().optional(),
    details: z.record(z.unknown()).optional()
  }).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const taskIdInputSchema = z.object({
  task_id: z.string()
});

export const getTaskLogsInputSchema = z.object({
  task_id: z.string(),
  cursor: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(64_000).optional()
});

export const mcpToolSchemas = {
  list_providers: z.object({}),
  list_capabilities: listCapabilitiesInputSchema,
  list_account_profiles: z.object({}),
  spawn_cloud_agent: spawnCloudAgentInputSchema,
  dispatch_task: dispatchTaskInputSchema,
  get_task_status: taskIdInputSchema,
  get_task_logs: getTaskLogsInputSchema,
  get_task_result: taskIdInputSchema,
  cancel_task: taskIdInputSchema
};
