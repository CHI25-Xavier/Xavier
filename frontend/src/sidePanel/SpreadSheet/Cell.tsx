import React, { useState, useEffect, useMemo, CSSProperties } from 'react';
import { Property } from "csstype";

import { toFix, isNumeric } from "../../utils";
import { TCellValue } from '../interface';

interface SpreadsheetCellProps {
  givenId: string;
  cellStyle?: CSSProperties;
  cellValue?: TCellValue;
  cellBold?: boolean;
  contenteditable?: boolean;
  row?: number;
  col?: number;
  onDblclick?: () => void;
  cellChange?: (arg: {oldValue: string, newValue: string, tableName: string, row: number, col: number}) => void;
}

const realValueHandler = (cv: TCellValue): string => {
  if (cv === undefined || cv === null) {
    return "NaN";
  } else if (cv === "") {
    return "<Empty String>";
  }

  if ((cv as any).value != undefined) {
    if (!(cv as any).value.lower) {
      return String(toFix((cv as any).value));
    } else if ((cv as any).value.isRightOpen == true) {
      return `[${toFix((cv as any).value.lower)}, ${toFix((cv as any).value.upper)})`;
    } else {
      return `[${toFix((cv as any).value.lower)}, ${toFix((cv as any).value.upper)}]`;
    }
  } else if(typeof cv === "string" || typeof cv === "number"){
    return String(toFix(cv));
  }
  // Can add more cases here for other types of cell values
  return String(cv);
};

const SpreadsheetCell: React.FC<SpreadsheetCellProps> = (props: SpreadsheetCellProps) => {
  const p_cellBold = useMemo(() => (props.cellBold !== undefined ? props.cellBold : false), [props.cellBold]);
  const p_contenteditable = useMemo(() => (props.contenteditable !== undefined ? props.contenteditable : false), [props.contenteditable]);

  const [editEn, setEditEn] = useState<boolean>(false);
  const [e_target, setE_target] = useState<HTMLElement | null>(null);
  const [storedStyle, setStoredStyle] = useState<CSSProperties>({});
  const realValue = useMemo<string>(() => realValueHandler(props.cellValue), [props.cellValue]);
  const givenIdRef = React.createRef<HTMLDivElement>();

  useEffect(() => {
    if(editEn && e_target) {
      e_target.focus();
    }
  }, [editEn, e_target]);

  const commitEdit = (e: React.FocusEvent<HTMLDivElement>) => {
    setEditEn(false);
    let splitres = props.givenId.split("_");
    if(splitres[splitres.length - 3] !== "cell" ||
        !isNumeric(splitres[splitres.length - 1]) ||
        !isNumeric(splitres[splitres.length - 2])) {
      console.error("commitEdit: Invalid cell ID!");
      return;
    }  
    let col = Number(splitres[splitres.length - 1]);  
    let row = Number(splitres[splitres.length - 2]);  
    let tableName = splitres.slice(0, splitres.length - 3).join("_");
    if (props.cellChange) {
      props.cellChange({
        oldValue: realValue,
        newValue: e.target.innerText,
        tableName, row, col
      });
    }
    if (!givenIdRef.current) {
      console.warn("[commitEdit] givenIdRef is null");
      return;
    }
    const s = givenIdRef.current.style;
    if(storedStyle.overflow !== undefined) {
      s.overflow = storedStyle.overflow;
    }
    if(storedStyle.textOverflow !== undefined) {
      s.textOverflow = storedStyle.textOverflow;
    }
    if(storedStyle.overflowX !== undefined) {
      s.overflowX = storedStyle.overflowX;
    }
    if(storedStyle.overflowY !== undefined) {
      s.overflowY = storedStyle.overflowY;
    }
  };
  
  const enableEdit = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    if (p_contenteditable) {
      setEditEn(true);
      setE_target(e.target as HTMLElement);
      if (!givenIdRef.current) {
        console.warn("[enableEdit] givenIdRef is null");
        return;
      }
      const s = givenIdRef.current.style;
      setStoredStyle({
        overflow: s.overflow as Property.Overflow,
        textOverflow: s.textOverflow as Property.TextOverflow,
        overflowX: s.overflowX as Property.OverflowX,
        overflowY: s.overflowY as Property.OverflowY,
      });
      s.overflow = "";
      s.textOverflow = "";
      s.overflowX = "overlay";
      s.overflowY = "hidden";
    } else if (props.onDblclick) {
      props.onDblclick();
    }
  };

  const cellClassName = `cell ${p_cellBold ? 'text-bold' : ''} ${((props.cellValue === undefined || props.cellValue === null || props.cellValue === '') && !(props.cellStyle && props.cellStyle.color === "transparent")) ? 'xavier-cell-empty' : ''}`;
  
  return (
    <div
      id={props.givenId}
      ref={givenIdRef}
      className={cellClassName}
      style={props.cellStyle}
      contentEditable={p_contenteditable && editEn}
      onMouseDown={e => e.stopPropagation()}
      // onClick={e => e.stopPropagation()}
      onDoubleClick={enableEdit}
      onBlur={commitEdit}
    >
      {realValue}
    </div>
  );
}

export default SpreadsheetCell;