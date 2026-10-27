const { z } = require("zod");

const linkSchema = z.object({
  target_url: z.url({
    protocol: /^https?$/,
    hostname: z.regexes.domain
  }),

  code: z.string()
    .regex(/^[A-Za-z0-9_-]{3,16}$/)
    .optional(),

  expires_at: z.iso.datetime({ offset: true })
    .refine((date) => new Date(date) > new Date(), {
      message: "Expiry must be in the future"
    })
    .optional()
});

const clickQuerySchema = z.object({
  after: z.coerce.number().int().positive().safe().optional(),

  limit: z.coerce.number().int().min(1).max(100).default(10)
});

module.exports = {
  linkSchema,
  clickQuerySchema
};