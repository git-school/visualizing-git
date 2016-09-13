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

  var revert = {
    title: 'Revert',
    key: 'revert',
    message: 'Oops, let\'s revert some commits',
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
        "id": "dd70cfe",
        "tags": [],
        "parent": "e137e9b",
        "cx": 140,
        "cy": 330,
        "branchless": false
      },
      {
        "id": "2545b6f",
        "tags": [],
        "parent": "dd70cfe",
        "cx": 230,
        "cy": 330,
        "branchless": false
      },
      {
        "id": "3d6ef16",
        "tags": [],
        "parent": "dd70cfe",
        "cx": 230,
        "cy": 240,
        "branchless": false
      },
      {
        "id": "077415f",
        "tags": [
          "feature"
        ],
        "parent": "3d6ef16",
        "cx": 320,
        "cy": 240,
        "branchless": false
      },
      {
        "parent2": "077415f",
        "id": "8686fb6",
        "tags": [
          "master",
          "HEAD"
        ],
        "message": "Merge",
        "parent": "2545b6f",
        "cx": 410,
        "cy": 330,
        "branchless": false
      }
    ]
  }

  var cherryPick = {
    title: 'Cherry Pick',
    key: 'cherry pick',
    message: 'Let\'s pick some commits',
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
        "id": "1453f27",
        "tags": [],
        "parent": "e137e9b",
        "cx": 140,
        "cy": 330,
        "branchless": false
      },
      {
        "id": "89613dc",
        "tags": [],
        "parent": "1453f27",
        "cx": 230,
        "cy": 330,
        "branchless": false
      },
      {
        "id": "378e507",
        "tags": [ "[bugfix2]" ],
        "parent": "89613dc",
        "cx": 320,
        "cy": 330,
        "branchless": false
      },
      {
        "id": "0fdc964",
        "tags": [],
        "parent": "89613dc",
        "cx": 320,
        "cy": 240,
        "branchless": false
      },
      {
        "id": "e2c97ff",
        "tags": [
          "bugfix"
        ],
        "parent": "0fdc964",
        "cx": 410,
        "cy": 240,
        "branchless": false
      },
      {
        "id": "7561647",
        "tags": [],
        "parent": "1453f27",
        "cx": 230,
        "cy": 240,
        "branchless": false
      },
      {
        "id": "af18be0",
        "tags": [
          "release"
        ],
        "parent": "7561647",
        "cx": 320,
        "cy": 150,
        "branchless": false
      },
      {
        "parent2": "e2c97ff",
        "id": "37b7579",
        "tags": [
          "master",
          "HEAD"
        ],
        "message": "Merge",
        "parent": "378e507",
        "cx": 500,
        "cy": 330,
        "branchless": false
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
    free, freeWithRemote, upstreamChanges, rewrittenHistory, revert, cherryPick
  ]
})
