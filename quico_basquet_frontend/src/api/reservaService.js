import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const reservaService = {
  crearReserva: async (reservaData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/reservas/`, reservaData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear reserva' };
    }
  },

  obtenerMisReservas: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reservas/mis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo mis reservas:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Error al obtener reservas' };
    }
  },

  cancelarReserva: async (reservaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/reservas/${reservaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al cancelar reserva' };
    }
  },

  obtenerReservasPorCanchaYFecha: async (canchaId, fecha) => {
    try {
      const response = await axios.get(`${API_URL}/reservas/cancha/${canchaId}?date=${fecha}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener reservas por cancha y fecha' };
    }
  },

  obtenerReservasPorFecha: async (fecha, canchaId) => {
    try {
      const response = await axios.get(`${API_URL}/reservas/fecha/${fecha}?cancha_id=${canchaId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener reservas por fecha' };
    }
  },

  obtenerTodasLasReservas: async (fecha = null) => {
    try {
      const token = localStorage.getItem('token');
      const params = fecha ? { fecha } : {};
      const response = await axios.get(`${API_URL}/reservas/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      console.log('📊 Reservas y suscripciones obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reservas:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Error al obtener todas las reservas' };
    }
  },

  actualizarEstadoReserva: async (reservaId, estado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/reservas/${reservaId}/estado`, 
        { estado }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar estado de reserva' };
    }
  },

  actualizarEstadoPagoReserva: async (reservaId, estadoPago) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/reservas/${reservaId}/estado-pago`, 
        { estado_pago: estadoPago }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al actualizar estado de pago:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Error al actualizar estado de pago' };
    }
  },

  actualizarPrecioReserva: async (reservaId, precio) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/reservas/${reservaId}/precio`, 
        { precio }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al actualizar precio de reserva:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Error al actualizar precio de reserva' };
    }
  },

  reactivarReserva: async (reservaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/reservas/${reservaId}/reactivar`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al reactivar reserva:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Error al reactivar reserva' };
    }
  }
};