import { CSSProperties } from "react";
import { Property } from 'csstype';
import _ from "lodash";

import { IDFStyle, IPreviewItems, TCellSpecialStyle, TCellValue, TEditMode, TOverflowOption, TSupportOp } from "../interface";
import * as constant from "../../constant";
import * as utils from "../../utils";


export const contenteditableHandler = (editMode: TEditMode): boolean => {
  return editMode === "rw";
};

export const spreadsheetStyleHandler = (maxHeight: number | undefined): CSSProperties => {
  if (maxHeight !== undefined) {
    return {
      overflowY: "auto",
      maxHeight: `${maxHeight}px`,
    };
  } else {
    return {};
  }
};

export const headerRowStyleHandler = (headerRowHeight: number): CSSProperties => {
  return {
    height: `${headerRowHeight}px`
  };
};

export const tableRowStyleHandler = (tableRowHeight: number): CSSProperties => {
  return {
    height: `${tableRowHeight}px`
  };
};

export const headerContainerStyleHandler = (headerColor: string | undefined, cellMinWidth: number | undefined, cellMaxWidth: number | undefined): CSSProperties => {
  let res: CSSProperties = {};
  if (headerColor !== undefined) {
    res.backgroundColor = headerColor;
  }
  if (cellMinWidth !== undefined) {
    res.minWidth = `${cellMinWidth}px`;
  }
  if (cellMaxWidth !== undefined) {
    res.maxWidth = `${cellMaxWidth}px`;
  }
  return res;
};

export const headerCellStyleHandler = (headerRowHeight: number, headerFontColor: string, cellTextAlign: Property.TextAlign, headerFontSize: number, overflowOption: TOverflowOption): CSSProperties => {
  let s: CSSProperties = {
    lineHeight: `${headerRowHeight}px`,
    color: headerFontColor,
    textAlign: cellTextAlign,
  };
  if(headerFontSize < 12) {
    s.fontSize = "12px";
    s.transform = `scale(${headerFontSize/12})`;
  } else {
    s.fontSize = `${headerFontSize}px`;
  }
  if(overflowOption === "auto") {
    s.overflow = "auto";
  } else if(overflowOption === "scrollX") {
    s.overflowX = "auto"; // @TODO cannot use "overlay"
    s.overflowY = "hidden";
  } else if(overflowOption === "hidden") {
    s.overflow = "hidden";
    s.textOverflow = "ellipsis";
    s.whiteSpace = "nowrap";
  }
  // Add more overflow options here...
  return s;
};

export const commonTableCellStyleHandler = (tableRowHeight: number, tableFontColor: string, cellTextAlign: Property.TextAlign, tableFontSize: number): CSSProperties => {
  let s: CSSProperties = {
    height: `${tableRowHeight}px`,
    lineHeight: `${tableRowHeight}px`,
    color: tableFontColor,
    textAlign: cellTextAlign,
  };
  if(tableFontSize < 12) {
    s.fontSize = "12px";
    s.transform = `scale(${tableFontSize/12})`;
  } else {
    s.fontSize = `${tableFontSize}px`;
  }
  return s;
};

export const tableCellStyleHandler = (commonTableCellStyle: CSSProperties, overflowOption: TOverflowOption): CSSProperties => { //require: tableRowHeight, tableFontSize
  let s: CSSProperties = _.cloneDeep<CSSProperties>(commonTableCellStyle);
  if(overflowOption === "auto") {
    s.overflow = "auto";
  } else if(overflowOption === "hidden") {
    s.overflow = "hidden";
    s.textOverflow = "ellipsis";
    s.whiteSpace = "nowrap";
  } else if (overflowOption === "scrollX") {
    console.warn("[tableCellStyleHandler]Warning: style for scrollX is not implemented yet. Using hidden style instead.");
    s.overflow = "hidden";
    s.textOverflow = "ellipsis";
    s.whiteSpace = "nowrap";
  }
  return s;
};

export const tableCellStyleColPre = (tableCellStyle: CSSProperties, header: TCellValue[], row: TCellValue[], curColNum: number, dfName: string, previewItem: IPreviewItems | undefined, isPreviewColumn: boolean) => {
  if (previewItem === undefined) {
    return tableCellStyle;
  }
  
  if (isPreviewColumn) { // For preview column
    const cond = curColNum >= 1 && row[curColNum-1] !== row[curColNum] && utils.isSingleColumnOp(previewItem.op);
    if (cond) {
      const realTableCellStyle = _.cloneDeep(tableCellStyle);
      realTableCellStyle.fontWeight = "bold";
      return realTableCellStyle;
    } else {
      return tableCellStyle;
    }
  }

  // For adjacent column
  const pn = previewItem.newColumns;
  const cond2 = dfName in pn && (header[curColNum] as string) in pn[dfName] && curColNum < row.length - 1 && row[curColNum+1] !== row[curColNum] && utils.isSingleColumnOp(previewItem.op);

  // Another case is when it is a filtered value
  const pnt = previewItem.newTables;
  const cond3 = previewItem.op === "table_filter" && dfName in pnt && ["string", "number"].includes(typeof row[curColNum]) && pnt[dfName].condValues?.includes(String(row[curColNum]));
  
  if (cond2 || cond3) {
    const realTableCellStyle = _.cloneDeep(tableCellStyle);
    realTableCellStyle.fontWeight = "bold";
    return realTableCellStyle;
  } else {
    return tableCellStyle;
  }
}

