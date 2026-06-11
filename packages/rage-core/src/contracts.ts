import { z } from 'zod'
import { RULESET_VERSION } from './types.js'

export const hostAppSchema = z.enum(['claude', 'codex'])
export const windowKindSchema = z.enum(['daily', 'weekly', 'all_time'])
export const intensitySchema = z.enum(['mild', 'standard', 'strong'])

export const rageWindowSchema = z.object({
  window: windowKindSchema,
  windowStart: z.string().datetime().nullable(),
  windowEnd: z.string().datetime().nullable(),
  userMessageCount: z.number().int().nonnegative(),
  userWordCount: z.number().int().nonnegative(),
  scoredProfanityCount: z.number().int().nonnegative(),
  ratePerThousandWords: z.number().nonnegative(),
  topIntensity: intensitySchema.nullable(),
  rankEligible: z.boolean(),
})

export const publicPublishPayloadSchema = z.object({
  handle: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/),
  hostApp: hostAppSchema,
  pluginVersion: z.string().min(1),
  rulesetVersion: z.literal(RULESET_VERSION),
  generatedAt: z.string().datetime(),
  windows: z.array(rageWindowSchema).min(1),
})

export const privateAntiAbuseSchema = z.object({
  installId: z.string().uuid(),
})

export const publishRequestSchema = z.object({
  publicPayload: publicPublishPayloadSchema,
  privateAntiAbuse: privateAntiAbuseSchema,
})

export const publishBatchRequestSchema = z.object({
  publicPayloads: z.array(publicPublishPayloadSchema).min(1).max(2),
  privateAntiAbuse: privateAntiAbuseSchema,
})

export const publishResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  leaderboardUrl: z.string().url().optional(),
  published: z.array(hostAppSchema).optional(),
  shareUrls: z
    .array(
      z.object({
        window: windowKindSchema,
        url: z.string().url(),
      }),
    )
    .optional(),
})

export type PublicPublishPayload = z.infer<typeof publicPublishPayloadSchema>
export type PublishRequest = z.infer<typeof publishRequestSchema>
export type PublishBatchRequest = z.infer<typeof publishBatchRequestSchema>
export type PublishResponse = z.infer<typeof publishResponseSchema>
