define(['vendor/yargs-parser', 'd3', 'demos'],
function(_yargs, d3, demos) {
  "use strict";

  function yargs(str, opts) {
    var result = _yargs(str, opts)

    // make every value in result._ a string
    result._ = result._.map(function(val) {
      return "" + val
    })

    return result
  }

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

    this.undoHistory = config.undoHistory || {
      pointer: 0,
      stack: [
        {
          hv: this.historyView.serialize(),
          ov: this.originView && this.originView.serialize()
        }
      ]
    }

    this.mode = 'local'

    this.historyView.on('lock', this.lock.bind(this))
    this.historyView.on('unlock', this.unlock.bind(this))
  }

  ControlBox.prototype = {
    lock: function () {
      this.locked = true
    },

    unlock: function () {
      this.locked = false
      this.createUndoSnapshot(true)
    },

    createUndoSnapshot: function (replace) {
      var state = {
        hv: this.historyView.serialize(),
        ov: (this.originView && this.originView.serialize()) || 'null'
      }
      if (!replace) {
        this.undoHistory.pointer++
        this.undoHistory.stack.length = this.undoHistory.pointer
        this.undoHistory.stack.push(state)
      } else {
        this.undoHistory.stack[this.undoHistory.pointer] = state
      }

      this.persist()
    },

    persist: function () {
      if (window.localStorage) {
        window.localStorage.setItem('git-viz-snapshot', JSON.stringify(this.undoHistory))
      }
    },

    getRepoView: function () {
      if (this.mode === 'local') {
        return this.historyView
      } else if (this.mode === 'origin') {
        return this.originView
      } else {
        throw new Error('invalid mode: ' + this.mode)
      }
    },

    changeMode: function (mode) {
      console.log(mode)
      if (mode === 'local' && this.historyView) {
        this.mode = 'local'
      } else if (mode === 'remote' && this.originView) {
        this.mode = 'origin'
      } else {
        throw new Error('invalid mode: ' + mode)
      }
    },

    render: function(container) {
      var cBox = this,
        cBoxContainer, log, input, selector;

      cBoxContainer = container.append('div')
        .classed('control-box', true);

      selector = cBoxContainer.append('select')
        .classed('scenario-chooser', true)

      demos.forEach(function (demo) {
        var opt = selector.append('option')
          .text(demo.title)
          .attr('value', demo.key)
        if (window.location.hash === ('#' + demo.key)) {
          opt.attr('selected', 'selected')
        }
      })

      selector.on('change', function () {
        if (!confirm('This will erase your current progress. Continue?')) {
          d3.event.preventDefault()
          d3.event.stopPropagation()
          selector.node().value = window.location.hash.replace(/^#/, '') || demos[0].key
          return false
        }
        var currentDemo = window.location.hash
        var sel = selector.node()
        var newDemo = sel.options[sel.selectedIndex].value
        if (('#' + newDemo) !== currentDemo) {
          window.location.hash = newDemo
        }
      })

      log = cBoxContainer.append('div')
        .classed('log', true);

      input = cBoxContainer.append('input')
        .attr('type', 'text')
        .classed('input', true)
        .attr('placeholder', 'enter git command');

      log.on('click', function () {
        if (d3.event.target === log.node()) {
          input.node().focus()
        }
      })

      setTimeout(function() {
        input.node().focus()
      })

      input.on('keyup', function() {
        var e = d3.event;

        switch (e.keyCode) {
          case 13:
            if (this.value.trim() === '' || cBox.locked) {
              return;
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
          default:
            document.getElementById('last-command').textContent = document.querySelectorAll(".control-box .input")[0].value
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
      entry = entry.trim()
      if (entry === '') {
        return;
      }

      document.getElementById('last-command').textContent = entry

      if (entry.trim() === 'help' || entry.trim() === 'help()') {
        this.info('pres() = Turn on presenter mode')
        this.info('undo = Undo the last git command')
        this.info('redo = Redo the last undone git command')
        this.info('mode = Change mode (`local` or `remote`)')
        this.info('clear = Clear the history pane and reset the visualization')
        this.info()
        this.info('Available Git Commands:')
        this.info('`git branch`')
        this.info('`git checkout`')
        this.info('`git cherry_pick`')
        this.info('`git commit`')
        this.info('`git fetch`')
        this.info('`git log`')
        this.info('`git merge`')
        this.info('`git pull`')
        this.info('`git push`')
        this.info('`git rebase`')
        this.info('`git reflog`')
        this.info('`git reset`')
        this.info('`git rev_parse`')
        this.info('`git revert`')
        this.info('`git tag`')
        return
      }

      if (entry === 'pres()') {
        window.pres()
        return
      }

      if (entry.toLowerCase().indexOf('mode ') === 0) {
        var mode = entry.split(' ').pop()
        this.changeMode(mode)
        return
      }

      if (entry.toLowerCase() === 'undo') {
        var lastId = this.undoHistory.pointer - 1
        var lastState = this.undoHistory.stack[lastId]
        if (lastState) {
          this.historyView.deserialize(lastState.hv)
          this.originView && this.originView.deserialize(lastState.ov)
          this.undoHistory.pointer = lastId
        } else {
          this.error("Nothing to undo")
        }
        this.persist()
        this.terminalOutput.append('div')
          .classed('command-entry', true)
          .html(entry);
        this._scrollToBottom();
        return
      }

      if (entry.toLowerCase() === 'redo') {
        var lastId = this.undoHistory.pointer + 1
        var lastState = this.undoHistory.stack[lastId]
        if (lastState) {
          this.historyView.deserialize(lastState.hv)
          this.originView && this.originView.deserialize(lastState.ov)
          this.undoHistory.pointer = lastId
        } else {
          this.error("Nothing to redo")
        }
        this.persist()
        this.terminalOutput.append('div')
          .classed('command-entry', true)
          .html(entry);
        this._scrollToBottom();
        return
      }

      if (entry.toLowerCase() === 'clear') {
        window.resetVis()
        return
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
        args = split.slice(2),
        argsStr = args.join(' ')

      var options = yargs(argsStr)

      try {
        if (typeof this[method] === 'function') {
          this[method](args, options, argsStr);
          this.createUndoSnapshot()
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
      var oldCommit = this.getRepoView().getCommit('HEAD')
      var oldBranch = this.getRepoView().currentBranch
      var oldRef = oldBranch || oldCommit.id
      action.call(this)
      var newCommit = this.getRepoView().getCommit('HEAD')
      var newBranch = this.getRepoView().currentBranch
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

    commit: function(args, opts, cmdStr) {
      opts = yargs(cmdStr, {
        boolean: ['amend'],
        string: ['m']
      })
      var msg = ""
      this.transact(function() {
        if (opts.amend) {
          this.getRepoView().amendCommit(opts.m || this.getRepoView().getCommit('head').message)
        } else {
          this.getRepoView().commit(null, opts.m);
        }
      }, function(before, after) {
        var reflogMsg = 'commit: ' + msg
        this.getRepoView().addReflogEntry(
          'HEAD', after.commit.id, reflogMsg
        )
        if(before.branch) {
          this.getRepoView().addReflogEntry(
            before.branch, after.commit.id, reflogMsg
          )
        }
      })
    },

    log: function(args) {
      if (args.length > 1) {
        return this.error("'git log' can take at most one argument in this tool")
      }
      var logs = this.getRepoView().getLogEntries(args[0] || 'head')
        .map(function(l) {
          return "<span class='log-entry'>&gt; " + l + "</span>"
        }).join('')
      this.info(logs)
    },

    rev_parse: function(args) {
      args.forEach(function(arg) {
        this.info(this.getRepoView().revparse(arg))
      }, this)
    },

    cherry_pick: function (args, opt, cmdStr) {
      opt = yargs(cmdStr, {
        number: ['m']
      })

      if (!opt._.length) {
        this.error('You must specify one or more commits to cherry-pick');
        return
      }

      if (opt.m !== undefined && isNaN(opt.m)) {
        this.error("switch 'm' expects a numerical value");
        return
      }

      // FIXME: because `cherryPick` is asynchronous,
      // it is responsible for its own reflog entries
      this.getRepoView().cherryPick(opt._, opt.m);
    },

    branch: function(args, options, cmdStr) {
      options = yargs(cmdStr, {
        alias: { delete: ['d'], remote: ['r'], all: ['a'] },
        boolean: ['a', 'r']
      })
      var branchName = options._[0]
      var startPoint = options._[1] || 'head'

      if (options.delete) {
        return this.getRepoView().deleteBranch(options.delete);
      }

      if (options._[2]) {
        return this.error('Incorrect usage - supplied too many arguments')
      }

      if (!branchName) {
        var branches
        if (options.remote) {
          branches = this.getRepoView().getBranchList().filter(function (b) {
            return b.indexOf('&nbsp; origin/') === 0
          }).join('<br>')
        } else if (options.all) {
          branches = this.getRepoView().getBranchList().join('<br>')
        } else {
          branches = this.getRepoView().getBranchList().filter(function(b) {
            return b.indexOf('&nbsp; origin/') !== 0
          }).join('<br>')
        }
        return this.info(branches)
      }

      this.transact(function() {
        this.getRepoView().branch(branchName, startPoint)
      }, function(before, after) {
        var branchCommit = this.getRepoView().getCommit(branchName)
        var reflogMsg = "branch: created from " + before.ref
        this.getRepoView().addReflogEntry(branchName, branchCommit.id, reflogMsg)
      })

    },

    checkout: function(args, opts) {
      if (opts.b) {
        if (opts._[0]) {
          this.branch(null, null, opts.b + ' ' + opts._[0])
        } else {
          this.branch(null, null, opts.b)
        }
      }

      var name = opts.b || opts._[0]

      this.transact(function() {
        this.getRepoView().checkout(name);
      }, function(before, after) {
        this.getRepoView().addReflogEntry(
          'HEAD', after.commit.id,
          'checkout: moving from ' + before.ref +
          ' to ' + name
        )
      })
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
          this.getRepoView().tag(arg);
        } catch (err) {
          if (err.message.indexOf('already exists') === -1) {
            throw new Error(err.message);
          }
        }
      }
    },

    doReset: function (name) {
      this.transact(function() {
        this.getRepoView().reset(name);
      }, function(before, after) {
        var reflogMsg = "reset: moving to " + name
        this.getRepoView().addReflogEntry(
          'HEAD', after.commit.id, reflogMsg
        )
        if (before.branch) {
          this.getRepoView().addReflogEntry(
            before.branch, after.commit.id, reflogMsg
          )
        }
      })
    },

    reset: function(args) {
      while (args.length > 0) {
        var arg = args.shift();

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
            this.doReset(args.join(' '));
            args.length = 0;
            break;
          default:
            var remainingArgs = [arg].concat(args);
            args.length = 0;
            this.info('Assuming "--hard".');
            this.doReset(remainingArgs.join(' '));
        }
      }
    },

    clean: function(args) {
      this.info('Deleting all of your untracked files...');
    },

    revert: function(args, opt, cmdStr) {
      opt = yargs(cmdStr, {
        number: ['m']
      })

      if (!opt._.length) {
        this.error('You must specify a commit to revert');
        return
      }

      if (opt.m !== undefined && isNaN(opt.m)) {
        this.error("switch 'm' expects a numerical value");
        return
      }

      this.transact(function() {
        this.getRepoView().revert(opt._, opt.m);
      }, function(before, after) {
        var reflogMsg = 'revert: ' + before.commit.message || before.commit.id
        this.getRepoView().addReflogEntry(
          'HEAD', after.commit.id, reflogMsg
        )
        if(before.branch) {
          this.getRepoView().addReflogEntry(
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
        result = this.getRepoView().merge(branch, noFF);

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
        this.getRepoView().addReflogEntry(
          'HEAD', after.commit.id, reflogMsg
        )
        if (before.branch) {
          this.getRepoView().addReflogEntry(
            before.branch, after.commit.id, reflogMsg
          )
        }
      })
    },

    rebase: function(args) {
      var ref = args.shift(),
        result = this.getRepoView().rebase(ref);

      // FIXME: rebase is async, so manages its own
      // reflog entries
      if (result === 'Fast-Forward') {
        this.info('Fast-forwarded to ' + ref + '.');
      }
    },

    fetch: function() {
      if (this.mode !== 'local') {
        throw new Error('can only fetch from local')
      }
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
      function checkCommit (commit, branch) {
        var notInLocal = local.getCommit(commit.id) === null
        if (notInLocal && commit.id) {
          if (fetchIds.indexOf(commit.id) === -1) {
            fetchCommits.unshift(commit)
            fetchIds.unshift(commit.id)
          }
          fetchBranches[branch] += 1
          commit.parent && checkCommit(origin.getCommit(commit.parent), branch)
          commit.parent2 && checkCommit(origin.getCommit(commit.parent2), branch)
        }
      }

      for (fb in fetchBranches) {
        if (origin.branches.indexOf(fb) > -1) {
          checkCommit(origin.getCommit(fb), fb)
        }
      }

      // add the fetched commits to the local commit data
      for (var fc = 0; fc < fetchCommits.length; fc++) {
        fetchCommit = fetchCommits[fc];
        local.commitData.push({
          id: fetchCommit.id,
          parent: fetchCommit.parent,
          parent2: fetchCommit.parent2,
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
      if (this.mode !== 'local') {
        throw new Error('can only pull from local')
      }
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

      this.lock()
      setTimeout(function() {
        try {
          if (args[0] === '--rebase' || control.rebaseConfig[currentBranch] === 'true') {
            isFastForward = local.rebase(rtBranch) === 'Fast-Forward';
          } else {
            isFastForward = local.merge(rtBranch) === 'Fast-Forward';
          }
        } catch (error) {
          control.error(error.message);
        } finally {
          this.unlock()
        }

        if (isFastForward) {
          control.info('Fast-forwarded to ' + rtBranch + '.');
        }
      }.bind(this), 750);
    },

    push: function(args, opts, cmdStr) {
      var opt = yargs(cmdStr, {
        alias: { force: ['f'], upstream: ['u'] },
        boolean: ['f', 'u']
      })

      if (this.mode !== 'local') {
        throw new Error('can only push from local')
      }
      var control = this,
        local = this.historyView,
        remoteName = opt._[0] || 'origin',
        remote = this[remoteName + 'View'],
        branchArgs = opt._[1],
        localRef = local.currentBranch,
        remoteRef = local.currentBranch,
        localCommit, remoteCommit,
        findCommitsToPush,
        isCommonCommit,
        idsToPush = [],
        toPush = [];

      if (remoteName === 'history') {
        throw new Error('Sorry, you can\'t have a remote named "history" in this example.');
      }

      if (!remote) {
        throw new Error('There is no remote server named "' + remoteName + '".');
      }

      if (remote.branches.indexOf(remoteRef) === -1) {
        remote.branch(remoteRef, 'e137e9b')
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
        var alreadyPushed = remote.getCommit(localCommit.id) !== null
        if (!alreadyPushed && idsToPush.indexOf(localCommit.id) === -1) {
          idsToPush.push(localCommit.id)

          toPush.push(Object.assign({}, localCommit, {tags: []}))

          localCommit.parent && findCommitsToPush(local.getCommit(localCommit.parent))
          localCommit.parent2 && findCommitsToPush(local.getCommit(localCommit.parent2))
        }
      }

      // push to an existing branch on the remote
      if (remoteCommit && remote.branches.indexOf(remoteRef) > -1) {
        if (!local.isAncestorOf(remoteCommit.id, localCommit.id) && !opt.f) {
          throw new Error('Push rejected. Non fast-forward. Try pulling first');
        }

        isCommonCommit = localCommit.id === remoteCommit.id;

        if (isCommonCommit) {
          return this.info('Everything up-to-date.');
        }

        if (!opt.f) {
          findCommitsToPush(localCommit);
          remote.commitData = remote.commitData.concat(toPush);
        } else {
          var localData = JSON.parse(JSON.stringify(local.commitData))
          localData.forEach(function(commit) {
            var originTagIndex = commit.tags.indexOf('origin/' + localRef)
            if (originTagIndex > -1) {
              commit.tags.splice(originTagIndex, 1)
            }
          })
          remote.commitData = localData
          this.info('forced update')
        }

        remote.moveTag(remoteRef, localCommit.id);
        local.moveTag('origin/' + localRef, localRef)
        remote.renderCommits();
        local.renderTags()
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
        return this.getRepoView().logs[ref.toLowerCase()]
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
        var logs = this.getRepoView().getReflogEntries(ref)
        this.info(
          logs.map(function(l) {
            return "<span class='reflog-entry'>&gt; " + l + "</span>"
          }).join('')
        )
      } else if (subcommand === "expire" || subcommand === "delete") {
        this.info("Real git reflog supports the '" + subcommand +
                  "' subcommand but this tool only supports 'show' and 'exists'")
      }
    }
  };

  return ControlBox;
});