export const tableContainerStyle = (rowNum: number, cellss: TCellSpecialStyle, alternateColor?: string[], InnerBorderStyle?: string, cellMinWidth?: number, cellMaxWidth?: number) => { //require: alternateColor, InnerBorderStyle
  let s: CSSProperties = {};
  if (cellss === "highlightAndDelete") {
    s.backgroundColor = constant.SSRowHLDelColor;
  } else if (cellss === "preview") {
    s.backgroundColor = constant.SSColumnPreColor;
  } else if (cellss === "deleted") {
    s.backgroundColor = constant.SSRowDelColor;
  } else if (cellss === "highlight") {
    s.backgroundColor = constant.SSColumnHLColor;
  } else if (alternateColor !== undefined) {
    s.backgroundColor = /*"#eaebee"*/alternateColor[rowNum % alternateColor.length];
  }
  if(InnerBorderStyle !== undefined) {
    s.border = InnerBorderStyle;
  }
  if(cellMinWidth !== undefined) {
    s.minWidth = `${cellMinWidth}px`;
  }
  if(cellMaxWidth !== undefined) {
    s.maxWidth = `${cellMaxWidth}px`;
  }
  return s;
};

export const moodHandler = (realAllDfStyle: IDFStyle): boolean => {
  return realAllDfStyle.isShowRows;
}

export const addDummyValue = (row: TCellValue[]) => {
  row.push("---");
}

export const tableHandler = (previewItems: IPreviewItems | undefined, header: TCellValue[], table: TCellValue[][], dfName: string) => {
  let headerCopy = _.cloneDeep<TCellValue[]>(header);
  let tableCopy = _.cloneDeep<TCellValue[][]>(table);
  if (previewItems !== undefined) {
    utils.tableAddPreviewColumn(headerCopy, tableCopy, previewItems, dfName);
  }
  tableCopy.forEach((row) => {
    addDummyValue(row); // Add a dummy column because we need to correctly scroll the table
  });
  return tableCopy;
}

export const headerHandler = (previewItems: IPreviewItems | undefined, header: TCellValue[], table: TCellValue[][], dfName: string) => {
  let headerCopy = _.cloneDeep<TCellValue[]>(header);
  let tableCopy = _.cloneDeep<TCellValue[][]>(table);
  if (previewItems !== undefined) {
    utils.tableAddPreviewColumn(headerCopy, tableCopy, previewItems, dfName);
  }
  addDummyValue(headerCopy); // Add a dummy column because we need to correctly scroll the table
  return headerCopy;
}

export const scrollHandlerFac = (parentElement: HTMLDivElement, floatColumnRefs: React.MutableRefObject<{
  el: HTMLDivElement;
  colNum: number;
}[]>) => {
  return () => {
    if (parentElement) {
      const ctnWidth = constant.SSCellMaxWidth + 10; // 10 means padding
      const parentRect = parentElement.getBoundingClientRect();
      const pScrollL = parentElement.scrollLeft;
      const isVisibleRef: {el: HTMLDivElement; colNum: number;}[] = [];
      const isNotVisibleRef: {el: HTMLDivElement; colNum: number;}[] = [];
      const allFloatRef: {el: HTMLDivElement; colNum: number;}[] = [];
  
      floatColumnRefs.current.forEach((fref) => {
        const cOriginRightRe = ctnWidth * (fref.colNum + 1);
        if (pScrollL + parentRect.width >= cOriginRightRe) {
          isVisibleRef.push(fref);
        } else {
          isNotVisibleRef.push(fref);
        }
      });
      isVisibleRef.forEach((fref) => {
        fref.el.classList.remove('xavier-cc-float-right');
        fref.el.style.right = "";
      });

      // First we put the invisible element to the right
      let allColNumNotVis = _.uniq(isNotVisibleRef.map((fref) => fref.colNum));
      allColNumNotVis.sort((a, b) => b - a); // Sort in descending order
      isNotVisibleRef.forEach((fref) => {
        fref.el.classList.add('xavier-cc-float-right');
        const rank = allColNumNotVis.indexOf(fref.colNum);
        fref.el.style.right = `${10 + ctnWidth * rank}px`;
        allFloatRef.push(fref);
      });

      // Then if the originally visible columns become invisible, we need to adjust the position
      const curNumOfFloatCol = allColNumNotVis.length;
      let allColNumVis = _.uniq(isVisibleRef.map((fref) => fref.colNum));
      allColNumVis.sort((a, b) => b - a); // Sort in descending order
      isVisibleRef.forEach((fref) => {
        const cOriginRightRe = ctnWidth * (fref.colNum + 1);
        if (pScrollL + parentRect.width < cOriginRightRe + ctnWidth * curNumOfFloatCol) {
          fref.el.classList.add('xavier-cc-float-right');
          const rank = allColNumVis.indexOf(fref.colNum);
          fref.el.style.right = `${10 + ctnWidth * (curNumOfFloatCol+rank)}px`;
          allFloatRef.push(fref);
        }
      });

      // Only let the first fref and the last fref to have shadows
      let allFloatNum = _.uniq(allFloatRef.map((fref) => fref.colNum));
      allFloatNum.sort((a, b) => a - b);
      allFloatRef.forEach((fref) => {
        const rank = allFloatNum.indexOf(fref.colNum);
        if (rank === 0 && rank === allFloatNum.length - 1) {
          fref.el.style.boxShadow = "-4px 4px 8px rgba(0, 0, 0, 0.1), 6px 4px 8px rgba(0, 0, 0, 0.1)"
        } else if (rank === 0) {
          fref.el.style.boxShadow = "-4px 4px 8px rgba(0, 0, 0, 0.1)";
        } else if (rank === allFloatNum.length - 1) {
          fref.el.style.boxShadow = "6px 4px 8px rgba(0, 0, 0, 0.1)";
        }
      });
    }
  }
}

