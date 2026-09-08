package client

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestClientCallSuccess(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("User-Agent") == "" {
			t.Errorf("expected User-Agent header")
		}
		w.Header().Set("X-Trace-ID", "test-trace-123")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}))
	defer server.Close()

	c := NewClient(2 * time.Second)
	status, body, trace, err := c.Call(server.URL, http.MethodGet, "/health", nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if status != 200 {
		t.Errorf("expected 200, got %d", status)
	}
	if trace != "test-trace-123" {
		t.Errorf("expected trace id test-trace-123, got %s", trace)
	}
	if body != `{"status":"ok"}` {
		t.Errorf("unexpected body: %s", body)
	}
}

func TestClientCallWithHeader(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Custom-Auth") != "secret" {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	c := NewClient(2 * time.Second)
	status, _, _, err := c.CallWithHeader(server.URL, http.MethodGet, "/test", "X-Custom-Auth", "secret")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if status != 200 {
		t.Errorf("expected 200, got %d", status)
	}
}

func TestBeginTraceIsPropagated(t *testing.T) {
	var received string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		received = r.Header.Get("X-Trace-ID")
		w.Header().Set("X-Trace-ID", received)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	c := NewClient(2 * time.Second)
	trace, err := c.BeginTrace()
	if err != nil {
		t.Fatalf("BeginTrace failed: %v", err)
	}
	_, _, echoed, err := c.Call(server.URL, http.MethodGet, "/event", nil)
	if err != nil {
		t.Fatalf("Call failed: %v", err)
	}
	if len(trace) != 32 || received != trace || echoed != trace {
		t.Fatalf("trace was not propagated consistently: generated=%q received=%q echoed=%q", trace, received, echoed)
	}
}

func TestValidateBaseURL(t *testing.T) {
	valid := []string{"http://127.0.0.1:8000", "https://honeypot.example.test/base"}
	for _, raw := range valid {
		if err := ValidateBaseURL(raw); err != nil {
			t.Errorf("expected %q to be valid: %v", raw, err)
		}
	}
	invalid := []string{"127.0.0.1:8000", "file:///tmp/lab", "", "http://"}
	for _, raw := range invalid {
		if err := ValidateBaseURL(raw); err == nil {
			t.Errorf("expected %q to be rejected", raw)
		}
	}
}
