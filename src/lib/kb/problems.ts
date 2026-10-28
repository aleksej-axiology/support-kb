// The problems inside one merged ticket, counted the way the desk counts: every report under its cause,
// where it is filed (causes.ts), and the reports the desk read as a one-day move (desk-notes.json)
// counted again as a problem of their own. A one-day move is not a month flip, so neither the parser fix
// nor the hint fix ends it.
import { groupByCause, uniqueById, type CauseGroup, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = CauseGroup['cause'] | 'one-day-move';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

function summary(problem: Problem, rs: Report[]): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function groupByProblem(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const groups = groupByCause(merged, tenantOf).map((g) => summary(g.cause, g.reports));
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  return moved.length ? [...groups, summary('one-day-move', moved)] : groups;
}
