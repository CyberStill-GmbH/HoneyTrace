package main

import "testing"

func TestRecordHashesBodyAndChecksExpectedStatus(t *testing.T) {
	got := record("sqli", "sql-injection-pattern", 200, 200, "trace-1", "decoy")
	if !got.Passed {
		t.Fatal("expected matching status to pass")
	}
	if got.BodyBytes != 5 || len(got.BodySHA256) != 64 {
		t.Fatalf("unexpected body evidence: %+v", got)
	}
}

func TestRecordMarksUnexpectedStatus(t *testing.T) {
	got := record("path-traversal", "attempt-host-escape", 200, 403, "trace-2", "blocked")
	if got.Passed {
		t.Fatal("expected unexpected status to fail")
	}
}
