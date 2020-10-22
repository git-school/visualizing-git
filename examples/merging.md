### Make local changes with using branches

Scenario dropdown - choose `Free Explore with Remote`

Make two commits on a branch called `feature1`
```
git checkout -b feature1
git commit
git commit
```

Merge `feature1` into `main`
```
git checkout main
git merge feature1 --no-ff
// --no-ff means "no fast-forward"
// see below on discussion
```
![explain_git_with_d3](https://cloud.githubusercontent.com/assets/7910250/17195018/537c8e8c-5410-11e6-94fd-041a0c865344.png)

Repeat with `feature2` branch, so that you get this:
![explain_git_with_d3](https://cloud.githubusercontent.com/assets/7910250/17195052/8fcc8b80-5410-11e6-922d-d61173a1cd57.png)

Push to share changes on GitHub!
```
git push
```
![explain_git_with_d3](https://cloud.githubusercontent.com/assets/7910250/17195090/bd7b0778-5410-11e6-9ca6-3f2034887765.png)

#### What is `--no-ff` all about?
Typically when we think about a merge, we are combining two branches that both have changes introduced to them:
![explain_git_with_d3](https://cloud.githubusercontent.com/assets/7910250/17196198/a5e734ea-5417-11e6-838c-2a030ad0ef70.png)

When we merge feature into main, Git creates a merge commit with two parents (the branch heads).
![explain_git_with_d3](https://cloud.githubusercontent.com/assets/7910250/17196233/f5da5db0-5417-11e6-9d25-34a52603e25f.png)

But let's say we have the two branches in the image below and we want to merge `feature1` into `main`.

![explain_git_with_d3](https://cloud.githubusercontent.com/assets/7910250/17195190/47c33676-5411-11e6-93cb-50f904a14f55.png)

Note that the `main` branch is pointing to a commit that is already in the history of the `feature1` branch. This means that all of the commits on the `main` branch are *already* on the `feature1` branch.

In this case, when you tell Git to merge, it will do a *fast-forward merge* by default, meaning it will simply move (or *fast-forward*) the `main` and `HEAD` refs so that they point to the commit that `feature1` points to.

![explain_git_with_d3](https://cloud.githubusercontent.com/assets/7910250/17195338/efa3b078-5411-11e6-81dc-6324701433a4.png)

This can be useful because it minimizes branching in our commit history. Remember that `git pull` consists of a `git fetch` then a `git merge`. What if every time we pulled we got a new merge commit instead of doing a *fast-forward* merge. Then we would get meaningless and unnecessary merge commits that would clutter up our history, and `git log` would show a mess of branches.

Sometimes it's useful to show a branch as being a separate section of our history.
For example, say we've done a bunch of work on a feature branch and want to make it clear which commits were on it after merging into main.

In this case we want to force Git to create a new merge commit and NOT do a *fast-forward merge* by default by saying `git merge feature1 --no-ff`.

![explain_git_with_d3](https://cloud.githubusercontent.com/assets/7910250/17195379/3adb2c42-5412-11e6-85c5-fd5987eafec1.png)

##### Why would we want to use --no-ff?
This is useful for creating a story with our commit history, so it's clear which commits have work for a given feature.

If I ask you which commits correspond to `feature1` and which correspond to `feature2` in this graph, could you tell me with certainty?

![explain_git_with_d3](https://cloud.githubusercontent.com/assets/7910250/17195634/d7c6cec0-5413-11e6-9c92-720811a3e036.png)

What if I asked the same question but with this graph:
![explain_git_with_d3](https://cloud.githubusercontent.com/assets/7910250/17195686/34375f1c-5414-11e6-8d12-7e17ccadb376.png)

With the merge commits it becomes clear which commits correspond to a given feature.

#### Your push will be rejected if it's not a fast-forward
Have you seen this in your console before?
```
To https://github.com/USERNAME/REPOSITORY.git
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/USERNAME/REPOSITORY.git'
To prevent you from losing history, non-fast-forward updates were rejected
Merge the remote changes (e.g. 'git pull') before pushing again.  See the
'Note about fast-forwards' section of 'git push --help' for details.
```

This happens when your remote branch has changes on it that you don't have locally. When you push you're saying to git "make the remote branch look exactly like what I have here". If Git detects that you'll lose information on your remote by doing this, it rejects the push and advises you to first pull to get all the commits locally, and then try pushing again. After doing this, your push will result in a fast-forwarding of the branch ref on your remote.
