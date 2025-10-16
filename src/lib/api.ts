const API_BASE = 'https://functions.poehali.dev';

const AUTH_URL = `${API_BASE}/95aa1336-3257-469f-8078-a755bbcf7a84`;
const MESSAGES_URL = `${API_BASE}/98b5613c-115f-4715-88eb-b32f0f75f520`;
const CONTACTS_URL = `${API_BASE}/2e0f5a3f-e4d1-40f4-bdc6-7edea4719a56`;
const CHATS_URL = `${API_BASE}/d5ad54d1-73a7-44c6-8c21-6c3235d63f29`;
const FAVORITES_URL = `${API_BASE}/84354332-d4ae-48ea-a818-ca44a164982f`;
const CALLS_URL = `${API_BASE}/calls`;

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
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('session_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    },
    
    async loginWithGoogle(googleToken: string) {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ google_token: googleToken }),
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('session_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    },

    loadSession() {
      const token = localStorage.getItem('session_token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        return { user: JSON.parse(userStr), token };
      }
      return null;
    },

    logout() {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');
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
    
    async createGroup(userId: string, groupName: string, memberIds: string[]) {
      const response = await fetch(CHATS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ 
          isGroup: true, 
          groupName, 
          memberIds: memberIds.map(id => parseInt(id))
        }),
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

    async send(userId: string, chatId: string, text: string, isVoice = false, voiceDuration?: number, mediaUrl?: string, mediaType?: string) {
      const response = await fetch(MESSAGES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ chatId, text, isVoice, voiceDuration, mediaUrl, mediaType }),
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

  favorites: {
    async getAll(userId: string) {
      const response = await fetch(FAVORITES_URL, {
        headers: {
          'X-User-Id': userId,
        },
      });
      return response.json();
    },

    async add(userId: string, messageId: string) {
      const response = await fetch(FAVORITES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ messageId }),
      });
      return response.json();
    },

    async remove(userId: string, messageId: string) {
      const response = await fetch(`${FAVORITES_URL}?message_id=${messageId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId,
        },
      });
      return response.json();
    },
  },

  calls: {
    async initiate(userId: string, targetUserId: string, callType: 'voice' | 'video') {
      const response = await fetch(CALLS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ targetUserId, callType }),
      });
      return response.json();
    },

    async accept(userId: string, callId: string) {
      const response = await fetch(`${CALLS_URL}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ callId }),
      });
      return response.json();
    },

    async end(userId: string, callId: string) {
      const response = await fetch(`${CALLS_URL}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ callId }),
      });
      return response.json();
    },
  },
};