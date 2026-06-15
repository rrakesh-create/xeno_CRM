import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

export default function AICampaignCreator() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Welcome to your D2C marketing control panel. Define the shopper category you would like to engage today.' }
  ]);
  const location = useLocation();
  const [input, setInput] = useState(location.state?.prompt || '');
  const [segmentData, setSegmentData] = useState(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [tone, setTone] = useState('Balanced');
  const [channel, setChannel] = useState('whatsapp');
  const [isLoading, setIsLoading] = useState(false);

  // Debounced Tone Modulator Execution Sequence
  useEffect(() => {
    if (segmentData) {
      const delayHandler = setTimeout(() => {
        regenerateMessageCopy();
      }, 400);
      return () => clearTimeout(delayHandler);
    }
  }, [tone, channel]);

  const handleSendMessageIntent = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    const currentInput = input;
    setInput('');

    try {
      // Step 1: Hit Gemini natural language segment builder endpoint
      const segRes = await axios.post('http://localhost:8000/ai/segment', { prompt: currentInput });
      setSegmentData(segRes.data);
      setMessages(prev => [...prev, { sender: 'ai', text: `Category isolated: "${segRes.data.label}". ${segRes.data.explanation} This campaign will be sent to ${segRes.data.customer_count} customers.` }]);

      // Step 2: Extract campaign copywriting options
      const copyRes = await axios.post('http://localhost:8000/ai/draft-message', {
        label: segRes.data.label, channel: channel, tone: tone
      });
      setMessageDraft(copyRes.data.message);

    } catch (err) {
      console.error("AI Generation loop error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateMessageCopy = async () => {
    if (!segmentData) return;
    
    setIsLoading(true);
    setMessageDraft("Applying new tone profile and regenerating campaign draft...");
    
    try {
      const copyRes = await axios.post('http://localhost:8000/ai/draft-message', {
        label: segmentData.label, channel: channel, tone: tone
      });
      setMessageDraft(copyRes.data.message);
    } catch (err) {
      console.error(err);
      setMessageDraft("Failed to generate campaign draft. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const executeOneClickGroupBlast = async () => {
    if (!segmentData || !messageDraft) return;
    setIsLoading(true);
    try {
      const draftCampaign = await axios.post('http://localhost:8000/campaigns', {
        name: `Blast for ${segmentData.label}`,
        segment_label: segmentData.label,
        segment_filters: segmentData.filters,
        message_template: messageDraft,
        channel: channel,
        audience_size: segmentData.customer_count || 0
      });

      await axios.post(`http://localhost:8000/campaigns/${draftCampaign.data.id}/send`);
      setMessages(prev => [...prev, { sender: 'ai', text: '🚀 Mass category blast successfully dispatched! Monitor delivery metrics inside the Campaigns panel.' }]);
      setSegmentData(null);
      setMessageDraft('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="campaign-creator-layout">
      <h2 className="campaign-creator-header">Conversational AI Campaign Creator</h2>
      
      <div className="campaign-creator-grid">
        {/* Left Column */}
        <div className="campaign-left-panel">
          <div className="chat-container">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-message-wrapper ${m.sender}`}>
                <span className={`chat-message ${m.sender}`}>
                  {m.text}
                </span>
              </div>
            ))}
          </div>

          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px'}}>
            {['Festival offer to all customers', 'Target high-value shoppers', 'Win-back churned users', 'Cart abandoners follow-up'].map((quickPrompt, i) => (
              <button 
                key={i}
                onClick={() => setInput(quickPrompt)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  background: 'var(--surface-border)',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: 'var(--text-main)'
                }}
              >
                {quickPrompt}
              </button>
            ))}
          </div>

          <div className="input-area" style={{marginTop: 0}}>
            <input 
              id="campaign-prompt-input"
              className="prompt-input" 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Type marketing objective..." 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessageIntent()} 
            />
            <button id="btn-send-prompt" onClick={handleSendMessageIntent} disabled={isLoading} className="btn-send">
              {isLoading ? 'Processing...' : 'Send Prompt'}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="campaign-right-panel">
          <div className="draft-blueprint" style={{marginBottom: 0, flex: 1}}>
            <h4>Output Template Block</h4>
            <textarea 
              id="campaign-blueprint-textarea"
              className="blueprint-textarea" 
              rows={10} 
              value={messageDraft} 
              onChange={(e) => setMessageDraft(e.target.value)} 
              placeholder="Your campaign message will appear here after generating a prompt..."
              disabled={!messageDraft && !isLoading}
            />
            
            <div className="blueprint-controls">
              <div className="control-group">
                <label>Tone Slider:</label>
                <input 
                  id="tone-slider"
                  type="range" min="1" max="10" defaultValue="5"
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val <= 3) setTone('Highly Professional & Direct');
                    else if (val <= 6) setTone('Conversational & Helpful');
                    else if (val <= 8) setTone('Friendly & Enthusiastic');
                    else setTone('Playful & Edgy');
                  }} 
                />
                <span style={{fontWeight: 600, color: 'var(--primary)', minWidth: '180px'}}>{tone}</span>
              </div>
              <div className="control-group">
                <label>Channel Node Switcher:</label>
                <select id="channel-switcher" value={channel} onChange={(e) => setChannel(e.target.value)}>
                  <option value="whatsapp">WhatsApp App Link</option>
                  <option value="sms">SMS Text Network</option>
                  <option value="email">Electronic Mail</option>
                  <option value="rcs">RCS Rich Media</option>
                </select>
              </div>
            </div>
            
            <button id="btn-launch-campaign" onClick={executeOneClickGroupBlast} disabled={isLoading || !messageDraft} className="btn-launch">
              🚀 Launch Campaign (One-Click Bulk Send)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
