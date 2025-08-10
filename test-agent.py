import os
import json
from pathlib import Path

from agents.optimizer_agent import OptimizerAgent

from dotenv import load_dotenv

load_dotenv()

def load_interactions_default(repo_root: Path):
    interactions_path = repo_root / "track" / "report.txt"
    if interactions_path.exists():
        try:
            report = interactions_path.read_text(encoding="utf-8")
            return report
        except Exception:
            pass
    # Fallback sample matching schema
    return ""


def main():
    # app_name = "morningstar-landing-clone"
    # app_name = "todo"
    repo_root = Path(__file__).resolve().parent
    # layout_path = repo_root / "demo-app" / "morningstar-landing-clone" / "src" / "app" / "layout.tsx"
    # If you want to target the TODO app instead, comment the line above and uncomment below:
    layout_path = repo_root / "demo-app" / "todo" / "src" / "components" / "Layout.tsx"

    if not layout_path.exists():
        raise FileNotFoundError(f"Layout file not found at {layout_path}")

    interactions = load_interactions_default(repo_root)

    dry_run = os.getenv("DRY_RUN", "0") == "1"
    print_edit = os.getenv("PRINT_EDIT", "1") == "1"

    agent = OptimizerAgent()
    merged = agent.invoke(
        layout=str(layout_path),
        interactions=interactions,
        output=str(layout_path),
        no_backup=False,
        print_edit=print_edit,
        dry_run=dry_run,
        timeout=60,
        base_url=os.getenv("MORPH_BASE_URL", "https://api.morphllm.com/v1"),
        model=os.getenv("MORPH_MODEL", "morph-v3-large"),
        planner_model=os.getenv("PLANNER_MODEL", "gpt-4o-mini"),
    )

    if dry_run:
        print("DRY_RUN=1: Skipped calling Morph Apply. Set DRY_RUN=0 to apply edits.")
    else:
        print(f"Updated layout at: {layout_path}")
        if merged:
            print("Preview (first 400 chars):\n" + merged[:400])


if __name__ == "__main__":
    main()


