import os
import requests
from typeguard import typechecked
from openai import OpenAI, AzureOpenAI
from openai.types.chat import ChatCompletion
from typing import List, Dict, Optional, Union

from src.constant import OPENAI, AZURE, LOCAL, GROQ, GPT_35_TURBO, GPT_4_TURBO, LLAMA3_70B_8192, GPT_4O
from src.debugger import debugger
from .. import utils as utilsX

import dashscope
# 如果环境变量配置无效请启用以下代码
dashscope.api_key = 'sk-116de053ad9841718100ee9c3fa77d1d'


from groq import Groq

counter = 0

# client = Groq(
#     api_key=os.environ.get("GROQ_API_KEY"),
# )

# chat_completion = client.chat.completions.create(
#     messages=[
#         {
#             "role": "user",
#             "content": "Explain the importance of fast language models",
#         }
#     ],
#     model="llama3-8b-8192",
# )

# print(chat_completion.choices[0].message.content)


@typechecked
class myAIClient():
  def __init__(self, model: str, platform: str):
    self.platform: str = platform
    self.model: str = model
    self.chatHistory: List[Dict[str, str]] = []
    utilsX.loadApiKey()
    self.azureClient = AzureOpenAI(
      api_key=os.environ.get("AZURE_OPENAI_KEY"),
      api_version="2023-07-01-preview",
      azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT"),
    )
    self.groqClient = Groq(
      api_key=os.environ.get("GROQ_API_KEY"),
    )
    self.deepseekClient = OpenAI(api_key=os.environ.get("DEEPSEEK_API_KEY"), base_url="https://api.deepseek.com")

    # if platform == OPENAI:
    #   self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    # elif platform == AZURE:
    #   self.client = AzureOpenAI(
    #     api_key=os.environ.get("AZURE_OPENAI_KEY"),
    #     api_version="2023-07-01-preview",
    #     azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT"),
    #   )
    # elif platform == LOCAL:
    #   self.client = None
    # elif platform == GROQ:
    #   self.client = Groq(
    #     api_key=os.environ.get("GROQ_API_KEY"),
    #   )
    # else:
    #   raise ValueError("Invalid platform")
    # self.client = OpenAI(base_url="http://localhost:11434/v1")
    # llama2:7b (bad performance)
    # llama2:70b (bad performance)
    # codellama:7b (bad performance)
    # codellama:70b (bad performance)
    # self.model = "llama3:70b"

  def promptRemote(self, prompt: str, client: Union[AzureOpenAI, Groq, OpenAI]) -> str:

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
        max_tokens=70,
        temperature=0.01
      )
      # if self.model == GPT_35_TURBO:
      #   response = self.client.chat.completions.create(
      #     messages=self.chatHistory,
      #     model=self.model,
      #     temperature=0,
      #     max_tokens=800,
      #     top_p=0.95,
      #     frequency_penalty=1,
      #     presence_penalty=0,
      #     stop=None,
      #   )
      # else:
      #   debugger.info(f"[sendPrompt] model: {self.model}, {self.platform}, {self.client}")
      #   response = self.client.chat.completions.create(
      #     messages=self.chatHistory,
      #     model=self.model,
      #     max_tokens=4096,
      #     temperature=0.01,
      #   )
    except Exception as e:
      debugger.error(f"[sendPrompt] {e}")
      return ""

    text = response.choices[0].message.content
    if text is None:
      raise RuntimeError("No text provided")

    
    return text

  def promptLocal(self, prompt: str) -> str:
    # The endpoint URL
    url = "http://localhost:11434/chat_completion"

    # The data to send in the request
    data = {
        "dialogs": [
            [{"role": "user", "content": prompt}],
        ],
        "temperature": 0,
        "top_p": 0.95,
        "max_gen_len": 4096
    }

    # Make the POST request
    response = requests.post(url, json=data)
    text = ""

    # Check the response status code
    if response.status_code == 200:
        # Print the response JSON (which contains the generated results)
        arr = response.json()
        if len(arr) > 0:
          text = arr[0]["content"]
    else:
        debugger.error(f"[promptLocal] Request failed with status code {response.status_code}: {response.text}")
    
    return text

  def rotatePrompt(self, prompt: str) -> str:
    global counter
    self.model = LLAMA3_70B_8192
    text = self.promptRemote(prompt, self.groqClient)

    debugger.info(f"[rotatePrompt] counter: {counter}")
    
    counter += 1
    return text


  def sendPrompt(self, prompt: str) -> str:
    utilsX.logInFiles("---------\nPrompt: " + prompt + "\n---------")

    # if self.platform == OPENAI or self.platform == AZURE or self.platform == GROQ:
    #   text = self.promptRemote(prompt)
    # elif self.platform == LOCAL:
    #   text = self.promptLocal(prompt)
    # else:
    #   raise ValueError("Invalid platform")
    text = self.rotatePrompt(prompt)
    
    utilsX.logInFiles("\n--------response--------\n" + text)
    utilsX.logInFiles("--------finished--------")

    return text
