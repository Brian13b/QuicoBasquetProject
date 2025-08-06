import { useState, useEffect } from 'react';
import { reservaService } from '../api/reservaService';
import { useAuth } from '../context/AuthContext';
import '../styles/components/timeslot.css';

function TimeSlot({ selectedDate, canchaId, onTimeSelect }) {
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Generar horarios de 8:00 a 23:00 cada 30 minutos
  useEffect(() => {
    const slots = [];
    for (let hour = 8; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 23) slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    setTimeSlots(slots);
  }, []);

  // Obtener reservas para la cancha y fecha seleccionada
  useEffect(() => {
    if (!canchaId || !selectedDate) return;

    const fetchBookedSlots = async () => {
      setLoading(true);
      try {
        // Formatear fecha usando métodos locales para evitar problemas de UTC
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const reservas = await reservaService.obtenerReservasPorCanchaYFecha(
          canchaId, 
          dateStr
        );
        const booked = reservas.map(r => r.hora_inicio);
        setBookedSlots(booked);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookedSlots();
  }, [canchaId, selectedDate, token]);

  return (
    <div className="time-slots-container">
      {loading ? (
        <p>Cargando horarios...</p>
      ) : (
        <div className="time-slots-grid">
          {timeSlots.map((time) => {
            const isBooked = bookedSlots.includes(time);
            return (
              <button
                key={time}
                className={`time-slot ${isBooked ? 'booked' : 'available'}`}
                onClick={() => !isBooked && onTimeSelect(time)}
                disabled={isBooked}
              >
                {time}
                {isBooked && <span className="booked-label">Reservado</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TimeSlot;