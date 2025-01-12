const Redis = require('ioredis');
const FailedRequest = require('../models/FailedRequest');

class SecurityMonitor {
    constructor() {
        // Use Azure Redis connection URL
        this.redis = new Redis({
            host: process.env.AZURE_REDIS_HOST || 'redis://localhost:6379',
            port: 6380, // Default Redis port
            password: process.env.AZURE_REDIS_KEY || 'your-access-key', // Set password
            tls: {} // Azure Redis requires TLS
        });

        this.WINDOW_SIZE = 10 * 60; // 10 minutes in seconds
        this.THRESHOLD = 5;
    }

    async trackFailedAttempt(ip, endpoint, reason) {
        const key = `failed:${ip}`;
        const now = Date.now();

        try {
            await this.redis.zadd(key, now, now.toString());
            const windowStart = now - (this.WINDOW_SIZE * 1000);
            await this.redis.zremrangebyscore(key, '-inf', windowStart);
            await this.redis.expire(key, this.WINDOW_SIZE);

            const attempts = await this.redis.zcard(key);
            const shouldAlert = attempts >= this.THRESHOLD && !(await this.redis.get(`alert:${ip}`));

            if (shouldAlert) {
                await this.redis.set(`alert:${ip}`, '1', 'EX', this.WINDOW_SIZE);
            }
            console.log({
                ip,
                attemptCount: attempts,
                shouldAlert: shouldAlert

            });

            await FailedRequest.create({
                ip,
                endpoint, // Add endpoint
                reason,
                timestamp: new Date(now),
                attemptCount: attempts
            });

            return { attempts, shouldAlert };
        } catch (error) {
            console.error('Error tracking failed attempt:', error);
            throw error;
        }
    }

    async getMetrics() {
        const windowStart = new Date(Date.now() - (this.WINDOW_SIZE * 1000));
        return await FailedRequest.aggregate([
            {
                $match: { timestamp: { $gte: windowStart } }
            },
            {
                $group: {
                    _id: '$ip',
                    totalAttempts: { $sum: 1 },
                    firstAttempt: { $min: '$timestamp' },
                    lastAttempt: { $max: '$timestamp' }
                }
            },
            {
                $sort: { totalAttempts: -1 }
            }
        ]);
    }
}

module.exports = new SecurityMonitor();
