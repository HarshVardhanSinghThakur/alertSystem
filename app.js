require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./config/database');
const SecurityMonitor = require('./services/SecurityMonitor');
const EmailService = require('./services/EmailService');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.connectDB();
  }

  async connectDB() {
    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection failed:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json({ limit: '10kb' }));
  }

  validateToken(req, res, next) {
    const token = req.headers.authorization;
    const header = req.headers['content-type'];;

    if (token != "password") {
      const error = new Error('Invalid token');
      error.status = 401;
      return this.handleFailedRequest(error, req, res);
    }
    if (header!== 'application/json'){
      const error = new Error('Invalid header type');
      error.status = 401;
      return this.handleFailedRequest(error, req, res);
    }

    next();
  }

  async handleFailedRequest(error, req, res) {
    const ip =
      process.env.NODE_ENV === 'development'
        ? '192.168.1.2'
        : req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    const endpoint = req.path; // Get endpoint from request
    const reason = error.message || 'Unknown reason';
    const recipientEmail = req.body.email || req.headers['x-alert-email'];
    
    try {
      const { shouldAlert } = await SecurityMonitor.trackFailedAttempt(ip, endpoint, reason);
      if (shouldAlert) {
        await EmailService.sendAlert(ip,reason,recipientEmail);
      }

      res.status(error.status || 400).json({
        error: error.message || 'Request failed'
      });
    } catch (err) {
      console.error('Error handling failed request:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  setupRoutes() {
    // Protected endpoint
    this.app.post('/api/submit',
      this.validateToken.bind(this),
      
      (req, res) => {
        console.log('successful post request'),
        res.json({ success: true });
      }
    );

    // Metrics endpoint
    this.app.get('/api/metrics', async (req, res) => {
      try {
        const metrics = await SecurityMonitor.getMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
      }
    });
  }

  setupErrorHandling() {
    // Handle 404
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  start() {
    const port = process.env.PORT || 3000;
    this.app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
}

module.exports = new App().app;

// Start the server
if (require.main === module) {
  new App().start();
}