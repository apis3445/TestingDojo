# Performance test case template

A manual performance test case documents how to run a load/latency test and the thresholds that decide pass/fail. The "expected results" are the acceptance thresholds — so they must be specific numbers, never "fast enough".

If a threshold (target RPS, p95 latency, error-rate ceiling, concurrent users, duration) is not provided by the user or the source story, **ask** — do not invent performance numbers.

## Step structure

1. **Preconditions / environment** — target environment, build/version, test data volume, and the tool (k6, JMeter, etc.). State them so a run is reproducible. e.g. `Confirm the staging API is deployed at build X with 10k seeded users|Environment ready`.
2. **Configure the load profile** — concurrency, ramp-up, duration, target endpoint(s). e.g. `Configure 200 virtual users ramping over 1 min, holding for 10 min against POST /api/login|Load profile configured`.
3. **Execute the run** — start the test. e.g. `Start the load test and let it run for the full duration|Test runs to completion with no setup errors`.
4. **Read the run report and assert the thresholds** — one step (opening the report is the action) whose expected result lists every threshold as bullets: `p95 latency ≤ 800 ms`, `Throughput ≥ 150 requests/sec`, `Error rate < 1% over the run`.
5. **Record results** — capture the metrics in the run report/attachment for trend comparison.

## What the expected results must be

- Quantified thresholds with units: `p95 ≤ 800 ms`, `≥ 150 req/s`, `error rate < 1%`, `CPU < 75%`.
- Tie each metric to one bullet so a regression points at a specific threshold.

## Example

Title: `Login endpoint sustains 200 concurrent users within latency SLO`

```
1. Confirm staging build and 10k seeded users; open the k6 script → Environment ready
2. Configure 200 VUs, 1 min ramp, 10 min steady state against POST /api/login → Load profile set
3. Start the run and wait for completion → Run completes with no script errors
4. Open the run report and read the metrics →
     - p95 latency ≤ 800 ms
     - Throughput ≥ 150 req/s
     - Error rate < 1%
```

Step 4's bulleted expected result is produced by the steps-XML rewrite described in SKILL.md Step 4 — the plain `steps` create-string cannot hold bullets.
