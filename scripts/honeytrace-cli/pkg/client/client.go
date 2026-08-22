package client

import (
	"bytes"
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

	req.Header.Set("User-Agent", c.UserAgent)
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
	req.Header.Set("User-Agent", c.UserAgent)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return 0, "", "", err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	return resp.StatusCode, string(data), resp.Header.Get("X-Trace-ID"), err
}
