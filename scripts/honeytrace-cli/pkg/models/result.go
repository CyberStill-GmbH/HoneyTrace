package models

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

// AvailableScenarios defines the list of attack vectors supported by HoneyTrace CLI.
var AvailableScenarios = []string{
	"all",
	"bruteforce",
	"idor",
	"sqli",
	"path-traversal",
	"stored-xss",
}

// Result represents the outcome of a scenario step.
type Result struct {
	Scenario   string `json:"scenario"`
	Step       string `json:"step"`
	Status     int    `json:"status"`
	Expected   string `json:"expected"`
	Passed     bool   `json:"passed"`
	TraceID    string `json:"trace_id,omitempty"`
	BodyBytes  int    `json:"body_bytes"`
	BodySHA256 string `json:"body_sha256"`
}

// Record generates a Result struct from step execution metadata.
func Record(scenario, step string, status, expected int, trace, body string) Result {
	hash := sha256.Sum256([]byte(body))
	return Result{
		Scenario:   scenario,
		Step:       step,
		Status:     status,
		Expected:   fmt.Sprint(expected),
		Passed:     status == expected,
		TraceID:    trace,
		BodyBytes:  len(body),
		BodySHA256: hex.EncodeToString(hash[:]),
	}
}
