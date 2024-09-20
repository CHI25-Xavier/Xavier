import React from "react";
import { FonNumRangeSelectIconClick } from "../interfaceFunc";

interface IProps {
    dfName: string;
    colName: string;
    minValue: number;
    maxValue: number;
    onNumRangeSelectIconClick: FonNumRangeSelectIconClick;
  }
  
  interface IState {
    lowerBundle: number;
    upperBundle: number;
    // isInit: boolean;
  }

export default class RangeFilter  extends React.Component<IProps, IState> { 
    constructor(props: IProps) {
        super(props);
        this.state = {
           lowerBundle: this.props.minValue,
           upperBundle: this.props.maxValue,
        //    isInit: false,
        };
    
        this.handleInputChange = this.handleInputChange.bind(this);
      }

      handleInputChange = (e: React.FormEvent<HTMLInputElement>) => {
        const { name, value } = e.currentTarget;
        if (name === 'lowerBundle') {
          this.setState({ lowerBundle: Number(value) });
        } else if (name === 'upperBundle') {
          this.setState({ upperBundle: Number(value) });
        }
      };

      render(): React.ReactNode { 
        return (
            <div className="xavier-mv-itemlist-wrapper">
            <div className="xavier-mv-search-bar">
              <input  type="number" className="xavier-mv-search-input xavier-mv-num-search-input" value={this.state.lowerBundle || 0} name="lowerBundle" 
               onChange={this.handleInputChange}
                      />
              <div className="xavier-mv-num-search-mid">~</div>
              <input  type="number" className="xavier-mv-search-input xavier-mv-num-search-input" value={this.state.upperBundle || 0} min={this.state.lowerBundle} name="upperBundle"
               onChange={this.handleInputChange}
                      />
              <button className="xavier-mv-confirm-btn" onClick={(e) => {this.props.onNumRangeSelectIconClick(e,this.props.dfName,this.props.colName,this.state.lowerBundle,this.state.upperBundle)}}>Confirm</button>
            </div>
            </div>  
          )
      }
}