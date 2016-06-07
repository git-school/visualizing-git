define([], function () {
  // function makeRepo (rootCommit, commits) {
  //   var commits = commits || []
  //   var children = rootCommit.children
  //   delete rootCommit.children
  //   commits.push(rootCommit)
  //
  //   if (!children.length) {
  //     return commits
  //   } else {
  //     return commits.concat(makeRepo())
  //   }
  // }
  //
  // function commit (sha, message, tags, children) {
  //   return {
  //     id: sha, message: message || null, tags: tags || [], children: children
  //   }
  // }

  var free = {
    title: 'Free Explore',
    key: 'free',
    message: 'Have fun!',
    commitData: [
        {id: 'e137e9b', tags: ['master'], message: 'first commit'},
    ]
  }

  var freeWithRemote = {
    title: 'Free Explore with Remote',
    key: 'free-remote',
    message: 'Have fun!',
    commitData: [
        {id: 'e137e9b', tags: ['master', 'origin/master'], message: 'first commit'},
    ],
    originData: [
        {id: 'e137e9b', tags: ['master'], message: 'first commit'}
    ]
  }

  var upstreamChanges = {
    title: 'Upstream Changes',
    key: 'upstream-changes',
    message: 'Someone else has been working here!',
    currentBranch: "feature",
    commitData: [
      {
        "id": "e137e9b",
        "tags": [],
        "message": "first commit",
        "parent": "initial",
      },
      {
        "id": "84c98fe",
        "parent": "e137e9b",
        "tags": [ "master", "origin/master" ],
      },
      {
        "id": "1c016b6",
        "parent": "e137e9b",
        "tags": [ "feature", "origin/feature", "HEAD" ],
      }
    ],
    originData: [
      {
        "id": "e137e9b",
        "tags": [],
        "message": "first commit",
        "parent": "initial",
      },
      {
        "id": "84c98fe",
        "parent": "e137e9b",
        "tags": [ "master", "HEAD" ],
      },
      {
        "id": "1c016b6",
        "parent": "e137e9b",
        "tags": [],
      },
      {
        "id": "fd0af32",
        "tags": [ "feature" ],
        "parent": "1c016b6",
      }
    ]
  }

  var cherryPick = {
    title: 'Cherry Picking',
    key: 'cherry',
    message: 'Let\'s pick some commits',
    commitData: [
      {
        "id": "e137e9b",
        "tags": [],
        "message": "first commit",
        "parent": "initial"
      },
      {
        "id": "78cc3bd",
        "tags": [],
        "parent": "e137e9b"
      },
      {
        "id": "aaad8c8",
        "tags": [ "master", "HEAD" ],
        "parent": "78cc3bd"
      },
      {
        "id": "157e15d",
        "tags": [],
        "parent": "78cc3bd"
      },
      {
        "id": "a17ad66",
        "tags": [],
        "parent": "157e15d"
      },
      {
        "id": "6f5b3a4",
        "tags": [],
        "parent": "a17ad66"
      },
      {
        "id": "f6089f6",
        "tags": [ "feature" ],
        "parent": "6f5b3a4"
      },
      {
        "id": "0da258b",
        "tags": [],
        "parent": "157e15d"
      },
      {
        "id": "c681e06",
        "tags": [],
        "parent": "0da258b"
      },
      {
        "id": "ab103f6",
        "tags": [],
        "parent": "c681e06"
      },
      {
        "parent": "f6089f6",
        "id": "571f0d3",
        "tags": [ "merged" ],
        "message": "Merge",
        "parent2": "ab103f6"
      }
    ]
  }

  var rebase = {
    title: 'Rebasing',
    key: 'rebase',
    message: 'Try rebasing the `feature` branch',
    commitData: [
        {id: 'e137e9b', tags: ['master'], message: 'first commit'}
    ]
  }

  return [
    free, freeWithRemote, upstreamChanges, cherryPick
  ]
})