export const fixFloatColumn = (rootRef: React.RefObject<HTMLDivElement>, floatColumnRefs: React.MutableRefObject<{
  el: HTMLDivElement;
  colNum: number;
}[]>) => {
  return () => {
    const parentElement = rootRef.current?.parentElement;
    scrollHandlerFac(parentElement as HTMLDivElement, floatColumnRefs)();
  }
}

export const attachScrollHandlerFac = (rootRef: React.RefObject<HTMLDivElement>, floatColumnRefs: React.MutableRefObject<{
  el: HTMLDivElement;
  colNum: number;
}[]>) => {
  return () => {
    const parentElement = rootRef.current?.parentElement;
    
    if (parentElement) {
      parentElement.addEventListener('scroll', scrollHandlerFac(parentElement as HTMLDivElement, floatColumnRefs));
    }
    return () => {
      if (parentElement) {
        parentElement.removeEventListener('scroll', scrollHandlerFac(parentElement as HTMLDivElement, floatColumnRefs));
      }
    };
  }
}

export function calCellCtnAltColor(p_alternateColor: string[] | undefined, deletedRowsFound: boolean, op: TSupportOp | null | undefined) {
  return utils.isSupportDeleteRowOp(op) && deletedRowsFound ? undefined : p_alternateColor;
}

export const fcRefFuncFac = (floatColumnRefs: React.MutableRefObject<{el: HTMLDivElement; colNum: number;}[]>) => {
  return (colNum: number, enable: boolean) => {
    return (el: HTMLDivElement | null) => {
      if (el && enable) {
        floatColumnRefs.current.push({el, colNum});
      }
    };
  }
}

export const zoomTitle = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, isZoomIn: boolean, type: boolean) => {
  // isZoomIn = true;
  let zoomIndex = 0.6;
  // if(type) { //如果是text，那么按照文本长度进行缩放
    let textWidth = e.currentTarget.innerText.length * 3.2;
    zoomIndex = textWidth / constant.SSCellMaxWidth;
  // }

  let width = constant.SSCellMaxWidth;

  e.currentTarget.style.marginLeft = isZoomIn ? -width * zoomIndex / 2 + 'px' : '0px';
  e.currentTarget.style.width = isZoomIn? width * (1 + zoomIndex) + 'px' : width +  'px';

  e.currentTarget.style.boxShadow = isZoomIn? '10px 0 15px rgba(0, 0, 0, 0.1), -10px 0 15px rgba(0, 0, 0, 0.1)' : 'none';

  e.currentTarget.style.transition = 'all 0.3s'; //坑的一批，加了动画再动态获取宽度会导致获取宽度异常

  const firstChild = e.currentTarget.children[0] as HTMLElement;

  firstChild.style.zIndex = isZoomIn ? '2' : '';
  firstChild.style.backgroundColor = 'white';

  // if(!type) {//如果是图形那就也放大height
  //   e.currentTarget.style.marginTop = isZoomIn ? -p_headerRowHeight * zoomIndex / 2 + 'px' : '0px';
  //   e.currentTarget.style.height = isZoomIn? p_headerRowHeight * (1 + zoomIndex) + 'px' : p_headerRowHeight +  'px';  
  //   firstChild.style.height = isZoomIn? p_headerRowHeight * (1 + zoomIndex) + 'px' : p_headerRowHeight +  'px';
  //   e.currentTarget.style.transition = 'all 1s';
  // }

}