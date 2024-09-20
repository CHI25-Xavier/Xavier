import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICompletionProvider, ICompletionProviderManager } from '@jupyterlab/completer';
import { INotebookTracker } from '@jupyterlab/notebook';

import { SidePanel } from './sidePanel/Wrapper/SidePanel';
import { XavierCompleterProvider } from './xavierCompleter/customconnector';
import { NBApi } from './dataApi/nbApi';
import { SidePanelModel } from './dataApi/sidePanelModel';

/**
 * Initialization data for the extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: '@xavier/xavier:completion',
  description: 'Minimal JupyterLab extension setting up the completion.',
  autoStart: true,
  requires: [ICompletionProviderManager, INotebookTracker],
  activate: async (
    app: JupyterFrontEnd,
    completionManager: ICompletionProviderManager,
    notebooks: INotebookTracker,
  ) => {
    const dataModel = new SidePanelModel(null); // Null session. The session will be set when a notebook is connected. See `SidePanel.connectNotebook()`
    const panel = new SidePanel(dataModel);
    app.shell.add(panel, 'right', { rank: 1000 });    

    // emitted when the user's notebook changes, null if all notebooks close
    // Note: SidePanel contains NBApi contains NotebookPanel. NotebookTracker contains NotebookPanel
    notebooks.currentChanged.connect((_, widget) => {
      const na = new NBApi(widget);      
      na.ready.then(async () => {
        await panel.connectNotebook(na);
      });
    });

    // @TODO
    const allProviders: Map<string, ICompletionProvider> = (completionManager as any).getProviders();
    const contextProvider = allProviders.get("CompletionProvider:context");
    const kernelProvider = allProviders.get("CompletionProvider:kernel")
    const ccp = new XavierCompleterProvider(notebooks, dataModel, contextProvider, kernelProvider);
    completionManager.registerProvider(ccp);

    console.log('@xavier02: JupyterLab custom completer extension is activated!', ccp, app, completionManager, notebooks);
  }
};

export default extension;
