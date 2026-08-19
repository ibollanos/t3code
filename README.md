# T3 Code (personal fork)

Personal fork of [T3 Code](https://github.com/pingdotgg/t3code). For full product documentation,
see the [upstream README](https://github.com/pingdotgg/t3code#readme).

## What this fork adds

- **Line-aware approval diffs for Claude Code file changes.** When the agent asks to edit a file,
  the proposed change renders as a line-numbered diff in the Diff panel's **Pending approval**
  view (click the file row in the approval card to jump there), and the approval card has a
  comment field whose text is sent to the agent along with your decision — as feedback on a
  decline, or as a follow-up instruction on an approve.

## Running this fork

```bash
pnpm install
pnpm --filter @t3tools/web build
node apps/server/src/bin.ts ~ --host 0.0.0.0 --port 1337 --base-dir ~/.t3
```

- The positional `~` is the server's workspace root. Keep it above every project you work on —
  the server sandboxes working-tree diffs to its own root and rejects projects outside it.
- `--host 0.0.0.0` makes the app reachable from other machines on the local network
  (`http://<this-machine>:1337`). Open the firewall port if needed:
  `sudo firewall-cmd --add-port=1337/tcp`.
- `--base-dir ~/.t3` reuses the installed app's state (threads, settings, provider credentials).
  Quit any other T3 Code instance first — one server per database.
- To pair another device: `node apps/server/src/bin.ts pair --base-dir ~/.t3`, then open the
  printed URL on that device (swap in the LAN IP if it prints a loopback host).

## Fork artifacts (releases)

The fork has its own release pipeline: **Actions → Fork Release → Run workflow**, with a version
like `0.0.34-fork.1`. It builds all three artifacts and attaches them to a GitHub Release at
`github.com/ibollanos/t3code/releases` (tag `fork-v<version>`):

| Artifact                         | What it is                                   | Install                                     |
| -------------------------------- | -------------------------------------------- | ------------------------------------------- |
| `t3-<version>.tgz`               | The server as an npm package (like `npx t3`) | `npm i -g <file-or-url>`, then run `t3`     |
| `T3-Code-<version>-x64.AppImage` | Linux desktop app                            | `chmod +x` and run                          |
| `T3-Code-<version>-x64.exe`      | Windows installer                            | run it — installs as **T3 Code (Personal)** |

Every artifact is a direct-download URL, so you can install straight from GitHub without cloning
anything — for release version `0.0.34-fork.1` (tag `fork-v0.0.34-fork.1`):

```bash
# Server CLI
npm i -g https://github.com/ibollanos/t3code/releases/download/fork-v0.0.34-fork.1/t3-0.0.34-fork.1.tgz

# Linux desktop app
curl -LO https://github.com/ibollanos/t3code/releases/download/fork-v0.0.34-fork.1/T3-Code-0.0.34-fork.1-x86_64.AppImage
chmod +x T3-Code-0.0.34-fork.1-x86_64.AppImage

# Windows installer: download
# https://github.com/ibollanos/t3code/releases/download/fork-v0.0.34-fork.1/T3-Code-0.0.34-fork.1-x64.exe
```

## Running the server CLI

Once the `t3` package is installed (from the tarball or the release URL above):

```bash
t3 --help                                        # all commands and flags
t3 ~ --host 0.0.0.0 --port 1337 --base-dir ~/.t3 # serve on the LAN with your real state
```

The arguments are the same as in "Running this fork" above: positional workspace root, `--host`,
`--port`, `--base-dir ~/.t3` (quit any other T3 Code instance first — one server per database).
Pair another device with `t3 pair --base-dir ~/.t3`.

Without installing anything, the same CLI runs from a checkout:

```bash
node apps/server/dist/bin.mjs ~ --host 0.0.0.0 --port 1337 --base-dir ~/.t3  # from the built bundle
node apps/server/src/bin.ts ~ --host 0.0.0.0 --port 1337 --base-dir ~/.t3    # straight from source
```

### Reinstalling / removing the CLI

The package is named `t3`, so it shares the global slot with the official CLI — uninstall before
switching between them:

```bash
npm uninstall -g t3        # remove whichever t3 is currently installed
npm i -g <tarball-or-url>  # install (or reinstall) this fork's build
t3 --version               # confirm what's now installed
```

The CLI's state lives under `--base-dir` (`~/.t3` by default), not in the package — uninstalling
removes only the binary, never your threads or settings.

The Windows build is branded **T3 Code (Personal)** with a dark-green icon and its own app id, so
it installs alongside the official T3 Code without touching it. Builds are unsigned: Windows
SmartScreen will warn once ("More info → Run anyway").

Desktop apps built by this workflow watch **this fork's** releases for auto-updates, so a new
workflow run is all it takes to ship an update to installed copies.

Do not push bare `v*.*.*` tags on the fork — that tag pattern fires upstream's release workflow,
which cannot run here.

### Building the artifacts locally instead

```bash
# Server CLI tarball → release/t3-<version>.tgz
pnpm --filter @t3tools/web build
node apps/server/scripts/cli.ts build
node scripts/pack-cli-tarball.mjs

# Linux AppImage → release/T3-Code-<version>-x64.AppImage (needs cargo + ImageMagick)
PATH="$PWD/node_modules/.bin:$PATH" node scripts/build-desktop-artifact.ts \
  --platform linux --target AppImage --arch x64 --build-version 0.0.34-fork.1

# Windows installer requires a Windows host (or the workflow above); on one:
#   set T3CODE_DESKTOP_PRODUCT_NAME=T3 Code (Personal)
#   set T3CODE_DESKTOP_APP_ID=com.ibollanos.t3code-personal
#   set T3CODE_DESKTOP_WINDOWS_ICON=assets/fork/t3-green-windows.ico
#   node scripts/build-desktop-artifact.ts --platform win --target nsis --arch x64 --build-version ...
```

## Syncing with upstream

One-time remote setup (this checkout currently points straight at upstream):

```bash
git remote rename origin upstream          # upstream = github.com/pingdotgg/t3code
git remote add origin git@github.com:<you>/t3code.git
git push -u origin approval-diffs:main     # fork's main = upstream main + this fork's commit
```

Pull the latest upstream changes into the fork:

```bash
git fetch upstream
git merge upstream/main
```

- **No conflicts**: the merge completes on its own — commit with the default message and
  `git push`.
- **Conflicts**: `git status` lists the conflicting files. Either resolve them (edit,
  `git add <file>`, `git commit`) or bail out entirely and keep the fork as it was:

  ```bash
  git merge --abort
  ```

  `README.md` is the file most likely to conflict, because this fork replaces it. To keep ours
  during a conflicted merge: `git checkout --ours README.md && git add README.md && git commit`.

## Extending the fork's changes

The fork's changes live in a single commit on top of upstream `main`, so adding more is:

```bash
git add -A
git commit --amend
git push --force-with-lease
```
