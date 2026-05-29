# Shell & File Operations

- **Create and edit files with the Write and Edit tools — never by shelling out.** No heredocs (`<<EOF`), `cat >`, `echo >`/`>>`, `tee`, `touch`, or `bash -c 'touch …'` to make or change files. Shelling out to write files is lossier, and on Windows (Git Bash) it can hang the session mid-write.
- **Run shell commands in the platform-native shell.** Windows → PowerShell (chain with `;`, not `&&`; `Remove-Item`, not `rm`). macOS/Linux → bash/zsh. Don't assume bash syntax on Windows.
- **AAM's own `*.sh` scripts are the one expected bash use** — run them with `bash <script>` (Git Bash or WSL on Windows). Needing bash for those scripts does not mean the rest of the session should switch to bash.
- Need an empty marker file? Use the Write tool with empty content. Need to delete a file? `Remove-Item` on Windows, `rm` on Unix.
