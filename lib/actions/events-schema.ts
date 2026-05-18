import { z } from "zod"

// Exported separately from the "use server" file so non-function values
// don't violate the Next.js "use server" constraint in webpack builds.

const StopSchema = z.object({
  placeId: z.string(),
  name:    z.string().min(1),
  address: z.string(),
  lat:     z.number(),
  lng:     z.number(),
})

const QuestionSchema = z.object({
  text:    z.string().min(1, "Question text is required").max(200),
  type:    z.enum(["single", "multiple"]),
  options: z.array(z.string().min(1).max(120)).min(2).max(8),
})

export const CreateEventSchema = z.object({
  title:           z.string().trim().min(1, "Title is required").max(120),
  description:     z.string().trim().max(500).optional(),
  date:            z.string().optional(),
  type:            z.enum(["night_out", "lunch", "coffee", "team_building", "activity", "other"]),
  alcoholFriendly: z.boolean(),
  pollQuestions:   z.array(QuestionSchema).max(10),
  stops:           z.array(StopSchema).max(20),
})

export type CreateEventInput = z.infer<typeof CreateEventSchema>
