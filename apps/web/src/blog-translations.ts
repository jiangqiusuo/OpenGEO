import { createHash } from "node:crypto";
import type { BlogPost } from './blog-content';

// Non-code blocks in source order. Executable examples are reused unchanged from the reviewed source.
const english: Record<string, { sourceUpdatedAt: string; text: string[] }> = {
  'geo-visibility-and-evidence': { sourceUpdatedAt: '2026-10-13', text: [
    'The difficult part of GEO is making an answer reviewable. The same question can produce different results at different times, on different platforms or in different contexts.',
    'OpenGEO models monitoring as Jobs and keeps questions, answers, citations and sample scope together. A mention can then become a comparable observation instead of an isolated screenshot.',
    'Before optimizing, fix three things: the question set, the observation window and the evidence level. Then compare changes in mention rate, ranking position and citation quality.',
    'This sequence also helps teams stop tasks safely, handle partial results and explain why a result is unavailable. Verifiability is the starting point for an optimization workflow.',
  ] },
  'partial-results-and-retries': { sourceUpdatedAt: '2026-10-13', text: [
    'Answers in a monitoring batch may finish at different times. Review the answers that are already available, but do not treat them as the entire observation window while work is still running. OpenGEO separates execution progress in Job status from result availability in result_state.',
    '202 means the request was accepted',
    'Keep the Job ID returned by creation. Query that same Job and its items. A successful HTTP request does not mean monitoring is complete, and a request timeout does not mean the Job failed. Use backoff, request timeouts and an overall waiting limit instead of creating another batch when a query takes too long.',
    'Prefer: wait=N is a waiting preference for one request. The CLI --wait option does not start a polling loop. Continue querying with the returned ID.',
    'Choose what to do with partial results',
    'partial means some results are available. Read items before deciding whether to wait for the remaining work. If coverage is sufficient, request finalize-partial and use cancel_remaining=true to stop unfinished work. Confirm finalization from the returned state.',
    'Use cancel when you only want to stop remaining execution. Cancellation does not delete completed answers or turn the Job into a complete success. Keep the partial-result label for finalized_partial. After cancelling, read the state and saved results again. On a state conflict, query the original Job rather than submitting again.',
    'Show the scope alongside results',
    'Show Job status, completed and total samples, and the number of observations actually loaded before presenting metrics. A single result page is not the total task progress, and the valid-sample ratio is not a completion rate. Keep retrieved sources separate from explicit answer citations.',
    'Failure is not a zero mention rate',
    'Keep HTTP errors, failed Jobs and unavailable fields distinct. Not requested, unsupported, temporarily unavailable, parsing failure and withheld public content must not all become "brand not mentioned". For diagnostics, keep the Job ID, safe request ID and error code. Exclude credentials and complete private responses from feedback.',
    'When replaying a creation request after a network interruption, keep the same request body and Idempotency-Key. Follow Retry-After when rate-limited. Correct invalid requests or permissions first; do not silently switch platforms or reduce capabilities. If submission status is unknown, inspect the original task before deciding what to do next.',
    'Practice locally before using a live environment',
    'Dynamic job_mock_* tasks advance to success by deterministic rules; they do not simulate live partial results. Fixed job_demo_* fixtures return example write responses without a persistent state machine. The workbench is a read-only simulated preview. This guide explains contract and client decisions, not live actions in the UI.',
    'The developer guide covers partial results, failures and retries. OpenAPI remains the source of truth for fields. Complete the local CLI tutorial first, then verify cancellation, finalization and result association in your own controlled test environment.',
  ] },
  'cli-local-quickstart': { sourceUpdatedAt: '2026-10-13', text: [
    'Try one local Job with the published @sysiphus/cli 0.1.1 command-line tool and the repository Mock server. Answers and brands are fictional. No API key or live monitoring is involved.',
    'Start the local Mock',
    'You need Node.js 22 or later, Git and pnpm 11. Enter the repository and start Mock in one terminal. Keep it open. Installing dependencies and downloading the CLI require network access; task requests below go only to your machine.',
    'Create a Job in a second terminal',
    'The examples use Windows PowerShell. npm.cmd avoids the execution-policy restrictions on npm.ps1. npm exec runs a pinned version without a global installation. Every command specifies the local endpoint. If OPENGEO_API_KEY is set for another project, use a terminal where that variable is unset.',
    'Defaults are search and best_effort, which the local Mock supports. Creation returns a job_mock_* ID and queued state. Keep the actual returned id. Its sequence number depends on Jobs already created in your Mock; do not copy an illustrative ID as your own.',
    'Use the same ID for progress and results',
    'For a new simulated Job, the first job query advances it to running and the second to succeeded with complete results. Every observation returned by items should have job_id equal to $job.id. Reading items immediately after creation returns an empty array; this alone is not evidence of task failure.',
    'Completion after two queries is a Mock teaching rule. For a live API, follow the returned state and set a polling interval and total waiting limit. CLI --wait 5 sends a preference for one request; it does not poll every five seconds or guarantee completion within five seconds.',
    'Practice retrying and cancelling',
    'Repeat creation with the same question and idempotency key to receive the same Job. Use a new key only for a different task. Reusing a key with another question causes a conflict. Restarting Mock clears its in-memory records, so do this exercise within one run.',
    'Create a new task here and cancel it before reading progress. Its state should remain cancelled. Cancelling a completed task cannot move it back from succeeded to cancelled. The local exercise has no billing or refund effects.',
    'What to check when a request fails',
    'On a connection error, check that Mock is running and the ports match. If you change OPEN_GEO_PORT, change every --base-url as well. HTTP 409 means an idempotency conflict, 422 means an unsupported Mock configuration, and 429 means the simulated task limit was reached. Restart Mock after your exercise to clear the fixtures if needed.',
    'On macOS and Linux, use npm instead of npm.cmd. Run monitor, copy the returned id from JSON, then pass it to job, items or cancel. Repository developers can also use pnpm cli -- with the same subcommands. Stop Mock with Ctrl+C when finished. The CLI reference and polling Node tutorial provide further parameters and code.',
  ] },
  'mock-to-job-quickstart': { sourceUpdatedAt: '2026-10-13', text: [
    'Use the local Mock to understand the OpenGEO Job flow. Create a task, query progress with the same ID, then read observations belonging to that task. Simulated answers and Demo Brand are fictional, not real monitoring results.',
    'Prepare the environment and start Mock',
    'You need Node.js 22 or later, Git and pnpm 11. Run these commands in one terminal and keep it open. Mock listens only on 127.0.0.1. Dependency installation needs network access; the monitoring exercise calls only your machine.',
    'Run the example in another terminal',
    'Enter the same OpenGEO directory and run the included script. This Node command works in Windows PowerShell, macOS and Linux. No credentials need to be pasted into it.',
    'The default address is http://127.0.0.1:8787. If the port is occupied, set OPEN_GEO_PORT in the Mock terminal and pass the new local address as the only script argument, for example node examples/mock-to-job.mjs http://127.0.0.1:8788. The script rejects external destinations and redirects to keep tutorial requests away from live services.',
    'What happens during the request',
    'POST /v1/monitor-runs returns 202 and queued. The returned id is used for later queries and result association; Location points to that Job. Use a new idempotency key for creation. The same key and body return the same Job, while changing the question causes a conflict.',
    'The first local query returns running and the second succeeded with complete results. items then returns the corresponding observations. This is a predictable teaching flow. Follow API state for real waiting times, partial results and failures instead of assuming two queries always complete a task.',
    'The output excerpt above omits answer. The task number depends on how many Jobs Mock has created. Check source is local-mock, the final state is succeeded, and every observation has the same job_id as the task.',
    'Complete code you can copy',
    'This code comes directly from examples/mock-to-job.mjs and is the same file available to download. Polling is limited to eight attempts, with a timeout on each request. Failure, cancellation, partial finalization or exceeding the window raises an error instead of waiting forever.',
    'Troubleshooting and next steps',
    'On connection failure, check Mock is still running and the ports match. Use another free local port when necessary; do not stop an unfamiliar service. Mock supports string questions, search and best_effort only. Other configurations are rejected explicitly. Generation and publishing are not simulated. Up to 100 tasks are kept; restarting clears the fictional data.',
    'job_demo_* are fixed workbench fixtures and do not advance through polling. This tutorial creates job_mock_* tasks. Stop Mock with Ctrl+C when done. For a live API, read authentication, capabilities, partial results and error handling. Do not use this local-only tutorial script as a production client.',
  ] },
};

