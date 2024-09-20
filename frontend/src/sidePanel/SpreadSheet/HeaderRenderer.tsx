import React from "react";
import _ from "lodash";

import { IColMode, IColStyleAll, IDfCondAll, IDFInfoAll, IPreviewItems, IRowSampleCache, IValueCountCache, TCellValue } from "../interface";
import Cell from './Cell';
import * as utils from "../../utils";
import * as constant from "../../constant";
import { zoomTitle } from "./SSStyle";
import { FfloatColumnRefFunc, FgetRowSampleOfOneDf, FSetSearchInputActive } from "../interfaceFunc";
import { FilterListRenderer } from "./FilterListRenderer";


interface IProps {
  tableName: string;
  spreadsheetName: string;
  header: TCellValue[];
  headerRowStyle: React.CSSProperties;
  headerContainerStyle: React.CSSProperties;
  headerCellStyle: React.CSSProperties;
  dfColsStyle: IColStyleAll;
  mood: boolean;
  searchInputActive: number | null;

  previewItems?: IPreviewItems;
  floatColumnRefFunc?: FfloatColumnRefFunc;
  setSearchInputActive?: FSetSearchInputActive;
  filterListRendererParam?: {
    selectCond: IDfCondAll | null;
    allColMode: IColMode;
    allDfInfo: IDFInfoAll;
    valueCounts: IValueCountCache;
    rowSampleCache: IRowSampleCache;
    getRowSampleOfOneDf: FgetRowSampleOfOneDf;
  };
}

interface IState {
}

export class HeaderRenderer extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
    };
    this.onCellDoubleClick = this.onCellDoubleClick.bind(this);
  }

  onCellDoubleClick(colNum: number) {
    return () => {
      if(this.props.mood && this.props.setSearchInputActive) {
        this.props.setSearchInputActive(colNum);
      }
    }
  }

  render(): React.ReactNode {
    return this.props.header && <div className="row" style={this.props.headerRowStyle}>
      {this.props.header.map((headerValue, j) => {
        if (j === this.props.header.length - 1) {
          const realHeaderCellStyle = _.cloneDeep(this.props.headerCellStyle);
          realHeaderCellStyle.color = "transparent";
          return (
            <div  className="cell-container"
                  key={`_dummy_${this.props.spreadsheetName}_header_${j}`}
                  style={this.props.headerContainerStyle}
                  id={`_dummy_${this.props.spreadsheetName}_headerContainer_${j}`} >
              <Cell givenId={`_dummy_${this.props.spreadsheetName}_header_${j}`}
                    cellValue={headerValue}
                    cellStyle={realHeaderCellStyle}
                    contenteditable={false}
                    cellBold={true} />
            </div>
          );
        }

        const colName = this.props.header[j] as string;

        const pn = this.props.previewItems?.newColumns;
        const previewDetail = (pn !== undefined && this.props.tableName in pn && j > 1) ? pn[this.props.tableName][(this.props.header[j-1] as string)] : undefined;
        const isPreviewColumn = this.props.previewItems !== undefined && this.props.previewItems.op !== null && utils.isSupportPreviewOp(this.props.previewItems.op) && previewDetail !== undefined && previewDetail.newColumn === colName;

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
          <div  className="cell-container cell-container-header"
                key={`${this.props.spreadsheetName}_header_${j}`}
                style={realHeaderCtnStyle}
                id={`${this.props.spreadsheetName}_headerContainer_${j}`}
                ref={refFn} >
            <div className='xavier-mv-header-cell' onMouseEnter={(e) => {zoomTitle(e, true, true)}} onMouseLeave={(e) => {zoomTitle(e, false, true)}}>
              <Cell onDblclick={this.onCellDoubleClick(j)}
                    givenId={`${this.props.spreadsheetName}_header_${j}`}
                    cellValue={headerValue}
                    cellStyle={this.props.headerCellStyle}
                    contenteditable={false}
                    cellBold={true} />
            </div>
            {this.props.searchInputActive === j && this.props.filterListRendererParam &&  
              <div className='xavier-mv-search-container'>
                <FilterListRenderer dfName={this.props.tableName}
                                    colName={String(headerValue)}
                                    {...this.props.filterListRendererParam} />
              </div>
            }

          </div>
        );
      })}
    </div>
  }
}