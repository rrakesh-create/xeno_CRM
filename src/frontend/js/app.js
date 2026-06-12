document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const chatHistory = document.getElementById('chat-history');
  
  let currentCampaignDraft = null;

  // Append message to chat
  function appendMessage(text, sender, isHtml = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = \`message \${sender}\`;
    if (isHtml) {
      msgDiv.innerHTML = text;
    } else {
      msgDiv.textContent = text;
    }
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  // Feature 2 & 3: Chat intent to SQL and Predictive Forecast
  async function handleChat() {
    const intent = chatInput.value.trim();
    if (!intent) return;
    
    appendMessage(intent, 'user');
    chatInput.value = '';

    try {
      const res = await fetch('http://localhost:8000/api/campaigns/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent })
      });
      const data = await res.json();
      
      currentCampaignDraft = {
        intent,
        template: data.template,
        segmentRules: data.segment.rules
      };

      const htmlResponse = \`
        <p>I found <strong>\${data.segment.size} customers</strong> matching your request.</p>
        <p><em>Draft Message:</em> "\${data.template}"</p>
        <div class="predictive-card">
          <h4>Predictive Forecast</h4>
          <p>\${data.forecast.message}</p>
        </div>
        <button class="launch-btn" id="launch-btn">Launch Campaign</button>
      \`;
      
      appendMessage(htmlResponse, 'ai', true);
      
      // Bind launch button
      document.getElementById('launch-btn').addEventListener('click', launchCampaign);
      
    } catch (err) {
      appendMessage('Error reaching CRM backend.', 'ai');
    }
  }

  // Feature 4 part 1: Launch Campaign
  async function launchCampaign() {
    if (!currentCampaignDraft) return;
    
    appendMessage('Launching campaign...', 'user');
    
    try {
      const res = await fetch('http://localhost:8000/api/campaigns/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentCampaignDraft)
      });
      const data = await res.json();
      appendMessage(\`Campaign successfully dispatched to \${data.size} users. Watch the visualizer!\`, 'ai');
    } catch (err) {
      appendMessage('Failed to launch campaign.', 'ai');
    }
  }

  chatSend.addEventListener('click', handleChat);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChat();
  });

  // Feature 4 part 2: Decoupled Async Callback Lifecycle Visualizer
  const evtSource = new EventSource('http://localhost:8000/api/stream');
  
  evtSource.addEventListener('message_update', (e) => {
    const data = JSON.parse(e.data);
    const { id, customerName, status } = data;
    
    // Remove existing card if present
    const existingCard = document.getElementById(\`card-\${id}\`);
    if (existingCard) {
      existingCard.remove();
    }
    
    // Create new card
    const card = document.createElement('div');
    card.className = 'msg-card';
    card.id = \`card-\${id}\`;
    card.textContent = \`To: \${customerName}\`;
    
    // Append to correct column
    const col = document.getElementById(\`col-\${status}\`);
    if (col) {
      col.querySelector('.cards').appendChild(card);
    }
  });

  // Feature 5: AI Customer Diagnostic Hub
  const diagContainer = document.getElementById('diagnostic-container');
  
  async function loadCustomersForDiag() {
    const res = await fetch('http://localhost:8000/api/customers');
    const customers = await res.json();
    
    const listDiv = document.createElement('div');
    listDiv.className = 'customer-list';
    
    // Only show first 10 for UI brevity
    customers.slice(0, 10).forEach(c => {
      const pill = document.createElement('div');
      pill.className = 'customer-pill';
      pill.textContent = c.name;
      pill.onclick = () => fetchDiagnostic(c.id, c.name);
      listDiv.appendChild(pill);
    });
    
    // Insert before placeholder
    diagContainer.parentNode.insertBefore(listDiv, diagContainer);
  }
  
  async function fetchDiagnostic(id, name) {
    diagContainer.innerHTML = '<p>Analyzing historical data...</p>';
    
    try {
      const res = await fetch(\`http://localhost:8000/api/diagnostics/\${id}\`);
      const data = await res.json();
      const diag = data.diagnostic;
      
      diagContainer.innerHTML = \`
        <h3>Analysis for \${name}</h3>
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 16px;">Overall Read Rate: \${data.openRate}%</p>
        
        <div class="diag-section">
          <h4>Found Reasons (Explicit Feedback)</h4>
          \${diag.foundReasons.map(r => \`<div class="diag-box">\${r}</div>\`).join('')}
        </div>
        
        <div class="diag-section">
          <h4>Guessed Reasons (Behavioral)</h4>
          \${diag.guessedReasons.map(r => \`<div class="diag-box">\${r}</div>\`).join('')}
        </div>
        
        <div class="diag-section">
          <h4>Strategic Alternatives</h4>
          \${diag.alternatives.map(r => \`<div class="diag-box" style="border-color: #10b981;">\${r}</div>\`).join('')}
        </div>
      \`;
    } catch(err) {
      diagContainer.innerHTML = '<p>Error fetching diagnostic.</p>';
    }
  }

  // Init
  loadCustomersForDiag();
});
