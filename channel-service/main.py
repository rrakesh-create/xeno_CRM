from fastapi import FastAPI, BackgroundTasks, status
from pydantic import BaseModel
import asyncio
import httpx
import random

app = FastAPI(title="Decoupled Xeno Gateway Simulator")

class MessagePayload(BaseModel):
    communication_id: str
    channel: str
    callback_url: str

CHANNEL_TIMINGS = {
    "whatsapp": {"deliver": (1, 4), "open": (3, 15), "click": (5, 30)},
    "sms":      {"deliver": (1, 3), "open": (5, 20), "click": (10, 45)},
    "email":    {"deliver": (2, 6), "open": (10, 40), "click": (20, 90)},
    "rcs":      {"deliver": (1, 5), "open": (4, 18), "click": (8, 35)}
}

async def fire_webhook_callback(url: str, comm_id: str, status_str: str):
    async with httpx.AsyncClient() as client:
        try:
            await client.post(url, json={"communication_id": comm_id, "status": status_str}, timeout=2.0)
        except Exception:
            pass # Suppress network drops to prevent halting simulations

async def simulate_message_lifecycle(payload: MessagePayload):
    channel = payload.channel.lower()
    timings = CHANNEL_TIMINGS.get(channel, CHANNEL_TIMINGS["whatsapp"])
    
    # 1. Simulated Transit Network Latency Delay
    await asyncio.sleep(random.uniform(*timings["deliver"]))
    
    # 12% baseline structural delivery failure simulation boundary
    if random.random() < 0.12:
        await fire_webhook_callback(payload.callback_url, payload.communication_id, "failed")
        # Single Retry Logic: Wait 5 seconds and attempt recovery once
        await asyncio.sleep(5.0)
        if random.random() < 0.60:
            await fire_webhook_callback(payload.callback_url, payload.communication_id, "delivered")
        else:
            return  # Message thread terminates as failed
    else:
        await fire_webhook_callback(payload.callback_url, payload.communication_id, "delivered")
        
    # 2. Simulated Message Open Loop (55% baseline chance)
    if random.random() < 0.55:
        await asyncio.sleep(random.uniform(*timings["open"]))
        await fire_webhook_callback(payload.callback_url, payload.communication_id, "opened")
        
        # 3. Simulated Link Click Loop (30% click probability among opened)
        if random.random() < 0.30:
            await asyncio.sleep(random.uniform(*timings["click"]))
            await fire_webhook_callback(payload.callback_url, payload.communication_id, "clicked")

@app.post("/send", status_code=status.HTTP_202_ACCEPTED)
async def queue_message_simulation(payload: MessagePayload, background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_message_lifecycle, payload)
    return {"status": "accepted", "message": "Simulation pipeline asynchronously initialized."}
