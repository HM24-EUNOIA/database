import { z } from 'zod';

export const Subtask = z.object({
    name: z.string(),
    description: z.string(),
    duration: z.number(),
})

export const Assignment = z.object({
    _id: z.number(),
    name: z.string(),
    due_date: z.string().datetime(),
    description: z.string(),
    subtasks: z.array(Subtask),
});

export const User = z.object({
    email: z.string().email(),
    canvas_token: z.string(),
    assignments: z.array(Assignment),
});

export type User = z.infer<typeof User>

export type Assignment = z.infer<typeof Assignment>

export type Subtask = z.infer<typeof Subtask>
