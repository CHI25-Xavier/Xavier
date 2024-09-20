import { CodeEditor } from '@jupyterlab/codeeditor';

import {timeout, handleFetch, HEADER_COMMON, API_URL} from "./apiUtils";
import { _debugVarInfo, _commonDict, CompResult, AnalyzeCodeResp } from "../interfaces";
import { IColLvInfo, IRowLvInfo, ITableLvInfo } from '../sidePanel/interface';

//previousCode2D, token, nbApi.dfList, nbApi.allDfInfo
export async function completeQuery(previousCode2D: string[][], token: CodeEditor.IToken, tableLvInfo: ITableLvInfo, rowLvInfo: IRowLvInfo, colLvInfo: IColLvInfo): Promise<CompResult> {
  // console.log("completeQuery", dfInfo, previousCode2D);
  try {
    const resp = await timeout(400000000, fetch(API_URL + '/complete', {
      // mode: 'no-cors',
      method: 'POST',
      headers: HEADER_COMMON,
      body: JSON.stringify({
        'previousCode2D': previousCode2D,
        'token': {
          ...token,
          "type": token.type === undefined ? null : token.type,
        },
        'tableLvInfo': tableLvInfo,
        'colLvInfo': colLvInfo,
        'rowLvInfo': rowLvInfo,
      })
    }));
    const j = await handleFetch(resp) as CompResult;
    return j;
  } catch (e) {
    console.log("[completeQuery] Error:", e);
    return {
      tokenList: [],
      analyzeResp: null,
    };
  }
};

export async function analyzeCodeQuery(previousCode2D: string[][], dfList: _debugVarInfo[]) {
  const resp = await timeout(400000000, fetch(API_URL + '/analyze_code', {
    method: 'POST',
    headers: HEADER_COMMON,
    body: JSON.stringify({
      'code': previousCode2D,
      'activeDfs': dfList
    })
  }));
  const j = await handleFetch(resp);
  return j as AnalyzeCodeResp;
};