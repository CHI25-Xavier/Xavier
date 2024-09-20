from typeguard import typechecked
from ..constant import PROMPT_MARKER

@typechecked
def codePreamble() -> str:
  return f"""Suppose a user has typed some Python code below. Here is the {PROMPT_MARKER.CODE_CONTEXT} before the input cursor {PROMPT_MARKER.CURSOR}:"""

@typechecked
def wrapPythonCode(code: str) -> str:
  return f"""```python
{code}{PROMPT_MARKER.CURSOR}
```"""

@typechecked
def getCodeInfo(pCode: str) -> str:
  prompt = codePreamble() + "\n\n"
  prompt += f"{wrapPythonCode(pCode)}\n"
  return prompt