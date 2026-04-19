export function buildSubjectSnippet(subjects: string[], email: string): string {
  if (subjects.length > 0) {
    return subjects.slice(0, 2).join(' · ')
  }
  return email.split('@')[1] ?? email
}
