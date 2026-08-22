package main

import (
	"flag"
	"fmt"
	"os"
	"time"

	"honeytrace-cli/pkg/client"
	"honeytrace-cli/pkg/runner"
	"honeytrace-cli/pkg/ui"
)

func main() {
	baseURL := flag.String("base-url", "", "explicit honeypot base URL (e.g. http://localhost:8000)")
	scenario := flag.String("scenario", "", "attack scenario: all, bruteforce, idor, sqli, path-traversal, stored-xss")
	confirmLab := flag.Bool("confirm-lab", false, "confirm the target is an authorized isolated honeypot")
	jsonOutput := flag.Bool("json", false, "output results as JSON lines for CI/CD automation")
	interactiveMode := flag.Bool("interactive", false, "force interactive TUI mode")
	timeoutSec := flag.Int("timeout", 10, "HTTP timeout in seconds")

	flag.Parse()
	if *timeoutSec <= 0 {
		fmt.Fprintln(os.Stderr, "timeout must be greater than zero")
		os.Exit(2)
	}

	nonInteractiveFlagsProvided := *baseURL != "" && *confirmLab && *scenario != ""
	isInteractive := *interactiveMode || !nonInteractiveFlagsProvided

	if !*jsonOutput {
		ui.PrintBanner()
	}

	targetURL := *baseURL
	selectedScenario := *scenario
	isConfirmed := *confirmLab

	if isInteractive && !*jsonOutput {
		var err error

		if targetURL == "" {
			targetURL, err = ui.PromptBaseURLInteractive()
			if err != nil {
				ui.PrintError(err)
				os.Exit(2)
			}
		}

		if !isConfirmed {
			isConfirmed, err = ui.PromptConfirmLabInteractive()
			if err != nil || !isConfirmed {
				ui.PrintWarn("Refusing to run: Authorized lab confirmation is required.")
				os.Exit(2)
			}
		}

		if selectedScenario == "" {
			selectedScenario, err = ui.SelectScenarioInteractive()
			if err != nil {
				ui.PrintError(err)
				os.Exit(2)
			}
		}
	}

	if targetURL == "" || !isConfirmed {
		if !*jsonOutput {
			ui.PrintWarn("Refusing to run: provide --base-url and --confirm-lab (or run interactively)")
		} else {
			fmt.Fprintln(os.Stderr, "refusing to run: provide --base-url and --confirm-lab")
		}
		os.Exit(2)
	}
	if err := client.ValidateBaseURL(targetURL); err != nil {
		if *jsonOutput {
			fmt.Fprintln(os.Stderr, err)
		} else {
			ui.PrintError(err)
		}
		os.Exit(2)
	}

	if selectedScenario == "" {
		selectedScenario = "all"
	}

	if !ui.IsValidScenario(selectedScenario) {
		ui.PrintError(fmt.Errorf("invalid scenario %q", selectedScenario))
		os.Exit(2)
	}

	httpClient := client.NewClient(time.Duration(*timeoutSec) * time.Second)
	attackRunner := runner.NewRunner(httpClient, targetURL)

	if !*jsonOutput {
		spinner, _ := ui.StartSpinner("Connecting and running healthcheck on target: " + targetURL)
		err := attackRunner.HealthCheck()
		if err != nil {
			spinner.Fail("Healthcheck failed: " + err.Error())
			os.Exit(2)
		}
		spinner.Success("Target honeypot is online and healthy.")

		fmt.Println()
		ui.PrintInfo(fmt.Sprintf("Executing attack scenario [%s]...", selectedScenario))
		fmt.Println()
	} else {
		if err := attackRunner.HealthCheck(); err != nil {
			fmt.Fprintln(os.Stderr, "healthcheck failed: "+err.Error())
			os.Exit(2)
		}
	}

	results, err := attackRunner.RunScenario(selectedScenario)

	if *jsonOutput {
		for _, res := range results {
			ui.PrintResultJSON(res)
		}
		if err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			os.Exit(1)
		}
		return
	}

	for _, res := range results {
		ui.PrintStepResult(res)
	}

	if err != nil {
		ui.PrintError(err)
	}

	ui.PrintSummaryTable(results)

	if err != nil {
		os.Exit(1)
	}
}
