# Error Tracking and Alert System

Monitors API request failures and sends email alerts for suspicious activity.

## API Usage

Make POST request to api/submit endpoint
for testing use your email in body while making request
change Authorization(password-> pasjk) or Content-Type and make 5 request within 10 min
an alert mail will be received on the provided address
```bash
curl --location 'https://alertsystem.up.railway.app/api/submit' \
--header 'Authorization: password' \
--header 'Content-Type: application/json' \
--data-raw '{"email": "example@gmail.com"}'
```

View metrics:
```bash
GET https://alertsystem.up.railway.app/api/metrics
```

## Setup locally

1. Clone and install:
```bash
git clone [repository-url]
npm install
```


3.setup azure cache for redis:
Log in to your Azure portal.
Navigate to "Create a Resource" > "Databases" > "Azure Cache for Redis".      
Configure the settings (e.g., pricing tier, resource group, and region), then create the instance.
Copy the Host Name and Access Key from the "Access Keys" section.

4.setup smtp server:
Navigate to Google Account Settings > Security.
Enable 2-Step Verification.
In the Security section, go to App Passwords.
Select the app (e.g., "Mail") and device (e.g., "Windows PC"), then generate an app password.
Copy the generated password.


3. Create `.env` file:
   
```env
MONGODB_URI=mongodb+srv://[your-connection-string]
AZURE_REDIS_HOST=your-redis-host
REDIS_URL=redis://localhost:6379
AZURE_REDIS_KEY=your-redis-key
AZURE_REDIS_PORT=6380
NODE_ENV=development
PORT=3000
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAIL=alert-recipient@gmail.com
ALERT_THRESHOLD=5
TIME_WINDOW=600000
```

3. Start server:
```bash
# Development
npm run dev

# Production
npm start
```

