/** Plain sign-in messages that say what to do next. Keyed by Supabase auth error codes. */
export function signInMessage(code: string): string {
  switch (code) {
    case "invalid_credentials":
      return "That email and password don’t match. Check both and try again, or ask your registrar to reset your password.";
    case "email_not_confirmed":
      return "This account isn’t activated yet. Ask your registrar to activate it.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Wait a minute, then try again.";
    case "user_banned":
      return "This account is blocked. Contact your registrar.";
    case "not_configured":
      return "Student sign-in isn’t set up on this server yet. Try again later.";
    default:
      return "We couldn’t sign you in right now. Check your connection and try again.";
  }
}
