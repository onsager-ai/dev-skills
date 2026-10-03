import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { run } from './sync.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-sync-'));
  t.after(() => fs.rmSync(root, {recursive:true,force:true}));
  const source = path.join(root, 'source'), repo = path.join(root, 'repo');
  fs.mkdirSync(source); fs.mkdirSync(repo);
  const write = (base, file, text) => { fs.mkdirSync(path.dirname(path.join(base,file)), {recursive:true}); fs.writeFileSync(path.join(base,file),text); };
  const git = (...args) => execFileSync('git',['-C',source,...args]).toString().trim();
  git('init','-q'); git('config','user.name','Fixture'); git('config','user.email','fixture@example.test');
  const skill = (name, body='') => `---\nname: ${name}\ndescription: Fixture workflow.\n---\n\n${body}\n`;
  write(source,'skills/parent/SKILL.md',skill('parent','Use [child](../child/SKILL.md) and [details](references/detail.md).'));
  write(source,'skills/parent/references/detail.md','Stable detail.');
  write(source,'skills/child/SKILL.md',skill('child'));
  write(source,'skills/child/data.bin',Buffer.from([0,255,42]));
  write(source,'skills/child/check.sh','#!/bin/sh\nexit 0\n');
  fs.chmodSync(path.join(source,'skills/child/check.sh'),0o755);
  write(source,'agent-config/rules/checks.md','Report actual check outcomes.');
  write(source,'agent-config/sync.mjs',fs.readFileSync(new URL('./sync.mjs',import.meta.url)));
  write(source,'agent-config/workflow.yml',fs.readFileSync(new URL('./workflow.yml',import.meta.url)));
  write(source,'LICENSE','Fixture license.');
  git('add','.'); git('commit','-qm','Fixture source');
  write(repo,'AGENTS.md','# Local contract\n\nKeep local invariants.\n');
  write(repo,'CLAUDE.md','@AGENTS.md\n\nLocal Claude mechanics.\n');
  write(repo,'.agents/skills/local/SKILL.md',skill('local'));
  const manifest = {schema:1,source:{repository:'onsager-ai/dev-skills',revision:git('rev-parse','HEAD')},skills:['parent'],rules:['checks'],local_skills:['local']};
  const save = () => write(repo,'.agents/manifest.json',JSON.stringify(manifest,null,2)+'\n'); save();
  const sync = () => run(['--repo',repo,'--source',source]);
  const check = (upstream=false) => run(['--repo',repo,'--check',...(upstream?['--source',source]:[])]);
  return {source,repo,manifest,save,sync,check,write,git};
}

test('fresh checkout includes dependency closure/assets and works offline; generation is idempotent', t => {
  const f=fixture(t); f.sync(); f.check(); f.check(true);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.repo,'.agents/lock.json'))).resolved_skills,['child','parent']);
  assert.deepEqual(fs.readFileSync(path.join(f.repo,'.claude/skills/child/data.bin')),Buffer.from([0,255,42]));
  for(const base of ['.agents','.claude']) assert.ok(fs.statSync(path.join(f.repo,`${base}/skills/child/check.sh`)).mode & 0o111);
  const lock=fs.readFileSync(path.join(f.repo,'.agents/lock.json')); const agents=fs.readFileSync(path.join(f.repo,'AGENTS.md'));
  f.sync(); assert.deepEqual(fs.readFileSync(path.join(f.repo,'.agents/lock.json')),lock); assert.deepEqual(fs.readFileSync(path.join(f.repo,'AGENTS.md')),agents);
  fs.renameSync(f.source,f.source+'-unavailable'); f.check();
});

test('rejects shared/projection/rule/manifest drift and unowned assets',t => {
  const f=fixture(t); f.sync();
  for (const file of ['.agents/skills/parent/SKILL.md','.claude/skills/local/SKILL.md','AGENTS.md','.agents/manifest.json']) {
    const p=path.join(f.repo,file),before=fs.readFileSync(p);
    if(file==='AGENTS.md') fs.writeFileSync(p,before.toString().replace('Report actual check outcomes.','Suppress check failures.'));
    else fs.appendFileSync(p,'\nDrift');
    assert.throws(()=>f.check()); fs.writeFileSync(p,before);
  }
  f.write(f.repo,'.agents/skills/parent/extra.md','Unexpected'); assert.throws(()=>f.check(),/Projection|Unmanaged/);
});

test('detects executable mode drift in vendored scripts',t => {
  const f=fixture(t);f.sync();fs.chmodSync(path.join(f.repo,'.agents/skills/child/check.sh'),0o644);
  assert.throws(()=>f.check(),/executable mode drift/);
});

test('allows local authoring then regenerates only projections, preserving repo contract',t => {
  const f=fixture(t); f.sync();
  fs.appendFileSync(path.join(f.repo,'.agents/skills/local/SKILL.md'),'Local procedure update.\n');
  assert.throws(()=>f.check(),/Projection drift/); f.sync(); f.check(true);
  assert.match(fs.readFileSync(path.join(f.repo,'AGENTS.md'),'utf8'),/Keep local invariants/);
});

test('upstream verification rejects rehashed edits; sync refuses silently overwriting edits',t => {
  const f=fixture(t); f.sync();
  fs.appendFileSync(path.join(f.repo,'.agents/skills/parent/SKILL.md'),'Edited');
  assert.throws(()=>f.sync(),/Restore edited generated/);
  // The exact upstream comparison must remain independent of an edited lock.
  const lockPath=path.join(f.repo,'.agents/lock.json'),lock=JSON.parse(fs.readFileSync(lockPath));
  const altered=fs.readFileSync(path.join(f.repo,'.agents/skills/parent/SKILL.md'));
  for(const base of ['.agents','.claude']) {
    const file=`${base}/skills/parent/SKILL.md`;f.write(f.repo,file,altered);
    lock.files[file].sha256=crypto.createHash('sha256').update(altered).digest('hex');
  }
  fs.writeFileSync(lockPath,JSON.stringify(lock));
  f.check(); assert.throws(()=>f.check(true),/Upstream provenance drift/);
});

test('removing a selection removes stale managed dependencies and leaves local skills',t => {
  const f=fixture(t); f.sync(); f.manifest.skills=[];f.save();f.sync();f.check(true);
  assert.deepEqual(fs.readdirSync(path.join(f.repo,'.agents/skills')),['local']);
});

test('rejects floating revisions, name collisions, upstream symlinks and escaping references',t => {
  const f=fixture(t);
  const revision=f.manifest.source.revision;f.manifest.source.revision='main';f.save();assert.throws(()=>f.sync(),/immutable/);
  f.manifest.source.revision=revision;f.manifest.local_skills.push('child');f.save();assert.throws(()=>f.sync(),/collision/);
  f.manifest.local_skills=['local'];f.save();
  fs.symlinkSync('../child/SKILL.md',path.join(f.source,'skills/parent/symlink.md'));
  f.git('add','.');f.git('commit','-qm','Symlink');f.manifest.source.revision=f.git('rev-parse','HEAD');f.save();assert.throws(()=>f.sync(),/nonregular/);
  fs.unlinkSync(path.join(f.source,'skills/parent/symlink.md'));
  f.write(f.source,'skills/parent/SKILL.md','---\nname: parent\ndescription: Fixture.\n---\n\n[Escape](../../outside.md)\n');
  f.git('add','-A');f.git('commit','-qm','Escape');f.manifest.source.revision=f.git('rev-parse','HEAD');f.save();assert.throws(()=>f.sync(),/escapes/);
});
