package runner

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"honeytrace-cli/pkg/client"
	"honeytrace-cli/pkg/models"
)

// StepCallback is invoked before or after a scenario step runs.
type StepCallback func(scenario, step string)

// Runner manages scenario execution against a target Honeypot.
type Runner struct {
	Client      *client.Client
	BaseURL     string
	OnStepStart StepCallback
	OnStepDone  StepCallback
}

// NewRunner initializes a new attack scenario runner.
func NewRunner(c *client.Client, baseURL string) *Runner {
	return &Runner{
		Client:  c,
		BaseURL: baseURL,
	}
}

// HealthCheck verifies if the honeypot target is reachable and healthy.
func (r *Runner) HealthCheck() error {
	status, _, _, err := r.Client.Call(r.BaseURL, http.MethodGet, "/health", nil)
	if err != nil {
		return fmt.Errorf("healthcheck connection error: %w", err)
	}
	if status != http.StatusOK {
		return fmt.Errorf("healthcheck failed: unexpected HTTP %d", status)
	}
	return nil
}

// RunScenario executes a specific scenario or all scenarios if "all" is provided.
func (r *Runner) RunScenario(scenario string) ([]models.Result, error) {
	if _, err := r.Client.BeginTrace(); err != nil {
		return nil, err
	}
	if scenario == "all" {
		scenariosToRun := []string{"bruteforce", "idor", "sqli", "path-traversal", "stored-xss"}
		var allResults []models.Result
		for _, s := range scenariosToRun {
			res, err := r.executeSingleScenario(s)
			if err != nil {
				return allResults, err
			}
			allResults = append(allResults, res...)
		}
		return allResults, nil
	}
	return r.executeSingleScenario(scenario)
}

func (r *Runner) executeSingleScenario(scenario string) ([]models.Result, error) {
	results := make([]models.Result, 0, 6)

	addStep := func(step string, status, expected int, trace, body string) error {
		if r.OnStepStart != nil {
			r.OnStepStart(scenario, step)
		}
		rec := models.Record(scenario, step, status, expected, trace, body)
		results = append(results, rec)

		if r.OnStepDone != nil {
			r.OnStepDone(scenario, step)
		}

		if !rec.Passed {
			return fmt.Errorf("%s/%s: got HTTP %d, expected %d", scenario, step, status, expected)
		}
		return nil
	}
	addStepWithEvidence := func(step string, status, expected int, trace, body, marker string) error {
		if err := addStep(step, status, expected, trace, body); err != nil {
			return err
		}
		if !strings.Contains(body, marker) {
			results[len(results)-1].Passed = false
			return fmt.Errorf("%s/%s: respuesta sin evidencia esperada %q", scenario, step, marker)
		}
		return nil
	}

	switch scenario {
	case "bruteforce":
		for _, password := range []string{"wrong-real-1", "wrong-real-2", "wrong-real-3"} {
			status, body, trace, err := r.Client.Call(r.BaseURL, http.MethodPost, "/auth", map[string]string{
				"username": "analyst",
				"password": password,
			})
			if err != nil {
				return nil, err
			}
			if err = addStep("failed-login", status, http.StatusUnauthorized, trace, body); err != nil {
				return nil, err
			}
		}
		status, body, trace, err := r.Client.Call(r.BaseURL, http.MethodPost, "/auth", map[string]string{
			"username": "analyst",
			"password": "honey123",
		})
		if err != nil {
			return nil, err
		}
		if err = addStep("successful-login-after-bruteforce", status, http.StatusOK, trace, body); err != nil {
			return nil, err
		}

	case "idor":
		reqPath := "/users/2"
		status, body, trace, err := r.Client.CallWithHeader(r.BaseURL, http.MethodGet, reqPath, "X-User-ID", "1")
		if err != nil {
			return nil, err
		}
		if err = addStepWithEvidence("read-object-as-other-user", status, http.StatusOK, trace, body, `"id":2`); err != nil {
			return nil, err
		}

	case "sqli":
		path := "/products?q=" + url.QueryEscape("' OR 1=1 --")
		status, body, trace, err := r.Client.Call(r.BaseURL, http.MethodGet, path, nil)
		if err != nil {
			return nil, err
		}
		if err = addStepWithEvidence("sql-injection-pattern", status, http.StatusOK, trace, body, `"id":2`); err != nil {
			return nil, err
		}

	case "path-traversal":
		items := []struct {
			name, path string
			expected   int
		}{
			{"read-decoy-file", "/files?path=" + url.QueryEscape("../secrets/system.txt"), http.StatusOK},
			{"attempt-host-escape", "/files?path=" + url.QueryEscape("../../../../etc/passwd"), http.StatusForbidden},
		}
		for _, item := range items {
			status, body, trace, err := r.Client.Call(r.BaseURL, http.MethodGet, item.path, nil)
			if err != nil {
				return nil, err
			}
			if item.name == "read-decoy-file" {
				err = addStepWithEvidence(item.name, status, item.expected, trace, body, "HONEYTRACE_DECOY_ONLY=true")
			} else {
				err = addStep(item.name, status, item.expected, trace, body)
			}
			if err != nil {
				return nil, err
			}
		}

	case "stored-xss":
		payload := "<script>document.body.dataset.realattack='go'</script>"
		status, body, trace, err := r.Client.Call(r.BaseURL, http.MethodPost, "/orders/1/notes", map[string]any{
			"author_id": 1,
			"note":      payload,
		})
		if err != nil {
			return nil, err
		}
		if err = addStep("store-script-in-note", status, http.StatusCreated, trace, body); err != nil {
			return nil, err
		}

		status, body, trace, err = r.Client.Call(r.BaseURL, http.MethodGet, "/orders/1/notes/render", nil)
		if err != nil {
			return nil, err
		}
		if err = addStepWithEvidence("render-stored-script", status, http.StatusOK, trace, body, "realattack"); err != nil {
			return nil, err
		}

	default:
		return nil, fmt.Errorf("unknown scenario %q", scenario)
	}

	return results, nil
}
