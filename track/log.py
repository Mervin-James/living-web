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
    isDestination: Optional[str] = "false"
    myId: int

class SessionRequest(BaseModel):
    myId: int

class InteractionLogger:
    def __init__(self, sessions_dir: str = "sessions"):
        self.sessions_dir = Path(sessions_dir)
        self.sessions_dir.mkdir(exist_ok=True)
        self.active_sessions = {}  # Maps myId to session info
        self.lock = asyncio.Lock()
    
    def _generate_session_id(self):
        """Generate a unique session ID based on timestamp"""
        return datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
    
    def start_session(self, my_id: int):
        """Start a new tracking session for a specific user ID"""
        session_id = self._generate_session_id()
        session_file = self.sessions_dir / f"session_{my_id}_{session_id}.json"

        print(f"Starting session {session_id} for user {my_id}")
        
        # Initialize session file with metadata
        session_data = {
            "session_id": session_id,
            "my_id": my_id,
            "start_time": datetime.now().isoformat(),
            "end_time": None,
            "interactions": []
        }
        
        # Store session info for this myId
        self.active_sessions[my_id] = {
            "session_id": session_id,
            "session_file": session_file
        }

        session_file.write_text(json.dumps(session_data, indent=2))
        return session_data
    
    def stop_session(self, my_id: int):
        """Stop the tracking session for a specific user ID"""
        if my_id not in self.active_sessions:
            return None
        
        session_info = self.active_sessions[my_id]
        session_file = session_info["session_file"]
        
        if not session_file.exists():
            return None
        
        # Update session with end time
        session_data = json.loads(session_file.read_text())
        session_data["end_time"] = datetime.now().isoformat()
        
        session_file.write_text(json.dumps(session_data, indent=2))
        
        # Remove from active sessions
        del self.active_sessions[my_id]
        
        return session_data
    
    async def log_interaction(self, interaction: InteractionData) -> dict:
        async with self.lock:
            try:
                # Check if we have an active session for this myId
                if interaction.myId not in self.active_sessions:
                    raise HTTPException(status_code=400, detail=f"No active tracking session for user {interaction.myId}. Please start tracking first.")
                
                session_info = self.active_sessions[interaction.myId]
                session_file = session_info["session_file"]
                
                if not session_file.exists():
                    raise HTTPException(status_code=400, detail=f"Session file not found for user {interaction.myId}")
                
                # Read current session data
                session_data = json.loads(session_file.read_text())
                
                # Create interaction record with myId
                record = {
                    "myId": interaction.myId,
                    "elementId": interaction.elementId,
                    "elementContent": interaction.elementContent,
                    "elementType": interaction.elementType,
                    "isDestination": interaction.isDestination,
                    "interactionType": interaction.interactionType,
                    "serverTimestamp": (datetime.now() - datetime.fromisoformat(session_data["start_time"])).total_seconds(),
                    "id": len(session_data["interactions"]) + 1
                }
                
                # Append new interaction to session
                session_data["interactions"].append(record)
                
                # Write back to session file
                
                session_file.write_text(json.dumps(session_data, indent=2))
                
                return record
                
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to log interaction: {str(e)}")
    
    async def get_session_interactions_by_user(self, my_id: int) -> list:
        """Get interactions from the active session for a specific user"""
        async with self.lock:
            try:
                if my_id not in self.active_sessions:
                    return []
                
                session_file = self.active_sessions[my_id]["session_file"]
                if not session_file.exists():
                    return []
                
                session_data = json.loads(session_file.read_text())
                return session_data.get("interactions", [])
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to read interactions: {str(e)}")
    
    async def get_all_sessions(self) -> list:
        """Get all session files"""
        async with self.lock:
            try:
                session_files = sorted(self.sessions_dir.glob("session_*.json"))
                sessions = []
                
                for session_file in session_files:
                    session_data = json.loads(session_file.read_text())
                    sessions.append({
                        "session_id": session_data.get("session_id"),
                        "start_time": session_data.get("start_time"),
                        "end_time": session_data.get("end_time"),
                        "interaction_count": len(session_data.get("interactions", [])),
                        "file_name": session_file.name
                    })
                
                return sessions
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to read sessions: {str(e)}")
    
    async def get_session_by_id(self, session_id: str) -> dict:
        """Get a specific session by ID"""
        async with self.lock:
            try:
                session_file = self.sessions_dir / f"session_{session_id}.json"
                if not session_file.exists():
                    raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
                
                return json.loads(session_file.read_text())
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to read session: {str(e)}")

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

# @app.get("/api/analytics/{my_id}")
# async def get_interactions(my_id: int):
#     """Retrieve interactions from current session for a specific user."""
#     interactions = await logger.get_session_interactions_by_user(my_id)
#     return {"status": "success", "count": len(interactions), "data": interactions}

@app.get("/api/analytics/sessions")
async def get_sessions():
    """Retrieve all tracking sessions."""
    sessions = await logger.get_all_sessions()
    return {"status": "success", "count": len(sessions), "data": sessions}

@app.get("/api/analytics/sessions/{session_id}")
async def get_session(session_id: str):
    """Retrieve a specific session by ID."""
    session = await logger.get_session_by_id(session_id)
    return {"status": "success", "data": session}

@app.post("/api/analytics/start")
async def start_tracking(request: SessionRequest):
    """Start a new tracking session."""
    session_data = logger.start_session(request.myId)
    print(f"Tracking session {session_data['session_id']} started for user {request.myId} at {session_data['start_time']}")
    return {"status": "success", "message": "Tracking started", "data": session_data}

@app.post("/api/analytics/stop")
async def stop_tracking(request: SessionRequest):
    """Stop the current tracking session."""
    session_data = logger.stop_session(request.myId)
    if session_data:
        print(f"Tracking session {session_data['session_id']} for user {request.myId} stopped at {session_data['end_time']}")
        return {"status": "success", "message": "Tracking stopped", "data": session_data}
    else:
        return {"status": "error", "message": f"No active tracking session for user {request.myId}"}

@app.get("/api/analytics/stats/{my_id}")
async def get_interaction_stats(my_id: int):
    """Get statistics about logged interactions for a specific user's current session."""
    interactions = await logger.get_session_interactions_by_user(my_id)
    
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