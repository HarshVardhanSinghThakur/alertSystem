// services/EmailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendAlert(ip,reason,recipientEmail) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: recipientEmail,
      subject: `Security Alert: Multiple Failed Requests from ${ip}`,
      html: `
        <h2>Security Alert</h2>
        <p>Multiple failed authentication attempts detected.</p>
        <ul>
          <li>IP Address: ${ip}</li>
          <li>Time: ${new Date().toLocaleString()}</li>
          <li>Issue: ${reason}</li>
          <li>Threshold: 5 attempts within 10 minutes</li>
        </ul>
        <p>Please check system logs for more details.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Alert email sent for IP: ${ip}`);
    } catch (error) {
      console.error('Failed to send alert email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();