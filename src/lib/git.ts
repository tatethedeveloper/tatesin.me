import { execSync } from 'node:child_process';

export interface Commit {
  hash: string;
  subject: string;
  /** ISO 8601 author date. */
  date: string;
}

/**
 * The repository's own history, oldest first. Runs at build time only.
 * In CI the checkout needs full depth (see .github/workflows/deploy.yml);
 * a shallow clone would draw a structure with one strut.
 */
export function getCommits(): Commit[] {
  try {
    const out = execSync('git log --reverse --format=%h%x1f%s%x1f%aI', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, subject, date] = line.split('\x1f');
        return { hash, subject, date };
      });
  } catch {
    return [];
  }
}
