import json
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

try:
    # LiteLLM router for planning call
    from litellm import completion  # type: ignore
except Exception as exc:  # pragma: no cover
    raise

try:
    # OpenAI-compatible client for Morph Apply
    import openai  # type: ignore
except Exception as exc:  # pragma: no cover
    raise


@dataclass
class PromotionPlan:
    component_name: str
    original_block: Optional[str]
    remove_context_before: Optional[str]
    remove_context_after: Optional[str]
    insert_context_before: Optional[str]
    insert_context_after: Optional[str]


def find_layout_return_jsx_bounds(tsx: str) -> Optional[Tuple[int, int]]:
    m = re.search(r"(export\s+default\s+)?function\s+Layout\b", tsx)
    start_idx = None
    if m:
        start_idx = m.end()
    else:
        m2 = re.search(r"(export\s+default\s+)?const\s+Layout\s*=", tsx)
        if m2:
            start_idx = m2.end()
    if start_idx is None:
        return None
    return_kw = re.search(r"return\s*\(", tsx[start_idx:])
    if not return_kw:
        return None
    ret_open = start_idx + return_kw.end() - 1
    depth = 0
    i = ret_open
    while i < len(tsx):
        ch = tsx[i]
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0:
                return (ret_open + 1, i)
        i += 1
    return None


def find_tag_block(tsx: str, tag: str) -> Optional[Tuple[int, int]]:
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


def find_main_container_bounds(tsx: str) -> Optional[Tuple[int, int, int]]:
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


def list_layout_component_tags(tsx: str) -> List[str]:
    bounds = find_layout_return_jsx_bounds(tsx)
    if not bounds:
        return []
    jsx = tsx[bounds[0]:bounds[1]]
    names = re.findall(r"<\s*([A-Z][A-Za-z0-9_]*)\b", jsx)
    seen: set = set()
    ordered: List[str] = []
    for n in names:
        if n not in seen:
            seen.add(n)
            ordered.append(n)
    return ordered


def guess_component_from_text(text: str) -> Optional[str]:
    if not text:
        return None
    m = re.search(r"[A-Z][A-Za-z0-9_]*", text)
    return m.group(0) if m else None


def select_latest_destination_component(interactions: List[Dict[str, Any]], initial_code: str) -> str:
    for entry in reversed(interactions):
        flag = entry.get("isDestination")
        if isinstance(flag, bool):
            is_dest = flag
        else:
            is_dest = str(flag).strip().lower() in {"true", "1", "yes", "y"}
        if not is_dest:
            continue
        text = (str(entry.get("elementContent")) if entry.get("elementContent") is not None else "") or str(entry.get("elementId") or "")
        component = guess_component_from_text(text)
        if component:
            return component
    # If none marked as destination, raise for caller to decide
    raise ValueError("No destination interaction found in provided interactions.")


def derive_edit_plan(tsx: str, component_name: str) -> PromotionPlan:
    layout_bounds = find_layout_return_jsx_bounds(tsx)
    if not layout_bounds:
        return PromotionPlan(component_name, None, None, None, None, None)
    jsx_start, jsx_end = layout_bounds
    layout_jsx = tsx[jsx_start:jsx_end]
    block_bounds_local = find_tag_block(layout_jsx, component_name)
    if not block_bounds_local:
        return PromotionPlan(component_name, None, None, None, None, None)
    abs_start = jsx_start + block_bounds_local[0]
    abs_end = jsx_start + block_bounds_local[1]
    original_block = tsx[abs_start:abs_end]
    main_bounds_local = find_main_container_bounds(layout_jsx)
    if main_bounds_local:
        main_open_start_local, main_open_end_local, _ = main_bounds_local
        insert_before_abs = jsx_start + main_open_start_local
        insert_after_abs = jsx_start + main_open_end_local
        insert_context_before = tsx[insert_before_abs:insert_after_abs]
        after_main_slice = tsx[insert_after_abs:jsx_end]
        first_non_empty_line = next((l for l in after_main_slice.splitlines(keepends=True) if l.strip()), "\n")
        insert_context_after = first_non_empty_line
    else:
        prefix = tsx[jsx_start: min(jsx_start + 200, jsx_end)]
        first_non_empty_line = next((l for l in tsx[jsx_start:jsx_end].splitlines(keepends=True) if l.strip()), "\n")
        insert_context_before = prefix
        insert_context_after = first_non_empty_line
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


