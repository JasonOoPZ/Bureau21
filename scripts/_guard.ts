/**
 * Shared safety guard for the admin scripts in this folder.
 *
 * Every script here talks to whatever DATABASE_URL points at, which is very
 * often production. The guard makes the target explicit and makes writing
 * opt-in:
 *
 *   - it always prints the target database host;
 *   - mutating scripts default to a DRY RUN that only logs what would change;
 *   - `--confirm` is required to actually write;
 *   - even with `--confirm`, the script refuses unless the host is in
 *     SCRIPT_DB_HOST_ALLOWLIST (comma separated; localhost is always allowed)
 *     or `--i-know-this-is-prod` is also passed.
 *
 * Usage:
 *   const guard = initGuard({ script: "add-credits", mutates: true });
 *   await guard.mutate("set credits of X to 5", () => prisma.x.update(...));
 */
import * as dotenv from "dotenv";

dotenv.config();

export const CONFIRM_FLAG = "--confirm";
export const PROD_FLAG = "--i-know-this-is-prod";
export const ALLOWLIST_ENV = "SCRIPT_DB_HOST_ALLOWLIST";

const DEFAULT_ALLOWED_HOSTS = ["localhost", "127.0.0.1", "::1"];

export interface GuardOptions {
  /** Script name, used as the log prefix. */
  script: string;
  /** False for read-only scripts: the host is printed and nothing else is enforced. */
  mutates: boolean;
  /** Overridable for tests. */
  argv?: readonly string[];
  env?: Record<string, string | undefined>;
}

export interface ScriptGuard {
  /** Hostname parsed from DATABASE_URL. */
  readonly host: string;
  /** The checked connection string, for constructing the Prisma adapter. */
  readonly databaseUrl: string;
  /** True unless `--confirm` was passed (always false for read-only scripts). */
  readonly dryRun: boolean;
  /**
   * Run a write. In a dry run the write is skipped, the description is logged
   * as "would ...", and `undefined` is returned.
   */
  mutate<T>(description: string, write: () => Promise<T>): Promise<T | undefined>;
  /** Print a closing line saying whether anything was written. */
  summary(): void;
}

export class GuardRefusal extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuardRefusal";
  }
}

export function parseDatabaseHost(databaseUrl: string | undefined): string {
  if (!databaseUrl) {
    throw new GuardRefusal("DATABASE_URL is not set.");
  }
  let hostname: string;
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    // Never echo the URL itself: it contains credentials.
    throw new GuardRefusal("DATABASE_URL is not a valid URL.");
  }
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host) {
    throw new GuardRefusal("DATABASE_URL has no host.");
  }
  return host;
}

export function allowedHosts(env: Record<string, string | undefined>): string[] {
  const extra = (env[ALLOWLIST_ENV] ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return [...DEFAULT_ALLOWED_HOSTS, ...extra];
}

/**
 * Pure version of the guard: throws GuardRefusal instead of exiting.
 * `initGuard` wraps it for scripts.
 */
export function createGuard(options: GuardOptions): ScriptGuard {
  const argv = options.argv ?? process.argv.slice(2);
  const env = options.env ?? process.env;
  const prefix = `[${options.script}]`;

  const databaseUrl = env.DATABASE_URL;
  const host = parseDatabaseHost(databaseUrl);
  const isAllowlisted = allowedHosts(env).includes(host);
  const isConfirmed = argv.includes(CONFIRM_FLAG);
  const isProdAcknowledged = argv.includes(PROD_FLAG);

  console.log(`${prefix} target database host: ${host}${isAllowlisted ? " (allowlisted)" : " (NOT in allowlist)"}`);

  if (!options.mutates) {
    console.log(`${prefix} read-only script, nothing will be written.`);
    return {
      host,
      databaseUrl: databaseUrl as string,
      dryRun: false,
      mutate: () => {
        throw new GuardRefusal(`${options.script} is declared read-only but attempted a write.`);
      },
      summary: () => undefined,
    };
  }

  if (isConfirmed && !isAllowlisted && !isProdAcknowledged) {
    throw new GuardRefusal(
      `Refusing to write to ${host}: it is not in ${ALLOWLIST_ENV} ` +
        `(allowed: ${allowedHosts(env).join(", ")}). ` +
        `Add the host to ${ALLOWLIST_ENV}, or pass ${PROD_FLAG} together with ${CONFIRM_FLAG}.`,
    );
  }

  const dryRun = !isConfirmed;
  let plannedWrites = 0;
  let appliedWrites = 0;

  if (dryRun) {
    console.log(`${prefix} DRY RUN: no changes will be written. Re-run with ${CONFIRM_FLAG} to apply.`);
    if (!isAllowlisted) {
      console.log(`${prefix} note: ${host} is not allowlisted, so applying will also need ${PROD_FLAG}.`);
    }
  } else {
    console.log(`${prefix} LIVE RUN: changes WILL be written to ${host}.`);
  }

  return {
    host,
    databaseUrl: databaseUrl as string,
    dryRun,
    async mutate<T>(description: string, write: () => Promise<T>): Promise<T | undefined> {
      if (dryRun) {
        plannedWrites += 1;
        console.log(`${prefix} [dry-run] would ${description}`);
        return undefined;
      }
      console.log(`${prefix} ${description}`);
      const result = await write();
      appliedWrites += 1;
      return result;
    },
    summary() {
      if (dryRun) {
        console.log(`${prefix} dry run complete: ${plannedWrites} change(s) would be made, none written.`);
      } else {
        console.log(`${prefix} done: ${appliedWrites} change(s) written to ${host}.`);
      }
    },
  };
}

/** Script entry point: prints the refusal and exits non-zero instead of throwing. */
export function initGuard(options: GuardOptions): ScriptGuard {
  try {
    return createGuard(options);
  } catch (error) {
    if (error instanceof GuardRefusal) {
      console.error(`[${options.script}] ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}
