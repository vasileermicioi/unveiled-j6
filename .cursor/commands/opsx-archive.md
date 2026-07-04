---
name: /opsx-archive
id: opsx-archive
category: Workflow
description: Archive a completed OpenSpec change with automatic spec sync
---

Archive a completed OpenSpec change.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name after `/opsx:archive` (e.g., `/opsx:archive add-auth`). If omitted, infer it from conversation context or from active changes when safe.

**Autonomy policy**: Prefer completing the archive without extra questions. Ask only when the change cannot be identified, checks reveal incomplete work, sync has conflicts, or the archive target already exists.

**Steps**

1. **Resolve the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user clearly mentioned a change.
   - Run `openspec list --json` and auto-select when exactly one active change exists.
   - If multiple active changes exist and none is clearly implied, use the **AskQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   Always announce: "Archiving change: <name>".

2. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context
   - `artifacts`: List of artifacts with their status (`done` or other)

   If status reports `actionContext.mode: "workspace-planning"`, explain that workspace archive is not supported in this slice and STOP. Do not move workspace changes into repo-local archives or edit linked repos.

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Ask for confirmation before continuing
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Ask for confirmation before continuing
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Auto-sync delta specs**

   Use `artifactPaths.specs.existingOutputPaths` from status JSON to check for delta specs. If none exist, proceed without sync.

   **If delta specs exist:**
   - Read the `openspec-sync-specs` skill before syncing.
   - Apply the delta specs to the corresponding main specs before archiving.
   - Treat the sync as idempotent: if the main specs already include the delta, record "already synced" and continue.
   - Preserve existing main spec content not mentioned by the delta.
   - Show a short sync summary after the sync is complete.

   **Only ask before syncing when:**
   - A delta modifies or removes a requirement that cannot be found in the main spec.
   - A rename is ambiguous.
   - Two deltas appear to conflict with each other.
   - The main spec path cannot be determined from `artifactPaths` or the standard `openspec/specs/<capability>/spec.md` layout.

5. **Perform the archive**

   Create an `archive` directory under `planningHome.changesDir` if it doesn't exist:
   ```bash
   mkdir -p "<planningHome.changesDir>/archive"
   ```

   Generate target name using current date: `YYYY-MM-DD-<change-name>`

   **Check if target already exists:**
   - If yes: stop with a clear error and suggest renaming the existing archive or choosing a different target
   - If no: move `changeRoot` to the archive directory

   ```bash
   mv "<changeRoot>" "<planningHome.changesDir>/archive/YYYY-MM-DD-<name>"
   ```

6. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Spec sync status (synced / already synced / no delta specs)
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs

All artifacts complete. All tasks complete.
```

**Output On Success (No Delta Specs)**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** No delta specs

All artifacts complete. All tasks complete.
```

**Output On Success With Warnings**

```
## Archive Complete (with warnings)

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs

**Warnings:**
- Archived with 2 incomplete artifacts
- Archived with 3 incomplete tasks

Review the archive if this was not intentional.
```

**Output On Error (Archive Exists)**

```
## Archive Failed

**Change:** <change-name>
**Target:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/

Target archive directory already exists.

**Options:**
1. Rename the existing archive
2. Delete the existing archive if it's a duplicate
3. Wait until a different date to archive
```

**Guardrails**
- Auto-select only when there is exactly one active change or the conversation clearly identifies one
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings after confirmation
- Sync delta specs before archiving whenever delta specs exist
- Do not offer "archive without syncing" as a normal path
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync cannot be completed safely, stop before moving the change to archive
