define(['historyview', 'd3'], function(HistoryView) {
  "use strict";

  var REG_MARKER_END = 'url(#triangle)',
    MERGE_MARKER_END = 'url(#brown-triangle)',
    FADED_MARKER_END = 'url(#faded-triangle)',

    preventOverlap,
    applyBranchlessClass,
    cx, cy, fixBlobPosition,
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

  fixBlobPosition = function(selection) {
    selection
      .attr('x', function(d) {
        return d.x;
      })
      .attr('y', function(d) {
        return d.y;
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
      return d.x + view.blob_width / 2;
    }).attr('y', function(d) {
      return d.y + view.blob_height + delta;
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
    this.blob_height = config.blob_height || 75;
    this.blob_width = config.blob_height || 200;
    this.filename_counter = 0;
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
          .text('Workspace/Working Tree')
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
          .text('Index/Stage')
          .attr('x', labelX)
          .attr('y', labelY);
      index.append('svg:g').classed('blob-space', true).attr('id', 'index.blob-space');

      this.svgContainer = svgContainer;
      this.svg = svg;
      this.curr_ws = curr_ws;
      this.curr_ws.name = "workspace"
      this.curr_ws.blobs = this.curr_ws.blobs || []
      this.stash = stash
      this.stash.name = "stash"
      this.stash.blobs = this.stash.blobs || []
      this.index = index
      this.index.name = "index"
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
      console.log("adding new blob to " + ws.name);
      if (ws.blobs === undefined || !ws.blobs) {
        ws.blobs = [];
      }
      var blob = {'id': HistoryView.generateId(),
                  'x': 50,
                  'y': 50,
                  'filename': 'file_' + this.filename_counter}
      this.filename_counter += 1;
      ws.blobs.push(blob);
      console.log(ws.blobs);
    },

    addBlob: function(src, dst, moveAll=false) {
      if (src === null) {
        // Adding a brand new blob
        this.addNewBlob(dst);
      } else {
        // Moving an existing blob from 'src' to 'dst'
        if (src.blobs === undefined || src.blobs.length == 0) {
          console.log("no blobs to move");
        } else if (moveAll) {
            if (dst.name === "stash") {
              // stash is treated like a stack of changesets (group of blobs)
              dst.blobs.unshift(src.blobs);
            } else {
              dst.blobs = src.blobs;
            }
            src.blobs = [];
            console.log("Moving all blobs");
        } else {
          if (dst.blobs === undefined) {
            dst.blobs = [];
          }
          if (src.name == "stash") {
            var top_blob = src.blobs.shift();
          } else {
            var top_blob = src.blobs.pop();
          }
          if (Array.isArray(top_blob)) {
            dst.blobs = dst.blobs.concat(top_blob);
          } else {
            dst.blobs.push(top_blob);
          }
          console.log("Moving top blob");
        }
      }
      this.renderBlobs();
    },

    moveBlobByName: function(src, dst, filename) {
      // set dst to undefined to remove the blob
      var target_blob = src.blobs.filter(function(d) {
              return d.filename === filename;
      });
      if (target_blob && target_blob.length == 1) {
        // remove from src
        src.blobs.splice(src.blobs.indexOf(target_blob[0]), 1);
        // add to dst
        if (dst) {
          dst.blobs.push(target_blob[0]);
        }
      }
      this.renderBlobs();
    },

    removeBlob: function(ws, index_to_remove) {
      ws.blobs.splice(index_to_remove, 1);
      this.renderBlobs();
    },

    removeAllBlobs: function(ws) {
      ws.blobs = []
      this.renderBlobs();
    },

    _calculatePositionData: function(blobs) {
      for (var i = 0; i < blobs.length; i++) {
        var blob = blobs[i];
        blob.x = 50;
        blob.y = 50 + i * 125;
        //preventOverlap(commit, this);
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
        workspaces = [this.curr_ws, this.index],
        changeset_workspaces = [this.stash];
      console.log("rendering blobs");

      workspaces.forEach(function(ws) {
        console.log(ws.name);
        console.log(ws.blobs);
        // Bind the data
        var blob_rect = ws.select("g.blob-space").selectAll("rect").data(ws.blobs);
        // Enter
        blob_rect.enter().append("svg:rect")
              .attr("width", function(d) { console.log(d); return view.blob_width;})
              .attr("height", view.blob_height)
              .attr("id", function(d) { return "blob-" + d.id; })
              .classed("rendered-blob", true);
        // Update
        view._calculatePositionData(ws.blobs);
        blob_rect.transition()
              .duration(500)
              .call(fixBlobPosition);
        //blob_rect
              //.attr("x", 50)
              //.attr("y", function(d) { return 50 + ws.blobs.indexOf(d) * 100; });
        // Remove
        blob_rect.exit().remove();
        view._renderIdLabels(ws);
      });
      changeset_workspaces.forEach(function(ws) {
        console.log(ws.name);
        console.log(ws.blobs);
        // Bind the data
        var blob_rect = ws.select("g.blob-space").selectAll("rect").data(ws.blobs);
        // Enter
        blob_rect.enter().append("svg:rect")
              .attr("width", function(d) { console.log(d); return view.blob_width;})
              .attr("height", view.blob_height)
              .attr("id", function(d) { return "changeset-" + d; })
              .classed("rendered-changeset", true);
        // Update
        view._calculatePositionData(ws.blobs);
        blob_rect.transition()
              .duration(500)
              .call(fixBlobPosition);
        //blob_rect
              //.attr("x", 50)
              //.attr("y", function(d) { return 50 + ws.blobs.indexOf(d) * 100; });
        // Remove
        blob_rect.exit().remove();
        view._renderIdLabels(ws);
      });
    },

    _renderIdLabels: function(ws) {
      this._renderText(ws, 'id-label', function(d) {
        if (Array.isArray(d)) {
          var ret_str = "";
          d.forEach( function(blob) {
            ret_str += blob.id + ',';
          });
          return ret_str.substr(0, 16);
        }
        return d.id + '..';
      }, 14);
      this._renderText(ws, 'message-label', function(d) {
        if (ws.name === "stash") {
          return "stash@{" + ws.blobs.indexOf(d) + "}";
        }
        return d.filename;
      }, 24);
    },

    _renderText: function(ws, className, getText, delta) {
      var view = this,
        existingTexts,
        newtexts;

      existingTexts = ws.select("g.blob-space").selectAll('text.' + className)
        .data(ws.blobs)
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
