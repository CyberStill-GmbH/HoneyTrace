from __future__ import annotations

import argparse
import json
import sys

from collector.event_collector import collect_stream


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate HoneyTrace NDJSON from stdin")
    parser.add_argument("--max-events", type=int, default=1000)
    args = parser.parse_args()
    accepted, rejected = collect_stream(sys.stdin, max_events=args.max_events)
    for event in accepted:
        print(json.dumps(event, separators=(",", ":"), ensure_ascii=False))
    print(json.dumps({"accepted": len(accepted), "rejected": len(rejected)}, separators=(",", ":")), file=sys.stderr)
    return 0 if not rejected else 1


if __name__ == "__main__":
    raise SystemExit(main())
