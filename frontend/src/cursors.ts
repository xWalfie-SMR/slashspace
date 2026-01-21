type CursorData = {
  x: number;
  y: number;
  username: string;
};

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number | null = null;

const cursors = new Map<string, CursorData>();

function handleResize(): void {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function renderLoop(): void {
  if (!ctx) return;

  // Clear canvas with black background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas!.width, canvas!.height);

  // WASM will draw cursor visuals here
  // TODO: Call WASM render function when available

  animationFrameId = requestAnimationFrame(renderLoop);
}

export function initCanvas(): void {
  if (canvas) return;

  canvas = document.createElement("canvas");
  canvas.className = "canvas-element";
  document.body.appendChild(canvas);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx = canvas.getContext("2d");

  window.addEventListener("resize", handleResize);
}

export function startRenderLoop(): void {
  if (animationFrameId) return;
  renderLoop();
}

export function stopRenderLoop(): void {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (canvas) {
    canvas.remove();
    canvas = null;
    ctx = null;
  }

  window.removeEventListener("resize", handleResize);
}

export function updateCursor(id: string, x: number, y: number): void {
  const cursor = cursors.get(id);
  if (!cursor) return;

  cursor.x = x;
  cursor.y = y;
}

export function addCursor(id: string, username: string): void {
  if (cursors.has(id)) return;

  cursors.set(id, {
    x: 0,
    y: 0,
    username,
  });
}

export function removeCursor(id: string): void {
  cursors.delete(id);
}

export function getCursorData(): Map<string, CursorData> {
  return cursors;
}

export function clearAllCursors(): void {
  cursors.clear();
}
