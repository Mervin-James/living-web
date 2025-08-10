import os
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from litellm import acompletion

from dotenv import load_dotenv
load_dotenv()

# OpenRouter / LLM configuration via environment
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/anthropic/claude-sonnet-4")

OPENROUTER_REFERER = os.getenv("OPENROUTER_REFERER")  # optional but recommended by OpenRouter
OPENROUTER_TITLE = os.getenv("OPENROUTER_TITLE")      # optional

from editor import main

def analysis_text_path_for(session_file: Path) -> Path:
    return session_file.parent / (session_file.stem + ".analysis.txt")


async def compact_interactions_for_llm(session: Dict, max_events: int = 300) -> List[Dict]:
    interactions = session.get("interactions", [])[-max_events:]
    compact: List[Dict] = []
    for interaction in interactions:
        compact.append(
            {
                "id": interaction.get("id"),
                "t": interaction.get("serverTimestamp"),
                "type": interaction.get("interactionType"),
                "elementId": interaction.get("elementId") or None,
                "elementType": interaction.get("elementType"),
                "isDestination": str(interaction.get("isDestination")).lower() == "true",
                "textSnippet": (interaction.get("elementContent") or "")[:120],
            }
        )
    return compact


def _build_prompts(session_meta: Dict, compact_events: List[Dict]) -> List[Dict]:
    system_prompt = (
        "You are a seasoned UX analyst. From the interaction stream, infer the user's intent(s) and evaluate whether "
        "their path was optimal, suboptimal, or failed. Identify frustration signals (rage clicks, dead clicks, error "
        "loops, form struggles) and produce actionable, concrete recommendations to improve the flow. Be concise."
    )
    user_instructions = (
        "Write a short, human-readable report. Use this structure and keep it tight: \n"
        "- Overall intent(s)\n"
        "- Optimality: optimal | suboptimal | failed (brief why)\n"
        "- Frustration signals (bulleted, if any)\n"
        "- Key evidence (2-5 bullets referencing events by id/type)\n"
        "- Recommendations (3-7 bullets, concrete UI/UX changes)\n"
        "Context follows as JSON. Do not echo the full JSON back."
    )
    context = {
        "session": {
            "session_id": session_meta.get("session_id"),
            "my_id": session_meta.get("my_id"),
            "start_time": session_meta.get("start_time"),
            "end_time": session_meta.get("end_time"),
        },
        "events": compact_events,
    }
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_instructions + "\n\nJSON Context:\n" + json.dumps(context, ensure_ascii=False)},
    ]


async def run_openrouter_text_analysis(session_meta: Dict, compact_events: List[Dict]) -> str:
    if not OPENROUTER_API_KEY:
        return "Analysis skipped: OPENROUTER_API_KEY not set."

    headers = {}
    if OPENROUTER_REFERER:
        headers["HTTP-Referer"] = OPENROUTER_REFERER
    if OPENROUTER_TITLE:
        headers["X-Title"] = OPENROUTER_TITLE

    messages = _build_prompts(session_meta, compact_events)
    resp = await acompletion(
        model=OPENROUTER_MODEL,
        messages=messages,
        temperature=0.2,
        api_base=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
        extra_headers=headers or None,
    )
    return resp["choices"][0]["message"].get("content", "")


async def analyze_and_write_text(session_file: Path) -> Path:
    """Run analysis and write a sibling .analysis.txt file. Returns the written path."""
    try:
        session_meta = json.loads(session_file.read_text(encoding="utf-8"))
        compact = await compact_interactions_for_llm(session_meta)
        body = await run_openrouter_text_analysis(session_meta, compact)
        report = (
            f"Model: {OPENROUTER_MODEL}\nCreated: {datetime.now().isoformat()}\n"
            f"Session: {session_meta.get('session_id')} (user {session_meta.get('my_id')})\n\n{body}\n"
        )
        out_path = analysis_text_path_for(session_file)
        out_path.write_text(report, encoding="utf-8")

        report_file = Path(f"report.txt")
        report_file.write_text(report, encoding="utf-8")
        print(f"Wrote analysis to {out_path}")

        main()
        
        return out_path
    except Exception as e:
        # Write error stub for visibility
        out_path = analysis_text_path_for(session_file)
        out_path.write_text(f"Analysis error: {e}", encoding="utf-8")

        
        print(f"Analysis failed for {session_file.name}: {e}")
        return out_path
    




