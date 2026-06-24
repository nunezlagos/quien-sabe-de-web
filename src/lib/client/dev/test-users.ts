// src/lib/client/dev/test-users.ts
// Lógica de la página de testing dev-only /test-users.
// Extraído de src/pages/test-users.astro (regla R2: sin JS inline).
// Solo se ejecuta si import.meta.env.DEV === true.

const API_USERS = '/api/v1/users';

interface UserJSON {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'provider' | 'admin';
}

export function inicializarTestUsers(): void {
  const form = document.getElementById('createUserForm') as HTMLFormElement | null;
  const usersList = document.getElementById('usersList');
  const loading = document.getElementById('loading');
  const messageDiv = document.getElementById('formMessage');
  const refreshBtn = document.getElementById('refreshBtn');

  if (!usersList || !loading) return;

  form?.addEventListener('submit', (e) => handleCreate(e, form, messageDiv, loading));
  refreshBtn?.addEventListener('click', () => fetchUsers(usersList, loading));

  if (!(window as unknown as { hasLoadedUsers?: boolean }).hasLoadedUsers) {
    (window as unknown as { hasLoadedUsers: boolean }).hasLoadedUsers = true;
    fetchUsers(usersList, loading);
  }
}

async function fetchUsers(usersList: HTMLElement, loading: HTMLElement): Promise<void> {
  loading.style.display = 'block';
  try {
    const res = await fetch(API_USERS);
    const json = await res.json();
    usersList.innerHTML = '';

    if (json.success && Array.isArray(json.data)) {
      if (json.data.length === 0) {
        usersList.innerHTML = '<li class="py-4 text-center text-gray-500">No users registered</li>';
      } else {
        usersList.innerHTML = (json.data as UserJSON[]).map(renderUserItem).join('');
      }
    } else {
      usersList.innerHTML = `<li class="text-red-500 p-2">Error loading data: ${json.error || 'Unknown'}</li>`;
    }
  } catch (err) {
    console.error(err);
    usersList.innerHTML = '<li class="text-red-500 p-2">Connection error</li>';
  } finally {
    loading.style.display = 'none';
  }
}

function renderUserItem(user: UserJSON): string {
  return `
    <li class="py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
          ${user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <a href="/api/v1/users/${user.id}" target="_blank" class="font-bold text-gray-800 hover:text-orange-500 hover:underline cursor-pointer" title="View User JSON">${user.name}</a>
          <p class="text-xs text-gray-500">${user.email}</p>
        </div>
      </div>
      <span class="px-2 py-1 text-xs rounded-full ${roleColor(user.role)}">
        ${user.role}
      </span>
    </li>
  `;
}

function roleColor(role: UserJSON['role']): string {
  switch (role) {
    case 'admin': return 'bg-purple-100 text-purple-700';
    case 'provider': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

async function handleCreate(
  e: Event,
  form: HTMLFormElement,
  messageDiv: HTMLElement | null,
  loading: HTMLElement
): Promise<void> {
  e.preventDefault();
  if (!messageDiv) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  messageDiv.textContent = 'Sending...';
  messageDiv.className = 'mt-4 text-sm text-gray-500 block';

  try {
    const res = await fetch(API_USERS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (res.ok && json.success) {
      messageDiv.textContent = 'User created successfully!';
      messageDiv.className = 'mt-4 text-sm text-green-600 font-bold block';
      form.reset();
      loading.style.display = 'block';
      const usersList = document.getElementById('usersList');
      if (usersList) await fetchUsers(usersList, loading);
    } else {
      const errorMsg = Array.isArray(json.error)
        ? json.error.join(', ')
        : (json.error || 'Unknown error');
      messageDiv.textContent = `Error: ${errorMsg}`;
      messageDiv.className = 'mt-4 text-sm text-red-600 font-bold block';
    }
  } catch (err) {
    console.error(err);
    messageDiv.textContent = 'Network error creating user';
    messageDiv.className = 'mt-4 text-sm text-red-600 font-bold block';
  }
}