const reviewedSource = {
  "partial-results-and-retries": "f387ff34897454b1bf695385480fc3bd71cffe9dfe019e16be76bb167d21d7ec",
  "cli-local-quickstart": "72a012c308cac435d87410da2dc56c19c4ad0215f326b846b705de7c6057cebb",
  "mock-to-job-quickstart": "412a45398ff781ea680d9e4a63756e5092fe892110b3b4320c33ea3810aac8e9",
  "geo-visibility-and-evidence": "255fc070359c0b7d3c73bced8b1aea904c4b06a816b711b6fddafb62ebc7ea3e"
};

export function englishPost(post: BlogPost): BlogPost | undefined {
  const translation = english[post.slug];
  const sourceHash = createHash('sha256').update(JSON.stringify(post.body.filter(b => typeof b === 'string' || b.kind !== 'code'))).digest('hex');
  if (sourceHash !== reviewedSource[post.slug as keyof typeof reviewedSource] || !translation || translation.sourceUpdatedAt !== post.updatedAt || post.body.filter(b => typeof b === 'string' || b.kind !== 'code').length !== translation.text.length) return undefined;
  let i = 0;
  return { ...post, title: post.titleEn, excerpt: post.excerptEn, category: post.category === '工程' ? 'Engineering' : post.category === '方法' ? 'Method' : 'Tutorial', body: post.body.map(b => typeof b === 'string' ? translation.text[i++] : b.kind === 'code' ? b : { ...b, text: translation.text[i++] }) };
}
