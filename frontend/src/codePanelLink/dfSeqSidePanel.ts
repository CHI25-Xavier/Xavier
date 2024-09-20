import { AnalyzeCodeResp } from "../interfaces";

export function dfNamePrefixSeq(analyzeRes: AnalyzeCodeResp, oldAllDfSeq: string[]) {
  const dflist = analyzeRes.df_name_list;
  let newAllDfSeq: string[] | null = null;
  if (dflist === null) {
    console.warn("[dfNamePrefixSeq] no dfNameList found.");
    return newAllDfSeq;
  }
  newAllDfSeq = [...dflist];
  for (let i = 0; i < oldAllDfSeq.length; i++) {
    if (dflist.indexOf(oldAllDfSeq[i]) === -1) {
      newAllDfSeq.push(oldAllDfSeq[i]);
    }
  }
  return newAllDfSeq;
}