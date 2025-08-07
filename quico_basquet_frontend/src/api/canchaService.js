import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const canchaService = {
  getCanchas: async () => {
    try {
      const response = await axios.get(`${API_URL}/canchas/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener canchas' };
    }
  },

  getCanchaById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/canchas/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener cancha' };
    }
  },

  updatePrecios: async (canchaId, preciosData, token) => {
    try {
      const response = await axios.put(`${API_URL}/canchas/${canchaId}/precios`, preciosData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Precios actualizados exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar precios:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Error al actualizar precios' };
    }
  },

  getPrecioDeporte: async (canchaId, deporte) => {
    try {
      const response = await axios.get(`${API_URL}/canchas/${canchaId}/precio/${deporte}`);
      return response.data.precio;
    } catch (error) {
      console.error('Error al obtener precio del deporte:', error);
      return 0;
    }
  },

  getDescuentoDeporte: async (canchaId, deporte) => {
    try {
      const response = await axios.get(`${API_URL}/canchas/${canchaId}/descuento/${deporte}`);
      return response.data.descuento;
    } catch (error) {
      console.error('Error al obtener descuento del deporte:', error);
      return 0;
    }
  },

  getDescuentoSuscripcion: async (canchaId, deporte) => {
    try {
      const response = await axios.get(`${API_URL}/canchas/${canchaId}/descuento-suscripcion/${deporte}`);
      return response.data.descuento_suscripcion;
    } catch (error) {
      console.error('Error al obtener descuento de suscripción:', error);
      return 0;
    }
  },

  calcularPrecio: async (canchaId, deporte, duracionHoras, esSuscripcion = false) => {
    try {
      const response = await axios.get(`${API_URL}/canchas/${canchaId}/calcular-precio`, {
        params: {
          deporte,
          duracion_horas: duracionHoras,
          es_suscripcion: esSuscripcion
        }
      });
      return response.data.precio_final;
    } catch (error) {
      console.error('Error al calcular precio:', error);
      return 0;
    }
  },

  obtenerPreciosDescuentos: async (canchaId) => {
    try {
      const response = await axios.get(`${API_URL}/canchas/${canchaId}/precios-descuentos`);
      return response.data.precios_descuentos;
    } catch (error) {
      console.error('Error al obtener precios y descuentos:', error);
      return null;
    }
  }
};