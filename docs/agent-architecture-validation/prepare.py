#!/usr/bin/env python3
"""Prepare disposable harness fixtures without invoking any harness."""
from pathlib import Path
import shutil, subprocess, json
V=Path(__file__).resolve().parent
G=V/'generated'
if G.exists(): shutil.rmtree(G)
G.mkdir()
def w(path,text):
    p=G/path; p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text+'\n')
def repo(path):
    subprocess.run(['git','init','-q',str(G/path)],check=True)
root='# Fixture repository\n\nFor a marker report, include ROOT=amber.\n'
adapter='@AGENTS.md\n\nFor a marker report, include CLAUDE=teal.\n'
skill='---\nname: fixture-workflow\ndescription: Return a harmless marker when fixture-workflow is explicitly invoked.\n---\n\nReply SKILL=plum. Do not edit or publish anything.\n'
for name in ['native','bridge','override','local-claude','duplicate']:
    w(Path(name)/'AGENTS.md',root);repo(Path(name))
w(Path('bridge/CLAUDE.md'),adapter)
w(Path('bridge/module/AGENTS.md'),'# Module fixture\n\nFor a marker report, include MODULE=violet.\n')
w(Path('bridge/module/CLAUDE.md'),'@AGENTS.md')
w(Path('bridge/module/src/example.txt'),'An inert module fixture.')
w(Path('override/AGENTS.override.md'),'# Codex override fixture\n\nFor a marker report, include OVERRIDE=coral.\n')
w(Path('local-claude/CLAUDE.local.md'),'# Personal project fixture\n\nFor a marker report, include LOCAL=silver.\n')
w(Path('ancestor/CLAUDE.md'),'# Ancestor fixture\n\nFor a marker report, include ANCESTOR=navy.\n')
w(Path('ancestor/child/AGENTS.md'),root);repo(Path('ancestor/child'))
for name in ['bridge','duplicate']:
    for location in ['.agents/skills','.claude/skills']:
        w(Path(name)/location/'fixture-workflow/SKILL.md',skill)
w(Path('profiles/codex/AGENTS.md'),'# Personal fixture\n\nFor a marker report, include USER=gold.\n')
w(Path('profiles/claude/CLAUDE.md'),'# Personal fixture\n\nFor a marker report, include USER=gold.\n')
for location in ['profiles/personal-agents/skills','profiles/claude/skills']:
    w(Path(location)/'fixture-workflow/SKILL.md',skill.replace('SKILL=plum','SKILL=personal'))
w(Path('profiles/claude/settings-both.json'),json.dumps({'pluginConfigs':{'agents-md@builtin':{'options':{'instructionFiles':'claude-md-and-agents-md'}}}},indent=2))
print('Prepared six disposable Git repositories and isolated profile material:',G)
