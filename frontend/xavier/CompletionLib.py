import json
import traceback
from typeguard import typechecked

from .server.server import apiFunc as apiX
from .server.server.myAIClient import myAIClient
from .server.debugger import debugger
from .server.constant import LLAMA3_70B_8192, LLAMA31_70B_VERSATILE, RUN_HOST, RUN_PORT

CLIENT = myAIClient(LLAMA3_70B_8192)

@typechecked
def setGroqAPIKey(apiKey: str) -> None:
	global CLIENT
	res = {
		"status": True,
	}
	if not apiKey:
		debugger.error("API Key is empty. Please set a valid API Key.")
		res["status"] = False
		print(json.dumps(res, default=str))
	CLIENT.initGroqClient(apiKey)
	print(json.dumps(res, default=str))
	
@typechecked
def complete(_para: str) -> None:
	global CLIENT
	para = json.loads(_para)
	previousCode2D = para["previousCode2D"]
	token = para["token"]
	tableLvInfo = para["tableLvInfo"]
	colLvInfo = para["colLvInfo"]
	rowLvInfo = para["rowLvInfo"]

	resJson = {
		"tokenList": [],
		"analyzeResp": None
	}
	try: 
		token_list, analyze_resp = apiX.try_complete(CLIENT, previousCode2D, token, tableLvInfo, colLvInfo, rowLvInfo)
		resJson = {
			"tokenList": token_list,
			"analyzeResp": analyze_resp
		}
	except Exception as e:
		debugger.error(f"Error in complete: {str(e)}")
		traceback.print_exc()

	print(json.dumps(resJson, default=str))