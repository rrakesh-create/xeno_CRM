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
  const [prediction, setPrediction] = useState(null);
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
      setMessages(prev => [...prev, { sender: 'ai', text: `Category isolated: "${segRes.data.label}". ${segRes.data.explanation}` }]);

      // Step 2: Extract campaign copywriting options
      const copyRes = await axios.post('http://localhost:8000/ai/draft-message', {
        label: segRes.data.label, channel: channel, tone: tone
      });
      setMessageDraft(copyRes.data.message);

      // Step 3: Trigger what-if financial forecasting predictions
      const predRes = await axios.post('http://localhost:8000/ai/what-if', { size: 34, avg_spend: 1850.0 });
      setPrediction(predRes.data);

    } catch (err) {
      console.error("AI Generation loop error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateMessageCopy = async () => {
    if (!segmentData) return;
    try {
      const copyRes = await axios.post('http://localhost:8000/ai/draft-message', {
        label: segmentData.label, channel: channel, tone: tone
      });
      setMessageDraft(copyRes.data.message);
    } catch (err) {
      console.error(err);
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
      setPrediction(null);
      setMessageDraft('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 font-sans">
      <h2 className="text-xl font-bold border-b pb-3 mb-4 text-zinc-800">Conversational AI Campaign Creator</h2>
      
      <div className="border rounded-lg p-4 h-80 overflow-y-auto mb-4 bg-zinc-50 space-y-3">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <span className={`inline-block p-3 rounded-xl max-w-md shadow-sm text-sm ${m.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-200 text-zinc-900'}`}>
              {m.text}
            </span>
          </div>
        ))}
      </div>

      {prediction && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-lg mb-4 text-sm shadow-inner">
          <p className="font-semibold">📊 AI Estimate Projections:</p>
          <p>Projected Read Count: <strong>{prediction.projected_open_count} shoppers</strong> · Estimated Conversion Range: <strong>₹{prediction.min_projected_revenue} - ₹{prediction.max_projected_revenue}</strong>.</p>
          <span className="text-xs text-amber-600 italic block mt-1">Estimates are based on historical segment behavior benchmarks. These fields are performance projections and completely non-guaranteed.</span>
        </div>
      )}

      {segmentData && (
        <div className="bg-white border p-4 rounded-lg shadow-sm mb-4">
          <h4 className="text-sm font-bold text-zinc-700 mb-2">Segment Audience Preview:</h4>
          <div className="flex gap-2 flex-wrap">
            {['A', 'V', 'S', 'P', 'R'].map((initial, i) => (
              <div key={i} className="flex items-center gap-2 bg-zinc-100 p-2 rounded-full pr-4 border hover:bg-zinc-200 cursor-pointer transition">
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                  {initial}
                </div>
                <span className="text-sm font-medium text-zinc-700">Shopper {i+1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {messageDraft && (
        <div className="bg-white border p-4 rounded-lg shadow-sm mb-4 space-y-3">
          <h4 className="text-sm font-bold text-zinc-700">Dynamic Campaign Content Blueprint:</h4>
          <textarea className="w-full p-2 border rounded-md text-sm font-mono" rows={3} value={messageDraft} onChange={(e) => setMessageDraft(e.target.value)} />
          
          <div className="flex justify-between items-center text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <label>Tone Slider:</label>
              <input type="range" min="1" max="10" className="w-24" onChange={(e) => setTone(e.target.value > 5 ? 'Playful' : 'Formal')} />
              <span className="font-semibold text-indigo-600">{tone}</span>
            </div>
            <div className="flex items-center gap-2">
              <label>Delivery Node Channel:</label>
              <select className="border rounded p-1 bg-white" value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="whatsapp">WhatsApp App Link</option>
                <option value="sms">SMS Text Network</option>
                <option value="email">Electronic Mail</option>
                <option value="rcs">RCS Rich Media</option>
              </select>
            </div>
          </div>
          
          <button onClick={executeOneClickGroupBlast} disabled={isLoading} className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-md hover:bg-emerald-700 transition active:scale-[0.995]">
            🚀 Launch Campaign (One-Click Bulk Send)
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input className="flex-1 p-3 border rounded-md text-sm shadow-sm" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type marketing objective (e.g., Target shoppers in Chennai with spend > 4000)..." onKeyDown={(e) => e.key === 'Enter' && handleSendMessageIntent()} />
        <button onClick={handleSendMessageIntent} disabled={isLoading} className="px-5 bg-indigo-600 text-white text-sm font-bold rounded-md hover:bg-indigo-700 transition">
          {isLoading ? 'Processing...' : 'Send Prompt'}
        </button>
      </div>
    </div>
  );
}
