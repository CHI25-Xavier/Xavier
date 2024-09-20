import React, { useState, useMemo, CSSProperties, useRef, useEffect } from 'react';
import _ from 'lodash';
import { Property } from 'csstype';

import Cell from './Cell';
import * as utils from "../../utils";

import { IColStyleAll, IDfCondAll,IDFInfoAll, IDFStyle, IHistogramBinCache, IPreviewItems, IRowSampleCache, IValueCountCache, TCellValue, TEditMode, TOverflowOption } from '../interface';

import { FgetRowSampleOfOneDf, FOnSampleBtnClick, FSetAllDfStyle } from '../interfaceFunc';
import { addDummyValue, attachScrollHandlerFac, calCellCtnAltColor, commonTableCellStyleHandler, contenteditableHandler, fcRefFuncFac, fixFloatColumn, headerCellStyleHandler, headerContainerStyleHandler, headerHandler, headerRowStyleHandler, moodHandler, spreadsheetStyleHandler, tableCellStyleColPre, tableCellStyleHandler, tableContainerStyle, tableHandler, tableRowStyleHandler } from './SSStyle';
import { HeaderRenderer } from './HeaderRenderer';
import { SGRowRenderer } from './SGRowRenderer';

interface IColMode {
  [dfName: string]: {
    [colName: string]: number;
  }
}


interface IProps {
  name: string;
  editMode?: TEditMode;
  initRowNum?: number;
  initColNum?: number;
  fixedRowNum?: number;
  fixedColNum?: number;
  minRowNum?: number;
  minColNum?: number;
  headerRowHeight?: number;
  tableRowHeight?: number;
  cellMinWidth?: number;
  cellMaxWidth?: number;
  overflowOption?: TOverflowOption;
  cellTextAlign?: Property.TextAlign;
  headerColor?: string;
  alternateColor?: string[];
  InnerBorderStyle?: string;
  headerFontColor?: string;
  headerFontSize?: number;
  tableFontSize?: number;
  tableFontColor?: string;
  maxHeight?: number;
  table: Array<Array<TCellValue>>;
  header: Array<TCellValue>;
  
  onlyPreviewSchema?: boolean;
  allDfInfo?: IDFInfoAll;
  dfName: string;
  histogramBin?: IHistogramBinCache;
  dfStyle?: IDFStyle;
  _allColMode?: IColMode;
  valueCounts: IValueCountCache;
  selectCond: IDfCondAll | null;
  rowSampleCache: IRowSampleCache;

  setAllDfStyle: FSetAllDfStyle;
  getRowSampleOfOneDf: FgetRowSampleOfOneDf;
  previewItems?: IPreviewItems;
  onSampleBtnClick?: FOnSampleBtnClick;
}

