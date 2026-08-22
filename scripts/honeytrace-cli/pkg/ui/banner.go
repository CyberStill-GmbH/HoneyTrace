package ui

import (
	"fmt"

	"github.com/pterm/pterm"
)

// PrintBanner displays the MielEnjoyer ASCII art logo in yellow.
func PrintBanner() {
	bannerText := `
   __  ___ _ el _____   ___                      
  /  |/  /(_)__/ __/___/ (_)___  __ _____ _______
 / /|_/ / / /_/ _// __/ / / __ \/ // / -_) __/ __/
/_/  /_/_/_/ /___/_/ /_/_/\___/\_, /\__/_/  /_/   
                              /___/               
`

	pterm.DefaultCenter.Println(pterm.NewStyle(pterm.FgYellow, pterm.Bold).Sprint(bannerText))

	pterm.DefaultCenter.Println(
		pterm.NewStyle(pterm.BgYellow, pterm.FgBlack, pterm.Bold).Sprintf(" MIEL ENJOYER ") +
			" " + pterm.NewStyle(pterm.FgCyan).Sprintf("[Honeypot Security Verification Tool]"),
	)
	fmt.Println()
}
