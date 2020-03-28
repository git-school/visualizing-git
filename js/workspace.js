define(['historyview', 'd3'], function(HistoryView) {
  "use strict";

  var REG_MARKER_END = 'url(#triangle)',
    MERGE_MARKER_END = 'url(#brown-triangle)',
    FADED_MARKER_END = 'url(#faded-triangle)',

    preventOverlap,
    applyBranchlessClass,
    cx, cy, fixCirclePosition,
    px1, py1, fixPointerStartPosition,
    px2, py2, fixPointerEndPosition,
    fixIdPosition, tagY, getUniqueSetItems;

  preventOverlap = function preventOverlap(commit, view) {
    var commitData = view.commitData,
      baseLine = view.baseLine,
      shift = view.commitRadius * 4.5,
      overlapped = null;

    for (var i = 0; i < commitData.length; i++) {
      var c = commitData[i];
      if (c.cx === commit.cx && c.cy === commit.cy && c !== commit) {
        overlapped = c;
        break;
      }
    }

    if (overlapped) {
      var oParent = view.getCommit(overlapped.parent),
        parent = view.getCommit(commit.parent);

      if (overlapped.cy < baseLine) {
        overlapped = oParent.cy < parent.cy ? overlapped : commit;
        overlapped.cy -= shift;
      } else {
        overlapped = oParent.cy > parent.cy ? overlapped : commit;
        overlapped.cy += shift;
      }

      preventOverlap(overlapped, view);
    }
  };

  applyBranchlessClass = function(selection) {
    if (selection.empty()) {
      return;
    }

    selection.classed('branchless', function(d) {
      return d.branchless;
    });

    if (selection.classed('commit-pointer')) {
      selection.attr('marker-end', function(d) {
        return d.branchless ? FADED_MARKER_END : REG_MARKER_END;
      });
    } else if (selection.classed('merge-pointer')) {
      selection.attr('marker-end', function(d) {
        return d.branchless ? FADED_MARKER_END : MERGE_MARKER_END;
      });
    }
  };

  cx = function(commit, view) {
    var parent = view.getCommit(commit.parent),
      parentCX = parent.cx;

    if (typeof commit.parent2 === 'string') {
      var parent2 = view.getCommit(commit.parent2);

      parentCX = parent.cx > parent2.cx ? parent.cx : parent2.cx;
    }

    return parentCX + (view.commitRadius * 4.5);
  };

  cy = function(commit, view) {
    var parent = view.getCommit(commit.parent),
      parentCY = parent.cy || cy(parent, view),
      baseLine = view.baseLine,
      shift = view.commitRadius * 4.5,
      branches = [], // count the existing branches
      branchIndex = 0;

    for (var i = 0; i < view.commitData.length; i++) {
      var d = view.commitData[i];

      if (d.parent === commit.parent) {
        branches.push(d.id);
      }
    }

    branchIndex = branches.indexOf(commit.id);

    if (commit.isNoFFBranch === true) {
      branchIndex++;
    }
    if (commit.isNoFFCommit === true) {
      branchIndex--;
    }

    if (parentCY === baseLine) {
      var direction = 1;
      for (var bi = 0; bi < branchIndex; bi++) {
        direction *= -1;
      }

      shift *= Math.ceil(branchIndex / 2);

      return parentCY + (shift * direction);
    }

    if (parentCY < baseLine) {
      return parentCY - (shift * branchIndex);
    } else if (parentCY > baseLine) {
      return parentCY + (shift * branchIndex);
    }
  };

  fixCirclePosition = function(selection) {
    selection
      .attr('cx', function(d) {
        return d.cx;
      })
      .attr('cy', function(d) {
        return d.cy;
      });
  };

  // calculates the x1 point for commit pointer lines
  px1 = function(commit, view, pp) {
    pp = pp || 'parent';

    var parent = view.getCommit(commit[pp]),
      startCX = commit.cx,
      diffX = startCX - parent.cx,
      diffY = parent.cy - commit.cy,
      length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return startCX - (view.pointerMargin * (diffX / length));
  };

  // calculates the y1 point for commit pointer lines
  py1 = function(commit, view, pp) {
    pp = pp || 'parent';

    var parent = view.getCommit(commit[pp]),
      startCY = commit.cy,
      diffX = commit.cx - parent.cx,
      diffY = parent.cy - startCY,
      length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return startCY + (view.pointerMargin * (diffY / length));
  };

  fixPointerStartPosition = function(selection, view) {
    selection.attr('x1', function(d) {
      return px1(d, view);
    }).attr('y1', function(d) {
      return py1(d, view);
    });
  };

  px2 = function(commit, view, pp) {
    pp = pp || 'parent';

    var parent = view.getCommit(commit[pp]),
      endCX = parent.cx,
      diffX = commit.cx - endCX,
      diffY = parent.cy - commit.cy,
      length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return endCX + (view.pointerMargin * 1.2 * (diffX / length));
  };

  py2 = function(commit, view, pp) {
    pp = pp || 'parent';

    var parent = view.getCommit(commit[pp]),
      endCY = parent.cy,
      diffX = commit.cx - parent.cx,
      diffY = endCY - commit.cy,
      length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return endCY - (view.pointerMargin * 1.2 * (diffY / length));
  };

  fixPointerEndPosition = function(selection, view) {
    selection.attr('x2', function(d) {
      return px2(d, view);
    }).attr('y2', function(d) {
      return py2(d, view);
    });
  };

  fixIdPosition = function(selection, view, delta) {
    selection.attr('x', function(d) {
      return d.cx;
    }).attr('y', function(d) {
      return d.cy + view.commitRadius + delta;
    });
  };

  tagY = function tagY(t, view) {
    var blobs = view.getBlobs,
      blobIndex = blobs.indexOf(t.blob);

    if (blobIndex === -1) {
      blobIndex = blobs.length;
    }
    return t.blob.y - 45 - (blobIndex * 25);
  };

  getUniqueSetItems = function(set1, set2) {
    var uniqueSet1 = JSON.parse(JSON.stringify(set1))
    var uniqueSet2 = JSON.parse(JSON.stringify(set2))
    for (var id in set1) {
      delete uniqueSet2[id]
    }
    for (var id in set2) {
      delete uniqueSet1[id]
    }
    return [uniqueSet1, uniqueSet2]
  };

  /**
   * @class Workspace
   * @constructor
   */
  function Workspace(config) {
    this.historyView = config.historyView;
    this.originView = config.originView;
    this.name = config.name || 'UnnamedWorkspace';
    this.width = config.width;
    this.height = config.height || 400;
    //this.width = this.historyView.width;
    //this.height = this.historyView.height || 400;
  }

  Workspace.prototype = {
    /**
     * @method render
     * @param container {String} selector for the container to render the SVG into
     */
    render: function(container) {
      var svgContainer, svg, curr_ws, stash, index;

      //svgContainer = container.select('svg-container');
      svgContainer = container.append('div')
        .classed('ws-container', true);

      svg = svgContainer.append('svg:svg');

      svg.attr('id', this.name)
        .attr('width', "100%")
        .attr('height', "100%");
        //.attr('width', this.width)
        //.attr('height', this.height);
      var labelX = 15;
      var labelY = 25;
            

      stash = svg.append('svg:g').classed('stash', true).attr('id', 'stash')
      stash.append('svg:rect')
      	  .attr('width', "31%")
      	  .attr('height', "100%")
      	  .attr('x', 0)
	        .attr('y', 0);
      stash.append('svg:text')
	      .classed('workspace-label', true)
          .text('Stash')
          .attr('x', labelX)
          .attr('y', labelY);
      stash.append('svg:g').classed('blob-space', true).attr('id', 'stash.blob-space');

      curr_ws = svg.append('svg:g').classed('curr-ws', true)
                    .attr('id', 'curr_ws')
                    .attr('transform', 'translate(750, 0)');
      curr_ws.append('svg:rect')
      	  .attr('width', "31%")
      	  .attr('height', "100%")
      	  .attr('x', 0)
	        .attr('y', 0);
      curr_ws.append('svg:text')
	      .classed('workspace-label', true)
          .text('Workspace')
          .attr('x', labelX)
          .attr('y', labelY);
      curr_ws.append('svg:g').classed('blob-space', true).attr('id', 'curr_ws.blob-space');

      index = svg.append('svg:g').classed('index', true)
                    .attr('id', 'index')
                    .attr('transform', 'translate(1500, 0)');
      index.append('svg:rect')
      	  .attr('width', "31%")
      	  .attr('height', "100%")
      	  .attr('x', 0)
          .attr('y', 0);
      index.append('svg:text')
	      .classed('workspace-label', true)
          .text('Index')
          .attr('x', labelX)
          .attr('y', labelY);
      index.append('svg:g').classed('blob-space', true).attr('id', 'index.blob-space');

      this.svgContainer = svgContainer;
      this.svg = svg;
      this.curr_ws = curr_ws;
      this.curr_ws.blobs = this.curr_ws.blobs || []
      this.stash = stash
      this.stash.blobs = this.stash.blobs || []
      this.index = index
      this.index.blobs = this.index.blobs || []
      //this.arrowBox = svg.append('svg:g').classed('pointers', true);
      //this.commitBox = svg.append('svg:g').classed('commits', true);
      //this.tagBox = svg.append('svg:g').classed('tags', true);

      this.renderBlobs();

      //this._setCurrentBranch(this.currentBranch);
    },

    destroy: function() {
      this.svg.remove();
      this.svgContainer.remove();
      clearInterval(this.refreshSizeTimer);

      for (var prop in this) {
        if (this.hasOwnProperty(prop)) {
          this[prop] = null;
        }
      }
    },

    addNewBlob: function(ws) {
      console.log("adding new blob to " + ws);
      if (ws.blobs === undefined || !ws.blobs) {
        ws.blobs = [];
      }
      ws.blobs.push(HistoryView.generateId());
      console.log(ws.blobs);
    },

    addBlob: function(src, dst, moveAll = false) {
      if (src === null) {
        // Adding a brand new blob
        this.addNewBlob(dst);
      } else {
        // Moving an existing blob from 'src' to 'dst'
        if (src.blobs === undefined || src.blobs.length == 0) {
          console.log("no blobs to move");
        } else if (moveAll) {
          dst.blobs = src.blobs;
          src.blobs = [];
          console.log("Moving all blobs");
        } else {
          if (dst.blobs === undefined) {
            dst.blobs = [];
          }
          dst.blobs.push(src.blobs.pop());
          console.log("Moving top blob");
        }
        console.log("src:");
        console.log(src.blobs);
        console.log("dst:");
        console.log(dst.blobs);
      }
      this.renderBlobs();
    },

    _calculatePositionData: function() {
      for (var i = 0; i < this.commitData.length; i++) {
        var commit = this.commitData[i];
        commit.cx = cx(commit, this);
        commit.cy = cy(commit, this);
        preventOverlap(commit, this);
      }
    },

    _resizeSvg: function() {
      var ele = document.getElementById(this.svg.node().id);
      var container = ele.parentNode;
      var currentWidth = ele.offsetWidth;
      var newWidth;

      if (ele.getBBox().width > container.offsetWidth)
        newWidth = Math.round(ele.getBBox().width);
      else
        newWidth = container.offsetWidth - 5;

      if (currentWidth != newWidth) {
        this.svg.attr('width', newWidth);
        container.scrollLeft = container.scrollWidth;
      }
    },

    renderBlobs: function() {
      var view = this,
        existingBlobs,
        newBlobs,
        curr_workspace = this.stash,
        workspaces = [this.stash, this.curr_ws, this.index];
      console.log("rendering blobs");

      workspaces.forEach(function(ws) {
        console.log(ws.blobs);
        // Bind the data
        var blob_rect = ws.select("g.blob-space").selectAll("rect").data(ws.blobs);
        // Enter 
        blob_rect.enter().append("svg:rect")
              .attr("width", function(d) { console.log(d); return 200;})
              .attr("height", 75)
              .attr("fill", "blue")
              .attr("id", function(d) { return "blob-" + d; })
              .classed("rendered-blob", true);
        // Update
        blob_rect
              .attr("x", 50)
              .attr("y", function(d) { return 50 + ws.blobs.indexOf(d) * 100; });
        // Remove
        blob_rect.exit().remove();
      });
    },

    _renderIdLabels: function() {
      this._renderText('id-label', function(d) {
        return d.id + '..';
      }, 14);
      this._renderText('message-label', function(d) {
        return d.message;
      }, 24);
    },

    _renderText: function(className, getText, delta) {
      var view = this,
        existingTexts,
        newtexts;

      existingTexts = this.commitBox.selectAll('text.' + className)
        .data(this.commitData, function(d) {
          return d.id;
        })
        .text(getText);

      existingTexts.transition().call(fixIdPosition, view, delta);

      newtexts = existingTexts.enter()
        .insert('svg:text', ':first-child')
        .classed(className, true)
        .text(getText)
        .call(fixIdPosition, view, delta);

      existingTexts.exit()
        .remove()
    },

  };

  return Workspace;
});
