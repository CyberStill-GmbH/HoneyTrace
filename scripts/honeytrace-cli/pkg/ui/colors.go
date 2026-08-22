package ui

import (
	"encoding/json"
	"fmt"

	"github.com/fatih/color"
	"github.com/pterm/pterm"

	"honeytrace-cli/pkg/models"
)

var (
	colorSuccess = color.New(color.FgGreen, color.Bold)
	colorFail    = color.New(color.FgRed, color.Bold)
	colorWarn    = color.New(color.FgYellow, color.Bold)
	colorInfo    = color.New(color.FgCyan)
)

// PrintResultJSON outputs step result in JSON lines format.
func PrintResultJSON(res models.Result) {
	encoded, err := json.Marshal(res)
	if err == nil {
		fmt.Println(string(encoded))
	}
}

// PrintStepResult renders a single step verdict in a clean text format.
func PrintStepResult(res models.Result) {
	if res.Passed {
		colorSuccess.Printf("  [PASS] ")
		fmt.Printf("│ Scenario: %-15s │ Step: %-32s │ Status: %d (Expected: %s)\n",
			res.Scenario, res.Step, res.Status, res.Expected)
	} else {
		colorFail.Printf("  [FAIL] ")
		fmt.Printf("│ Scenario: %-15s │ Step: %-32s │ Status: %d (Expected: %s)\n",
			res.Scenario, res.Step, res.Status, res.Expected)
	}
}

// PrintSummaryTable displays a professional summary table of all executed steps.
func PrintSummaryTable(results []models.Result) {
	tableData := pterm.TableData{
		{"VERDICT", "SCENARIO", "STEP", "STATUS", "EXPECTED", "TRACE ID"},
	}

	passedCount := 0
	failedCount := 0

	for _, r := range results {
		verdict := pterm.FgLightGreen.Sprintf("PASS")
		if r.Passed {
			passedCount++
		} else {
			verdict = pterm.FgLightRed.Sprintf("FAIL")
			failedCount++
		}

		trace := r.TraceID
		if trace == "" {
			trace = "N/A"
		} else if len(trace) > 16 {
			trace = trace[:16] + "..."
		}

		tableData = append(tableData, []string{
			verdict,
			r.Scenario,
			r.Step,
			fmt.Sprintf("%d", r.Status),
			r.Expected,
			trace,
		})
	}

	fmt.Println()
	pterm.DefaultSection.Println("Attack Execution Summary")
	_ = pterm.DefaultTable.
		WithHasHeader().
		WithBoxed().
		WithData(tableData).
		Render()

	fmt.Println()
	if failedCount == 0 {
		pterm.Success.Println(
			colorSuccess.Sprintf("Execution completed: %d test steps passed. Honeypot recorded target behaviors.", passedCount),
		)
	} else {
		pterm.Error.Println(
			colorFail.Sprintf("Execution alert: %d of %d test steps failed.", failedCount, len(results)),
		)
	}
}

// PrintError renders a highlighted error message.
func PrintError(err error) {
	colorFail.Printf("\n[ERROR] %v\n", err)
}

// PrintInfo renders an info message.
func PrintInfo(msg string) {
	colorInfo.Println("[INFO] " + msg)
}

// PrintWarn renders a warning message.
func PrintWarn(msg string) {
	colorWarn.Println("[WARN] " + msg)
}
