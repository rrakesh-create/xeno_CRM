const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8001;
const CRM_WEBHOOK_URL = 'http://localhost:8000/api/receipts';

app.use(cors());
app.use(express.json());

// Helper to simulate webhook calls back to CRM
async function sendReceipt(communicationId, status) {
  try {
    const fetch = (await import('node-fetch')).default;
    await fetch(CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communication_id: communicationId,
        status: status,
        timestamp: new Date().toISOString()
      })
    });
    console.log(`[Channel Service] Webhook sent: ${communicationId} -> ${status}`);
  } catch (err) {
    console.error(`[Channel Service] Webhook failed for ${communicationId}:`, err.message);
  }
}

// Simulated Background Worker
function simulateMessageLifecycle(communication) {
  const commId = communication.id;
  
  // Step 1: Sent -> Delivered (or Failed) after 1-2 seconds
  setTimeout(() => {
    const isFailure = Math.random() < 0.1; // 10% failure rate
    
    if (isFailure) {
      sendReceipt(commId, 'Failed');
      return; // Stop lifecycle
    }
    
    sendReceipt(commId, 'Delivered');
    
    // Step 2: Delivered -> Read after 2-4 seconds
    setTimeout(() => {
      sendReceipt(commId, 'Read');
      
      // Step 3: Read -> Clicked after 3-5 seconds (50% probability)
      setTimeout(() => {
        const isClicked = Math.random() < 0.5;
        if (isClicked) {
          sendReceipt(commId, 'Clicked');
        }
      }, 3000 + Math.random() * 2000);
      
    }, 2000 + Math.random() * 2000);
    
  }, 1000 + Math.random() * 1000);
}

// Receive outgoing message from CRM
app.post('/api/send', (req, res) => {
  const communication = req.body;
  if (!communication || !communication.id) {
    return res.status(400).json({ error: 'Missing communication object' });
  }

  // Acknowledge immediately (202 Accepted)
  res.status(202).json({ message: 'Accepted for processing' });
  
  // Immediately mark as Sent
  sendReceipt(communication.id, 'Sent');

  // Trigger async lifecycle
  simulateMessageLifecycle(communication);
});

app.listen(PORT, () => {
  console.log(`[Channel Service] Stub server running on http://localhost:${PORT}`);
});
