from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
import os
from pathlib import Path
import asyncio
from contextlib import asynccontextmanager

class InteractionData(BaseModel):
    elementId: Optional[str] = None
    elementContent: Optional[str] = None
    elementType: Optional[str] = None
    interactionType: str
    isDestination: Optional[str] = None

class InteractionLogger:
    def __init__(self, file_path: str = "interactions.json"):
        self.file_path = Path(file_path)
        self.lock = asyncio.Lock()
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        if not self.file_path.exists():
            self.file_path.write_text("[]")
    
    async def log_interaction(self, interaction: InteractionData) -> dict:
        async with self.lock:
            try:
                # Read existing data
                current_data = []
                if self.file_path.exists():
                    content = self.file_path.read_text()
                    if content.strip():
                        current_data = json.loads(content)
                
                # Create interaction record
                record = {
                    "elementId": interaction.elementId,
                    "elementContent": interaction.elementContent,
                    "elementType": interaction.elementType,
                    "isDestination": interaction.isDestination,
                    "interactionType": interaction.interactionType,
                    "serverTimestamp": datetime.now().isoformat(),
                    "id": len(current_data) + 1
                }
                
                # Append new interaction
                current_data.append(record)
                
                # Write back to file
                self.file_path.write_text(json.dumps(current_data, indent=2))
                
                return record
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to log interaction: {str(e)}")
    
    async def get_all_interactions(self) -> list:
        async with self.lock:
            try:
                if not self.file_path.exists():
                    return []
                
                content = self.file_path.read_text()
                if not content.strip():
                    return []
                
                return json.loads(content)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to read interactions: {str(e)}")

# Initialize logger
logger = InteractionLogger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Analytics server starting...")
    yield
    # Shutdown
    print("Analytics server shutting down...")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analytics")
async def log_interaction(interaction: InteractionData):
    """Log a user interaction to the JSON file."""
    result = await logger.log_interaction(interaction)
    return {"status": "success", "data": result}

@app.get("/api/analytics")
async def get_interactions():
    """Retrieve all logged interactions."""
    interactions = await logger.get_all_interactions()
    return {"status": "success", "count": len(interactions), "data": interactions}

@app.post("/api/analytics/start")
async def start_tracking():
    """Start a new tracking session."""
    session_data = {
        "event": "session_start",
        "timestamp": datetime.now().isoformat()
    }
    # Log session start as a special interaction
    print(f"Tracking session started at {session_data['timestamp']}")
    return {"status": "success", "message": "Tracking started", "data": session_data}

@app.post("/api/analytics/stop")
async def stop_tracking():
    """Stop the current tracking session."""
    session_data = {
        "event": "session_stop",
        "timestamp": datetime.now().isoformat()
    }
    # Log session stop
    print(f"Tracking session stopped at {session_data['timestamp']}")
    return {"status": "success", "message": "Tracking stopped", "data": session_data}

@app.get("/api/analytics/stats")
async def get_interaction_stats():
    """Get statistics about logged interactions."""
    interactions = await logger.get_all_interactions()
    
    if not interactions:
        return {"status": "success", "data": {
            "totalInteractions": 0,
            "clickCount": 0,
            "hoverCount": 0,
            "scrollCount": 0,
            "uniqueElements": 0
        }}
    
    click_count = sum(1 for i in interactions if i.get("interactionType") == "click")
    hover_count = sum(1 for i in interactions if i.get("interactionType") == "mouseover")
    scroll_count = sum(1 for i in interactions if i.get("interactionType") == "scroll")
    unique_elements = len(set(i.get("elementId", "unknown") for i in interactions if i.get("elementId")))
    
    return {
        "status": "success",
        "data": {
            "totalInteractions": len(interactions),
            "clickCount": click_count,
            "hoverCount": hover_count,
            "scrollCount": scroll_count,
            "uniqueElements": unique_elements,
            "lastInteraction": interactions[-1] if interactions else None
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)