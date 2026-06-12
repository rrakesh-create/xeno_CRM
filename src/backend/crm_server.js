const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { db, all, get, run } = require('./db');
const ai = require('./ai_helper');

const app = express();
const PORT = 8000;
const CHANNEL_SERVICE_URL = 'http://localhost:8001/api/send';

app.use(cors());
app.use(express.json());

// --- SSE Setup for Realtime UI ---
let clients = [];
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

function broadcast(event, data) {
  clients.forEach(client => {
    client.write(\`event: \${event}\n\`);
    client.write(\`data: \${JSON.stringify(data)}\n\n\`);
  });
}

// --- APIs ---

// 1. Get Customers (for dashboard)
app.get('/api/customers', async (req, res) => {
  const customers = await all('SELECT * FROM customers ORDER BY created_at DESC LIMIT 50');
  res.json(customers);
});

// 2. Feature 2: Conversational Campaign Builder
app.post('/api/campaigns/build', async (req, res) => {
  const { intent } = req.body;
  if (!intent) return res.status(400).json({ error: 'Intent is required' });

  // Use AI to parse intent into rules
  const rules = ai.parseIntentToSQL(intent);
  
  // Build SQL dynamically based on rules
  let sql = 'SELECT id, name FROM customers WHERE 1=1';
  let params = [];
  
  if (rules.location) {
    sql += ' AND location = ?';
    params.push(rules.location);
  }
  
  // Calculate Audience Size
  const audience = await all(sql, params);
  
  // Calculate average order value for this segment
  let aov = 0;
  if (audience.length > 0) {
    const custIds = audience.map(a => \`'\${a.id}'\`).join(',');
    const stats = await get(\`SELECT AVG(amount) as avg_spend FROM orders WHERE customer_id IN (\${custIds})\`);
    aov = stats.avg_spend || 1500;
  }
  
  // Draft message
  const template = ai.draftCampaignMessage(intent);
  
  // Feature 3: Predictive Forecast
  const forecast = ai.generatePredictiveForecast(audience.length, aov);
  
  res.json({
    segment: { rules, size: audience.length, sample: audience.slice(0, 5) },
    template,
    forecast
  });
});

// Launch Campaign & Trigger Channel Service
app.post('/api/campaigns/launch', async (req, res) => {
  const { intent, template, segmentRules } = req.body;
  
  // Resolve Audience
  let sql = 'SELECT id, name, phone, email FROM customers WHERE 1=1';
  let params = [];
  if (segmentRules.location) {
    sql += ' AND location = ?';
    params.push(segmentRules.location);
  }
  const audience = await all(sql, params);
  
  const campaignId = crypto.randomUUID();
  await run('INSERT INTO campaigns (id, name, segment_query, message_template, channel, status) VALUES (?, ?, ?, ?, ?, ?)',
    [campaignId, intent, JSON.stringify(segmentRules), template, 'WhatsApp', 'Sending']
  );
  
  res.json({ success: true, campaignId, size: audience.length });
  
  // Dispatch asynchronously
  for (const customer of audience) {
    const commId = crypto.randomUUID();
    const personalizedMessage = template.replace('{{name}}', customer.name);
    
    await run('INSERT INTO communications (id, campaign_id, customer_id, message_body, status) VALUES (?, ?, ?, ?, ?)',
      [commId, campaignId, customer.id, personalizedMessage, 'Queued']
    );
    
    broadcast('message_update', { id: commId, customerName: customer.name, status: 'Queued' });
    
    // Send to Channel Service
    try {
      await fetch(CHANNEL_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commId,
          campaignId,
          recipient: customer.phone,
          message: personalizedMessage,
          channel: 'WhatsApp'
        })
      });
    } catch (err) {
      console.error('Failed to dispatch to Channel Service:', err.message);
    }
  }
});

// Feature 4: Webhook Receipts endpoint (Decoupled Visualizer)
app.post('/api/receipts', async (req, res) => {
  const { communication_id, status, timestamp } = req.body;
  
  // Update DB
  await run('UPDATE communications SET status = ? WHERE id = ?', [status, communication_id]);
  await run('INSERT INTO receipts (id, communication_id, status, timestamp) VALUES (?, ?, ?, ?)',
    [crypto.randomUUID(), communication_id, status, timestamp]
  );
  
  // Fetch communication to get customer details for UI
  const comm = await get(\`
    SELECT c.id, cust.name as customerName 
    FROM communications c 
    JOIN customers cust ON c.customer_id = cust.id 
    WHERE c.id = ?\`, [communication_id]);
    
  if (comm) {
    // Broadcast status to Frontend for visualizer
    broadcast('message_update', { id: comm.id, customerName: comm.customerName, status });
  }
  
  res.status(200).send('OK');
});

// Feature 5: AI Customer Diagnostic Hub
app.get('/api/diagnostics/:customerId', async (req, res) => {
  const { customerId } = req.params;
  
  // Fetch Historical Orders and Reviews
  const orders = await all('SELECT review_text as text, rating FROM orders WHERE customer_id = ? AND rating IS NOT NULL', [customerId]);
  
  // Fetch Comm stats (Mocked Open Rate based on past communications)
  const commsCount = await get('SELECT COUNT(*) as c FROM communications WHERE customer_id = ?', [customerId]);
  const readCount = await get('SELECT COUNT(*) as c FROM receipts r JOIN communications c ON r.communication_id = c.id WHERE c.customer_id = ? AND r.status = "Read"', [customerId]);
  
  let openRate = 0;
  if (commsCount.c > 0) {
    openRate = Math.floor((readCount.c / commsCount.c) * 100);
  } else {
    openRate = Math.floor(Math.random() * 100); // randomize if no history
  }
  
  const diagnostic = ai.generateDiagnosticHub(orders, openRate);
  
  res.json({ customerId, diagnostic, openRate });
});

app.listen(PORT, () => {
  console.log(\`[CRM Server] Running on http://localhost:\${PORT}\`);
});
