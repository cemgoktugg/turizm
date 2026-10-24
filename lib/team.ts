export type TeamMember = { name: string; role: string; photo: string; bio: string };

/** Adı girilmiş üyeler (boş satırlar sitede gösterilmez) */
export function visibleMembers(members: TeamMember[]): TeamMember[] {
  return members.filter((m) => m.name.trim());
}
