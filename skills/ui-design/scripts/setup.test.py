"""Exercise selected harness side effects without network or real user state."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("ui_setup", Path(__file__).with_name("setup.py"))
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class SelectionTests(unittest.TestCase):
    def test_codex_only_repeat_then_explicit_claude_opt_in(self):
        with tempfile.TemporaryDirectory() as directory:
            user = Path(directory)
            root = user / ".local/share/ui-design-tools"
            vendor = root / "stitch-skills"
            for group, names in (("stitch-design", ("generate-design",)),
                                 ("stitch-utilities", ("design-md", "enhance-prompt"))):
                for name in names:
                    skill = vendor / "plugins" / group / "skills" / name
                    skill.mkdir(parents=True)
                    (skill / "SKILL.md").write_text("fixture")
            pen = user / ".local/lib/node_modules/@pen.dev/cli"
            pen.mkdir(parents=True)
            for name in ("SKILL.md", "LICENSE"):
                (pen / name).write_text("fixture")
            calls, probes, entries = [], [], set()
            config = user / ".codex/config.toml"
            config.parent.mkdir()
            config.write_text('[unrelated]\nvalue = "preserved"\n')

            def call(args, **kwargs):
                calls.append([str(arg) for arg in args])
                if "mcp" in args and "add" in args:
                    name = str(args[-1])
                    with config.open("a") as stream:
                        stream.write(f'\n[mcp_servers.{name}]\ncommand = "{args[-2]}"\nargs = ["{name}"]\n')
                if "mcp" in args:
                    entries.add((str(args[0]), str(args[-1]) if "add-json" not in args else str(args[-2])))

            def which(tool, **kwargs):
                probes.append(tool)
                return None if tool == "claude" else "/fixture/" + tool

            def output(args, **kwargs):
                return "24.0.0" if "-p" in args else ""

            with patch.multiple(setup, USER=user, ROOT=root, BIN=user / ".local/bin", ENV={"PATH":"/fixture"}), \
                    patch.object(setup, "call", side_effect=call), \
                    patch.object(setup.shutil, "which", side_effect=which), \
                    patch.object(setup.subprocess, "check_output", side_effect=output), \
                    patch.object(setup, "has_mcp", side_effect=lambda executable, name: (str(executable), name) in entries):
                setup.main([])
                setup.main(["--harness", "codex"])
                self.assertNotIn("claude", probes)
                self.assertFalse((user / ".claude").exists())
                self.assertFalse((user / ".claude.json").exists())
                self.assertFalse(any("anthropic" in " ".join(args) for args in calls))
                self.assertEqual(sum("mcp" in args for args in calls), 2)
                parsed = setup.tomllib.loads(config.read_text())
                self.assertEqual(parsed["unrelated"]["value"], "preserved")
                for name in ("stitch", "pencil"):
                    self.assertIn("STITCH_API_KEY", parsed["mcp_servers"][name]["env_vars"])
                    self.assertIn("HTTPS_PROXY", parsed["mcp_servers"][name]["env_vars"])
                    self.assertIn("NODE_EXTRA_CA_CERTS", parsed["mcp_servers"][name]["env_vars"])
                    self.assertEqual(parsed["mcp_servers"][name]["startup_timeout_sec"], 60)
                canonical = (user / ".agents/skills/design-md").resolve()
                setup.main(["--harness", "both"])
                self.assertEqual((user / ".claude/skills/design-md").resolve(), canonical)
                self.assertEqual(sum("add-json" in args for args in calls), 2)
                self.assertEqual(sum("mcp" in args and "add" in args for args in calls), 2)
                self.assertTrue(any("@anthropic-ai/claude-code@" in " ".join(args) for args in calls))


if __name__ == "__main__":
    unittest.main()
