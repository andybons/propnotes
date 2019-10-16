package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"

	"golang.org/x/build/maintner"
	"golang.org/x/build/maintner/godata"
)

func main() {
	corpus, err := godata.Get(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	var issues []*ghIssue
	// -label:Go2
	// -label:Proposal-Crypto
	// -label:Proposal-Hold
	// -label:proposal-accepted proposal sort:updated-desc
	corpus.GitHub().Repo("golang", "go").ForeachIssue(func(issue *maintner.GitHubIssue) error {
		if issue.Closed ||
			issue.HasLabel("Go2") ||
			issue.HasLabel("Proposal-Crypto") ||
			issue.HasLabel("Proposal-Hold") ||
			issue.HasLabel("Proposal-Accepted") {
			return nil
		}
		issues = append(issues, &ghIssue{
			Number: issue.Number,
			Title:  issue.Title,
		})

		return nil
	})
	fmt.Fprintln(os.Stderr, len(issues), "issues")
	var buf bytes.Buffer
	buf.WriteString("export const ISSUE_DATA = ")
	if err := json.NewEncoder(&buf).Encode(issues); err != nil {
		log.Fatal(err)
	}
	buf.WriteByte(';')
	if _, err := io.Copy(os.Stdout, &buf); err != nil {
		log.Fatal(err)
	}
}

type ghIssue struct {
	Number int32  `json:"number"`
	Title  string `json:"title"`
}
