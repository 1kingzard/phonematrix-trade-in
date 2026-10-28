export function passwordError(password: string, confirmation: string) {
  if (password.length < 6) return 'Password must be at least 6 characters long.';
  if (password !== confirmation) return 'Passwords do not match.';
  return null;
}

export function accountDestination(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !value.startsWith('/login') && !value.startsWith('/reset-password') ? value : '/account';
}