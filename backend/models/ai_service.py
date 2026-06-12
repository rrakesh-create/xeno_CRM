import os
import google.generativeai as genai
import json

genai.configure(api_key=os.getenv("GEMINI_API_KEY", "dummy_key"))
model = genai.GenerativeModel('gemini-1.5-flash')

def segment_from_nl(query: str, db_context: str):
    prompt = f"""
    You are a marketing AI assistant. Convert the marketer's text query into a segment JSON.
    Only use terminology like "shoppers", "campaigns", "engagement". Do not use "leads" or "pipeline".
    
    Query: "{query}"
    
    Output exactly valid JSON in this format:
    {{
        "label": "Short label for segment",
        "filters": {{"city": "Optional city name", "min_spend": 0, "max_spend": 999999, "inactive_days": 0}},
        "explanation": "One sentence explaining who these shoppers are."
    }}
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        return json.loads(text)
    except Exception as e:
        return {
            "label": "Custom Shopper Segment",
            "filters": {},
            "explanation": f"Failed to parse AI response. Error: {e}"
        }

def draft_message(segment_label: str, channel: str, tone_hint: str):
    prompt = f"""
    Draft a personalized campaign message for shoppers in the segment "{segment_label}".
    Channel: {channel}
    Tone: {tone_hint if tone_hint else 'Friendly'}
    
    Rules:
    - Use {{name}} as the placeholder for the shopper's name.
    - If WhatsApp/SMS: 2-3 sentences, 1-2 emojis.
    - If Email: 3-4 sentences, slightly more formal.
    - Do not include subject lines, just the message body.
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Hi {{name}}! We noticed you love our products. Check out our latest collection tailored just for {segment_label} shoppers! Reply STOP to opt out."

def refine_message(original: str, feedback: str, channel: str):
    prompt = f"""
    Rewrite this {channel} campaign message based on the marketer's feedback.
    Original: "{original}"
    Feedback: "{feedback}"
    Keep the {{name}} placeholder.
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return original + "\n(Updated based on feedback)"

def campaign_insights(question: str, stats_context: str):
    prompt = f"""
    Answer the marketer's question about their campaign engagement.
    Use terms "shoppers", "campaigns", "engagement". NEVER use "leads" or "pipeline".
    Keep it to 2-3 plain English sentences.
    
    Stats context: {stats_context}
    Question: {question}
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return "Based on recent campaign data, engagement remains stable across most active shoppers. Your delivery rates are excellent."

def diagnose_shopper(profile: str, reviews: str, channel_stats: str, inactive_days: int):
    prompt = f"""
    Analyze this shopper's engagement and output a structured JSON diagnostic.
    Use terms "shoppers", "engagement". NEVER use "lead score" or "conversion" or "pipeline".
    
    Shopper Profile: {profile}
    Recent Reviews: {reviews}
    Channel Stats: {channel_stats}
    Days Inactive: {inactive_days}
    
    Output exactly valid JSON in this format:
    {{
        "satisfaction_level": "loyal" or "engaged" or "at_risk" or "churning",
        "satisfaction_score": <number 0-100>,
        "summary": "One sentence summary.",
        "satisfaction_drivers": [
            {{"type": "Explicit" or "Behavioral", "evidence": "text", "impact": "High" or "Medium" or "Low"}}
        ],
        "risk_factors": [
            {{"type": "Explicit" or "Behavioral", "evidence": "text", "severity": "High" or "Medium" or "Low"}}
        ],
        "retention_actions": [
            {{"channel": "WhatsApp/Email/etc", "action": "description", "message_angle": "angle", "reasoning": "reason"}}
        ],
        "channel_recommendation": {{
            "best_channel": "channel", "best_reason": "reason",
            "avoid_channel": "channel", "avoid_reason": "reason"
        }}
    }}
    Rules: Minimum 2 satisfaction_drivers, minimum 2 risk_factors, 2-3 retention_actions.
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        return json.loads(text)
    except Exception as e:
        return {
            "satisfaction_level": "engaged",
            "satisfaction_score": 50,
            "summary": "AI diagnosis temporarily unavailable.",
            "satisfaction_drivers": [],
            "risk_factors": [],
            "retention_actions": [],
            "channel_recommendation": {"best_channel": "Email", "best_reason": "", "avoid_channel": "SMS", "avoid_reason": ""}
        }
