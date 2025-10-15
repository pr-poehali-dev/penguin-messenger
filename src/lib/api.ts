const API_BASE = 'https://functions.poehali.dev';

const AUTH_URL = `${API_BASE}/95aa1336-3257-469f-8078-a755bbcf7a84`;
const MESSAGES_URL = `${API_BASE}/98b5613c-115f-4715-88eb-b32f0f75f520`;
const CONTACTS_URL = `${API_BASE}/2e0f5a3f-e4d1-40f4-bdc6-7edea4719a56`;
const CHATS_URL = `${API_BASE}/d5ad54d1-73a7-44c6-8c21-6c3235d63f29`;

export const api = {
  auth: {
    async login(phone: string, name: string) {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, name }),
      });
      return response.json();
    },
  },

  chats: {
    async getAll(userId: string) {
      const response = await fetch(CHATS_URL, {
        headers: {
          'X-User-Id': userId,
        },
      });
      return response.json();
    },

    async create(userId: string, contactId: string) {
      const response = await fetch(CHATS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ contactId }),
      });
      return response.json();
    },
  },

  messages: {
    async getAll(userId: string, chatId: string) {
      const response = await fetch(`${MESSAGES_URL}?chat_id=${chatId}`, {
        headers: {
          'X-User-Id': userId,
        },
      });
      return response.json();
    },

    async send(userId: string, chatId: string, text: string) {
      const response = await fetch(MESSAGES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ chatId, text }),
      });
      return response.json();
    },
  },

  contacts: {
    async getAll(userId: string) {
      const response = await fetch(CONTACTS_URL, {
        headers: {
          'X-User-Id': userId,
        },
      });
      return response.json();
    },
  },
};
