// src/services/authService.js
async function login(email, password) {
  const res = await fetch(`/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data.user;
}

async function getProfile() {
  const res = await fetch(`/api/profile`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Not authenticated');
  const data = await res.json();
  return { id: data.userId, role: data.role };
}

async function logout() {
  await fetch(`/api/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

const authService = {
  login,
  getProfile,
  logout,
};

export default authService;
