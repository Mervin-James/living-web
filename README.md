## Living Web – Layout Optimizer Agent

This repository contains a simple Python CLI agent that promotes the last user-interacted React component in a `layout.tsx` file. The agent reads a log of interactions, determines the most recent component, and uses Morph Fast Apply to minimally edit the `layout.tsx` so that the target component appears earlier/more prominently on the page (preferably at the top of the `<main>` area).

### How it works
- Parses a log file where each line is `(ComponentName, userTimeSpent)` and selects the last valid component.
- Reads the `layout.tsx` file.
- Uses LiteLLM to call your chosen LLM and generate a constrained edit snippet that: only edits within the JSX returned by the `Layout` component, and does not add new UI elements; it only rearranges/moves/resizes existing elements to make the target component more prevalent.
- Uses Morph Fast Apply to merge the minimal edit with the original file.
- Writes the merged result back, creating a `.bak` backup unless disabled.

The agent does not use any LLM framework (e.g., no LangChain), only the OpenAI Python SDK pointed at Morph’s base URL.

### Prerequisites
- Python 3.9+
- A Morph account and API key
  - Set environment variable: `export MORPH_API_KEY=YOUR_KEY`
- An API key for your chosen planner model supported by LiteLLM (e.g., OpenAI)
  - Example: `export OPENAI_API_KEY=YOUR_OPENAI_KEY`

### Install
```
pip install -r requirements.txt
```

### Usage (import and call)
```python
from agents.optimizer_agent import OptimizerAgent

agent = OptimizerAgent()
agent.invoke(
    layout="/absolute/path/to/layout.tsx",
    log="/absolute/path/to/log.txt",
    output=None,                 # or "/absolute/path/to/output.tsx"
    no_backup=False,
    print_edit=True,
    dry_run=False,
    timeout=30,
    base_url="https://api.morphllm.com/v1",
    model="morph-v3-large",
    planner_model="gpt-4o-mini",  # any model supported by LiteLLM and your keys
)
```

Notes:
- `--output` writes to a separate file; otherwise the input file is modified in-place (with a `.bak` created unless `--no-backup`).
- `--print-edit` prints the abbreviated edit snippet being sent to Morph for debugging.
- `--dry-run` skips the Morph call and file write but prints diagnostics.

### Input formats
- `layout.tsx`: Your React layout.
- `log.txt`: Lines formatted as `(ComponentName, userTimeSpent)`, e.g.
  ```
  (Header, 12)
  (UserCard, 5.3)
  (Footer, 2)
  ```
  The last valid line determines which component to promote.

### What the agent changes
The agent only edits within the JSX returned by the `Layout` component. It does NOT insert any new UI elements or imports. It rearranges/moves/resizes existing elements to make the last user-interacted component more prevalent (e.g., move earlier in `<main>`, adjust existing `className` or style props). It avoids duplication by removing the original instance when moving.

### Implementation details
- Uses OpenAI Python SDK configured with Morph’s base URL and model.
- Uses an LLM (via LiteLLM) to produce a Morph Fast Apply snippet that obeys constraints.
- Sends: `<instruction>...</instruction>`, `<code>...</code>`, `<update>...</update>` to Morph Apply for a deterministic merge of the edit.
- Attempts to detect JSX blocks for removal and insertion contexts conservatively, and falls back safely without adding new UI elements.

### References
- Morph Quickstart (Fast Apply): `https://docs.morphllm.com/quickstart#json-tool-simple`
- LiteLLM: `https://www.litellm.ai/`


