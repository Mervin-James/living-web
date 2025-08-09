import os
import json
from typing import Optional, List, Dict, Any

from .optimizer_core import (
    generate_edit_and_merge,
    plan_edit_snippet_with_llm,
    select_latest_destination_component,
)

MORPH_BASE_URL = "https://api.morphllm.com/v1"
MORPH_MODEL = "morph-v3-large"


class OptimizerAgent:
    def __init__(self) -> None:
        pass

    @staticmethod
    def _read_text(path: str) -> str:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    @staticmethod
    def _write_text(path: str, content: str) -> None:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    @staticmethod
    def _ensure_backup(original_path: str) -> str:
        backup_path = original_path + ".bak"
        if not os.path.exists(backup_path):
            OptimizerAgent._write_text(backup_path, OptimizerAgent._read_text(original_path))
        return backup_path

    def invoke(
        self,
        *,
        layout: str,
        interactions: Optional[List[Dict[str, Any]]] = None,
        log: Optional[str] = None,
        output: Optional[str] = None,
        no_backup: bool = False,
        print_edit: bool = False,
        dry_run: bool = False,
        timeout: Optional[float] = None,
        base_url: str = MORPH_BASE_URL,
        model: str = MORPH_MODEL,
        planner_model: str = "gpt-4o-mini",
    ) -> Optional[str]:
        """
        Optimize the `layout.tsx` by rearranging/moving/resizing ONLY existing elements inside the JSX
        returned by `Layout`, focusing on the latest destination interaction. Uses optimizer_core for planning/merge.
        """
        if not os.path.isabs(layout):
            raise ValueError("Please provide an absolute path for `layout`.")
        if not os.path.exists(layout):
            raise FileNotFoundError(f"layout file not found: {layout}")
        if interactions is None and log is None:
            raise ValueError("Provide either `interactions` (list of dict) or `log` (absolute path to JSON list).")
        if log is not None and not os.path.isabs(log):
            raise ValueError("Please provide an absolute path for `log`.")
        if log is not None and not os.path.exists(log):
            raise FileNotFoundError(f"log file not found: {log}")

        api_key = os.getenv("MORPH_API_KEY")
        if not api_key:
            raise EnvironmentError("Environment variable MORPH_API_KEY is not set.")

        # Load interactions
        interactions_list: Optional[List[Dict[str, Any]]] = interactions
        if interactions_list is None and log is not None:
            with open(log, "r", encoding="utf-8") as f:
                payload = json.load(f)
            if not isinstance(payload, list):
                raise ValueError("Interactions JSON must be a list of objects")
            interactions_list = payload

        # Read initial code
        initial_code = OptimizerAgent._read_text(layout)

        # Dry-run: plan only
        if dry_run:
            target = select_latest_destination_component(interactions_list or [], initial_code)
            edit_snippet = plan_edit_snippet_with_llm(
                initial_code=initial_code,
                component_name=target,
                interactions=interactions_list or [],
                planner_model=planner_model,
            )
            if print_edit:
                print("\n=== Edit Snippet (dry-run) ===\n")
                print(edit_snippet)
            return None

        # Plan + merge via core
        edit_snippet, merged_code = generate_edit_and_merge(
            initial_code=initial_code,
            interactions=interactions_list or [],
            planner_model=planner_model,
            morph_api_key=api_key,
            morph_base_url=base_url,
            morph_model=model,
            timeout=timeout,
        )

        if print_edit:
            print("\n=== Edit Snippet ===\n")
            print(edit_snippet)

        # Write
        if output:
            OptimizerAgent._write_text(output, merged_code)
        else:
            if not no_backup:
                OptimizerAgent._ensure_backup(layout)
            OptimizerAgent._write_text(layout, merged_code)

        return merged_code
