
const express = require('express')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const path = require('node:path')

const linkRoutes = require('./routes/links')
const pool = require('./db/pool')

const app = express()

app.use(express.json())

// Load Swagger documentation
const swaggerDocument = YAML.load(
  path.join(__dirname, '../docs/openapi.yaml')
)

// Swagger must come before the redirect route
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.status(200).json({ status: 'ok' })
  } catch (_error) {
    res.status(503).json({ status: 'error', error: 'Database unavailable' })
  }
})

// API routes
app.use('/', linkRoutes)

// JSON error handling
app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON payload'
    })
  }

  const status = err.status || 500

  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message
  })
})

module.exports = app
