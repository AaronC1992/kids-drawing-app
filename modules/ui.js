// UI utilities for Kids Drawing App
export function setActiveToolButton(toolName) {
  const all = document.querySelectorAll('.tool-btn[data-tool]');
  all.forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.tool-btn[data-tool="${toolName}"]`);
  if (btn) btn.classList.add('active');
}

export function showBadge(id, text) {
  let badge = document.getElementById(id);
  if (!badge) {
    badge = document.createElement('div');
    badge.id = id;
    Object.assign(badge.style, {
      position: 'fixed',
      bottom: '12px',
      right: '12px',
      padding: '6px 10px',
      borderRadius: '12px',
      background: '#000000a0',
      color: '#fff',
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      fontSize: '12px',
      zIndex: 4000
    });
    document.body.appendChild(badge);
  }
  badge.textContent = text;
}

export function hideBadge(id) {
  const badge = document.getElementById(id);
  if (badge && badge.parentElement) badge.parentElement.removeChild(badge);
}
