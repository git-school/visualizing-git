define(['d3'], function() {
  "use strict";

  /**
   * @class ControlBox
   * @constructor
   */
  function ControlBox(config) {
    this.historyView = config.historyView;
    this.originView = config.originView;
    this.initialMessage = config.initialMessage || 'Enter git commands below.';
    this._commandHistory = [];
    this._currentCommand = -1;
    this._tempCommand = '';
    this.rebaseConfig = {}; // to configure branches for rebase
  }

  ControlBox.prototype = {
    render: function(container) {
      var cBox = this,
        cBoxContainer, log, input;

      cBoxContainer = container.append('div')
        .classed('control-box', true);


      log = cBoxContainer.append('div')
        .classed('log', true);

      input = cBoxContainer.append('input')
        .attr('type', 'text')
        .attr('placeholder', 'enter git command');

      input.on('keyup', function() {
        var e = d3.event;

        switch (e.keyCode) {
          case 13:
            if (this.value.trim() === '') {
              break;
            }

            cBox._commandHistory.unshift(this.value);
            cBox._tempCommand = '';
            cBox._currentCommand = -1;
            cBox.command(this.value);
            this.value = '';
            e.stopImmediatePropagation();
            break;
          case 38:
            var previousCommand = cBox._commandHistory[cBox._currentCommand + 1];
            if (cBox._currentCommand === -1) {
              cBox._tempCommand = this.value;
            }

            if (typeof previousCommand === 'string') {
              cBox._currentCommand += 1;
              this.value = previousCommand;
              this.value = this.value; // set cursor to end
            }
            e.stopImmediatePropagation();
            break;
          case 40:
            var nextCommand = cBox._commandHistory[cBox._currentCommand - 1];
            if (typeof nextCommand === 'string') {
              cBox._currentCommand -= 1;
              this.value = nextCommand;
              this.value = this.value; // set cursor to end
            } else {
              cBox._currentCommand = -1;
              this.value = cBox._tempCommand;
              this.value = this.value; // set cursor to end
            }
            e.stopImmediatePropagation();
            break;
        }
      });

      this.container = cBoxContainer;
      this.terminalOutput = log;
      this.input = input;

      this.info(this.initialMessage);
    },

    destroy: function() {
      this.terminalOutput.remove();
      this.input.remove();
      this.container.remove();

      for (var prop in this) {
        if (this.hasOwnProperty(prop)) {
          this[prop] = null;
        }
      }
    },

    _scrollToBottom: function() {
      var log = this.terminalOutput.node();
      log.scrollTop = log.scrollHeight;
    },

    command: function(entry) {
      if (entry.trim === '') {
        return;
      }

      var split = entry.split(' ');

      this.terminalOutput.append('div')
        .classed('command-entry', true)
        .html(entry);

      this._scrollToBottom();

      if (split[0] !== 'git') {
        return this.error();
      }

      var method = split[1].replace(/-/g, '_'),
        args = split.slice(2);

      try {
        if (typeof this[method] === 'function') {
          this[method](args);
        } else {
          this.error();
        }
      } catch (ex) {
        console.error(ex.stack)
        var msg = (ex && ex.message) ? ex.message : null;
        this.error(msg);
      }
    },

    info: function(msg) {
      this.terminalOutput.append('div').classed('info', true).html(msg);
      this._scrollToBottom();
    },

    error: function(msg) {
      msg = msg || 'I don\'t understand that.';
      this.terminalOutput.append('div').classed('error', true).html(msg);
      this._scrollToBottom();
    },

    transact: function(action, after) {
      var oldCommit = this.historyView.getCommit('HEAD')
      var oldBranch = this.historyView.currentBranch
      var oldRef = oldBranch || oldCommit.id
      action.call(this)
      var newCommit = this.historyView.getCommit('HEAD')
      var newBranch = this.historyView.currentBranch
      var newRef = newBranch || newCommit.id
      after.call(this, {
        commit: oldCommit,
        branch: oldBranch,
        ref: oldRef
      }, {
        commit: newCommit,
        branch: newBranch,
        ref: newRef
      })
    },

    commit: function(args) {
      var msg = ""
      this.transact(function() {
        if (args.length >= 2) {
          var arg = args.shift();

          switch (arg) {
            case '-m':
              msg = args.join(" ");
              this.historyView.commit({}, msg);
              break;
            default:
              this.historyView.commit();
              break;
          }
        } else {
          this.historyView.commit();
        }
      }, function(before, after) {
        var reflogMsg = 'commit: ' + msg
        this.historyView.addReflogEntry(
          'HEAD', after.commit.id, reflogMsg
        )
        if(before.branch) {
          this.historyView.addReflogEntry(
            before.branch, after.commit.id, reflogMsg
          )
        }
      })
    },

    log: function(args) {
      if (args.length > 1) {
        return this.error("'git log' can take at most one argument in this tool")
      }
      var logs = this.historyView.log(args[0] || 'head')
      logs = logs.replace(/\n/g, "<br>")
      this.info(logs)
    },

    rev_parse: function(args) {
      args.forEach(function(arg) {
        this.info(this.historyView.revparse(arg))
      }, this)
    },

    cherry_pick: function (args) {
      var mainline = null;
      var commits = [];
      for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        if (arg === '-m') {
          mainline = args[i+1];
          i++;
        } else {
          commits.push(arg);
        }
      }

      if (mainline !== null && !mainline.match(/^\d+$/)) {
        this.error("switch 'm' expects a numerical value");
        return
      } else if (mainline) {
        mainline = parseInt(mainline, 10);
      }

      // FIXME: because `cherryPick` is asynchronous,
      // it is responsible for its own reflog entries
      this.historyView.cherryPick(commits, mainline);
    },

    branch: function(args) {
      if (args.length < 1) {
        this.info(
          'You need to give a branch name. ' +
          'Normally if you don\'t give a name, ' +
          'this command will list your local branches on the screen.'
        );

        return;
      }

      while (args.length > 0) {
        var arg = args.shift();

        switch (arg) {
          case '--remote':
          case '-r':
            this.info(
              'This command normally displays all of your remote tracking branches.'
            );
            args.length = 0;
            break;
          case '--all':
          case '-a':
            this.info(
              'This command normally displays all of your tracking branches, both remote and local.'
            );
            break;
          case '--delete':
          case '-d':
            var name = args.pop();
            this.historyView.deleteBranch(name);
            break;
          default:
            if (arg.charAt(0) === '-') {
              this.error();
            } else {
              var branchName = arg
              var startCommit = args.shift() || 'head'
              if (args.length) {
                // TODO: error handling if too many args?
              }

              this.transact(function() {
                this.historyView.branch(branchName, startCommit);
              }, function(before, after) {
                var branchCommit = this.historyView.getCommit(branchName)
                var reflogMsg = "branch: created from " + before.ref
                this.historyView.addReflogEntry(
                  branchName, branchCommit.id, reflogMsg
                )
              })
            }
        }
      }
    },

    checkout: function(args) {
      while (args.length > 0) {
        var arg = args.shift();

        switch (arg) {
          case '-b':
            var name = args[args.length - 1];
            this.branch([name])
            break;
          default:
            var remainingArgs = [arg].concat(args);
            args.length = 0;
            var rest = remainingArgs.join(' ')
            this.transact(function() {
              this.historyView.checkout(rest);
            }, function(before, after) {
              this.historyView.addReflogEntry(
                'HEAD', after.commit.id,
                'checkout: moving from ' + before.ref +
                ' to ' + rest
              )
            })
        }
      }
    },

    tag: function(args) {
      if (args.length < 1) {
        this.info(
          'You need to give a tag name. ' +
          'Normally if you don\'t give a name, ' +
          'this command will list your local tags on the screen.'
        );

        return;
      }

      while (args.length > 0) {
        var arg = args.shift();

        try {
          this.historyView.tag(arg);
        } catch (err) {
          if (err.message.indexOf('already exists') === -1) {
            throw new Error(err.message);
          }
        }
      }
    },

    reset: function(args) {
      while (args.length > 0) {
        var arg = args.shift();

        function doReset (name) {
          this.transact(function() {
            this.historyView.reset(name);
          }, function(before, after) {
            var reflogMsg = "reset: moving to " + name
            this.historyView.addReflogEntry(
              'HEAD', after.commit.id, reflogMsg
            )
            if (before.branch) {
              this.historyView.addReflogEntry(
                before.branch, after.commit.id, reflogMsg
              )
            }
          })
        }

        switch (arg) {
          case '--soft':
            this.info(
              'The "--soft" flag works in real git, but ' +
              'I am unable to show you how it works in this demo. ' +
              'So I am just going to show you what "--hard" looks like instead.'
            );
            break;
          case '--mixed':
            this.info(
              'The "--mixed" flag works in real git, but ' +
              'I am unable to show you how it works in this demo. ' +
              'So I am just going to show you what "--hard" looks like instead.'
            );
            break;
          case '--hard':
            doReset.call(this, args.join(' '));
            args.length = 0;
            break;
          default:
            var remainingArgs = [arg].concat(args);
            args.length = 0;
            this.info('Assuming "--hard".');
            doReset.call(this, remainingArgs.join(' '));
        }
      }
    },

    clean: function(args) {
      this.info('Deleting all of your untracked files...');
    },

    revert: function(args) {
      if(args.length === 0) {
        this.error('You must specify a commit to revert');
        return
      }

      this.transact(function() {
        this.historyView.revert(args.shift());
      }, function(before, after) {
        var reflogMsg = 'revert: ' + before.commit.message || before.commit.id
        this.historyView.addReflogEntry(
          'HEAD', after.commit.id, reflogMsg
        )
        if(before.branch) {
          this.historyView.addReflogEntry(
            before.branch, after.commit.id, reflogMsg
          )
        }
      })
    },

    merge: function(args) {
      var noFF = false;
      var branch = args[0];
      var result
      if (args.length === 2) {
        if (args[0] === '--no-ff') {
          noFF = true;
          branch = args[1];
        } else if (args[1] === '--no-ff') {
          noFF = true;
          branch = args[0];
        } else {
          this.info('This demo only supports the --no-ff switch..');
        }
      }

      this.transact(function() {
        result = this.historyView.merge(branch, noFF);

        if (result === 'Fast-Forward') {
          this.info('You have performed a fast-forward merge.');
        }
      }, function(before, after) {
        var reflogMsg = "merge " + branch + ": "
        if (result === 'Fast-Forward') {
          reflogMsg += "Fast-forward"
        } else {
          reflogMsg += "Merge made by the 'recursive' strategy."
        }
        this.historyView.addReflogEntry(
          'HEAD', after.commit.id, reflogMsg
        )
        if (before.branch) {
          this.historyView.addReflogEntry(
            before.branch, after.commit.id, reflogMsg
          )
        }
      })
    },

    rebase: function(args) {
      var ref = args.shift(),
        result = this.historyView.rebase(ref);

      // FIXME: rebase is async, so manages its own
      // reflog entries
      if (result === 'Fast-Forward') {
        this.info('Fast-forwarded to ' + ref + '.');
      }
    },

    fetch: function() {
      if (!this.originView) {
        throw new Error('There is no remote server to fetch from.');
      }

      var origin = this.originView,
        local = this.historyView,
        remotePattern = /^origin\/([^\/]+)$/,
        rtb, isRTB, fb,
        fetchBranches = {},
        fetchIds = [], // just to make sure we don't fetch the same commit twice
        fetchCommits = [],
        fetchCommit,
        resultMessage = '';

      // determine which branches to fetch
      for (rtb = 0; rtb < local.branches.length; rtb++) {
        isRTB = remotePattern.exec(local.branches[rtb]);
        if (isRTB) {
          fetchBranches[isRTB[1]] = 0;
        }
      }

      // determine which commits the local repo is missing from the origin
      for (fb in fetchBranches) {
        if (origin.branches.indexOf(fb) > -1) {
          fetchCommit = origin.getCommit(fb);

          var notInLocal = local.getCommit(fetchCommit.id) === null;
          while (notInLocal) {
            if (fetchIds.indexOf(fetchCommit.id) === -1) {
              fetchCommits.unshift(fetchCommit);
              fetchIds.unshift(fetchCommit.id);
            }
            fetchBranches[fb] += 1;
            fetchCommit = origin.getCommit(fetchCommit.parent);
            notInLocal = local.getCommit(fetchCommit.id) === null;
          }
        }
      }

      // add the fetched commits to the local commit data
      for (var fc = 0; fc < fetchCommits.length; fc++) {
        fetchCommit = fetchCommits[fc];
        local.commitData.push({
          id: fetchCommit.id,
          parent: fetchCommit.parent,
          tags: []
        });
      }

      // update the remote tracking branch tag locations
      for (fb in fetchBranches) {
        if (origin.branches.indexOf(fb) > -1) {
          var remoteLoc = origin.getCommit(fb).id;
          local.moveTag('origin/' + fb, remoteLoc);
        }

        resultMessage += 'Fetched ' + fetchBranches[fb] + ' commits on ' + fb + '.</br>';
      }

      this.info(resultMessage);

      local.renderCommits();
    },

    pull: function(args) {
      var control = this,
        local = this.historyView,
        currentBranch = local.currentBranch,
        rtBranch = 'origin/' + currentBranch,
        isFastForward = false;

      this.fetch();

      if (!currentBranch) {
        throw new Error('You are not currently on a branch.');
      }

      if (local.branches.indexOf(rtBranch) === -1) {
        throw new Error('Current branch is not set up for pulling.');
      }

      setTimeout(function() {
        try {
          if (args[0] === '--rebase' || control.rebaseConfig[currentBranch] === 'true') {
            isFastForward = local.rebase(rtBranch) === 'Fast-Forward';
          } else {
            isFastForward = local.merge(rtBranch) === 'Fast-Forward';
          }
        } catch (error) {
          control.error(error.message);
        }

        if (isFastForward) {
          control.info('Fast-forwarded to ' + rtBranch + '.');
        }
      }, 750);
    },

    push: function(args) {
      var control = this,
        local = this.historyView,
        remoteName = args.shift() || 'origin',
        remote = this[remoteName + 'View'],
        branchArgs = args.pop(),
        localRef = local.currentBranch,
        remoteRef = local.currentBranch,
        localCommit, remoteCommit,
        findCommitsToPush,
        isCommonCommit,
        toPush = [];

      if (remoteName === 'history') {
        throw new Error('Sorry, you can\'t have a remote named "history" in this example.');
      }

      if (!remote) {
        throw new Error('There is no remote server named "' + remoteName + '".');
      }

      if (branchArgs) {
        branchArgs = /^([^:]*)(:?)(.*)$/.exec(branchArgs);

        branchArgs[1] && (localRef = branchArgs[1]);
        branchArgs[2] === ':' && (remoteRef = branchArgs[3]);
      }

      if (local.branches.indexOf(localRef) === -1) {
        throw new Error('Local ref: ' + localRef + ' does not exist.');
      }

      if (!remoteRef) {
        throw new Error('No remote branch was specified to push to.');
      }

      localCommit = local.getCommit(localRef);
      remoteCommit = remote.getCommit(remoteRef);

      findCommitsToPush = function findCommitsToPush(localCommit) {
        var commitToPush,
          isCommonCommit = remote.getCommit(localCommit.id) !== null;

        while (!isCommonCommit) {
          commitToPush = {
            id: localCommit.id,
            parent: localCommit.parent,
            tags: []
          };

          if (typeof localCommit.parent2 === 'string') {
            commitToPush.parent2 = localCommit.parent2;
            findCommitsToPush(local.getCommit(localCommit.parent2));
          }

          toPush.unshift(commitToPush);
          localCommit = local.getCommit(localCommit.parent);
          isCommonCommit = remote.getCommit(localCommit.id) !== null;
        }
      };

      // push to an existing branch on the remote
      if (remoteCommit && remote.branches.indexOf(remoteRef) > -1) {
        if (!local.isAncestorOf(remoteCommit.id, localCommit.id)) {
          throw new Error('Push rejected. Non fast-forward.');
        }

        isCommonCommit = localCommit.id === remoteCommit.id;

        if (isCommonCommit) {
          return this.info('Everything up-to-date.');
        }

        findCommitsToPush(localCommit);

        remote.commitData = remote.commitData.concat(toPush);
        remote.moveTag(remoteRef, toPush[toPush.length - 1].id);
        remote.renderCommits();
      } else {
        this.info('Sorry, creating new remote branches is not supported yet.');
      }
    },

    config: function(args) {
      var path = args.shift().split('.');

      if (path[0] === 'branch') {
        if (path[2] === 'rebase') {
          this.rebase[path[1]] = args.pop();
        }
      }
    },

    reflog: function (args) {
      var reflogExistsFor = function (ref) {
        return this.historyView.logs[ref.toLowerCase()]
      }.bind(this)

      var ref = ""
      var subcommand = "show"
      if (args.length === 0) {
        ref = "HEAD"
      } else if (args.length === 1) {
        ref = args[0].trim()
        if (ref === "show" || ref === "expire" || ref === "delete" || ref === "exists") {
          subcommand = ref
          ref = "HEAD"
        }
      } else if (args.length === 2) {
        subcommand = args[0]
        ref = args[1]
      } else {
        this.error("'git reflog' can take at most two arguments in this tool")
        return
      }

      if (!ref) {
        this.error("No ref specified")
        return
      }

      if (subcommand === "exists") {
        if (reflogExistsFor(ref)) {
          this.info("Reflog for ref " + ref + " exists")
        } else {
          this.error("Reflog for ref " + ref + " does not exist")
        }
      } else if (subcommand === "show") {
        var log = this.historyView.getFormattedReflog(ref)
        this.info(log.replace(/\n/g, "<br>"))
      } else if (subcommand === "expire" || subcommand === "delete") {
        this.info("Real git reflog supports the '" + subcommand +
                  "' subcommand but this tool only supports 'show' and 'exists'")
      }
    }
  };

  return ControlBox;
});
