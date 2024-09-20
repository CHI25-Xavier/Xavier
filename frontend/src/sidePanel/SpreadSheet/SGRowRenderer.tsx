import React from "react";
import _ from "lodash";

import { IColStyleAll, IDFInfo, IHistogramBin, IPreviewItems, TCellValue } from "../interface";
import { zoomTitle } from "./SSStyle";
import Cell from './Cell';
import { CateColTitle } from "../Metadata/CateColTitle";
import { NumColTitle } from "../Metadata/NumColTitle";
import * as utils from "../../utils";
import * as constant from "../../constant";
import { FfloatColumnRefFunc } from "../interfaceFunc";


interface IProps {
  tableName: string;
  spreadsheetName: string;
  header: TCellValue[];
  headerRowStyle: React.CSSProperties;
  headerContainerStyle: React.CSSProperties;
  headerCellStyle: React.CSSProperties;
  dfColsStyle: IColStyleAll;
  dfInfo: IDFInfo;
  histogramBin: { [colName: string]: IHistogramBin[] };

  previewItems?: IPreviewItems;
  floatColumnRefFunc?: FfloatColumnRefFunc;

}

interface IState {
}


export class SGRowRenderer extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
    };
  }

  renderSummaryGraph(colName: string, colNum: number) {
    const p_dfName = this.props.tableName;
    const p_header = this.props.header;
    const p_previewItems = this.props.previewItems;
    const p_dfInfo = this.props.dfInfo;
    const p_histogramBin = this.props.histogramBin;

    const pn = p_previewItems?.newColumns;
    const previewDetail = (pn !== undefined && p_dfName in pn && colNum > 1) ? pn[p_dfName][(p_header[colNum-1] as string)] : undefined;
    const isPreviewColumn = utils.isSupportPreviewOp(p_previewItems?.op) && previewDetail !== undefined && previewDetail.newColumn === colName;
    const colMeta = isPreviewColumn ? previewDetail.colMeta : p_dfInfo.columns[colName];

    const colHist = p_histogramBin[colName];
    // if (utils.isCateColumn(colMeta.dtype) && colMeta.cardinality === null) {
    //   console.error(`[renderCol] Cardinality is null for column ${colName} in DataFrame ${p_dfName}.`);
    // } else if (utils.isNumColumn(colMeta.dtype) && colHist === undefined) {
    //   console.error(`[renderCol] Histogram is not found for column ${colName} in DataFrame ${p_dfName}.`);
    // }
    const cardinality: number = colMeta.cardinality === null ? 0 : colMeta.cardinality;
    const histItems = colHist !== undefined ? colHist : [];

    const cateColTitleDiv = (
      <CateColTitle dfName={p_dfName}
                    colName={colName}
                    nullCount={colMeta.nullCount}
                    cardinality={cardinality}
                    numRows={p_dfInfo.numRows} />
    );
    const numColTitleDiv = (
      <NumColTitle  dfName={p_dfName}
                    colName={colName}
                    nullCount={colMeta.nullCount}
                    numRows={p_dfInfo.numRows}
                    bins={histItems}
                    minValue={colMeta.minValue}
                    maxValue={colMeta.maxValue} />
    );


    return (
      // <div className="xavier-mv-col" key={`xavier-table-${p_dfName}-col-${colName}`}>
      <>
        {utils.isNumColumn(colMeta.dtype) ? numColTitleDiv : cateColTitleDiv}
      </>
      // </div>
    );

  };

  render(): React.ReactNode {
    const p_header = this.props.header;
    const p_name = this.props.spreadsheetName;
    const p_previewItems = this.props.previewItems;
    const p_dfName = this.props.tableName;


    return p_header && <div className="row" style={this.props.headerRowStyle}>
        {p_header.map((headerValue, j) => {
          if (j === p_header.length - 1) {
            const realHeaderCellStyle = _.cloneDeep(this.props.headerCellStyle);
            realHeaderCellStyle.color = "transparent";
            return (
              <div  className="cell-container"
                    key={`_dummy_${p_name}_summary_${j}`}
                    style={this.props.headerContainerStyle}
                    id={`_dummy_${p_name}_summary_${j}`}>
                <Cell givenId={`_dummy_${p_name}_summary_${j}`}
                      cellValue={headerValue}
                      cellStyle={realHeaderCellStyle}
                      contenteditable={false}
                      cellBold={true} />
              </div>
            );
          }

          const colName = p_header[j] as string;
          const pn = p_previewItems !== undefined ? p_previewItems.newColumns : undefined;
          const previewDetail = (pn !== undefined && p_dfName in pn && j > 1) ? pn[p_dfName][(p_header[j-1] as string)] : undefined;
          const isPreviewColumn = p_previewItems !== undefined && p_previewItems.op !== null && utils.isSupportPreviewOp(p_previewItems.op) && previewDetail !== undefined && previewDetail.newColumn === colName;
          const isHighlight = isPreviewColumn ? false : this.props.dfColsStyle[colName].isHighlight;
          const refFn = this.props.floatColumnRefFunc ? this.props.floatColumnRefFunc(j, isPreviewColumn || isHighlight) : undefined;

          const cellCtnSpecialStyle = utils.calCellCtnSpecialStyle(false, isPreviewColumn, false, isHighlight, this.props.previewItems?.op);
          const realHeaderCtnStyle = _.cloneDeep(this.props.headerContainerStyle);
          if (cellCtnSpecialStyle === "highlight") {
            realHeaderCtnStyle.backgroundColor = constant.SSColumnHLColor;
          } else if (cellCtnSpecialStyle === "preview") {
            realHeaderCtnStyle.backgroundColor = constant.SSColumnPreColor;
          }

          return (
            <div  className="cell-container"
                  key={`${p_name}_summary_${j}`}
                  style={realHeaderCtnStyle}
                  ref={refFn}
            >
              <div className='xavier-mv-header-cell' onMouseEnter={(e) => {zoomTitle(e, true, false)}} onMouseLeave={(e) => {zoomTitle(e, false, false)}}>
            {this.renderSummaryGraph(headerValue as string, j)}
              </div>
          </div>
          );
        })}
      </div>
  }
}