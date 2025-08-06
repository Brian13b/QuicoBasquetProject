import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const authService = {
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/users/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al registrar usuario' };
    }
  },

  registerWithFirebaseToken: async (userData, firebaseToken) => {
    try {
      const response = await axios.post(`${API_URL}/users/auth/register-firebase`, userData, {
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al registrar usuario con Firebase' };
    }
  },

  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/users/auth/login`, {
        username: email,
        password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al iniciar sesión' };
    }
  },

  loginWithFirebaseToken: async (firebaseToken) => {
    try {
      const response = await axios.post(`${API_URL}/users/auth/firebase`, {}, {
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      // Mejorar el manejo de errores específicos
      if (error.response?.status === 401) {
        const errorDetail = error.response?.data?.detail || 'Token de Firebase inválido';
        throw { message: errorDetail, status: 401 };
      } else if (error.response?.status === 503) {
        throw { message: 'Servicio de Firebase no disponible', status: 503 };
      } else {
        throw error.response?.data || { message: 'Error al validar token de Firebase' };
      }
    }
  },

  loginWithGoogle: async (googleToken) => {
    try {
      const response = await axios.post(`${API_URL}/users/auth/google`, { token: googleToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al iniciar sesión con Google' };
    }
  },

  getCurrentUser: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener usuario' };
    }
  },

  getAllUsers: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/users/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener usuarios' };
    }
  },

  sendNotification: async (notificationData, token) => {
    try {
      const response = await axios.post(`${API_URL}/notifications/send`, notificationData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al enviar notificación' };
    }
  },

  getUsersList: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener lista de usuarios' };
    }
  },

  bloquearUsuario: async (userId, bloqueado, token) => {
    try {
      const response = await axios.patch(`${API_URL}/users/${userId}/bloquear`, 
        { bloqueado }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al bloquear/desbloquear usuario' };
    }
  }
};

export const sendNotification = async (notificationData) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(notificationData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Error al enviar notificación')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export const getNotificationHistory = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/notifications/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Error al obtener historial')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export const getNotificationStats = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/notifications/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Error al obtener estadísticas')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export const getUsersList = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/admin/usuarios`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Error al obtener lista de usuarios')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}