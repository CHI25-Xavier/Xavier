import traceback
from flask import request
from flask.json import jsonify

from src.server import apiFunc as apiX
from src.server.myCompletionServer import myCompletionServer
from src.debugger import debugger
from src.constant import LLAMA3_70B_8192, LLAMA31_70B_VERSATILE, RUN_HOST, RUN_PORT

SERVER = myCompletionServer(LLAMA3_70B_8192)

@SERVER.app.route("/complete", methods=["POST"])
def complete():
	global SERVER
	client = SERVER.client
	para = request.get_json()
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
		token_list, analyze_resp = apiX.try_complete(SERVER, client, previousCode2D, token, tableLvInfo, colLvInfo, rowLvInfo)
		resJson = {
			"tokenList": token_list,
			"analyzeResp": analyze_resp
		}
	except Exception as e:
		debugger.error(f"Error in complete: {str(e)}")
		traceback.print_exc()

	return jsonify(resJson)

if __name__ == '__main__':
	SERVER.run(RUN_HOST, RUN_PORT)