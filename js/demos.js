define([], function () {
  var initial = {
    title: 'Free Explore',
    key: 'free',
    commitData: [
        {id: 'e137e9b', tags: ['master', 'origin/master'], message: 'first commit'},
        {id: 'abcdef1', parent: 'e137e9b'}
    ],
    originData: [
        {id: 'e137e9b', tags: ['master'], message: 'first commit'}
    ]
  }

  var rebase = {
    title: 'Rebasing',
    key: 'rebase',
    commitData: [
        {id: 'e137e9b', tags: ['master'], message: 'first commit'}
    ]
  }

  return [
    initial, rebase
  ]
})
