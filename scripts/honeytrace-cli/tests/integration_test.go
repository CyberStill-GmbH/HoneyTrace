package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"honeytrace-cli/pkg/client"
	"honeytrace-cli/pkg/runner"
)

// setupMockHoneypot initializes a full HTTP test server mimicking the HoneyTrace Python Honeypot backend.
func setupMockHoneypot() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Trace-ID", r.Header.Get("X-Trace-ID"))

		switch {
		case r.URL.Path == "/health":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok","version":"1.0"}`))

		case r.URL.Path == "/auth":
			var payload map[string]string
			json.NewDecoder(r.Body).Decode(&payload)
			if payload["username"] == "analyst" && payload["password"] == "honey123" {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"token":"valid-jwt-token"}`))
			} else {
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"detail":"Invalid credentials"}`))
			}

		case r.URL.Path == "/users/2":
			userID := r.Header.Get("X-User-ID")
			if userID == "1" {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"id":2,"username":"victim","email":"victim@example.com"}`))
			} else {
				w.WriteHeader(http.StatusForbidden)
				w.Write([]byte(`{"detail":"Forbidden"}`))
			}

		case r.URL.Path == "/products":
			query := r.URL.Query().Get("q")
			if strings.Contains(query, "OR 1=1") {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`[{"id":1,"name":"Honey Pot 3000"},{"id":2,"name":"Bear Trapper"}]`))
			} else {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`[]`))
			}

		case r.URL.Path == "/files":
			p := r.URL.Query().Get("path")
			if strings.Contains(p, "secrets/system.txt") {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`HONEYTRACE_DECOY_ONLY=true`))
			} else if strings.Contains(p, "../../../../etc/passwd") {
				w.WriteHeader(http.StatusForbidden)
				w.Write([]byte(`Access Denied: Path Traversal Detected`))
			} else {
				w.WriteHeader(http.StatusNotFound)
			}

		case r.URL.Path == "/orders/1/notes":
			w.WriteHeader(http.StatusCreated)
			w.Write([]byte(`{"id":42,"status":"created"}`))

		case r.URL.Path == "/orders/1/notes/render":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`<html><body><script>document.body.dataset.realattack='go'</script></body></html>`))

		default:
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"detail":"Not Found"}`))
		}
	}))
}

func TestFullIntegrationSuite(t *testing.T) {
	mockHoneypot := setupMockHoneypot()
	defer mockHoneypot.Close()

	c := client.NewClient(5 * time.Second)
	r := runner.NewRunner(c, mockHoneypot.URL)

	// 1. Test Healthcheck
	if err := r.HealthCheck(); err != nil {
		t.Fatalf("Integration HealthCheck failed: %v", err)
	}

	// 2. Test All Scenarios Execution
	results, err := r.RunScenario("all")
	if err != nil {
		t.Fatalf("Integration RunScenario('all') failed: %v", err)
	}

	expectedStepCount := 10 // 4 bruteforce + 1 IDOR + 1 SQLi + 2 traversal + 2 XSS.
	if len(results) != expectedStepCount {
		t.Errorf("Expected exactly %d results, got %d", expectedStepCount, len(results))
	}

	tracesByScenario := make(map[string]string)
	for _, res := range results {
		if !res.Passed {
			t.Errorf("Step %s/%s failed: status=%d, expected=%s", res.Scenario, res.Step, res.Status, res.Expected)
		}
		if res.BodySHA256 == "" {
			t.Errorf("Step %s/%s missing body SHA256 hash", res.Scenario, res.Step)
		}
		traceID, exists := tracesByScenario[res.Scenario]
		if !exists {
			if len(res.TraceID) != 32 {
				t.Errorf("Step %s/%s invalid trace ID: %s", res.Scenario, res.Step, res.TraceID)
			}
			tracesByScenario[res.Scenario] = res.TraceID
		} else if res.TraceID != traceID {
			t.Errorf("Step %s/%s changed trace ID: %s", res.Scenario, res.Step, res.TraceID)
		}
	}
	if len(tracesByScenario) != 5 {
		t.Errorf("Expected five scenario traces, got %d", len(tracesByScenario))
	}
}
