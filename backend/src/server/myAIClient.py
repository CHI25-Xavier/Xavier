import os
from typeguard import typechecked
from typing import List, Dict, Optional, Union
from groq import Groq

from .. import constant as constX
from src.debugger import debugger
from .. import utils as utilsX

@typechecked
class myAIClient():
  def __init__(self, model: str) -> None:
    self.chatHistory: List[Dict[str, str]] = []
    utilsX.loadApiKey()
    self.model = model
    self.groqClient = Groq(
      api_key=os.environ.get("GROQ_API_KEY"),
    )

  def promptRemote(self, prompt: str, client: Union[Groq]) -> str:
    self.chatHistory = [{
      "role": "user",
      "content": prompt
    }]

    response = None
    text: Optional[str] = None
    try:
      response = client.chat.completions.create(
        messages=self.chatHistory,
        model=self.model,
        max_tokens=constX.MAX_OUTPUT_TOKENS,
        temperature=constX.TEMPERATURE
      )
    except Exception as e:
      debugger.error(f"[promptRemote] {e}")
      return ""

    text = response.choices[0].message.content
    if text is None:
      raise RuntimeError("[promptRemote] No text provided")

    return text

  def sendPrompt(self, prompt: str) -> str:
    utilsX.logInFiles("---------\nPrompt: " + prompt + "\n---------")
    text = self.promptRemote(prompt, self.groqClient)
    
    utilsX.logInFiles("\n--------response--------\n" + text)
    utilsX.logInFiles("--------finished--------")

    return text
