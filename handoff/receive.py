#!/usr/bin/env python3
"""Verify and import a repository handoff locally; never log in or start an AI."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import zipfile

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent

def sha(data):
    return hashlib.sha256(data).hexdigest()

def file_sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def safe_name(name):
    p = PurePosixPath(name)
    if not name or p.is_absolute() or '..' in p.parts or '\\' in name or ':' in name:
        raise SystemExit('Unsafe handoff path: ' + name)
    return p

def normalize_text(data, expected):
    if sha(data) == expected:
        return data
    if b'\0' not in data and b'\r\n' in data:
        try:
            data.decode('utf-8')
            normalized = data.replace(b'\r\n', b'\n')
            if sha(normalized) == expected:
                return normalized
        except UnicodeDecodeError:
            pass
    raise SystemExit('Content differs from the handoff snapshot')

def load_index():
    index = json.loads((HERE / 'index.json').read_text(encoding='utf-8-sig'))
    if index.get('schema') != 3:
        raise SystemExit('Unsupported handoff schema')
    claimed = index['bundle_id']
    body = dict(index)
    del body['bundle_id']
    actual = sha(json.dumps(body, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8'))
    if claimed != actual:
        raise SystemExit('index.json has changed')
    return index

def verify(index):
    objects = index['objects']
    seen = set()
    for archive in index['archives']:
        safe_name(archive['name'])
        path = HERE / archive['name']
        if not path.is_file() or path.stat().st_size != archive['size'] or file_sha(path) != archive['sha256']:
            raise SystemExit('Missing/incomplete archive or LFS pointer: ' + str(path))
        expected = {spec['member']: oid for oid, spec in objects.items() if spec.get('archive') == archive['name']}
        with zipfile.ZipFile(path) as z:
            if len(z.namelist()) != len(set(z.namelist())) or set(z.namelist()) != set(expected):
                raise SystemExit('Unexpected archive entries: ' + archive['name'])
            for member, oid in expected.items():
                safe_name(member)
                h = hashlib.sha256()
                size = 0
                with z.open(member) as f:
                    for block in iter(lambda: f.read(1024 * 1024), b''):
                        h.update(block); size += len(block)
                if h.hexdigest() != oid or size != objects[oid]['size']:
                    raise SystemExit('Corrupt archived object: ' + oid)
                seen.add(oid)
        print('Verified ' + archive['name'], flush=True)
    for row in index['tracked_files']:
        safe_name(row['path'])
        path = PROJECT / row['path']
        if not path.is_file():
            raise SystemExit('Missing project file: ' + row['path'])
        if file_sha(path) != row['sha256']:
            try:
                normalize_text(path.read_bytes(), row['sha256'])
            except SystemExit:
                raise SystemExit('Project file changed: ' + row['path'])
    for oid, spec in objects.items():
        if 'repo' in spec:
            safe_name(spec['repo'])
            normalize_text((PROJECT / spec['repo']).read_bytes(), oid)
            seen.add(oid)
    if seen != set(objects):
        raise SystemExit('Unresolved payload objects')
    for row in index['files']:
        safe_name(row['path'])
        if row['sha256'] not in objects:
            raise SystemExit('Unresolved file: ' + row['path'])
    print('Verified %d records, %d sessions and %d project files.' % (
        len(index['files']), len(index['sessions']), len(index['tracked_files'])), flush=True)

def encoded(path):
    return re.sub(r'[^A-Za-z0-9-]', '-', str(path))

def blob(index, row):
    spec = index['objects'][row['sha256']]
    if 'repo' in spec:
        return normalize_text((PROJECT / spec['repo']).read_bytes(), row['sha256'])
    with zipfile.ZipFile(HERE / spec['archive']) as z:
        return z.read(spec['member'])

def target_for(row, index, claude_home, cache):
    logical = PurePosixPath(row['path'])
    if row['kind'] == 'state':
        root, tail = PROJECT, logical.parts[1:]
    elif row['kind'] in ('session', 'session_sidecar'):
        root, tail = claude_home, ('projects', encoded(PROJECT), *logical.parts[3:])
    elif row['kind'] == 'file_history':
        root, tail = claude_home, logical.parts[1:]
    elif row['kind'] == 'memory':
        root = claude_home
        tail = ('projects', encoded(PROJECT), 'memory', 'handoff-' + index['slug'] + '-' + logical.name)
    else:
        root, tail = cache, ('files', *logical.parts)
    destination = root.joinpath(*tail)
    resolved = destination.resolve()
    if resolved != root and root not in resolved.parents:
        raise SystemExit('Destination escapes its allowed root: ' + str(destination))
    return destination

def imported_bytes(index, row):
    data = blob(index, row)
    if row['kind'] in ('session', 'session_sidecar') and row['path'].endswith('.jsonl'):
        lines = []
        for line in io.BytesIO(data):
            if not line.strip():
                continue
            obj = json.loads(line)
            if isinstance(obj.get('cwd'), str):
                obj['cwd'] = str(PROJECT)
            lines.append(json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode('utf-8') + b'\n')
        return b''.join(lines)
    return data

def install(index, claude_home):
    claude_home = claude_home.expanduser().resolve()
    if claude_home == PROJECT or PROJECT in claude_home.parents or claude_home in PROJECT.parents:
        raise SystemExit('Claude home must be separate from the project')
    cache = claude_home / 'handoffs' / index['slug'] / index['bundle_id'][:16]
    plans = []
    destinations = set()
    # Plan every target and conflict before any import writes.
    for row in index['files']:
        destination = target_for(row, index, claude_home, cache)
        if destination in destinations:
            raise SystemExit('Duplicate import destination: ' + str(destination))
        destinations.add(destination)
        if destination.exists():
            expected = sha(imported_bytes(index, row))
            if not destination.is_file() or file_sha(destination) != expected:
                raise SystemExit('Existing content preserved; import stopped: ' + str(destination))
        plans.append((row, destination))
    written = 0
    for row, destination in plans:
        if destination.exists():
            continue
        data = imported_bytes(index, row)
        destination.parent.mkdir(parents=True, exist_ok=True)
        with destination.open('xb') as stream:
            stream.write(data)
        if row.get('executable') and os.name != 'nt':
            destination.chmod(destination.stat().st_mode | 0o100)
        written += 1
    memory = claude_home / 'projects' / encoded(PROJECT) / 'memory'
    memory.mkdir(parents=True, exist_ok=True)
    memory_index = memory / 'MEMORY.md'
    if not memory_index.exists():
        with memory_index.open('x', encoding='utf-8', newline='\n') as stream:
            stream.write('# ' + index['title'] + '\n\n先读项目 `handoff/README.md`。\n'
                         '当前交接：[handoff-' + index['slug'] + '-current.md](handoff-' + index['slug'] + '-current.md)。\n'
                         '其他 handoff 文件是历史记忆，按最新用户要求和实际项目解释。\n')
    cache.mkdir(parents=True, exist_ok=True)
    report = {'project': str(PROJECT), 'claude_home': str(claude_home),
              'bundle_id': index['bundle_id'], 'sessions': len(index['sessions']),
              'files_written': written, 'files_reused': len(plans) - written,
              'reference_directory': str(cache / 'files'),
              'main_sessions': index['main_sessions'],
              'credentials_imported': False, 'settings_or_model_changed': False,
              'ai_started': False, 'cwd_policy': 'All imported transcript cwd metadata points to this project root; historical text is preserved.'}
    (cache / 'import-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['verify', 'install'])
    parser.add_argument('--claude-home', type=Path,
                        default=Path(os.environ.get('CLAUDE_CONFIG_DIR', str(Path.home() / '.claude'))))
    args = parser.parse_args()
    index = load_index()
    verify(index)
    if args.command == 'install':
        install(index, args.claude_home)

if __name__ == '__main__':
    main()