const exactProps = (props: IProps) => {
  const p_name = props.name;  
  const p_editMode = (props.editMode !== undefined) ? props.editMode : "r";
  const p_initRowNum = (props.initRowNum !== undefined) ? props.initRowNum : 0;
  const p_initColNum = (props.initColNum !== undefined) ? props.initColNum : 0;
  const p_fixedRowNum = (props.fixedRowNum !== undefined) ? props.fixedRowNum : 0;
  const p_fixedColNum = (props.fixedColNum !== undefined) ? props.fixedColNum : 0;
  const p_minRowNum = (props.minRowNum !== undefined) ? props.minRowNum : 0;
  const p_minColNum = (props.minColNum !== undefined) ? props.minColNum : 0;
  const p_headerRowHeight = (props.headerRowHeight !== undefined) ? props.headerRowHeight : 32;
  const p_tableRowHeight = (props.tableRowHeight !== undefined) ? props.tableRowHeight : 26;
  const p_cellMinWidth = props.cellMinWidth;
  const p_cellMaxWidth = props.cellMaxWidth;
  const p_overflowOption = (props.overflowOption !== undefined) ? props.overflowOption : "auto";
  const p_cellTextAlign = (props.cellTextAlign !== undefined) ? props.cellTextAlign : "center";
  const p_headerColor = props.headerColor;
  const p_alternateColor = props.alternateColor;
  const p_InnerBorderStyle = props.InnerBorderStyle;
  const p_headerFontColor = (props.headerFontColor !== undefined) ? props.headerFontColor : "#000";
  const p_headerFontSize = (props.headerFontSize !== undefined) ? props.headerFontSize : 14;
  const p_tableFontSize = (props.tableFontSize !== undefined) ? props.tableFontSize : 10;
  const p_tableFontColor = (props.tableFontColor !== undefined) ? props.tableFontColor : "#000";
  const p_height = props.maxHeight;

  const p_onlyPreviewSchema = props.onlyPreviewSchema === undefined ? false : props.onlyPreviewSchema;
  const p_allDfInfo = (!p_onlyPreviewSchema && props.allDfInfo !== undefined) ? props.allDfInfo : {};
  const p_dfName = props.dfName;
  const p_dfStyle: IDFStyle = props.dfStyle === undefined ? {
    tableName: p_dfName,
    isFold: true,
    isShowRows: false,
    columns: {}
  } : props.dfStyle;
  const histogramBin = props.histogramBin === undefined ? {} : props.histogramBin;
  const _allColMode = props._allColMode === undefined ? {} : props._allColMode;
  const valueCounts = props.valueCounts;
  const p_selectCond = props.selectCond;

  const p_previewItems = props.previewItems;

  return { p_name, p_editMode, p_initRowNum, p_initColNum, p_fixedRowNum, p_fixedColNum, p_minRowNum, 
    p_minColNum, p_headerRowHeight, p_tableRowHeight, p_cellMinWidth, p_cellMaxWidth, p_overflowOption,
     p_cellTextAlign, p_headerColor, p_alternateColor, p_InnerBorderStyle, p_headerFontColor, p_headerFontSize,
      p_tableFontSize, p_tableFontColor, p_height,
      p_onlyPreviewSchema, p_allDfInfo, p_dfName, p_dfStyle, histogramBin, _allColMode, valueCounts, p_selectCond, p_previewItems };
};

