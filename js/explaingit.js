define(['historyview', 'controlbox', 'workspace', 'd3'], function(HistoryView,
ControlBox, Workspace, d3) {
  var prefix = 'ExplainGit',
    openSandBoxes = [],
    open,
    reset,
    explainGit;

  open = function(_args) {
    var args = Object.create(_args),
      name = prefix + args.name,
      containerId = name + '-Container',
      container = d3.select('#' + containerId),
      playground = container.select('.playground-container'),
      historyView, originView = null,
      controlBox;

    container.style('display', 'block');

    args.name = name;
    args.savedState = args.hvSavedState
    historyView = new HistoryView(args);
    window.hv = historyView;

    if (args.originData) {
      originView = new HistoryView({
        name: name + '-Origin',
        width: 300,
        height: 400,
        commitRadius: args.commitRadius,
        remoteName: 'origin',
        commitData: args.originData,
        savedState: args.ovSavedState
      });

      originView.render(playground);
      window.ov = originView;
    }

    workspace = new Workspace({
      historyView: historyView,
      originView: originView,
      undoHistory: args.undoHistory,
      name: name + '-Workspace',
      width: 300,
      height: 400
    });
    window.ws = workspace

    controlBox = new ControlBox({
      historyView: historyView,
      originView: originView,
      workspace: workspace,
      initialMessage: args.initialMessage,
      undoHistory: args.undoHistory
    });
    window.cb = controlBox;

    controlBox.render(playground);
    historyView.render(playground);
    workspace.render(playground);

    openSandBoxes.push({
      hv: historyView,
      cb: controlBox,
      ws: workspace,
      container: container
    });
  };

  reset = function() {
    for (var i = 0; i < openSandBoxes.length; i++) {
      var osb = openSandBoxes[i];
      osb.hv.destroy();
      osb.cb.destroy();
      osb.ws.destroy();
      osb.container.style('display', 'none');
    }

    openSandBoxes.length = 0;
    d3.selectAll('a.openswitch').classed('selected', false);
  };

  explainGit = {
    HistoryView: HistoryView,
    ControlBox: ControlBox,
    Workspace: Workspace,
    generateId: HistoryView.generateId,
    open: open,
    reset: reset
  };

  window.explainGit = explainGit;

  return explainGit;
});
