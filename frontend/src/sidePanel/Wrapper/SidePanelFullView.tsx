import React from "react";
import _ from "lodash";

import '../../../style/base.css';
import { SidePanelModel } from "../../dataApi/sidePanelModel";
import { MetadataView } from "../Metadata/MetadataView";
import { IDFInfoAll, IDFStyleAll, IHistogramBinCache, IPreviewItems, IRowSampleCache, IValueCountCache } from "../interface";
import { MetaDataIcon } from "../../assets/SvgCollection";

interface IProps {
  model: SidePanelModel;
}

interface IState {
  _modelAllDfStyle: IDFStyleAll;
  _modelAllDfSeq: string[];
  // _modelSelectedDFName: string | null;
  _modelPreviewItems: IPreviewItems;
  _modelRowSampleCache: IRowSampleCache;
  _allDfInfo: IDFInfoAll;
  _histogramBinCache: IHistogramBinCache;
  _valueCountsCache: IValueCountCache;
  _isLive: boolean;
}


export class SidePanelFullView extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this._model = props.model;
    this.state = {
      _modelAllDfStyle: this._model.allDfStyle,
      _modelAllDfSeq: this._model.allDfSeq,
      // _modelSelectedDFName: this._model.selectedDFName,
      _modelPreviewItems: this._model.previewItems,
      _modelRowSampleCache: this._model.rowSampleCache,
      _allDfInfo: this._model.allDfInfo,
      _histogramBinCache: this._model.histogramBinCache,
      _valueCountsCache: this._model.valueCountsCache,
      _isLive: true,
    };

    this.handleModelChange = this.handleModelChange.bind(this);
    this.renderTitle = this.renderTitle.bind(this);
    this.onLinkCodeBtnClick = this.onLinkCodeBtnClick.bind(this);
  }

  componentDidMount() {
    this._model.addObserver(this.handleModelChange);
  }

  componentWillUnmount() {
    this._model.removeObserver(this.handleModelChange);
  }

  handleModelChange() {
    this.setState({ 
      _allDfInfo: this._model.allDfInfo,
      _histogramBinCache: this._model.histogramBinCache,
      _valueCountsCache: this._model.valueCountsCache,
      _modelAllDfStyle: this._model.allDfStyle,
      _modelAllDfSeq: this._model.allDfSeq,
      // _modelSelectedDFName: this._model.selectedDFName,
      _modelPreviewItems: this._model.previewItems,
      _modelRowSampleCache: this._model.rowSampleCache,
    });
  }

  onLinkCodeBtnClick() {
    this.setState({ _isLive: !this.state._isLive });
  }

  renderTitle() {
    return (
      <div className="xavier-sidepanel-view-title">
        <div className="xavier-sti-wrapper">
          <MetaDataIcon />
        </div>
        <div className="xavier-st-text">
          Table View
        </div>
        {/* <div  className="xavier-st-btn"
              style={{
                borderColor: this.state._isLive ? "#1890ff" : "#d9d9d9",
                color: this.state._isLive ? "#1890ff" : undefined,
                boxShadow: this.state._isLive ? "inset 0 1px 1px rgba(0,0,0,.075), 0 0 4px rgba(102, 175, 233, .6)" : undefined,
              }}
              onClick={this.onLinkCodeBtnClick} >Link to code</div> */}
      </div>
    );
  }

  render() {
    return (
      <div className="xavier-sidepanel-fullview">
        {this.renderTitle()}
        <MetadataView isLive={this.state._isLive}
                      rowSampleCache={this._model.rowSampleCache}
                      allDfStyle={this.state._modelAllDfStyle}
                      allDfSeq={this.state._modelAllDfSeq}
                      previewItems={this.state._modelPreviewItems}
                      allDfInfo={this.state._allDfInfo}
                      valueCounts={this.state._valueCountsCache}
                      histogramBin={this.state._histogramBinCache}
                      getCateValueCounts={this._model.getCateValueCounts}
                      getRowSampleOfOneDf={this._model.getRowSampleOfOneDf}
                      setAllDfStyle={this._model.setAllDfStyle}
                       />
                       {/* {setSelectedDFName={this._model.setSelectedDFName}} */}
      </div>
    );
  }

  private _model: SidePanelModel;
}