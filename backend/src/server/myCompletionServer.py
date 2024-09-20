import copy
from flask import Flask
from flask_cors import CORS
from typeguard import typechecked

from src.server.myAIClient import myAIClient
from src.constant import OPENAI, AZURE, LOCAL, GROQ, AST_POS, SPECIAL_CASE
from src.datatypes import List, Dict, Optional, CacheInfo

@typechecked
class myCompletionServer:
	def __init__(self, model: str) -> None:
		self.caseno: Optional[str] = None
		self.app = Flask(__name__)
		CORS(self.app)
		self.client = myAIClient(model=model, platform=GROQ)
		# initialize completion cache
		cacheInit: CacheInfo = {
			"previousTokens": [],
			"completionList": [],
		}
		astPosMember = [attr for attr in dir(AST_POS) if not callable(getattr(AST_POS, attr)) and not attr.startswith("__")]
		self.completionCache: Dict[int, CacheInfo] = {}
		for m in astPosMember:
			self.completionCache[getattr(AST_POS, m)] = copy.deepcopy(cacheInit)

	def run(self) -> None:
		self.app.run(
			host='0.0.0.0',
			port=1022,
			debug=True
		)

	def setCase(self, caseno: str) -> None:
		self.caseno = caseno