import {execFileSync} from 'node:child_process';
import process from 'node:process';
import {Buffer} from 'node:buffer';
import console from 'node:console';

// Inspect the exact index that a commit publishes; never print matched secrets.
const git = (...args) => execFileSync('git', args, {maxBuffer: 32 * 1024 * 1024});
const paths = git('ls-files', '--cached', '-z').toString().split('\0').filter(Boolean);
const forbidden = /(^|\/)(?:\.env[^/]*|\.dev\.vars[^/]*|node_modules|dist|reference|\.wrangler|\.idea|\.vscode|test-results|playwright-report|credentials[^/]*\.json|secrets[^/]*\.json)(\/|$)|\.(?:pem|key|p12|pfx|sqlite\w*|db|zip|7z|rar|log|bak|tmp)$/i;
const signatures = [
  /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\b\d{6,12}:[A-Za-z0-9_-]{30,}\b/,
  /\b(?:api[_-]?key|bot[_-]?token|password|client[_-]?secret)\s*[=:]\s*["'][^"'\s]{8,}["']/i,
  /[A-Z]:[\\/](?:Users|Neyro)[\\/]/i,
];
let failed = false;
for (const file of paths) {
  if (forbidden.test(file)) {
    console.error('Blocked private/generated file:', file);
    failed = true;
    continue;
  }
  const body = git('show', ':' + file);
  if (body.includes(Buffer.from([0]))) continue;
  if (signatures.some(pattern => pattern.test(body.toString('utf8')))) {
    console.error('Review potential secret or local path:', file);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log('Publication check passed for', paths.length, 'staged files. Pattern coverage is limited.');
