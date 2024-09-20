import { StackedPanel } from '@lumino/widgets';
import type { ISessionContext } from '@jupyterlab/apputils';
import type { Message } from '@lumino/messaging';

import { SidePanelReactWidget } from './SidePanelReactWidget';
import type { NBApi } from '../../dataApi/nbApi';
import { SidePanelModel } from '../../dataApi/sidePanelModel';
// import { LabIcon } from '@jupyterlab/ui-components';
// import appIconStr from '../style/logo.svg';

export class SidePanel extends StackedPanel {
    constructor(model: SidePanelModel) {
        super();
        this.addClass('xavier-sidepanel');
        this.id = 'xavier-sidepanel-app';
        this.title.caption = 'Xavier'; // shown on hover the tab icon
        this.title.iconClass = 'autoprofile-logo';

        // ICON in the side panel tab
        // const icon = new LabIcon({
        //     name: 'auto-profile-app:app-icon',
        //     svgstr: appIconStr
        // });

        // this.title.icon = icon;

        // MODEL init
        this._model = model;

        // VIEW init
        this._sidePanelFullView = new SidePanelReactWidget(this._model);
        this.addWidget(this._sidePanelFullView);
    }

    // ~~~~~~~~~ Variables, getters, setters ~~~~~~~~~
    private _sessionContext: ISessionContext | null = null;
    private _model: SidePanelModel;
    private _sidePanelFullView: SidePanelReactWidget;

    // get session(): ISessionContext {
    //     return this._sessionContext;
    // }

    // set session(session: ISessionContext) {
    //     this._sessionContext = session;
    // }

    public async connectNotebook(na: NBApi) {
        if (na.hasConnection) {            
            this._sessionContext = na.panel.sessionContext;
        }
        await this._model.connectNotebook(na, () => { return this.isVisible });
    }

    // ~~~~~~~~~ Lifecycle methods for closing panel ~~~~~~~~~
    dispose(): void {
        if (this._sessionContext) {
            this._sessionContext.dispose();
        }
        super.dispose();
    }

    protected onCloseRequest(msg: Message): void {
        super.onCloseRequest(msg);
        this.dispose();
    }

    /**
     * Called before the widget is made visible.
     * NOTE: when using beforeShow, this.isVisible is false during update.
     * 
     * other useful state messages are onAfterShow, 
     * onBeforeHide, onAfterHide.
     * @param msg 
     */
    protected onBeforeShow(msg: Message): void {
        this._model.updateAll();
    }

}
