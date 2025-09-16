import os
import asyncio
from pathlib import Path
from typing import List, Dict

from dotenv import load_dotenv
from litellm import acompletion
from openai import OpenAI


load_dotenv()


# OpenRouter config for generating a lazy code edit (update block)
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/anthropic/claude-sonnet-4")
OPENROUTER_REFERER = os.getenv("OPENROUTER_REFERER")
OPENROUTER_TITLE = os.getenv("OPENROUTER_TITLE")

# Morph Apply API (OpenAI-compatible)
MORPH_API_KEY = os.getenv("MORPH_API_KEY")
MORPH_BASE_URL = os.getenv("MORPH_BASE_URL", "https://api.morphllm.com/v1")
MORPH_MODEL = os.getenv("MORPH_MODEL", "morph-v3-large")


def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def build_edit_prompt(report_text: str, original_code: str) -> List[Dict[str, str]]:
    system = (
        "You are a pragmatic frontend engineer. Based on the UX analysis report, propose small, safe, and "
        "useful improvements to the provided React component. Only output an edit block for an edit_file tool. "
        "Use the // ... existing code ... separators exactly as shown. Do not add explanations."
    )
    user = (
        "Produce ONLY the code edit block.\n\n"
        "Rules:\n"
        "- Use: // ... existing code ... to skip unchanged parts.\n"
        "- Include just enough surrounding context to disambiguate.\n"
        "- IMPORTANT!!!: Only make mearningful rearrangement of the layout. DO NOT MODIFY STYLES, CONTENT, OR TAGS. Only rearrange items as needed."
        "- Make MINIAL, meaningful layout improvements aligned with the report. Prioritize moving elements with data-destination=\"true\"\n"
        "- Do not change file/module structure unless necessary.\n"
        "- Do not print any commentary.\n\n"
        f"UX Analysis Report (text):\n{report_text}\n\n"
        f"Current File: Layout.tsx {original_code}"
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


async def generate_code_edit(report_text: str, original_code: str) -> str:
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not set")

    headers = {}
    if OPENROUTER_REFERER:
        headers["HTTP-Referer"] = OPENROUTER_REFERER
    if OPENROUTER_TITLE:
        headers["X-Title"] = OPENROUTER_TITLE

    messages = build_edit_prompt(report_text, original_code)
    resp = await acompletion(
        model=OPENROUTER_MODEL,
        messages=messages,
        temperature=0.2,
        api_base=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
        extra_headers=headers or None,
    )
    return resp["choices"][0]["message"].get("content", "").strip()


def merge_with_morph(instructions: str, initial_code: str, code_edit: str) -> str:
    if not MORPH_API_KEY:
        raise RuntimeError("MORPH_API_KEY not set")

    client = OpenAI(api_key=MORPH_API_KEY, base_url=MORPH_BASE_URL)
    content = f"<instruction>{instructions}</instruction>\n<code>{initial_code}</code>\n<update>{code_edit}</update>"
    response = client.chat.completions.create(
        model=MORPH_MODEL,
        messages=[{"role": "user", "content": content}],
    )
    return response.choices[0].message.content


async def main():
    report_path = Path("report.txt")
    # target_file = Path("../demo-app/todo/src/components/Layout.tsx")
    target_file = Path("../demo-app/morningstar-landing-clone/src/app/layout.tsx")

    if not report_path.exists():
        raise FileNotFoundError(f"Missing report file: {report_path}")
    if not target_file.exists():
        raise FileNotFoundError(f"Missing target file: {target_file}")
    


    report_text = read_text_file(report_path)
    original_code = read_text_file(target_file)

    print("Generating code edit from report and current file...")
    code_edit = await generate_code_edit(report_text, original_code)
    if not code_edit:
        raise RuntimeError("Empty code edit generated")
    
    code_edit = code_edit.split("<file_text>")[-1].split("</file_text>")[0]

    # Optional: persist the raw edit for inspection
    Path("latest_code_edit.txt").write_text(code_edit, encoding="utf-8")

    print("Merging with Morph Fast Apply...")
    instructions = "I am applying UX improvements to the Layout.tsx component based on the analysis report; merge the provided edit into the code."
    final_code = merge_with_morph(instructions, original_code, code_edit)
    if not final_code:
        raise RuntimeError("Morph did not return merged code")

    target_file.write_text(final_code, encoding="utf-8")
    print(f"Wrote merged code to {target_file}")


if __name__ == "__main__":
    asyncio.run(main())


