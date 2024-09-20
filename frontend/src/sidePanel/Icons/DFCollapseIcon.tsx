import React from "react";
import { TDirection } from "../interface";

interface IProps {
  initDirection: TDirection;
  handleIconClick: (e: React.MouseEvent, newDirection: TDirection) => void;
}

interface IState {
  _direction: TDirection;
}

export class DFCollapseIcon extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      _direction: props.initDirection,
    }
    this.onIconClick = this.onIconClick.bind(this);
  }

  direction2Degree(direction: TDirection): number {
    return direction === "right" ? -90 : 0;
  }

  onIconClick(e: React.MouseEvent) {
    const newDirection = this.state._direction === "right" ? "down" : "right"
    this.setState({
      _direction: newDirection
    });
    this.props.handleIconClick(e, newDirection);
  }

  render() {
    const deg = this.direction2Degree(this.state._direction);
    return (
      <div  className="xavier-mdt-icon-wrapper" 
            onClick={this.onIconClick}>
        <svg
          width={14}
          height={14}
          viewBox="0 0 18 18"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
              d="M14.657,7.343L9,13L3.343,7.343L4.757,5.929L9,10.172L13.243,5.929L14.657,7.343"
              fill={"#212121"} 
              transform={`rotate(${deg}, 10, 10)`}
          />
        </svg>
      </div>
    )
  }
}