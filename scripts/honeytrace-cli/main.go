package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

var scenarios = []string{"bruteforce", "idor", "sqli", "path-traversal", "stored-xss"}

type result struct {
	Scenario   string `json:"scenario"`
	Step       string `json:"step"`
	Status     int    `json:"status"`
	Expected   string `json:"expected"`
	Passed     bool   `json:"passed"`
	TraceID    string `json:"trace_id,omitempty"`
	BodyBytes  int    `json:"body_bytes"`
	BodySHA256 string `json:"body_sha256"`
}

func call(client *http.Client, base, method, path string, body any) (int, string, string, error) {
	var reader io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return 0, "", "", err
		}
		reader = bytes.NewReader(encoded)
	}
	req, err := http.NewRequest(method, strings.TrimRight(base, "/")+path, reader)
	if err != nil {
		return 0, "", "", err
	}
	req.Header.Set("User-Agent", "honeytrace-lab-cli-go/1.1")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := client.Do(req)
	if err != nil {
		return 0, "", "", err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	return resp.StatusCode, string(data), resp.Header.Get("X-Trace-ID"), err
}

func record(scenario, step string, status, expected int, trace, body string) result {
	hash := sha256.Sum256([]byte(body))
	return result{Scenario: scenario, Step: step, Status: status, Expected: fmt.Sprint(expected), Passed: status == expected, TraceID: trace, BodyBytes: len(body), BodySHA256: hex.EncodeToString(hash[:])}
}

func run(client *http.Client, base, scenario string) ([]result, error) {
	results := make([]result, 0, 6)
	add := func(step string, status, expected int, trace, body string) error {
		r := record(scenario, step, status, expected, trace, body)
		results = append(results, r)
		encoded, err := json.Marshal(r)
		if err == nil {
			fmt.Println(string(encoded))
		}
		if err != nil {
			return err
		}
		if !r.Passed {
			return fmt.Errorf("%s/%s: got HTTP %d, expected %d", scenario, step, status, expected)
		}
		return nil
	}

	switch scenario {
	case "bruteforce":
		for _, password := range []string{"wrong-real-1", "wrong-real-2", "wrong-real-3"} {
			status, body, trace, err := call(client, base, http.MethodPost, "/auth", map[string]string{"username": "analyst", "password": password})
			if err != nil {
				return nil, err
			}
			if err = add("failed-login", status, http.StatusUnauthorized, trace, body); err != nil {
				return nil, err
			}
		}
		status, body, trace, err := call(client, base, http.MethodPost, "/auth", map[string]string{"username": "analyst", "password": "honey123"})
		if err != nil {
			return nil, err
		}
		if err = add("successful-login-after-bruteforce", status, http.StatusOK, trace, body); err != nil {
			return nil, err
		}
	case "idor":
		reqPath := "/users/2"
		status, body, trace, err := callWithHeader(client, base, http.MethodGet, reqPath, "X-User-ID", "1")
		if err != nil {
			return nil, err
		}
		if err = add("read-object-as-other-user", status, http.StatusOK, trace, body); err != nil {
			return nil, err
		}
	case "sqli":
		path := "/products?q=" + url.QueryEscape("' OR 1=1 --")
		status, body, trace, err := call(client, base, http.MethodGet, path, nil)
		if err != nil {
			return nil, err
		}
		if err = add("sql-injection-pattern", status, http.StatusOK, trace, body); err != nil {
			return nil, err
		}
	case "path-traversal":
		for _, item := range []struct {
			name, path string
			expected   int
		}{
			{"read-decoy-file", "/files?path=" + url.QueryEscape("../secrets/system.txt"), http.StatusOK},
			{"attempt-host-escape", "/files?path=" + url.QueryEscape("../../../../etc/passwd"), http.StatusForbidden},
		} {
			status, body, trace, err := call(client, base, http.MethodGet, item.path, nil)
			if err != nil {
				return nil, err
			}
			if err = add(item.name, status, item.expected, trace, body); err != nil {
				return nil, err
			}
		}
	case "stored-xss":
		payload := "<script>document.body.dataset.realattack='go'</script>"
		status, body, trace, err := call(client, base, http.MethodPost, "/orders/1/notes", map[string]any{"author_id": 1, "note": payload})
		if err != nil {
			return nil, err
		}
		if err = add("store-script-in-note", status, http.StatusCreated, trace, body); err != nil {
			return nil, err
		}
		status, body, trace, err = call(client, base, http.MethodGet, "/orders/1/notes/render", nil)
		if err != nil {
			return nil, err
		}
		if err = add("render-stored-script", status, http.StatusOK, trace, body); err != nil {
			return nil, err
		}
		if !strings.Contains(body, "realattack") {
			return nil, fmt.Errorf("stored-xss/render: marker absent")
		}
	default:
		return nil, fmt.Errorf("unknown scenario %q", scenario)
	}
	return results, nil
}

func callWithHeader(client *http.Client, base, method, path, key, value string) (int, string, string, error) {
	req, err := http.NewRequest(method, strings.TrimRight(base, "/")+path, nil)
	if err != nil {
		return 0, "", "", err
	}
	req.Header.Set(key, value)
	req.Header.Set("User-Agent", "honeytrace-lab-cli-go/1.1")
	resp, err := client.Do(req)
	if err != nil {
		return 0, "", "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	return resp.StatusCode, string(body), resp.Header.Get("X-Trace-ID"), err
}

func main() {
	base := flag.String("base-url", "", "explicit honeypot URL")
	scenario := flag.String("scenario", "all", "all or one controlled scenario")
	confirm := flag.Bool("confirm-lab", false, "confirm the target is an authorized isolated honeypot")
	flag.Parse()
	if *base == "" || !*confirm {
		fmt.Fprintln(os.Stderr, "refusing to run: provide --base-url and --confirm-lab")
		os.Exit(2)
	}
	client := &http.Client{Timeout: 10 * time.Second}
	status, _, _, err := call(client, *base, http.MethodGet, "/health", nil)
	if err != nil || status != http.StatusOK {
		fmt.Fprintln(os.Stderr, "healthcheck failed")
		os.Exit(2)
	}
	selected := scenarios
	if *scenario != "all" {
		selected = []string{*scenario}
	}
	for _, item := range selected {
		if _, err := run(client, *base, item); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
	}
}
