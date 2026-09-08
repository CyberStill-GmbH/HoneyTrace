package runner

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"honeytrace-cli/pkg/client"
)

func newTestServer() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Trace-ID", r.Header.Get("X-Trace-ID"))

		switch {
		case r.URL.Path == "/health":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"healthy"}`))

		case r.URL.Path == "/auth":
			var req map[string]string
			json.NewDecoder(r.Body).Decode(&req)
			if req["password"] == "honey123" {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"token":"jwt-mock-token"}`))
			} else {
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"invalid credentials"}`))
			}

		case r.URL.Path == "/users/2":
			if r.Header.Get("X-User-ID") == "1" {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"id":2,"name":"victim_user"}`))
			} else {
				w.WriteHeader(http.StatusForbidden)
			}

		case r.URL.Path == "/products":
			q := r.URL.Query().Get("q")
			if strings.Contains(q, "OR 1=1") {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`[{"id":1},{"id":2}]`))
			} else {
				w.WriteHeader(http.StatusBadRequest)
			}

		case r.URL.Path == "/files":
			p := r.URL.Query().Get("path")
			if strings.Contains(p, "system.txt") {
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`HONEYTRACE_DECOY_ONLY=true`))
			} else if strings.Contains(p, "etc/passwd") {
				w.WriteHeader(http.StatusForbidden)
				w.Write([]byte(`Blocked escape`))
			} else {
				w.WriteHeader(http.StatusNotFound)
			}

		case r.URL.Path == "/orders/1/notes":
			w.WriteHeader(http.StatusCreated)
			w.Write([]byte(`{"id":10}`))

		case r.URL.Path == "/orders/1/notes/render":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`<div><script>document.body.dataset.realattack='go'</script></div>`))

		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
}

func TestHealthCheck(t *testing.T) {
	ts := newTestServer()
	defer ts.Close()

	c := client.NewClient(2 * time.Second)
	r := NewRunner(c, ts.URL)

	if err := r.HealthCheck(); err != nil {
		t.Fatalf("HealthCheck failed: %v", err)
	}
}

func TestRunScenarios(t *testing.T) {
	ts := newTestServer()
	defer ts.Close()

	c := client.NewClient(2 * time.Second)
	r := NewRunner(c, ts.URL)

	scenarios := []string{"bruteforce", "idor", "sqli", "path-traversal", "stored-xss"}
	for _, sc := range scenarios {
		t.Run(sc, func(t *testing.T) {
			results, err := r.RunScenario(sc)
			if err != nil {
				t.Fatalf("RunScenario(%s) failed: %v", sc, err)
			}
			if len(results) == 0 {
				t.Errorf("RunScenario(%s) returned empty results", sc)
			}
			for _, res := range results {
				if !res.Passed {
					t.Errorf("Step %s failed unexpectedly: got HTTP %d, expected %s", res.Step, res.Status, res.Expected)
				}
			}
		})
	}
}

func TestRunScenarioAll(t *testing.T) {
	ts := newTestServer()
	defer ts.Close()

	c := client.NewClient(2 * time.Second)
	r := NewRunner(c, ts.URL)

	results, err := r.RunScenario("all")
	if err != nil {
		t.Fatalf("RunScenario(all) failed: %v", err)
	}
	if len(results) != 10 {
		t.Errorf("expected exactly 10 step results for 'all', got %d", len(results))
	}
	if len(results) > 0 {
		trace := results[0].TraceID
		if len(trace) != 32 {
			t.Fatalf("expected a 32-character campaign trace, got %q", trace)
		}
		for _, result := range results {
			if result.TraceID != trace {
				t.Fatalf("all steps must share trace %q, got %q", trace, result.TraceID)
			}
		}
	}
}

func TestRunUnknownScenario(t *testing.T) {
	ts := newTestServer()
	defer ts.Close()

	c := client.NewClient(2 * time.Second)
	r := NewRunner(c, ts.URL)

	_, err := r.RunScenario("unknown-scenario")
	if err == nil {
		t.Fatal("expected error for unknown scenario")
	}
}
