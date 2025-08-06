import { createContext, useContext, useState } from 'react';
import { reservaService } from '../api/reservaService';
import { useAuth } from './AuthContext';

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createReserva = async (reservaData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservaService.crearReserva(reservaData);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getMyReservas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservaService.obtenerMisReservas();
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const cancelReserva = async (reservaId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservaService.cancelarReserva(reservaId);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    createReserva,
    getMyReservas,
    cancelReserva,
    loading,
    error
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}