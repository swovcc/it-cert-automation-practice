# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

Practice files for the [Google IT Automation with Python Professional Certificate](https://www.coursera.org/professional-certificates/google-it-automation). Each course has its own folder containing lab exercises.

## Running the Scripts

There is no build system or package manager. Scripts are plain Python 3.

```bash
# Run the hello_cloud HTTP server (defaults to port 8000)
python3 Course5/Lab3/hello_cloud.py
python3 Course5/Lab3/hello_cloud.py 8080  # custom port

# validations.py has no __main__ block — import it to use validate_user()
python3 -c "from Course3.Lab4.validations import validate_user; print(validate_user('alice', 3))"
```

The `hello_cloud.service` systemd unit runs `hello_cloud.py` on port 80 via `/usr/local/bin/hello_cloud.py`.

## Repository Structure

```
CourseN/LabN/   # One folder per lab within each course
docs/           # Contributing guidelines
.github/        # PR/issue templates; stale-PR workflow (closes PRs with no activity after 7 days)
```

Current lab files:
- `Course3/Lab4/validations.py` — `validate_user(username, minlen)` using regex; raises `TypeError`/`ValueError` on bad inputs
- `Course4/Lab4/employees-with-date.csv` — Employee roster (Name, Surname, Department, Start Date)
- `Course5/Lab3/hello_cloud.py` — Minimal `http.server` app; responds with hostname and IP
- `Course5/Lab3/hello_cloud.service` — Systemd unit for the above

## Contributing

- A signed [Google CLA](https://cla.developers.google.com/) is required before any contribution is merged.
- All changes go through GitHub pull requests; reference the related issue (`Fixes #N`) in the PR description.
- The PR template checklist requires tests to pass and README updates where applicable.
- This project follows [Google's Open Source Community Guidelines](https://opensource.google/conduct/).
