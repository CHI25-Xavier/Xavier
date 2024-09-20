import * as React from 'react';
import { ReactWidget } from "@jupyterlab/apputils";
import { ReactElement, JSXElementConstructor } from "react";
import { SidePanelModel } from '../../dataApi/sidePanelModel';
import { SidePanelFullView } from './SidePanelFullView';
import { SidePanelReactStore } from "./SidePanelReactStore";

export class SidePanelReactWidget extends ReactWidget {
  private _model: SidePanelModel;

  constructor(model: SidePanelModel) {
    super();
    this.addClass('xavier-sidepanel-react');
    this._model = model;
  }

  protected render(): (ReactElement<any, string | JSXElementConstructor<any>>[] | ReactElement<any, string | JSXElementConstructor<any>>) | null {
    return (
      <SidePanelReactStore>
        <SidePanelFullView model={this._model} />
      </SidePanelReactStore>
    );
  }
};