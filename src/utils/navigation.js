let navigateFn = null;

export function setNavigate(fn) {
  navigateFn = fn;
}

export function navigateToHome() {
  if (navigateFn) navigateFn("/");
}
