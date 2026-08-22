package ui

import (
	"strings"

	"github.com/pterm/pterm"

	"honeytrace-cli/pkg/models"
)

// SelectScenarioInteractive prompts the user to pick an attack scenario using arrow keys.
func SelectScenarioInteractive() (string, error) {
	options := []string{
		"all - Execute all attack vectors in sequence",
		"bruteforce - Password guessing and brute force attack",
		"idor - Insecure Direct Object Reference",
		"sqli - SQL Injection vulnerability test",
		"path-traversal - Directory and file traversal attack",
		"stored-xss - Stored Cross-Site Scripting attack",
	}

	selected, err := pterm.DefaultInteractiveSelect.
		WithOptions(options).
		WithDefaultOption("all - Execute all attack vectors in sequence").
		Show("Select Attack Scenario to Execute")

	if err != nil {
		return "", err
	}

	parts := strings.Split(selected, " - ")
	return strings.TrimSpace(parts[0]), nil
}

// PromptBaseURLInteractive asks for the Honeypot URL if not provided via flags.
func PromptBaseURLInteractive() (string, error) {
	url, err := pterm.DefaultInteractiveTextInput.
		WithDefaultValue("http://localhost:8000").
		Show("Enter Target Honeypot Base URL")
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(url), nil
}

// PromptConfirmLabInteractive asks the user to confirm authorization for testing.
func PromptConfirmLabInteractive() (bool, error) {
	confirm, err := pterm.DefaultInteractiveConfirm.
		WithDefaultText("Confirm target is an authorized isolated honeypot?").
		WithDefaultValue(true).
		Show()
	return confirm, err
}

// StartSpinner creates and starts a Pterm spinner for a scenario step.
func StartSpinner(message string) (*pterm.SpinnerPrinter, error) {
	return pterm.DefaultSpinner.
		WithRemoveWhenDone(false).
		Start(message)
}

// IsValidScenario checks if scenario is in AvailableScenarios.
func IsValidScenario(s string) bool {
	for _, sc := range models.AvailableScenarios {
		if sc == s {
			return true
		}
	}
	return false
}
