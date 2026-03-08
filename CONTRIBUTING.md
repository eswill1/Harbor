# Contributing to Harbor

Thank you for your interest in contributing to Harbor.

## License and IP Assignment

Harbor is licensed under the [Business Source License 1.1](LICENSE) (BUSL-1.1).

By submitting a contribution (pull request, issue, code, documentation, or any other material) to this repository, you agree that:

1. Your contribution is your original work and you have the right to submit it.
2. Your contribution is submitted under the same BUSL-1.1 terms as the rest of the project.
3. You grant Ed Williams a perpetual, worldwide, non-exclusive, royalty-free license to use, reproduce, modify, distribute, and commercialize your contribution as part of Harbor, including under any future license Harbor may adopt.
4. You understand that Harbor is a commercial project and your contributions may be used in a commercial product.

If you are contributing on behalf of an employer, you represent that you are authorized to submit contributions under these terms.

## How to Contribute

### Reporting Bugs

Use the [bug report issue template](.github/ISSUE_TEMPLATE/bug-report.yml). All bugs must reference the spec or document they violate.

### Proposing Ranking or Algorithm Changes

All material changes to ranking, scoring, or algorithm behavior require an RFC before implementation. Use the [Ranking RFC issue template](.github/ISSUE_TEMPLATE/ranking-rfc.yml).

### Submitting Code

1. Fork the repository and create a branch from `main`.
2. Follow the existing code style and architecture patterns.
3. Ensure your change passes the compliance checklist in the [PR template](.github/PULL_REQUEST_TEMPLATE.md) — every item must be checked or explicitly marked N/A with a reason.
4. All PRs are reviewed against the [Anti-Drift Constitution](ANTI_DRIFT_CONSTITUTION.md) and [Metrics Standard](METRICS_STANDARD.md). PRs that violate constitutional constraints will not be merged regardless of other merit.

### What We Will Not Merge

- Changes that optimize for engagement, time-spent, or any metric banned by the Constitution
- Changes that remove or weaken the baseline view switcher
- Changes that introduce dark patterns or remove natural stopping points
- Ranking changes without a completed RFC
- Anything that weakens user control over their signal graph

## Questions

Open a discussion or issue on GitHub.
