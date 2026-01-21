interface CursorData {
  x: number;
  y: number;
  username: string;
}

const cursors = new Map<string, CursorData>();
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number | null = null;

export function initCanvas(): void {
  canvas = document.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
  }
  
  ctx = canvas.getContext('2d');
  
  const resize = () => {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };
  
  window.addEventListener('resize', resize);
  resize();
}

function render() {
  if (ctx && canvas) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // WASM will draw cursor visuals here later
  }
  animationFrameId = requestAnimationFrame(render);
}

export function startRenderLoop(): void {
  if (animationFrameId === null) {
    render();
  }
}

export function stopRenderLoop(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

export function updateCursor(id: string, x: number, y: number): void {
  const cursor = cursors.get(id);
  if (cursor) {
    cursor.x = x;
    cursor.y = y;
  }
}

export function addCursor(id: string, username: string): void {
  if (!cursors.has(id)) {
    cursors.set(id, { x: 0, y: 0, username });
  }
}

export function removeCursor(id: string): void {
  cursors.delete(id);
}

export function getCursorData(): Map<string, CursorData> {
  return cursors;
}

// For compatibility with any existing calls that might not have been updated yet
export function clearAllCursors(): void {
  cursors.clear();
}
