define(['historyview', 'd3'], function(HistoryView) {
  "use strict";

    var fixBlobPosition,
    fixIdPosition, tagY, getUniqueSetItems;

  fixBlobPosition = function(selection) {
    selection
      .attr('x', function(d) {
        return d.x;
      })
      .attr('y', function(d) {
        return d.y;
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

      this.renderBlobs();
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
      if (ws.blobs === undefined || !ws.blobs) {
        ws.blobs = [];
      }
      var blob = {'id': HistoryView.generateId(),
                  'x': 50,
                  'y': 50,
                  'filename': 'file_' + this.filename_counter}
      this.filename_counter += 1;
      ws.blobs.push(blob);
    },

    addBlob: function(src, dst, moveAll=false) {
      if (src === null) {
        // Adding a brand new blob
        this.addNewBlob(dst);
      } else {
        // Moving an existing blob from 'src' to 'dst'
        if (src.blobs !== undefined && src.blobs.length > 0) {
          if (moveAll) {
            if (dst.name === "stash") {
              // stash is treated like a stack of changesets (group of blobs)
              dst.blobs.unshift(src.blobs);
            } else {
              dst.blobs = dst.blobs.concat(src.blobs);
            }
            // empty out the src blobs
            src.blobs = [];
          } else {
            if (dst.blobs === undefined) {
              dst.blobs = [];
            }
            if (src.name === "stash") {
              var top_blob = src.blobs.shift();
            } else {
              var top_blob = src.blobs.pop();
            }
            if (Array.isArray(top_blob)) {
              dst.blobs = dst.blobs.concat(top_blob);
            } else {
              dst.blobs.push(top_blob);
            }
          }
        }
      }
      this.renderBlobs();
    },

    moveBlobByName: function(src, dst, filename, remove_from_src=true) {
      // set dst to undefined to remove the blob
      var target_blob = src.blobs.filter(function(d) {
              if (src.name === "stash") {
                      return d.filename.split("{")[1].split("}")[0] === filename;
              } else {
                      return d.filename === filename;
              }
      });
      if (target_blob && target_blob.length == 1) {
        if (remove_from_src) {
          src.blobs.splice(src.blobs.indexOf(target_blob[0]), 1);
        }
        // add to dst
        if (dst) {
          if (Array.isArray(target_blob[0])) {
            // ensure there's no duplicates after a 'stash apply'
            dst.blobs = Array.from(new Set(dst.blobs.concat(target_blob[0])));
          } else {
            dst.blobs.push(target_blob[0]);
          }
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

      workspaces.forEach(function(ws) {
        // Bind the data
        var blob_rect = ws.select("g.blob-space").selectAll("rect").data(ws.blobs);
        // Enter
        blob_rect.enter().append("svg:rect")
              .attr("id", function(d) { return "blob-" + d.id; })
              .classed("rendered-blob", true)
              .attr("width", 1)
              .attr("height", 1)
              .transition("inflate")
              .attr("width", view.blob_width)
              .attr("height", view.blob_height)
              .duration(500);
        // Update
        view._calculatePositionData(ws.blobs);
        blob_rect
              .call(fixBlobPosition);
        // Remove
        blob_rect.exit().remove();
        view._renderIdLabels(ws);
      });
      changeset_workspaces.forEach(function(ws) {
        // Bind the data
        var blob_rect = ws.select("g.blob-space").selectAll("rect").data(ws.blobs);
        // Enter
        blob_rect.enter().append("svg:rect")
              .attr("id", function(d) { return "changeset-" + d; })
              .classed("rendered-changeset", true)
              .attr("width", 1)
              .attr("height", 1)
              .transition("inflate")
              .attr("width", view.blob_width)
              .attr("height", view.blob_height)
              .duration(500);
        // Update
        view._calculatePositionData(ws.blobs);
        blob_rect.transition()
              .duration(500)
              .call(fixBlobPosition);
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
          ret_str = ret_str.substr(0, ret_str.length - 1);
          return ret_str.substr(0, 32);
        }
        return d.id + '..';
      }, 14);
      this._renderText(ws, 'message-label', function(d) {
        if (ws.name === "stash") {
          var filename = "stash@{" + ws.blobs.indexOf(d) + "}";
          // save the stash name in the changeset object
          d.filename = filename;
          return filename;
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
