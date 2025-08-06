import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const suscripcionService = {
  crearSuscripcion: async (suscripcionData) => {
    try {
      console.log('📡 Enviando petición de creación de suscripción...');
      console.log('📋 Datos enviados:', suscripcionData);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.post(`${API_URL}/suscripciones/`, suscripcionData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Respuesta del servidor:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en crearSuscripcion:', error);
      
      if (error.response) {
        // El servidor respondió con un código de error
        console.error('📊 Status:', error.response.status);
        console.error('📋 Headers:', error.response.headers);
        console.error('📄 Data:', error.response.data);
        
        throw error.response.data || { message: 'Error al crear suscripción' };
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        console.error('🌐 No se recibió respuesta del servidor');
        throw { message: 'No se pudo conectar con el servidor' };
      } else {
        // Algo más causó el error
        console.error('💥 Error en la petición:', error.message);
        throw { message: error.message || 'Error al crear suscripción' };
      }
    }
  },

  obtenerMisSuscripciones: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/suscripciones/mis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener suscripciones' };
    }
  },

  obtenerSuscripcionesPorFecha: async (fecha, canchaId) => {
    try {
      console.log('📅 Obteniendo suscripciones para fecha:', fecha, 'cancha:', canchaId);
      const response = await axios.get(`${API_URL}/suscripciones/fecha/${fecha}`, {
        params: { cancha_id: canchaId }
      });
      console.log('📅 Suscripciones encontradas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener suscripciones por fecha:', error);
      return [];
    }
  },

  cancelarSuscripcion: async (suscripcionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/suscripciones/${suscripcionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al cancelar suscripción' };
    }
  },

  actualizarDescuentoSuscripcion: async (suscripcionId, descuento) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/suscripciones/${suscripcionId}/descuento`, 
        { descuento }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al actualizar descuento de suscripción:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Error al actualizar descuento de suscripción' };
    }
  },

  actualizarEstadoPagoSuscripcion: async (suscripcionId, estadoPago) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/suscripciones/${suscripcionId}/estado-pago`, 
        { estado_pago: estadoPago }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al actualizar estado de pago de suscripción:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Error al actualizar estado de pago de suscripción' };
    }
  },

  actualizarEstadoSuscripcion: async (suscripcionId, estado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/suscripciones/${suscripcionId}/estado`, 
        { estado }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al actualizar estado de suscripción:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Error al actualizar estado de suscripción' };
    }
  },

  actualizarPrecioSuscripcion: async (suscripcionId, precio) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/suscripciones/${suscripcionId}/precio`, 
        { precio }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al actualizar precio de suscripción:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Error al actualizar precio de suscripción' };
    }
  },

  // Calcular precio estimado basado en precios por deporte y descuentos
  calcularPrecioEstimado: (preciosDeportes, deporte, diasPorSemana = 1, descuento = 0) => {
    const precioPorHora = preciosDeportes[deporte] || 0;
    if (precioPorHora === 0) {
      return 0;
    }
    
    const horasPorSemana = 1;
    const semanasPorMes = 4.33;
    
    const precioSinDescuento = precioPorHora * horasPorSemana * diasPorSemana * semanasPorMes;
    const precioConDescuento = precioSinDescuento * (1 - descuento / 100);
    
    return Math.round(precioConDescuento * 100) / 100;
  },

  // Obtener precio de un deporte específico desde el backend
  obtenerPrecioDeporte: async (canchaId, deporte) => {
    try {
      const response = await axios.get(`${API_URL}/canchas/${canchaId}/precio/${deporte}`);
      return response.data.precio;
    } catch (error) {
      console.error('Error al obtener precio del deporte:', error);
      return 0;
    }
  },

  // Calcular precio final con descuentos desde el backend
  calcularPrecioFinal: async (canchaId, deporte, duracionHoras, esSuscripcion = false) => {
    try {
      console.log('💰 Calculando precio final...');
      console.log('📋 Parámetros:', { canchaId, deporte, duracionHoras, esSuscripcion });
      
      const response = await axios.get(`${API_URL}/canchas/${canchaId}/calcular-precio`, {
        params: {
          deporte,
          duracion_horas: duracionHoras,
          es_suscripcion: esSuscripcion
        }
      });
      
      console.log('✅ Precio calculado:', response.data);
      return response.data.precio_final;
    } catch (error) {
      console.error('❌ Error al calcular precio final:', error);
      
      if (error.response) {
        console.error('📊 Status:', error.response.status);
        console.error('📄 Data:', error.response.data);
      }
      
      // Retornar un precio por defecto en caso de error
      console.warn('⚠️ Usando precio por defecto debido a error');
      return 24000; // Precio por defecto para básquet
    }
  },

  reactivarSuscripcion: async (suscripcionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/suscripciones/${suscripcionId}/reactivar`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error al reactivar suscripción:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Error al reactivar suscripción' };
    }
  }
};