from flask import Flask
from flask_cors import CORS
from typeguard import typechecked

from src.server.myAIClient import myAIClient
from src.datatypes import List, Dict, Optional

@typechecked
class myCompletionServer:
	def __init__(self, model: str) -> None:
		self.caseno: Optional[str] = None
		self.app = Flask(__name__)
		CORS(self.app)
		self.client = myAIClient(model)

	def run(self, host: str, port: int) -> None:
		self.app.run(
			host=host,
			port=port,
			debug=True
		)

	def setCase(self, caseno: str) -> None:
		self.caseno = caseno