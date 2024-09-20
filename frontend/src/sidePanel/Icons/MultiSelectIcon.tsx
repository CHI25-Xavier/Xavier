import React from "react";

interface IProps {
  status: "empty" | "half" | "full";
  handleIconClick: (e: React.MouseEvent) => void;
  width?: number;
  height?: number;
};

interface IState {

};


export class MultiSelectIcon extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.handleIconClick = this.handleIconClick.bind(this);
    
  }

  handleIconClick(e: React.MouseEvent) {
    this.props.handleIconClick(e);
  }

  render() {
    const width = this.props.width === undefined ? this.defaultWidth : this.props.width;
    const height = this.props.height === undefined ? this.defaultHeight : this.props.height;

    return (
      <div  className="xavier-mdt-icon-wrapper"
            onClick={this.handleIconClick}>
        {this.props.status === "full" ? (
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6496" width={width} height={height}>
              <path d="M863.8 127.7c17.6 0 32 14.4 32 32v704c0 17.6-14.4 32-32 32h-704c-17.6 0-32-14.4-32-32v-704c0-17.6 14.4-32 32-32h704m0-64h-704c-53 0-96 43-96 96v704c0 53 43 96 96 96h704c53 0 96-43 96-96v-704c0-53-42.9-96-96-96z" p-id="6497" fill="#444444">
              </path>
              <path d="M435 737.1c-1.7 0-3.4-0.1-5.1-0.2-17-1.3-32.5-9.2-43.6-22.2L208.8 507c-11.5-13.4-9.9-33.6 3.5-45.1s33.6-9.9 45.1 3.5L434.8 673l332.4-284c13.4-11.5 33.6-9.9 45.1 3.5s9.9 33.6-3.5 45.1l-332.4 284c-11.6 10.2-26.2 15.5-41.4 15.5z" p-id="6498" fill="#444444">
              </path>
            </svg>
          ) : this.props.status === "empty" ? (
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6755" width={width} height={height}>
              <path d="M873.59 960H150.41C102.73 960 64 921.27 64 873.59V150.41C64 102.73 102.73 64 150.41 64h723.18c47.68 0 86.41 38.73 86.41 86.41v723.17c0 47.69-38.73 86.42-86.41 86.42zM150.68 116.95c-18.44 0-33.72 15.02-33.72 33.72v723.17c0 18.44 15.02 33.72 33.72 33.72h723.18c18.44 0 33.72-15.02 33.72-33.72V150.68c0-18.44-15.02-33.72-33.72-33.72H150.68z" p-id="6756" fill="#444444">
              </path>
            </svg>
          ) : (
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5800" width={width} height={height}><path d="M152.251317 1023.000976h718.498342c83.918049 0 152.251317-68.333268 152.251317-152.251317V152.251317C1023.000976 68.333268 954.667707 0 870.749659 0H152.251317C68.333268 0 0 68.333268 0 152.251317v718.498342c0 83.918049 68.333268 152.251317 152.251317 152.251317zM56.834498 883.996722V139.044215a82.429502 82.429502 0 0 1 82.149775-82.239688h745.04242a82.279649 82.279649 0 0 1 82.149775 82.139785v745.05241a82.279649 82.279649 0 0 1-82.149775 82.139785H138.984273a82.279649 82.279649 0 0 1-82.149775-82.139785z" fill="#444444" p-id="5801" data-spm-anchor-id="a313x.search_index.0.i11.290c3a81HmaRUN"></path><path d="M227.328 227.34798m73.068644 0l422.197697 0q73.068644 0 73.068644 73.068644l0 422.197698q0 73.068644-73.068644 73.068644l-422.197697 0q-73.068644 0-73.068644-73.068644l0-422.197698q0-73.068644 73.068644-73.068644Z" fill="#8a8a8a" p-id="5802" data-spm-anchor-id="a313x.search_index.0.i7.290c3a81HmaRUN"></path></svg>
          )
        }
      </div>
    )
  }

  private defaultWidth: number = 14;
  private defaultHeight: number = 14;
};