const SpreadSheet: React.FC<IProps> = (props: IProps) => {
  // @TODO: I don't know whether or not it can react to props change
  const { p_name, p_editMode, p_headerRowHeight, p_tableRowHeight, p_cellMinWidth, p_cellMaxWidth, p_overflowOption, 
    p_cellTextAlign, p_headerColor, p_alternateColor, p_InnerBorderStyle, p_headerFontColor, p_headerFontSize,
    p_tableFontSize, p_tableFontColor, p_height,
    p_onlyPreviewSchema, p_allDfInfo, p_dfName, p_dfStyle, histogramBin, _allColMode, valueCounts, p_selectCond, p_previewItems } = exactProps(props);
  const p_table = useMemo(() => tableHandler(props.previewItems, props.header, props.table, props.dfName), [props.previewItems, props.table, props.header, props.dfName]);
  const p_header = useMemo(() => headerHandler(props.previewItems, props.header, props.table, props.dfName), [props.previewItems, props.table, props.header, props.dfName]);

  const mood = useMemo<boolean>(() => moodHandler(p_dfStyle), [p_dfStyle]);
  const [searchInputActive, setSearchInputActive] = useState<number | null>(null); // 用来记录当前激活的input的索引，null表示没有激活

  // const [editingCellInfo, setEditingCellInfo] = useState<IEditingCellInfo>({ exist: false, row: -1, col: -1 })

  const contenteditable = useMemo<boolean>(() => contenteditableHandler(p_editMode), [p_editMode]);
  const spreadsheetStyle = useMemo<CSSProperties>(() => spreadsheetStyleHandler(p_height), [p_height]);
  const headerRowStyle = useMemo<CSSProperties>(() => headerRowStyleHandler(p_headerRowHeight), [p_headerRowHeight]);
  const tableRowStyle = useMemo<CSSProperties>(() => tableRowStyleHandler(p_tableRowHeight), [p_tableRowHeight]);
  const headerContainerStyle = useMemo<CSSProperties>(() => headerContainerStyleHandler(p_headerColor, p_cellMinWidth, p_cellMaxWidth), [p_headerColor, p_cellMinWidth, p_cellMaxWidth]);
  const headerCellStyle = useMemo<CSSProperties>(() => headerCellStyleHandler(p_headerRowHeight, p_headerFontColor, p_cellTextAlign, p_headerFontSize, p_overflowOption), [p_headerRowHeight, p_headerFontColor, p_cellTextAlign, p_headerFontSize, p_overflowOption]);
  const commonTableCellStyle = useMemo<CSSProperties>(() => commonTableCellStyleHandler(p_tableRowHeight, p_tableFontColor, p_cellTextAlign, p_tableFontSize), [p_tableRowHeight, p_tableFontColor, p_cellTextAlign, p_tableFontSize]);
  const tableCellStyle = useMemo<CSSProperties>(() => tableCellStyleHandler(commonTableCellStyle, p_overflowOption), [commonTableCellStyle, p_overflowOption]);

  const floatColumnRefs = useRef<{
    el: HTMLDivElement,
    colNum: number
  }[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(attachScrollHandlerFac(rootRef, floatColumnRefs) , []); // Empty dependency array means this effect will only run once after the initial render
  useEffect(fixFloatColumn(rootRef, floatColumnRefs)); // No dependencies means this effect will run after every render
  useEffect(() => {    
    floatColumnRefs.current = [];
  });

  const [updateKey, setUpdateKey] = useState(0);
  useEffect(() => {
    // Increment the updateKey to force a re-render
    // The reason for re-render is the bug of the float column header style. @TODO
    setUpdateKey(prevKey => prevKey + 1);
  }, [props.header, props.table]); // Dependency array includes props that should trigger a re-render

  const renderTable = ()=> {
    
    if(p_table.length === 0) { //筛选为空表时，渲染10行空表
      return (
        [...Array(10)].map((_, i) => (
          <div key={utils.myNanoid(20) + String(i)} className="row" style={tableRowStyle}>
            {[...Array(p_header.length)].map((_, j) => (
              <div  key={utils.myNanoid(20) + String(i + j)}
              className="cell-container"
              style={tableContainerStyle(i, "normal", p_alternateColor, p_InnerBorderStyle, p_cellMinWidth, p_cellMaxWidth)}
              ></div>
            ))}
          </div>
      )))
    }

    const isTableInSituPreview = utils.tableShouldInSituPreview(p_dfName, p_previewItems);
    const previewRows = isTableInSituPreview && p_previewItems !== undefined ? p_previewItems.newTables[p_dfName] : undefined;
    const deletedRowsFound = isTableInSituPreview &&
      previewRows !== undefined &&
      p_table.some((row, i) => !utils.canFindRows(row, utils.dfRows2SSRows(previewRows.rows, p_header as string[])));

    return (
      <>
      {p_table.map((row, i) => {
        const isDeletedRows = isTableInSituPreview && previewRows !== undefined && !utils.canFindRows(row, utils.dfRows2SSRows(previewRows.rows, p_header as string[]));
        return (
          <div  key={utils.myNanoid(20) + String(i)}
                className="row"
                style={tableRowStyle}
          >
            {row.map((rowValue, j) => {
              if (j === row.length - 1) {
                const realTableCellStyle = _.cloneDeep(tableCellStyle);
                realTableCellStyle.color = "transparent";
                const realTableCtnStyle = tableContainerStyle(i, "normal", p_alternateColor, p_InnerBorderStyle, p_cellMinWidth, p_cellMaxWidth);
                realTableCtnStyle.backgroundColor = undefined;
                return (
                  <div  key={utils.myNanoid(20) + String(i + j)}
                        className="cell-container"
                        style={realTableCtnStyle}>
                    <Cell givenId={`_dummy_${p_name}_cell_${i}_${j}`}
                          cellValue={rowValue}
                          row={i}
                          col={1 + j}
                          contenteditable={contenteditable}
                          cellStyle={realTableCellStyle}/>
                  </div>
                );
              }

              const colName = p_header[j] as string;
              const pn = p_previewItems?.newColumns;
              const op = p_previewItems?.op;
              const previewDetail = (pn !== undefined && p_dfName in pn && j > 1) ? pn[p_dfName][(p_header[j-1] as string)] : undefined;
              const isPreviewColumn = utils.isSupportPreviewOp(op) && previewDetail !== undefined && previewDetail.newColumn === colName;
              const isHighlight = colName in p_dfStyle.columns ? p_dfStyle.columns[colName].isHighlight : false;
              
              const realTableCellStyle = tableCellStyleColPre(tableCellStyle, p_header, row, j, p_dfName, p_previewItems, isPreviewColumn);
              const cellCtnSpecialStyle = utils.calCellCtnSpecialStyle(deletedRowsFound, isPreviewColumn, isDeletedRows, isHighlight, op);
              const altColor = calCellCtnAltColor(p_alternateColor, deletedRowsFound, op);

              return (
                <div  key={utils.myNanoid(20) + String(i + j)}
                      ref={fcRefFuncFac(floatColumnRefs)(j, isPreviewColumn || isHighlight)}
                      className="cell-container"
                      style={tableContainerStyle(i, cellCtnSpecialStyle, altColor, p_InnerBorderStyle, p_cellMinWidth, p_cellMaxWidth)}
                >
                  <Cell givenId={`${p_name}_cell_${i}_${j}`} cellValue={rowValue}  row={i} col={1 + j} contenteditable={contenteditable} cellStyle={realTableCellStyle} />
                </div>
              );
            })}
          </div>
        );
        })}
      </>
    )
  }

  const renderOtherSchemas = () => {
    const nt = p_previewItems?.newTables;
    if (nt === undefined || !utils.isSupportMultiSchemaOp(p_previewItems?.op)) {
      return null;
    }
    const tables = Object.keys(nt);
    if (tables.length === 0) {
      return null;
    }
    const allInSitu = tables.every(t => nt[t].isInSituIfSameTable);
    if (!allInSitu) {
      return null;
    }
    const newTableName = nt[tables[0]].newTable; // @TODO: We assume that all tables have the same new table name    

    if (p_name.startsWith("table-view-ss-preview-")) { // Is preview table
      return tables.map((t, i) => {
        const key = utils.myNanoid(20);
        const dfMeta = nt[t].dfMeta;
        // columns style
        const dfColsStyle: IColStyleAll = {};
        dfMeta.columnNameList.forEach(col => {
          dfColsStyle[col] = {
            colName: col,
            isHighlight: false
          };
        });
        const realHeader = _.cloneDeep(dfMeta.columnNameList);
        addDummyValue(realHeader);

        return (
          <>
            <HeaderRenderer key={key}
                            tableName={dfMeta.tableName}
                            spreadsheetName={p_name + "---" + key}
                            header={realHeader}
                            headerRowStyle={headerRowStyle}
                            headerContainerStyle={headerContainerStyle}
                            headerCellStyle={headerCellStyle}
                            dfColsStyle={dfColsStyle}
                            mood={false}
                            searchInputActive={null} />
            <SGRowRenderer  key={key}
                            tableName={dfMeta.tableName}
                            spreadsheetName={p_name + "---" + key}
                            header={realHeader}
                            headerRowStyle={headerRowStyle}
                            headerContainerStyle={headerContainerStyle}
                            headerCellStyle={headerCellStyle}
                            dfColsStyle={dfColsStyle}
                            dfInfo={dfMeta}
                            histogramBin={nt[t].histograms} />
          </>
        )
      });
    } else if (newTableName === p_dfName) {
      // If the table is not a preview table, insert other schemas
      return tables.map((t, i) => {
        if (t === p_dfName) {
          return null;
        }
        const key = utils.myNanoid(20);
        const dfMeta = nt[t].dfMeta;
        // columns style
        const dfColsStyle: IColStyleAll = {};
        dfMeta.columnNameList.forEach(col => {
          dfColsStyle[col] = {
            colName: col,
            isHighlight: false
          };
        });
        const realHeader = _.cloneDeep(dfMeta.columnNameList);
        addDummyValue(realHeader);
  
        return (
          <>
            <HeaderRenderer key={key}
                            tableName={dfMeta.tableName}
                            spreadsheetName={p_name + "-header-" + key}
                            header={realHeader}
                            headerRowStyle={headerRowStyle}
                            headerContainerStyle={headerContainerStyle}
                            headerCellStyle={headerCellStyle}
                            dfColsStyle={dfColsStyle}
                            mood={false}
                            searchInputActive={null} />
            <SGRowRenderer  key={key}
                            tableName={dfMeta.tableName}
                            spreadsheetName={p_name + "-sg-" + key}
                            header={realHeader}
                            headerRowStyle={headerRowStyle}
                            headerContainerStyle={headerContainerStyle}
                            headerCellStyle={headerCellStyle}
                            dfColsStyle={dfColsStyle}
                            dfInfo={dfMeta}
                            histogramBin={nt[t].histograms} />
          </>
        )
      });
    }
    return null;
  }

  const headerRendererDiv = p_onlyPreviewSchema ? null : (
    <HeaderRenderer   tableName={p_dfName}
                      spreadsheetName={p_name}
                      header={p_header}
                      headerRowStyle={headerRowStyle}
                      headerContainerStyle={headerContainerStyle}
                      headerCellStyle={headerCellStyle}
                      dfColsStyle={p_dfStyle.columns}
                      mood={mood}
                      searchInputActive={searchInputActive}
                      
                      previewItems={p_previewItems}
                      floatColumnRefFunc={fcRefFuncFac(floatColumnRefs)}
                      setSearchInputActive={setSearchInputActive}
                      filterListRendererParam={{
                        selectCond: p_selectCond,
                        allColMode: _allColMode,
                        allDfInfo: p_allDfInfo,
                        valueCounts: valueCounts,
                        rowSampleCache: props.rowSampleCache,
                        getRowSampleOfOneDf: props.getRowSampleOfOneDf,
                      }} />
  );
  const sgRowRendererDiv = p_onlyPreviewSchema ? null : (
    <SGRowRenderer    tableName={p_dfName}
                      spreadsheetName={p_name}
                      header={p_header}
                      headerRowStyle={headerRowStyle}
                      headerContainerStyle={headerContainerStyle}
                      headerCellStyle={headerCellStyle}
                      dfColsStyle={p_dfStyle.columns}
                      dfInfo={p_allDfInfo[p_dfName]}
                      histogramBin={histogramBin[p_dfName]}
                      
                      previewItems={p_previewItems}
                      floatColumnRefFunc={fcRefFuncFac(floatColumnRefs)} />
  );
  
  return (
    
    <div  className="spreadsheet xavier-mv-table-wrapper"
          id={p_name}
          style={spreadsheetStyle}
          onClick={(e)=>{ if((e.target as HTMLElement).className.includes('cell')){setSearchInputActive(null);}}}
          ref={rootRef}
          key={updateKey}
    >
      {headerRendererDiv}
      {sgRowRendererDiv}
      {renderOtherSchemas()}
      {!mood && !p_onlyPreviewSchema && (
        <button className='xavier-sample-row-btn'
                onClick={() => {if (props.onSampleBtnClick) props.onSampleBtnClick(p_dfName);}}>
          Show sample rows...
        </button>)
      }
      {mood && !p_onlyPreviewSchema && renderTable()}
    </div>
  );
}

export default SpreadSheet;