const cursors = new Map<string, HTMLDivElement>();

export function createCursor(id: string, username: string): void {
  if (cursors.has(id)) return;

  const el = document.createElement("div");
  el.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3L10 22L12.0513 15.8461C12.6485 14.0544 14.0544 12.6485 15.846 12.0513L22 10L3 3Z" stroke="#e5e5e5" stroke-width="2" stroke-linejoin="round"/>
        </svg>
        <span style="color:#e5e5e5;font-size:12px;margin-left:4px;">${username}</span>
    `;
  el.style.cssText =
    "position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999; display: flex; align-items: center;";
  document.body.appendChild(el);
  cursors.set(id, el);
}

export function updateCursor(id: string, x: number, y: number): void {
  const el = cursors.get(id);
  if (!el) return;

  el.style.transform = `translate(${x}px, ${y}px)`;
}

export function removeCursor(id: string): void {
  const el = cursors.get(id);
  if (!el) return;

  el.remove();
  cursors.delete(id);
}

export function clearAllCursors(): void {
  cursors.forEach((el) => el.remove());
  cursors.clear();
}