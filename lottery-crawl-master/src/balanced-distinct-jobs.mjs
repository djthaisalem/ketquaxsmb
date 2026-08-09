import { fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const workerPath = fileURLToPath(new URL('./balanced-distinct-worker.mjs', import.meta.url));
const jobs = new Map();

export function startBalancedDistinctJob(from, to) {
  const existing = [...jobs.values()].find((job) => job.from === from && job.to === to && job.status === 'running');
  if (existing) return existing;
  const job = { id: randomUUID(), from, to, status: 'running', progress: { completed: 0, total: 0, date: null }, createdAt: new Date().toISOString() };
  jobs.set(job.id, job);
  const worker = fork(workerPath, [from, to], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
  worker.on('message', (message) => {
    if (message.type === 'progress') job.progress = message.progress;
    if (message.type === 'complete') { job.status = 'complete'; job.report = message.report; job.completedAt = new Date().toISOString(); }
    if (message.type === 'error') { job.status = 'error'; job.error = message.error; }
  });
  worker.on('exit', (code) => {
    if (job.status === 'running') { job.status = 'error'; job.error = `Tiến trình backtest dừng với mã ${code}.`; }
  });
  return job;
}

export function getBalancedDistinctJob(id) {
  return jobs.get(id) || null;
}
