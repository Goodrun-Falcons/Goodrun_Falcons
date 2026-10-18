import { TaskTeam } from '@/types/task';

/**
 * The internal team a run belongs to. Same values and labels as the web app's
 * `web-admin/lib/tags.ts` and the `requests.tag` column, so they line up once the
 * backend sends them.
 */
export const TEAM_OPTIONS: { value: TaskTeam; label: string }[] = [
  { value: 'animal_welfare', label: 'Animal Welfare Team' },
  { value: 'donations', label: 'Donations Team' },
  { value: 'education', label: 'Education Team' },
  { value: 'funders_and_grants', label: 'Funders and Grants Team' },
  { value: 'humanitarian_aid', label: 'Humanitarian Aid Team' },
  { value: 'innovation', label: 'Innovation Team' },
];

const TEAM_LABELS = Object.fromEntries(
  TEAM_OPTIONS.map((option) => [option.value, option.label])
) as Record<TaskTeam, string>;

export function teamLabel(team: TaskTeam): string {
  return TEAM_LABELS[team];
}
