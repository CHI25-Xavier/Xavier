import _ from "lodash";
import { IDFStyleAll } from "../sidePanel/interface";

export function resetAllColumnHighlight(allDfStyle: IDFStyleAll) {
  for (const key in allDfStyle) {
    for (const colKey in allDfStyle[key].columns) {
      allDfStyle[key].columns[colKey].isHighlight = false;
    }
  }
}

export function resetAllDfFold(tableColumnsLL: {[key: string]: string[]}, newAllDfStyle: IDFStyleAll) {
  if (!_.isEmpty(tableColumnsLL)) {
    for (const t in newAllDfStyle) {
      if (!(t in tableColumnsLL)) {
        newAllDfStyle[t].isFold = true;
      }
    }
  }
}