/** Keep the first intro visible while React renders behind it. Never delay imports. */
export function prepareIntro(): () => void {
  const screen = document.getElementById('boot-screen');
  const root = document.getElementById('root');
  if (!screen) { root?.removeAttribute('inert'); return () => {}; }
  const sessionKey = 'nightreign.intro.seen.v1';
  let seen = false;
  try { seen = sessionStorage.getItem(sessionKey) === '1'; } catch { /* storage optional */ }
  const started = Number(screen.dataset.started ?? performance.now());
  let ready = false;
  let finished = false;
  let timer: number | undefined;
  const finish = () => {
    if (finished || !ready) return;
    finished = true;
    clearTimeout(timer);
    const restoreFocus = screen.contains(document.activeElement);
    screen.remove();
    root?.removeAttribute('inert');
    document.removeEventListener('nr-intro-skip', skip);
    try { sessionStorage.setItem(sessionKey, '1'); } catch { /* storage optional */ }
    if (restoreFocus) root?.querySelector<HTMLElement>('button, a, input')?.focus();
  };
  const skip = () => {
    if (ready) finish();
    else {
      const button = screen.querySelector('button');
      if (button) button.textContent = '正在进入…';
    }
  };
  document.addEventListener('nr-intro-skip', skip);
  return () => {
    if (ready) return;
    ready = true;
    const remaining = seen || screen.dataset.skip === 'true' ? 0 : Math.max(0, 2000 - (performance.now() - started));
    if (remaining === 0) finish();
    else timer = window.setTimeout(finish, remaining);
  };
}