def build_update_snippet(plan: PromotionPlan) -> str:
    if not plan.original_block:
        return ""
    lines: List[str] = []
    lines.append("// ... existing code ...")
    if plan.insert_context_before:
        lines.append(plan.insert_context_before.rstrip("\n"))
    lines.append(plan.original_block.strip("\n"))
    if plan.insert_context_after and plan.insert_context_after.strip():
        lines.append(plan.insert_context_after.rstrip("\n"))
    lines.append("// ... existing code ...")
    if plan.remove_context_before is not None and plan.remove_context_after is not None:
        lines.append(plan.remove_context_before.rstrip("\n"))
        if plan.remove_context_after.strip():
            lines.append(plan.remove_context_after.rstrip("\n"))
        lines.append("// ... existing code ...")
    return "\n".join(lines) + "\n"


def plan_edit_snippet_with_llm(
    initial_code: str,
    component_name: str,
    interactions: List[Dict[str, Any]],
    planner_model: str,
) -> str:
    system_prompt = (
        "You are an expert React/TSX layout optimizer. You receive a layout.tsx file and a target component name. "
        "Your goal is to make ONLY the target component more prevalent by rearranging/moving/resizing EXISTING UI elements. "
        "HARD CONSTRAINTS: \n"
        "1) Only modify code inside the JSX returned by the `Layout` component.\n"
        "2) Do NOT insert new UI elements or imports. No new tags/components beyond moving/resizing existing ones.\n"
        "3) Optimize ONLY the target component (the latest destination). Do not alter other components' order or size unless required to move the target.\n"
        "4) Keep TypeScript/TSX valid and preserve behavior. Minimize edits.\n"
        "OUTPUT FORMAT: Return ONLY a Morph Fast Apply abbreviated edit snippet using the delimiter `// ... existing code ...`. No commentary or code fences."
    )
    interactions_json = json.dumps(interactions[-50:], indent=2)
    user_prompt = (
        f"Target component (latest destination): {component_name}\n\n"
        "Recent user interactions (JSON, last is most recent):\n" + interactions_json + "\n\n"
        "Here is the entire layout.tsx file content. Only modify within the JSX returned by the `Layout` component:\n\n"
        f"{initial_code}\n\n"
        "Return ONLY the abbreviated edit snippet per Morph Fast Apply guidance, ensuring you only optimize the target component and avoid adding new UI elements."
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


def call_morph_apply(
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


def generate_edit_and_merge(
    *,
    initial_code: str,
    interactions: List[Dict[str, Any]],
    planner_model: str,
    morph_api_key: str,
    morph_base_url: str,
    morph_model: str,
    timeout: Optional[float] = None,
) -> Tuple[str, str]:
    target_component = select_latest_destination_component(interactions, initial_code)
    try:
        edit_snippet = plan_edit_snippet_with_llm(
            initial_code=initial_code,
            component_name=target_component,
            interactions=interactions,
            planner_model=planner_model,
        )
    except Exception:
        plan = derive_edit_plan(initial_code, target_component)
        edit_snippet = build_update_snippet(plan)
        if not edit_snippet:
            raise RuntimeError("Fallback could not construct a safe edit snippet.")
    instructions = (
        "I am optimizing the layout by rearranging/resizing existing UI elements to make ONLY the latest destination component more prevalent. "
        f"Strictly modify only within the JSX returned by the `Layout` component. Move `{target_component}` earlier in the primary content region and/or increase its prominence using existing props/styles. "
        "Do NOT insert any new UI elements or imports; avoid duplication by removing originals if moved. Keep TSX valid and minimal."
    )
    merged_code = call_morph_apply(
        api_key=morph_api_key,
        base_url=morph_base_url,
        model=morph_model,
        initial_code=initial_code,
        instructions=instructions,
        edit_snippet=edit_snippet,
        timeout=timeout,
    )
    return edit_snippet, merged_code


