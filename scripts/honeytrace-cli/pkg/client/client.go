package client

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Client wraps the standard http.Client with Honeypot helper logic.
type Client struct {
	HTTPClient *http.Client
	UserAgent  string
	TraceID    string
}

// BeginTrace creates one identifier shared by every request in a laboratory run.
// The honeypot accepts 32 hexadecimal characters and echoes the value in its response.
func (c *Client) BeginTrace() (string, error) {
	buffer := make([]byte, 16)
	if _, err := rand.Read(buffer); err != nil {
		return "", fmt.Errorf("no se pudo crear el ID de traza: %w", err)
	}
	c.TraceID = hex.EncodeToString(buffer)
	return c.TraceID, nil
}

func (c *Client) setTelemetryHeaders(req *http.Request) {
	req.Header.Set("User-Agent", c.UserAgent)
	if c.TraceID != "" {
		req.Header.Set("X-Trace-ID", c.TraceID)
	}
}

// ValidateBaseURL comprueba que el destino sea una URL HTTP(S) absoluta.
func ValidateBaseURL(raw string) error {
	parsed, err := url.ParseRequestURI(strings.TrimSpace(raw))
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return fmt.Errorf("base URL inválida: debe incluir esquema y host")
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return fmt.Errorf("esquema no permitido %q: usa http o https", parsed.Scheme)
	}
	return nil
}

// NewClient creates a new Client with a default timeout.
func NewClient(timeout time.Duration) *Client {
	if timeout <= 0 {
		timeout = 10 * time.Second
	}
	return &Client{
		HTTPClient: &http.Client{Timeout: timeout},
		UserAgent:  "honeytrace-lab-cli-go",
	}
}

// Call performs an HTTP request to base + path, optionally sending JSON body.
func (c *Client) Call(base, method, path string, body any) (int, string, string, error) {
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

	c.setTelemetryHeaders(req)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return 0, "", "", err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	return resp.StatusCode, string(data), resp.Header.Get("X-Trace-ID"), err
}

// CallWithHeader performs an HTTP request with a custom header key-value pair.
func (c *Client) CallWithHeader(base, method, path, key, value string) (int, string, string, error) {
	req, err := http.NewRequest(method, strings.TrimRight(base, "/")+path, nil)
	if err != nil {
		return 0, "", "", err
	}

	req.Header.Set(key, value)
	c.setTelemetryHeaders(req)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return 0, "", "", err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	return resp.StatusCode, string(data), resp.Header.Get("X-Trace-ID"), err
}
