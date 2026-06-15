import React, { useState, useEffect } from 'react';
import { MessageSquare, Sparkles, Send, Loader2, Zap } from 'lucide-react';
import { aiInsights, getCampaigns } from '../lib/api';

export default function AIChatWidget() {
  const [showAIChat, setShowAIChat] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    getCampaigns()
      .then(res => setCampaigns(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleAsk = async (question) => {
    if (!question) return;
    setChatLoading(true);
    setChatQuestion(question);
    try {
      const recentCamp = campaigns.length > 0 ? campaigns[0].id : '';
      const res = await aiInsights(question, recentCamp);
      setChatAnswer(res.data.answer);
    } catch (err) {
      setChatAnswer("Sorry, I couldn't process that right now.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      <button 
        id="ai-fab-btn"
        onClick={() => setShowAIChat(prev => !prev)}
        className="ai-fab-btn"
        title="Campaign Insights AI"
      >
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={24} style={{ fill: showAIChat ? 'rgba(255,255,255,0.2)' : 'none' }} />
          <Sparkles size={12} color="#fbbf24" style={{ position: 'absolute', top: -4, right: -4 }} />
        </div>
      </button>

      {showAIChat && (
        <div className="floating-chat-container">
          <div className="floating-chat-header">
            <h3 style={{ fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Zap size={16} fill="#fbbf24" color="#fbbf24" /> Campaign Insights AI
            </h3>
            <button onClick={() => setShowAIChat(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px', padding: 0 }}>&times;</button>
          </div>

          <div className="floating-chat-body">
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
              Ask anything about your campaigns and shopper engagement, or try these quick suggestions:
            </div>
            
            <div style={{ display: 'flex', gap: '6px', flexDirection: 'column', marginBottom: '8px' }}>
              {["Which campaign had the highest open rate?", "Why did the recent campaign fail to deliver?", "What is the average engagement for SMS?"].map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => handleAsk(q)} 
                  style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '11px', textAlign: 'left', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  {q}
                </button>
              ))}
            </div>

            {chatQuestion && <div style={{ alignSelf: 'flex-end', background: 'var(--accent-primary)', color: '#ffffff', padding: '8px 12px', borderRadius: '12px 12px 0 12px', fontSize: '12px', maxWidth: '85%' }}>{chatQuestion}</div>}
            {chatLoading ? (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card-hover)', padding: '10px 12px', borderRadius: '12px 12px 12px 0', fontSize: '12px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <Loader2 size={14} className="animate-spin" /> Thinking...
              </div>
            ) : chatAnswer && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-card-hover)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '12px 12px 12px 0', fontSize: '12px', border: '1px solid var(--border-color)', borderLeft: '3px solid var(--accent-primary)', maxWidth: '85%', lineHeight: '1.4' }}>
                {chatAnswer}
              </div>
            )}
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleAsk(chatInput); setChatInput(''); }}
            className="floating-chat-footer"
          >
            <input 
              id="ai-chat-input"
              type="text" 
              className="input-field" 
              placeholder="Ask AI Copilot..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '12px', flex: 1 }}
            />
            <button 
              id="ai-chat-send-btn"
              type="submit" 
              className="btn-primary" 
              disabled={chatLoading || !chatInput.trim()}
              style={{ padding: '8px 12px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', flexShrink: 0, boxShadow: 'none' }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
