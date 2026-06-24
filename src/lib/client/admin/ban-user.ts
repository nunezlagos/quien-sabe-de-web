// @ts-nocheck
export function initBanButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.js-ban-user');
    if (!btn) return;
    const userId = btn.dataset.userId;
    const userName = btn.dataset.userName;
    const currentStatus = btn.dataset.currentStatus;
    const action = currentStatus === 'active' ? 'ban' : 'unban';
    const msg = action === 'ban'
      ? `¿Banear a ${userName}? No podrá iniciar sesión.`
      : `¿Desbanear a ${userName}?`;
    if (!confirm(msg)) return;
    const res = await fetch('/api/v1/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: Number(userId), action }),
    });
    if (res.ok) location.reload();
    else alert('Error al actualizar usuario');
  });
}
