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

module.exports = linkSchema;