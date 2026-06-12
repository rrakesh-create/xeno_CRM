# CRM Backend

This is the primary FastAPI service for Xeno CRM.

## Deployment Notes
1. Set the following Environment Variables in your hosting provider (e.g., Render):
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `CHANNEL_SERVICE_URL`: The URL of your deployed Channel Service (e.g., `https://channel-service-xyz.onrender.com`).
   - `CRM_RECEIPT_URL`: The public URL of this CRM Backend appended with `/receipts` (e.g., `https://crm-backend-xyz.onrender.com/receipts`).

2. Start Command:
   `uvicorn main:app --host 0.0.0.0 --port 10000`

## Seeding Data
Before first use or after deployment, make sure to execute the seed script to populate the database with shoppers and initial campaigns:
`python seed.py`
