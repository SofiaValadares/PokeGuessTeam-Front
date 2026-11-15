const MIN_FRAGMENT = 3;

export function usernameConflictsWithEmail(username: string, email: string): boolean {
  const user = username.trim().toLowerCase();
  const mail = email.trim().toLowerCase();
  if (!user || !mail) return false;
  if (user === mail || user.includes(mail)) return true;
  const at = mail.indexOf('@');
  const local = at > 0 ? mail.slice(0, at) : mail;
  if (local.length >= MIN_FRAGMENT && user.includes(local)) return true;
  const localCompact = local.replace(/[^a-z0-9]/g, '');
  const userCompact = user.replace(/[^a-z0-9]/g, '');
  return localCompact.length >= MIN_FRAGMENT && userCompact.includes(localCompact);
}

export const USERNAME_FROM_EMAIL_MESSAGE =
  'O nome de usuário não pode conter o e-mail nem trechos do e-mail.';
