/**
 * Input validation middleware — security.md §3.
 * Zod schema validation: reject unknown fields, enforce enums server-side.
 * SKILL-security.md §3: "reject extra/unknown fields"
 */

const { ZodError } = require('zod');

/**
 * validate — wraps a Zod schema into Express middleware.
 *
 * @param {import('zod').ZodObject} schema
 * @param {'body' | 'query' | 'params'} source - default 'body'
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      // .strict() rejects unknown/extra fields — security.md §3
      const parsed = schema.strict().parse(req[source]);
      req[source] = parsed; // Replace with sanitized/typed data
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input.',
            details,
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Internal server error.' },
      });
    }
  };
}

module.exports = { validate };
