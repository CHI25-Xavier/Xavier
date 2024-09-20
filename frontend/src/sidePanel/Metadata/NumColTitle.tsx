import React from "react";
import _ from "lodash";

// import { ViewMode } from "../../constant";
// import { MultiSelectIcon } from "../Icons/MultiSelectIcon";
// import { AddContextIcon } from "../Icons/AddContextIcon";
import { IHistogramBin } from "../interface";
import * as utils from "../../utils";

interface IProps {
  dfName: string;
  colName: string;
  nullCount: number;
  numRows: number;
  minValue: string | number | null;
  maxValue: string | number | null;
  bins: IHistogramBin[];
  basicPercent?: number;
}

interface IState {
  
}

export class NumColTitle extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.renderHistBars = this.renderHistBars.bind(this);
  }

  get realBasicPercent(): number {
    return this.props.basicPercent === undefined ? 0.05 : this.props.basicPercent;
  }

  renderHistBars() {
    const dfName = this.props.dfName;
    const colName = this.props.colName;
    const _maxCount = _.max(this.props.bins.map(bin => bin.count));
    const maxCount = _maxCount === undefined ? 1 : _maxCount;
    const width = `${1 / this.props.bins.length * 100}%`;
    return this.props.bins.map((bin: IHistogramBin) => {
      const height = this.realBasicPercent+(1-this.realBasicPercent)*(bin.count / maxCount);
      const heightStr = `${(height) * 100}%`; 
      return (
        <div  key={`xavier-${dfName}-${colName}-hist-bar-${bin.low}-${bin.high}`}
              className="xavier-mct-histogram-bar"
              style={{
          width: width, 
          height: heightStr, 
          backgroundColor: '#fca5a5', //highLight === false? '#FCF2F2' : '#ffcccc', between FCF2FC and FFCCCC
        }} />
      );
    });
  }

  render(): React.ReactNode {
    // const isShowSelectIcon = this.props.dfMode === ViewMode.FILTER_COLUMN;
    const minValueStr = this.props.minValue === null ? "NaN" : typeof this.props.minValue === "string" ? this.props.minValue : utils.formatNumber(this.props.minValue);
    const maxValueStr = this.props.maxValue === null ? "NaN" : typeof this.props.maxValue === "string" ? this.props.maxValue : utils.formatNumber(this.props.maxValue);
    return (
      <div className="xavier-mct-wrapper">
        {/* <AddContextIcon handleIconClick={(e) => this.props.onUpdateDCIconClick(e, "column", "toggle", {dfName: this.props.dfName, colName: this.props.colName})} 
                        sign={this.props.isFold ? "+" : "-"} />
        {isShowSelectIcon ? (
          <MultiSelectIcon  status={this.props.isColSelect ? "full" : "empty"}
                            handleIconClick={(e) => this.props.onColSelectIconClick(e, this.props.dfName, this.props.colName) } />
        ) : null} */}
        {/* <div className="xavier-mct-name-wrapper" style={{width: isShowSelectIcon ? "calc(100% - 2 * var(--xavier-icon-width))" : "calc(100% - var(--xavier-icon-width))" }}> */}
          {/* <div className="xavier-mct-name">
            {this.props.colName}
          </div> */}
          <div className="xavier-mct-histogram" style={{width: "100%"}}>
            {this.renderHistBars()}
            <div className="xavier-mct-histogram-text">{minValueStr} ~ {maxValueStr}</div>
          </div>
        </div>
      // </div>
    )
  }
}