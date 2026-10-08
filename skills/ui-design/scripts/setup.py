#!/usr/bin/env python3
"""Install optional user tooling once, without writing any consumer repository."""
import argparse
import json
import os
from pathlib import Path
import platform
import re
import shlex
import shutil
import subprocess
import tomllib

STITCH_REV = "0337446dadde6f8c94210444e2aa9d546126480f"
PEN_VERSION = "0.3.10"
CLAUDE_VERSION = "2.1.293"
SOURCE = Path(__file__).resolve().parent
USER = Path.home()
ROOT = USER / ".local/share/ui-design-tools"
BIN = USER / ".local/bin"
ENV = dict(os.environ, PATH=str(BIN) + os.pathsep + os.environ.get("PATH", ""))


def call(args, **kwargs):
    return subprocess.run([str(arg) for arg in args], check=True, env=ENV, **kwargs)


def link(target, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.is_symlink() and destination.resolve() == target.resolve():
        return
    if destination.exists() or destination.is_symlink():
        raise RuntimeError(f"Existing skill at {destination}; reconcile its source before installing.")
    destination.symlink_to(target, target_is_directory=True)


def has_mcp(executable, name):
    # Native configuration may contain secrets: do not relay its output.
    return subprocess.run([str(executable), "mcp", "get", name], env=ENV,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0


def configure_codex_runtime(name, launcher):
    # Codex's stdio child filters the environment. Forward names, never values.
    config = Path(ENV.get("CODEX_HOME") or USER / ".codex") / "config.toml"
    text = config.read_text()
    entry = tomllib.loads(text).get("mcp_servers", {}).get(name, {})
    if entry.get("command") != str(launcher) or entry.get("args") != [name]:
        print(f"Codex {name}: external entry preserved; validate its environment forwarding independently.")
        return
    additions = []
    if "env_vars" not in entry:
        additions.append('env_vars = ["STITCH_API_KEY", "PEN_CLI_KEY", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "all_proxy", "no_proxy", "NODE_EXTRA_CA_CERTS", "SSL_CERT_FILE", "SSL_CERT_DIR", "REQUESTS_CA_BUNDLE", "CURL_CA_BUNDLE", "PEN_MCP_APP"]')
    if "startup_timeout_sec" not in entry:
        additions.append("startup_timeout_sec = 60")
    if additions:
        pattern = rf"(?m)^\[mcp_servers\.{re.escape(name)}\]\s*$"
        updated, count = re.subn(pattern, lambda match: match.group(0) + "\n" + "\n".join(additions), text)
        if count != 1:
            raise RuntimeError("Cannot safely locate Codex MCP section; preserve it and reconcile manually.")
        tomllib.loads(updated)
        config.write_text(updated)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--harness", choices=("codex", "both"), default="codex",
                        help="Configure Codex only (default), or opt into Claude Code too.")
    options = parser.parse_args(argv)
    include_claude = options.harness == "both"
    if platform.system() not in ("Linux", "Darwin"):
        raise RuntimeError("This installer supports Linux/macOS; Windows should use WSL or native app setup.")
    node, npm, git, codex = [shutil.which(tool, path=ENV["PATH"]) for tool in ("node", "npm", "git", "codex")]
    if not all((node, npm, git, codex)):
        raise RuntimeError("Node >=22.19, npm, Git and Codex CLI are required.")
    version = subprocess.check_output([node, "-p", "process.versions.node"], text=True).strip()
    if tuple(map(int, version.split("."))) < (22, 19, 0):
        raise RuntimeError("Node >=22.19 is required by the pen.dev CLI.")
    ROOT.mkdir(parents=True, exist_ok=True)
    BIN.mkdir(parents=True, exist_ok=True)
    runtime = ROOT / "runtime"
    runtime.mkdir(exist_ok=True)
    for filename in ("run.mjs", "proxy.mjs", "smoke.mjs", "package.json", "package-lock.json"):
        shutil.copy2(SOURCE / filename, runtime / filename)
    call([npm, "ci", "--prefix", runtime, "--no-audit", "--no-fund"])
    call([npm, "install", "-g", "--prefix", USER / ".local", f"@pen.dev/cli@{PEN_VERSION}", "--no-audit", "--no-fund"])
    claude = None
    if include_claude:
        claude = shutil.which("claude", path=ENV["PATH"])
        if not claude:
            call([npm, "install", "-g", "--prefix", USER / ".local", f"@anthropic-ai/claude-code@{CLAUDE_VERSION}", "--no-audit", "--no-fund"])
            claude = str(BIN / "claude")
    # npm's published tarball carries native files without executable mode.
    pen_root = USER / ".local/lib/node_modules/@pen.dev/cli"
    for native in (pen_root / "dist/out").glob("mcp-server-*"):
        if not native.name.endswith(".exe"):
            native.chmod(native.stat().st_mode | 0o100)
    vendor = ROOT / "stitch-skills"
    if not vendor.exists():
        call([git, "clone", "https://github.com/google-labs-code/stitch-skills.git", vendor])
    else:
        dirty = subprocess.check_output([git, "-C", str(vendor), "status", "--porcelain"], text=True)
        if dirty:
            raise RuntimeError("Canonical Stitch checkout has edits; preserve them before updating.")
        call([git, "-C", vendor, "fetch", "origin", STITCH_REV])
    call([git, "-C", vendor, "checkout", "--detach", STITCH_REV])
    skills = list((vendor / "plugins/stitch-design/skills").iterdir())
    skills += [vendor / "plugins/stitch-utilities/skills" / name for name in ("design-md", "enhance-prompt")]
    # Preserve the original pen.dev skill in a small canonical directory, not a
    # skill symlink into an entire dependency tree containing node_modules.
    pen_skill = ROOT / "vendor-skills/pen-design"
    pen_skill.mkdir(parents=True, exist_ok=True)
    shutil.copy2(pen_root / "SKILL.md", pen_skill / "SKILL.md")
    shutil.copy2(pen_root / "LICENSE", pen_skill / "LICENSE")
    skills.append(pen_skill)
    for skill in skills:
        if not (skill / "SKILL.md").is_file():
            continue
        bases = [USER / ".agents/skills"]
        if include_claude:
            bases.append(USER / ".claude/skills")
        for base in bases:
            link(skill, base / skill.name)
    credential_dir = USER / ".config/ui-design"
    credential_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    credentials = credential_dir / "credentials.json"
    if not credentials.exists():
        descriptor = os.open(credentials, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "w") as stream:
            json.dump({"STITCH_API_KEY": "", "PEN_CLI_KEY": ""}, stream, indent=2)
            stream.write("\n")
    launcher = BIN / "ui-design"
    launcher.write_text("#!/bin/sh\nexec " + shlex.quote(node) + " " + shlex.quote(str(runtime / "run.mjs")) + ' "$@"\n')
    launcher.chmod(0o755)
    for name in ("stitch", "pencil"):
        if not has_mcp(codex, name):
            call([codex, "mcp", "add", name, "--", launcher, name])
        else:
            print(f"Codex {name}: reusing existing configuration.")
        configure_codex_runtime(name, launcher)
        if not include_claude:
            continue
        if not has_mcp(claude, name):
            entry = {"type": "stdio", "command": str(launcher), "args": [name]}
            call([claude, "mcp", "add-json", "--scope", "user", name, json.dumps(entry)])
        else:
            print(f"Claude Code {name}: reusing existing configuration.")
    profile = USER / ".profile"
    text = profile.read_text() if profile.exists() else ""
    if ".local/bin" not in text:
        profile.write_text(text + '\n# User CLI tools (ui-design setup)\nexport PATH="$HOME/.local/bin:$PATH"\n')
    (ROOT / "versions.json").write_text(json.dumps({"stitch_skills_revision": STITCH_REV,
        "pen_cli": PEN_VERSION, "runtime": json.loads((runtime / "package.json").read_text())["dependencies"]}, indent=2) + "\n")
    selected = "Codex and Claude Code" if include_claude else "Codex only"
    print(f"User tooling configured for {selected}. Credentials were not copied into MCP configuration.")
    print("Restart harnesses to discover the new user skills/MCP entries. Authenticate providers securely.")


if __name__ == "__main__":
    main()
