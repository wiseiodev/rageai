import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const hostAppEnum = pgEnum('host_app', ['claude', 'codex'])
export const windowKindEnum = pgEnum('window_kind', ['daily', 'weekly', 'all_time'])
export const intensityEnum = pgEnum('rage_intensity', ['mild', 'standard', 'strong'])

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    userIdIdx: index('session_user_id_idx').on(table.userId),
  }),
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerAccountIdx: uniqueIndex('account_provider_account_idx').on(
      table.providerId,
      table.accountId,
    ),
    userIdIdx: index('account_user_id_idx').on(table.userId),
  }),
)

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const apiKey = pgTable(
  'api_key',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    start: text('start'),
    prefix: text('prefix'),
    key: text('key').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    refillInterval: integer('refill_interval'),
    refillAmount: integer('refill_amount'),
    lastRefillAt: timestamp('last_refill_at', { withTimezone: true }),
    enabled: boolean('enabled').notNull().default(true),
    rateLimitEnabled: boolean('rate_limit_enabled').notNull().default(true),
    rateLimitTimeWindow: integer('rate_limit_time_window'),
    rateLimitMax: integer('rate_limit_max'),
    requestCount: integer('request_count').notNull().default(0),
    remaining: integer('remaining'),
    lastRequest: timestamp('last_request', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    permissions: text('permissions'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  },
  (table) => ({
    userIdIdx: index('api_key_user_id_idx').on(table.userId),
  }),
)

export const rageProfile = pgTable(
  'rage_profile',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    handle: text('handle').notNull(),
    handleHidden: boolean('handle_hidden').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    handleIdx: uniqueIndex('rage_profile_handle_idx').on(table.handle),
  }),
)

export const deviceAuthRequest = pgTable(
  'device_auth_request',
  {
    id: text('id').primaryKey(),
    deviceCodeHash: text('device_code_hash').notNull().unique(),
    userCodeHash: text('user_code_hash').notNull().unique(),
    installIdHash: text('install_id_hash').notNull(),
    deviceLabel: text('device_label').notNull(),
    status: text('status', { enum: ['pending', 'approved', 'denied', 'expired'] })
      .notNull()
      .default('pending'),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    apiKeyId: text('api_key_id'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index('device_auth_request_status_idx').on(table.status),
    expiresAtIdx: index('device_auth_request_expires_at_idx').on(table.expiresAt),
  }),
)

export const submission = pgTable(
  'submission',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    installIdHash: text('install_id_hash').notNull(),
    ipBucketHash: text('ip_bucket_hash'),
    hostApp: hostAppEnum('host_app').notNull(),
    handle: text('handle').notNull(),
    pluginVersion: text('plugin_version').notNull(),
    rulesetVersion: text('ruleset_version').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    accepted: boolean('accepted').notNull().default(true),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userInstallHostIdx: index('submission_user_install_host_idx').on(
      table.userId,
      table.installIdHash,
      table.hostApp,
    ),
    createdAtIdx: index('submission_created_at_idx').on(table.createdAt),
  }),
)

export const leaderboardRow = pgTable(
  'leaderboard_row',
  {
    id: text('id').primaryKey(),
    submissionId: text('submission_id')
      .notNull()
      .references(() => submission.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    installIdHash: text('install_id_hash').notNull(),
    handle: text('handle').notNull(),
    hostApp: hostAppEnum('host_app').notNull(),
    window: windowKindEnum('window').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }),
    windowEnd: timestamp('window_end', { withTimezone: true }),
    userMessageCount: integer('user_message_count').notNull(),
    userWordCount: integer('user_word_count').notNull(),
    scoredProfanityCount: integer('scored_profanity_count').notNull(),
    ratePerThousandWords: numeric('rate_per_thousand_words', {
      precision: 12,
      scale: 2,
    }).notNull(),
    topIntensity: intensityEnum('top_intensity'),
    rankEligible: boolean('rank_eligible').notNull(),
    hidden: boolean('hidden').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    replacementKey: uniqueIndex('leaderboard_row_replacement_key').on(
      table.userId,
      table.installIdHash,
      table.hostApp,
      table.window,
    ),
    rankingIdx: index('leaderboard_row_ranking_idx').on(
      table.window,
      table.hostApp,
      table.rankEligible,
      table.hidden,
      table.ratePerThousandWords,
    ),
  }),
)

export const moderationAction = pgTable('moderation_action', {
  id: text('id').primaryKey(),
  adminUserId: text('admin_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  targetType: text('target_type', { enum: ['handle', 'score'] }).notNull(),
  targetId: text('target_id').notNull(),
  action: text('action').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const privateAbuseBucket = pgTable(
  'private_abuse_bucket',
  {
    bucketHash: text('bucket_hash').notNull(),
    bucketKind: text('bucket_kind', {
      enum: ['ip_day', 'ip_month', 'install', 'account'],
    }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.bucketHash, table.bucketKind] }),
    expiresAtIdx: index('private_abuse_bucket_expires_at_idx').on(table.expiresAt),
  }),
)
