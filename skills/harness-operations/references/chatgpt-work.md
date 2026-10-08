# ChatGPT Work mechanics

Load this reference only in an observed ChatGPT Work session. Determine whether
execution is local or cloud from the current runtime; sharing a model or tools
with Codex does not establish identical instruction or skill discovery.

## Repository instructions and skills

1. Resolve the exact repository, target branch and commit for the task. A
   ChatGPT Project mirror and its read-only sources are reference material, not
   an editable repository checkout or proof that its AGENTS.md was injected.
2. In an available checkout, read AGENTS.md and .agents/manifest.json at the
   selected commit, then discover applicable module instructions before edits.
   Without a checkout, use an already connected GitHub file-read capability at
   that same commit. Keep repository and ref explicit for every subsequent read.
3. Select relevant canonical .agents/skills/<name>/SKILL.md files and read their
   necessary references/assets, including dependencies recorded in .agents/lock.json.
   Discover repo-owned local skills from manifest.local_skills. Do not assume a
   GitHub file is installed or appears in Work's skill catalog merely because
   it can be read.
4. Use the exposed skill catalog and its supported read mechanism for installed
   skills. Where supported, ChatGPT uses @ mentions; use the current interface
   rather than assuming Codex's $ syntax works. If an installed shared skill
   differs from the target repository's pinned workflow, load the canonical
   repository copy. Host instructions and tool contracts continue to govern.
5. Keep the Project instructions as a short loading entrypoint. Maintain
   repository invariants and checks in AGENTS.md, shared procedures in dev-skills,
   and local workflows in their canonical repo-owned paths. Update generated
   copies through the pinned synchronizer, not by editing discovery projections.
   On a task ref change, refresh the affected instructions and selected skills;
   do not carry a cached catalog or previous branch's policy forward as evidence.

## Tools and authority

- Prefer available connected tools for repository/file, issue/PR, check/status
  and log operations. Inspect each operation's actual schema and permissions;
  a working file-read tool does not prove publication or logs are available.
  Preserve file modes, deletions and parent lineage for Git API publication,
  then verify the exact resulting tree.
- Use execution and file-edit tools only when exposed and permitted. Local Work
  may have desktop files or a shell; cloud Work does not acquire local access
  from a project name. A connector-backed edit does not run Node, Rust or tests.
  Report unavailable tooling and unrun gates explicitly.
- Skills provide procedures, not tools, credentials or additional authority.
  Carry forward the user's established scope. Preserve repository deployment
  routes and disabled workflows; do not enable CI or deploy to obtain evidence
  unless that operation is within the authorized task.
- Treat browser/connector denial as an operation-specific boundary. Use an
  equivalent only when it is permitted; never bypass an explicit denial through
  another surface or hidden endpoint. Complete independent authorized work and
  report the exact blocked action.
- Create another task, send another session a message or delegate only when the
  current task and runtime permit it. Do not promise background monitoring
  because a tool call completed or a turn ended.

## Human decisions

Follow the current system/developer instructions and tool contracts. Some Work
surfaces expose request_user_input or request_user_input_async; inspect their
availability, supported purposes and mode restrictions before use. Do not use a
clarification tool for an approval purpose it prohibits.

Ask for unresolved human choices through an available permitted structured
question tool, including options and tradeoffs. Continue independent work while
waiting; silence or a recommended default supplies no approval. Reuse settled
decisions. If the required answer channel is unavailable, report that concrete
limitation and use the established human handoff without inventing authority.

## Verification

Record the Work surface, repository/commit, instruction sources and selected
skill reads actually observed. Distinguish installed catalog discovery from
explicit GitHub/local file reads. Static packaging and checksum checks do not
prove fresh-session injection, automatic selection, cross-device availability
or adherence. Report those runtime checks as unrun until observed.
