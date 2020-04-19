### Make local changes to the working tree

Simulate file edits with the 'edit' command. No filename is required.

```
edit
```

### The Stash

The stash a convenient place to store changes that aren't ready for committing.
To move these files changes to the stash:

```
git stash
```

To move these changes back to the working tree:

```
git stash apply
```
OR
```
git stash pop
```

Applying the changes will move the changes back to the working tree and leave a copy in the stash.
Popping the changes will move the changes back to the working tree but will remove the changes from
the stash.

### Add files to the index

If files are ready for committing, they can "staged"/"added to the index".

```
git add -u
```

The `-u` flag adds all previously tracked files to the staging area

### Remove files from the index

If a file needs to be removed from the staging area, use 'git reset'

```
git reset -- <filename>
```

### Committing

Committing files will remove them from the index and add them to the local repository.
