import { AnalyzeCodeResp } from "../interfaces";

export function dfNamePrefixDD(analyzeRes: AnalyzeCodeResp) {
  const dflist = analyzeRes.df_name_list;
  let newSelectedDFName: string | null = null;
  if (dflist === null) {
    console.warn("[dfNamePrefixSeq] no dfNameList found.");
    return newSelectedDFName;
  }
  newSelectedDFName = dflist.length === 1 ? dflist[0] : null;
  return newSelectedDFName;
}