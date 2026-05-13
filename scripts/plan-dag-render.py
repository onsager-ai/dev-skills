#!/usr/bin/env python3
"""plan-dag-render — JSON DAG IR → ASCII / box-art / mermaid / DOT."""

import argparse
import json
import math
import shlex
import subprocess
import sys
from pathlib import Path

STATUS_MARKER = {"done": " ✓", "in_progress": " …", "open": ""}
VALID_STATUS = set(STATUS_MARKER.keys())
VALID_SOURCES = {"sub-issue", "depends-on", "pr-link", "closes", "part-of"}
FORBIDDEN_LABEL_CHARS = ('"', "\\", "[", "]", "\n", "\r")


def _dot_escape(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')


def validate(ir):
    errors = []
    if not isinstance(ir, dict):
        return [f"ir must be a JSON object, got {type(ir).__name__}"]
    nodes = ir.get("nodes", [])
    if not isinstance(nodes, list) or not nodes:
        return ["ir.nodes is missing or empty"]
    ids = set()
    for i, n in enumerate(nodes):
        if not isinstance(n, dict):
            errors.append(f"nodes[{i}] must be an object, got {type(n).__name__}")
            continue
        if "id" not in n:
            errors.append(f"nodes[{i}] missing id")
            continue
        nid = str(n["id"])
        if nid == "close":
            errors.append(
                f"nodes[{i}].id={nid!r} is reserved for the synthetic CLOSE sentinel; "
                f"use a different id and set ir.close instead"
            )
            continue
        if nid in ids:
            errors.append(f"duplicate node id: {nid}")
        ids.add(nid)
        status = n.get("status", "open")
        if status not in VALID_STATUS:
            errors.append(f"node #{nid}: invalid status {status!r}")
        label = n.get("label")
        if not label:
            errors.append(f"node #{nid}: missing label")
        elif not isinstance(label, str):
            errors.append(f"node #{nid}: label must be a string, got {type(label).__name__}")
        else:
            for ch in FORBIDDEN_LABEL_CHARS:
                if ch in label:
                    errors.append(
                        f"node #{nid}: label contains forbidden character {ch!r} "
                        f"(any of {FORBIDDEN_LABEL_CHARS} break mermaid emission)"
                    )
                    break
    ids.add("close")
    edges = ir.get("edges", [])
    if not isinstance(edges, list):
        errors.append(f"ir.edges must be a list, got {type(edges).__name__}")
        return errors
    references_close = False
    for i, e in enumerate(edges):
        if not isinstance(e, dict):
            errors.append(f"edges[{i}] must be an object, got {type(e).__name__}")
            continue
        for end in ("from", "to"):
            if end not in e:
                errors.append(f"edges[{i}] missing {end}")
            else:
                val = str(e[end])
                if val == "close":
                    references_close = True
                if val not in ids:
                    errors.append(f"edges[{i}].{end}={e[end]!r} not in declared nodes")
        if not e.get("source"):
            errors.append(f"edges[{i}] missing source (citation required)")
        elif e["source"] not in VALID_SOURCES:
            errors.append(
                f"edges[{i}].source={e['source']!r} not in {sorted(VALID_SOURCES)}"
            )
    close = ir.get("close")
    if references_close and close is None:
        errors.append(
            "edges reference the CLOSE sentinel but ir.close is missing "
            "(set ir.close to the closing issue id, e.g. 'ir.close': '300')"
        )
    if close is not None and not isinstance(close, (str, int)):
        errors.append(
            f"ir.close must be a string or int, got {type(close).__name__}"
        )
    cp = ir.get("critical_path")
    if cp is not None:
        if not isinstance(cp, list):
            errors.append(
                f"ir.critical_path must be a list, got {type(cp).__name__}"
            )
        else:
            for i, node_id in enumerate(cp):
                if not isinstance(node_id, (str, int)):
                    errors.append(
                        f"critical_path[{i}]: must be a string or int, "
                        f"got {type(node_id).__name__}"
                    )
                elif str(node_id) not in ids:
                    errors.append(
                        f"critical_path[{i}]={node_id!r} not in declared nodes"
                    )
    return errors


def render_dot(ir, extra_graph_attrs=()):
    lines = ["digraph plan {", "  rankdir=TB;"]
    for attr in extra_graph_attrs:
        lines.append(f"  {attr};")
    lines += ["  node [shape=box];", ""]
    for n in ir["nodes"]:
        nid = str(n["id"])
        marker = STATUS_MARKER[n.get("status", "open")]
        label = _dot_escape(f'#{nid} {n["label"]}{marker}')
        lines.append(f'  "{_dot_escape(nid)}" [label="{label}"];')
    if ir.get("close"):
        close_label = _dot_escape(f'close #{ir["close"]}')
        lines.append(f'  "close" [label="{close_label}"];')
    lines.append("")
    for e in ir.get("edges", []):
        lines.append(f'  "{_dot_escape(str(e["from"]))}" -> "{_dot_escape(str(e["to"]))}";')
    lines.append("}")
    return "\n".join(lines)


def render_mermaid(ir):
    lines = ["graph TD"]
    for n in ir["nodes"]:
        nid = str(n["id"])
        status = n.get("status", "open")
        marker = STATUS_MARKER[status]
        cls = {"done": ":::done", "in_progress": ":::wip", "open": ""}[status]
        lines.append(f'  N{nid}[#{nid} {n["label"]}{marker}]{cls}')
    if ir.get("close"):
        lines.append(f'  CLOSE[close #{ir["close"]}]')
    for e in ir.get("edges", []):
        a = "CLOSE" if e["from"] == "close" else f'N{e["from"]}'
        b = "CLOSE" if e["to"] == "close" else f'N{e["to"]}'
        lines.append(f"  {a} --> {b}")
    lines.append("  classDef done fill:#cfc,stroke:#3a3")
    lines.append("  classDef wip fill:#ffd,stroke:#aa3")
    return "\n".join(lines)


def render_dot_ortho(ir):
    """Like render_dot but with rectilinear edge routing for grid rendering."""
    return render_dot(ir, extra_graph_attrs=("splines=ortho",))


_TB_XS = 14.0
_TB_YS = 5.0
_TB_N, _TB_S, _TB_E, _TB_W = 1, 2, 4, 8
_TB_GLYPHS = {
    _TB_N | _TB_S: "│", _TB_E | _TB_W: "─",
    _TB_N | _TB_E: "└", _TB_N | _TB_W: "┘",
    _TB_S | _TB_E: "┌", _TB_S | _TB_W: "┐",
    _TB_N | _TB_S | _TB_E: "├", _TB_N | _TB_S | _TB_W: "┤",
    _TB_N | _TB_E | _TB_W: "┴", _TB_S | _TB_E | _TB_W: "┬",
    _TB_N | _TB_S | _TB_E | _TB_W: "┼",
    _TB_N: "│", _TB_S: "│", _TB_E: "─", _TB_W: "─",
}


def _parse_plain(text):
    g = {"w": 0.0, "h": 0.0, "nodes": [], "edges": []}
    for line in text.splitlines():
        toks = shlex.split(line)
        if not toks:
            continue
        if toks[0] == "graph":
            g["w"], g["h"] = float(toks[2]), float(toks[3])
        elif toks[0] == "node":
            g["nodes"].append({
                "id": toks[1],
                "cx": float(toks[2]), "cy": float(toks[3]),
                "w": float(toks[4]), "h": float(toks[5]),
                "label": toks[6],
            })
        elif toks[0] == "edge":
            n = int(toks[3])
            pts = [(float(toks[4 + 2 * i]), float(toks[5 + 2 * i])) for i in range(n)]
            g["edges"].append({"from": toks[1], "to": toks[2], "pts": pts})
    return g


def _dedupe(seq):
    out = []
    for p in seq:
        if not out or out[-1] != p:
            out.append(p)
    return out


def render_tb_boxart(ir):
    """Render the IR as a top-to-bottom box-drawing DAG via real graphviz layout."""
    dot = render_dot_ortho(ir)
    try:
        res = subprocess.run(
            ["dot", "-Tplain"], input=dot,
            capture_output=True, text=True, timeout=10,
        )
    except FileNotFoundError:
        sys.exit("`dot` not on PATH. Install graphviz (e.g. apt install graphviz).")
    except subprocess.TimeoutExpired:
        sys.exit("`dot -Tplain` timed out after 10s. Try a smaller IR, or --as=mermaid.")
    if res.returncode != 0:
        sys.stderr.write(res.stderr)
        sys.exit(res.returncode)
    g = _parse_plain(res.stdout)

    Wt = int(math.ceil(g["w"] * _TB_XS)) + 4
    Ht = int(math.ceil(g["h"] * _TB_YS)) + 2

    def px(x): return int(round(x * _TB_XS)) + 2
    def py(y): return int(round((g["h"] - y) * _TB_YS)) + 1

    canvas = [[None] * Wt for _ in range(Ht)]
    edge_dirs = [[0] * Wt for _ in range(Ht)]
    arrows = {}

    boxes = {}
    for n in g["nodes"]:
        cx, cy = px(n["cx"]), py(n["cy"])
        bw = max(len(n["label"]) + 4, int(round(n["w"] * _TB_XS)))
        if (bw - len(n["label"])) % 2:
            bw += 1
        left = cx - bw // 2
        right = left + bw - 1
        top, bot = cy - 1, cy + 1
        boxes[n["id"]] = (top, left, bot, right)
        canvas[top][left] = "┌"
        canvas[top][right] = "┐"
        canvas[bot][left] = "└"
        canvas[bot][right] = "┘"
        for c in range(left + 1, right):
            canvas[top][c] = "─"
            canvas[bot][c] = "─"
        canvas[cy][left] = "│"
        canvas[cy][right] = "│"
        label = n["label"]
        lpad = (bw - 2 - len(label)) // 2
        for i, ch in enumerate(label):
            canvas[cy][left + 1 + lpad + i] = ch

    def is_box_cell(r, c):
        return 0 <= r < Ht and 0 <= c < Wt and canvas[r][c] is not None

    def add(r, c, bit):
        if 0 <= r < Ht and 0 <= c < Wt and canvas[r][c] is None:
            edge_dirs[r][c] |= bit

    for e in g["edges"]:
        pts = _dedupe(e["pts"])
        if len(pts) < 2:
            continue
        grid_pts = _dedupe([(py(y), px(x)) for x, y in pts])
        if len(grid_pts) < 2:
            continue
        for i in range(len(grid_pts) - 1):
            r1, c1 = grid_pts[i]
            r2, c2 = grid_pts[i + 1]
            if r1 == r2:
                lo, hi = sorted([c1, c2])
                for c in range(lo, hi + 1):
                    if c > lo:
                        add(r1, c, _TB_W)
                    if c < hi:
                        add(r1, c, _TB_E)
            elif c1 == c2:
                lo, hi = sorted([r1, r2])
                for r in range(lo, hi + 1):
                    if r > lo:
                        add(r, c1, _TB_N)
                    if r < hi:
                        add(r, c1, _TB_S)

        head_top, head_left, head_bot, head_right = boxes[e["to"]]
        last_r, last_c = grid_pts[-1]
        arrow = arrow_r = arrow_c = mask_bit = None
        if last_r < head_top:
            arrow, arrow_r = "▼", head_top - 1
            arrow_c = max(head_left + 1, min(head_right - 1, last_c))
            for r in range(last_r, arrow_r):
                add(r, last_c, _TB_S); add(r + 1, last_c, _TB_N)
            mask_bit = _TB_S
        elif last_r > head_bot:
            arrow, arrow_r = "▲", head_bot + 1
            arrow_c = max(head_left + 1, min(head_right - 1, last_c))
            for r in range(arrow_r, last_r):
                add(r, last_c, _TB_S); add(r + 1, last_c, _TB_N)
            mask_bit = _TB_N
        elif last_c < head_left:
            arrow, arrow_c = "►", head_left - 1
            arrow_r = max(head_top + 1, min(head_bot - 1, last_r))
            for c in range(last_c, arrow_c):
                add(last_r, c, _TB_E); add(last_r, c + 1, _TB_W)
            mask_bit = _TB_E
        elif last_c > head_right:
            arrow, arrow_c = "◄", head_right + 1
            arrow_r = max(head_top + 1, min(head_bot - 1, last_r))
            for c in range(arrow_c, last_c):
                add(last_r, c, _TB_E); add(last_r, c + 1, _TB_W)
            mask_bit = _TB_W
        if arrow and 0 <= arrow_r < Ht and 0 <= arrow_c < Wt and not is_box_cell(arrow_r, arrow_c):
            arrows[(arrow_r, arrow_c)] = arrow
            edge_dirs[arrow_r][arrow_c] |= mask_bit

    for r in range(Ht):
        for c in range(Wt):
            if canvas[r][c] is not None:
                continue
            if (r, c) in arrows:
                canvas[r][c] = arrows[(r, c)]
            elif edge_dirs[r][c]:
                canvas[r][c] = _TB_GLYPHS.get(edge_dirs[r][c], "·")

    return "\n".join(
        "".join(ch if ch is not None else " " for ch in row).rstrip()
        for row in canvas
    )


def render_via_graph_easy(dot, mode):
    try:
        res = subprocess.run(
            ["graph-easy", "--from=graphviz", f"--as={mode}"],
            input=dot, capture_output=True, text=True, timeout=10,
        )
    except FileNotFoundError:
        sys.exit("graph-easy not on PATH. Install: cpan -T -i Graph::Easy")
    except subprocess.TimeoutExpired:
        sys.exit("`graph-easy` timed out after 10s. Try a smaller IR.")
    if res.returncode != 0:
        sys.stderr.write(res.stderr)
        sys.exit(res.returncode)
    return res.stdout


def main():
    ap = argparse.ArgumentParser(description="Render plan DAG IR.")
    ap.add_argument("ir", help="path to JSON IR, or '-' for stdin")
    ap.add_argument(
        "--as", dest="target", default="tb",
        choices=["tb", "boxart", "ascii", "mermaid", "dot"],
        help="output target (default: tb — top-to-bottom box-drawing via graphviz)",
    )
    args = ap.parse_args()

    text = sys.stdin.read() if args.ir == "-" else Path(args.ir).read_text()
    try:
        ir = json.loads(text)
    except json.JSONDecodeError as e:
        sys.exit(f"invalid JSON: {e}")

    errors = validate(ir)
    if errors:
        sys.stderr.write("IR validation failed:\n")
        for err in errors:
            sys.stderr.write(f"  - {err}\n")
        sys.exit(1)

    if args.target == "mermaid":
        print(render_mermaid(ir))
    elif args.target == "dot":
        print(render_dot(ir))
    elif args.target == "tb":
        print(render_tb_boxart(ir))
    else:
        sys.stdout.write(render_via_graph_easy(render_dot(ir), args.target))

    cp = ir.get("critical_path")
    if cp and args.target in ("tb", "boxart", "ascii"):
        path = " → ".join("close" if n == "close" else f"#{n}" for n in cp)
        print(f"\nCritical path: {path}")


if __name__ == "__main__":
    main()
