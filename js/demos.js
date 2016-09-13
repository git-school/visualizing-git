define([], function () {

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

  var rewrittenHistory = {
    title: 'Rewritten Remote History',
    key: 'rewritten-history',
    message: 'Someone force-pushed and re-wrote history on the remote!',
    currentBranch: "feature",
    commitData: [
      {
        "id": "e137e9b",
        "tags": [],
        "message": "first commit",
        "parent": "initial",
        "cx": 50,
        "cy": 330,
        "branchless": false
      },
      {
        "id": "84c98fe",
        "parent": "e137e9b",
        "tags": [
          "master",
          "origin/master"
        ],
        "cx": 140,
        "cy": 330,
        "branchless": false
      },
      {
        "id": "1c016b6",
        "parent": "e137e9b",
        "tags": [],
        "cx": 140,
        "cy": 240,
        "branchless": false
      },
      {
        "id": "fd0af32",
        "parent": "1c016b6",
        "tags": [],
        "cx": 230,
        "cy": 240,
        "branchless": false
      },
      {
        "id": "5041e4c",
        "tags": [
          "feature",
          "origin/feature",
          "HEAD"
        ],
        "parent": "fd0af32",
        "cx": 320,
        "cy": 240,
        "branchless": false
      }
    ],
    originData: [
      {
        "id": "e137e9b",
        "tags": [],
        "message": "first commit",
        "parent": "initial",
        "cx": 50,
        "cy": 360,
        "branchless": false
      },
      {
        "id": "84c98fe",
        "parent": "e137e9b",
        "tags": [
          "master"
        ],
        "cx": 140,
        "cy": 360,
        "branchless": false
      },
      {
        "id": "1c016b6",
        "parent": "e137e9b",
        "tags": [],
        "cx": 140,
        "cy": 270,
        "branchless": false
      },
      {
        "id": "fd0af32",
        "tags": [
          "feature",
          "HEAD"
        ],
        "parent": "1c016b6",
        "cx": 230,
        "cy": 270,
        "branchless": false
      },
      {
        "id": "5041e4c",
        "tags": [],
        "parent": "fd0af32",
        "cx": 320,
        "cy": 270,
        "branchless": true
      }
    ]

  }

  var mainline = {
    title: 'Mainline',
    key: 'mainline',
    message: 'Let\'s pick and revert some commits',
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
        "tags": [ "[fix]" ],
        "parent": "a17ad66"
      },
      {
        "id": "f6089f6",
        "tags": [],
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
        "tags": [ "feature" ],
        "parent": "c681e06"
      },
      {
        "parent": "f6089f6",
        "id": "571f0d3",
        "tags": [ "development" ],
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
    free, freeWithRemote, upstreamChanges, rewrittenHistory, mainline
  ]
})
