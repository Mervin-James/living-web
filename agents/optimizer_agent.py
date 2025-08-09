import os
import re
import sys
import json
from dataclasses import dataclass
from typing import Optional, Tuple, List, Dict, Any

try:
    # OpenAI client compatible with Morph's API
    import openai  # type: ignore
except Exception:  # pragma: no cover
    print("Failed to import openai. Please run: pip install -r requirements.txt", file=sys.stderr)
    raise

try:
    # LiteLLM for planner LLM call to generate edit snippet
    from litellm import completion  # type: ignore
except Exception:
    print("Failed to import litellm. Please run: pip install -r requirements.txt", file=sys.stderr)
    raise


MORPH_BASE_URL = "https://api.morphllm.com/v1"
MORPH_MODEL = "morph-v3-large"


@dataclass
class PromotionPlan:
    component_name: str
    original_block: Optional[str]
    remove_context_before: Optional[str]
    remove_context_after: Optional[str]
    insert_context_before: Optional[str]
    insert_context_after: Optional[str]


class OptimizerAgent:
    def __init__(self) -> None:
        pass

    # ---- File IO helpers ----
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

    # ---- Log parsing ----
    @staticmethod
    def _parse_log_last_component(log_path: str) -> str:
        last_component: Optional[str] = None
        with open(log_path, "r", encoding="utf-8") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line:
                    continue
                m = re.match(r"^\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)\s*$", line)
                if m:
                    last_component = m.group(1)
        if not last_component:
            raise ValueError("No valid '(ComponentName, userTimeSpent)' entries found in log.")
        return last_component

    @staticmethod
    def _read_log_lines(log_path: str) -> List[str]:
        with open(log_path, "r", encoding="utf-8") as f:
            return [ln.rstrip("\n") for ln in f.readlines()]

    @staticmethod
    def _load_interactions_from_path(path: str) -> Optional[List[Dict[str, Any]]]:
        try:
            if path.lower().endswith(".json"):
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return data  # expect list of interaction dicts
        except Exception:
            return None
        return None

    @staticmethod
    def _extract_last_interaction(interactions: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not interactions:
            return None
        return interactions[-1]

    @staticmethod
    def _guess_component_from_text(text: str) -> Optional[str]:
        if not text:
            return None
        m = re.search(r"[A-Z][A-Za-z0-9_]*", text)
        return m.group(0) if m else None

    @staticmethod
    def _list_layout_component_tags(tsx: str) -> List[str]:
        bounds = OptimizerAgent._find_layout_return_jsx_bounds(tsx)
        if not bounds:
            return []
        jsx = tsx[bounds[0]:bounds[1]]
        names = re.findall(r"<\s*([A-Z][A-Za-z0-9_]*)\b", jsx)
        # remove duplicates preserving order
        seen: set = set()
        ordered: List[str] = []
        for n in names:
            if n not in seen:
                seen.add(n)
                ordered.append(n)
        return ordered

    # ---- TSX parsing helpers ----
    @staticmethod
    def _find_tag_block(tsx: str, tag: str) -> Optional[Tuple[int, int]]:
        open_pattern = re.compile(rf"<\s*{re.escape(tag)}(\s|>|/)")
        open_match = open_pattern.search(tsx)
        if not open_match:
            return None

        start_idx = open_match.start()
        open_tag_end = tsx.find('>', open_match.end())
        if open_tag_end == -1:
            return None
        if '/>' in tsx[start_idx:open_tag_end + 1] or tsx[max(start_idx, open_tag_end - 2):open_tag_end].endswith('/'):
            return (start_idx, open_tag_end + 1)

        depth = 1
        search_start = open_tag_end + 1
        open_re = re.compile(rf"<\s*{re.escape(tag)}(\s|>|/)")
        close_re = re.compile(rf"</\s*{re.escape(tag)}\s*>")
        while True:
            next_open = open_re.search(tsx, search_start)
            next_close = close_re.search(tsx, search_start)
            if not next_close:
                return None
            if next_open and next_open.start() < next_close.start():
                provisional_end = tsx.find('>', next_open.end())
                if provisional_end == -1:
                    return None
                if '/>' in tsx[next_open.start():provisional_end + 1]:
                    search_start = provisional_end + 1
                    continue
                depth += 1
                search_start = provisional_end + 1
            else:
                depth -= 1
                end_idx = next_close.end()
                search_start = end_idx
                if depth == 0:
                    return (start_idx, end_idx)

    @staticmethod
    def _find_main_container_bounds(tsx: str) -> Optional[Tuple[int, int, int]]:
        main_open = re.search(r"<\s*main(\s|>)", tsx)
        if not main_open:
            return None
        open_tag_end = tsx.find('>', main_open.end())
        if open_tag_end == -1:
            return None
        main_close = re.search(r"</\s*main\s*>", tsx[open_tag_end + 1:])
        if not main_close:
            return None
        main_close_start = (open_tag_end + 1) + main_close.start()
        return (main_open.start(), open_tag_end + 1, main_close_start)

    @staticmethod
    def _find_layout_return_jsx_bounds(tsx: str) -> Optional[Tuple[int, int]]:
        # Try function declaration form
        m = re.search(r"(export\s+default\s+)?function\s+Layout\b", tsx)
        start_idx = None
        if m:
            start_idx = m.end()
        else:
            # Try const assignment form
            m2 = re.search(r"(export\s+default\s+)?const\s+Layout\s*=", tsx)
            if m2:
                start_idx = m2.end()
        if start_idx is None:
            return None

        # Find 'return (' following this
        return_kw = re.search(r"return\s*\(", tsx[start_idx:])
        if not return_kw:
            return None
        ret_open = start_idx + return_kw.end() - 1  # index of '('

        # Balance parentheses to find the matching ')'
        depth = 0
        i = ret_open
        while i < len(tsx):
            ch = tsx[i]
            if ch == '(':
                depth += 1
            elif ch == ')':
                depth -= 1
                if depth == 0:
                    # ret_open is '(', i is the matching ')'
                    return (ret_open + 1, i)
            i += 1
        return None

    # ---- Heuristic fallback plan (no new UI elements) ----
    @staticmethod
    def _derive_edit_snippet(tsx: str, component_name: str) -> PromotionPlan:
        layout_bounds = OptimizerAgent._find_layout_return_jsx_bounds(tsx)
        if not layout_bounds:
            return PromotionPlan(
                component_name=component_name,
                original_block=None,
                remove_context_before=None,
                remove_context_after=None,
                insert_context_before=None,
                insert_context_after=None,
            )

        jsx_start, jsx_end = layout_bounds
        layout_jsx = tsx[jsx_start:jsx_end]

        block_bounds_local = OptimizerAgent._find_tag_block(layout_jsx, component_name)
        if not block_bounds_local:
            return PromotionPlan(
                component_name=component_name,
                original_block=None,
                remove_context_before=None,
                remove_context_after=None,
                insert_context_before=None,
                insert_context_after=None,
            )

        # Map local bounds to absolute indexes
        abs_start = jsx_start + block_bounds_local[0]
        abs_end = jsx_start + block_bounds_local[1]
        original_block = tsx[abs_start:abs_end]

        # Insertion target: top of <main> within Layout's JSX if available; otherwise top of Layout JSX
        main_bounds_local = OptimizerAgent._find_main_container_bounds(layout_jsx)
        if main_bounds_local:
            main_open_start_local, main_open_end_local, _ = main_bounds_local
            insert_before_abs = jsx_start + main_open_start_local
            insert_after_abs = jsx_start + main_open_end_local
            insert_context_before = tsx[insert_before_abs:insert_after_abs]
            after_main_slice = tsx[insert_after_abs:jsx_end]
            first_non_empty_line = next((l for l in after_main_slice.splitlines(keepends=True) if l.strip()), "\n")
            insert_context_after = first_non_empty_line
        else:
            # Use the beginning of Layout JSX and the first non-empty line as context
            prefix = tsx[jsx_start: min(jsx_start + 200, jsx_end)]
            first_non_empty_line = next((l for l in tsx[jsx_start:jsx_end].splitlines(keepends=True) if l.strip()), "\n")
            insert_context_before = prefix
            insert_context_after = first_non_empty_line

        # Removal contexts around the original block
        before_slice = tsx[:abs_start]
        after_slice = tsx[abs_end:]
        before_lines = before_slice.splitlines(keepends=True)
        after_lines = after_slice.splitlines(keepends=True)
        remove_context_before = before_lines[-1] if before_lines else ""
        remove_context_after = after_lines[0] if after_lines else ""

        return PromotionPlan(
            component_name=component_name,
            original_block=original_block,
            remove_context_before=remove_context_before,
            remove_context_after=remove_context_after,
            insert_context_before=insert_context_before,
            insert_context_after=insert_context_after,
        )

    @staticmethod
    def _build_update_snippet(plan: PromotionPlan) -> str:
        lines: List[str] = []

        if not plan.original_block:
            # No-op: cannot insert new UI elements per constraints
            return ""

        # Insert moved block
        lines.append("// ... existing code ...")
        if plan.insert_context_before:
            lines.append(plan.insert_context_before.rstrip("\n"))
        lines.append(plan.original_block.strip("\n"))
        if plan.insert_context_after and plan.insert_context_after.strip():
            lines.append(plan.insert_context_after.rstrip("\n"))
        lines.append("// ... existing code ...")

        # Remove original block
        if plan.remove_context_before is not None and plan.remove_context_after is not None:
            lines.append(plan.remove_context_before.rstrip("\n"))
            if plan.remove_context_after.strip():
                lines.append(plan.remove_context_after.rstrip("\n"))
            lines.append("// ... existing code ...")

        return "\n".join(lines) + "\n"

    # ---- LLM planner (no mention of LiteLLM in prompts) ----
    @staticmethod
    def _plan_edit_snippet(
        initial_code: str,
        component_name: Optional[str],
        interactions: Optional[List[Dict[str, Any]]],
        planner_model: str,
    ) -> str:
        system_prompt = (
            "You are an expert React/TSX layout optimizer. You receive a layout.tsx file and a target component name. "
            "Your goal is to make the target component more prevalent by rearranging/moving/resizing EXISTING UI elements ONLY. "
            "HARD CONSTRAINTS: \n"
            "1) Only modify code inside the JSX returned by the `Layout` component (do not touch other components).\n"
            "2) Do NOT insert new UI elements or imports. No new tags/components beyond moving/resizing existing ones.\n"
            "3) Prefer moving the target component earlier (e.g., near the top of `<main>` or primary content) and/or increasing its visual prominence by adjusting existing props/styles/classes.\n"
            "4) Keep TypeScript/TSX valid and preserve behavior. Minimize edits.\n"
            "OUTPUT FORMAT: Return ONLY a Morph Fast Apply abbreviated edit snippet using the special delimiter `// ... existing code ...` to indicate unchanged code. Do not include explanations or code fences."
        )

        interactions_json = json.dumps(interactions[-50:] if interactions else [], indent=2)
        target_label = component_name or "UNKNOWN"
        user_prompt = (
            f"Target component (if known): {target_label}\n\n"
            "Recent user interactions (JSON, last is most recent):\n" + interactions_json + "\n\n"
            "Here is the entire layout.tsx file content. Only modify within the JSX returned by the `Layout` component:\n\n"
            f"{initial_code}\n\n"
            "Return ONLY the abbreviated edit snippet per Morph Fast Apply guidance, ensuring it rearranges/moves/resizes existing elements to make the target component (or the component most relevant to the last interaction) more prevalent, without adding new UI elements."
        )

        resp = completion(
            model=planner_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        try:
            content = resp.choices[0].message["content"]  # type: ignore
        except Exception:
            content = getattr(resp.choices[0].message, "content", None)  # type: ignore
        if not content or not isinstance(content, str):
            raise RuntimeError("Planner returned empty content")
        content = content.strip()
        if content.startswith("```"):
            content = "\n".join([ln for ln in content.splitlines() if not ln.strip().startswith("```")])
        return content.strip() + ("\n" if not content.endswith("\n") else "")

    # ---- Morph Apply ----
    @staticmethod
    def _call_morph_apply(
        api_key: str,
        base_url: str,
        model: str,
        initial_code: str,
        instructions: str,
        edit_snippet: str,
        timeout: Optional[float] = None,
    ) -> str:
        client = openai.OpenAI(api_key=api_key, base_url=base_url)
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": f"<instruction>{instructions}</instruction>\n<code>{initial_code}</code>\n<update>{edit_snippet}</update>",
                }
            ],
            timeout=timeout,
        )
        content = resp.choices[0].message.content
        if not content:
            raise RuntimeError("Morph Apply returned empty content")
        return content

    # ---- Public API ----
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
        Optimize the given layout.tsx by making the target component (from the last log entry)
        more prevalent, using only rearrangement/movement/resizing of existing elements inside
        the JSX returned by `Layout`. Returns the merged TSX string, or None if dry-run.
        """
        if not os.path.isabs(layout):
            raise ValueError("Please provide an absolute path for `layout`.")
        if not os.path.exists(layout):
            raise FileNotFoundError(f"layout file not found: {layout}")
        if interactions is None and log is None:
            raise ValueError("Provide either `interactions` (list of dict) or `log` (absolute path).")
        if log is not None and not os.path.isabs(log):
            raise ValueError("Please provide an absolute path for `log`.")
        if log is not None and not os.path.exists(log):
            raise FileNotFoundError(f"log file not found: {log}")

        api_key = os.getenv("MORPH_API_KEY")
        if not api_key:
            raise EnvironmentError("Environment variable MORPH_API_KEY is not set.")

        # 1) Normalize interactions and derive target
        interactions_list: Optional[List[Dict[str, Any]]] = interactions
        if interactions_list is None and log is not None:
            # Try JSON interactions file
            interactions_list = OptimizerAgent._load_interactions_from_path(log)
        component_name: Optional[str] = None
        if interactions_list:
            last = OptimizerAgent._extract_last_interaction(interactions_list)
            if last:
                # Prefer elementContent; fallback to elementId
                text = (str(last.get("elementContent")) if last.get("elementContent") is not None else "") or str(last.get("elementId") or "")
                component_name = OptimizerAgent._guess_component_from_text(text)
        elif log is not None:
            # Fallback to legacy .txt log format
            component_name = OptimizerAgent._parse_log_last_component(log)

        # 2) Read initial code
        initial_code = OptimizerAgent._read_text(layout)

        # 3) Generate edit snippet via LLM planner
        try:
            edit_snippet = OptimizerAgent._plan_edit_snippet(
                initial_code=initial_code,
                component_name=component_name,
                interactions=interactions_list,
                planner_model=planner_model,
            )
        except Exception as planner_exc:
            # Heuristic fallback that respects constraints (no new elements, only move if found)
            # If we don't have a clear component name, attempt to choose the first component in Layout JSX
            guessed = component_name
            if not guessed:
                tags = OptimizerAgent._list_layout_component_tags(initial_code)
                guessed = tags[0] if tags else None
            if not guessed:
                raise RuntimeError(
                    f"Planner failed ({planner_exc}) and no component could be inferred from interactions or layout."
                )
            plan = OptimizerAgent._derive_edit_snippet(initial_code, guessed)
            edit_snippet = OptimizerAgent._build_update_snippet(plan)
            if not edit_snippet:
                raise RuntimeError(
                    f"Planner failed ({planner_exc}) and fallback couldn't safely move `{guessed}` inside Layout."
                )

        if print_edit:
            print("\n=== Edit Snippet ===\n")
            print(edit_snippet)

        instructions = (
            "I am optimizing the layout by rearranging/resizing existing UI elements to make the last user-interacted component more prevalent. "
            f"Strictly modify only within the JSX returned by the `Layout` component. Move `{component_name or 'the most relevant component'}" 
            " earlier in the primary content region and/or increase its prominence using existing props/styles. "
            "Do NOT insert any new UI elements or imports; avoid duplication by removing originals if moved. Keep TSX valid and minimal."
        )

        if dry_run:
            return None

        merged_code = OptimizerAgent._call_morph_apply(
            api_key=api_key,
            base_url=base_url,
            model=model,
            initial_code=initial_code,
            instructions=instructions,
            edit_snippet=edit_snippet,
            timeout=timeout,
        )

        if output:
            OptimizerAgent._write_text(output, merged_code)
        else:
            if not no_backup:
                OptimizerAgent._ensure_backup(layout)
            OptimizerAgent._write_text(layout, merged_code)

        return merged_code


