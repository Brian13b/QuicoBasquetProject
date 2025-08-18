import React, { useState, useEffect } from 'react';
import { reservaService } from '../api/reservaService';
import { suscripcionService } from '../api/suscripcionService';
import '../styles/components/timeGridSelector.css';

function TimeGridSelector({ 
  selectedDate, 
  onDateChange, 
  onTimeSelect, 
  canchaId, 
  deporte,
  canchaNombre,
  canchaDescripcion,
  onDeporteChange
}) {
  const [reservas, setReservas] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  // Horarios disponibles cada 30 minutos (de 8:00 AM a 23:00 PM)
  const timeSlots = [];
  for (let hour = 8; hour <= 23; hour++) {
    timeSlots.push(hour.toString().padStart(2, '0') + ':00');
    if (hour < 23) {
      timeSlots.push(hour.toString().padStart(2, '0') + ':30');
    }
  }

  // Días de la semana para navegación
  const allDays = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    allDays.push({
      date: date,
      day: date.getDate(),
      month: date.getMonth() + 1,
      isToday: i === 0
    });
  }

  // Obtener solo 5 días para mostrar
  const startIndex = currentWeekIndex * 5;
  const weekDays = allDays.slice(startIndex, startIndex + 5);

  // Verificar si un día está seleccionado
  const isDateSelected = (date) => {
    const isSelected = date.toDateString() === selectedDate.toDateString();
    if (isSelected) {
    }
    return isSelected;
  };

  const canGoPrevious = currentWeekIndex > 0;
  const canGoNext = startIndex + 5 < allDays.length;

  // Función para verificar si un horario está en el pasado
  const isTimeSlotInPast = (time) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    // Si es un día anterior, todos los horarios están en el pasado
    if (selectedDateOnly < today) {
      return true;
    }
    
    // Si es hoy, verificar la hora
    if (selectedDateOnly.getTime() === today.getTime()) {
      const [hours, minutes] = time.split(':').map(Number);
      const timeSlotDate = new Date();
      timeSlotDate.setHours(hours, minutes, 0, 0);
      
      // Agregar una hora de margen (bloquear hasta una hora después de la hora actual)
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      return timeSlotDate <= oneHourLater;
    }
    
    return false;
  };

  useEffect(() => {
    if (canchaId && selectedDate) {
      fetchData();
    }
  }, [canchaId, selectedDate]);

  // Escuchar eventos de reserva creada para actualizar la vista
  useEffect(() => {
    const handleReservaCreada = (event) => {
      const { fecha, canchaId: eventCanchaId } = event.detail;
      if (eventCanchaId === canchaId) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const fechaActual = `${year}-${month}-${day}`;
        
        if (fecha === fechaActual) {
          fetchData();
        }
      }
    };

    const handleSuscripcionCreada = (event) => {
      const { canchaId: eventCanchaId } = event.detail;
      if (eventCanchaId === canchaId) {
        fetchData();
      }
    };

    window.addEventListener('reservaCreada', handleReservaCreada);
    window.addEventListener('suscripcionCreada', handleSuscripcionCreada);
    
    return () => {
      window.removeEventListener('reservaCreada', handleReservaCreada);
      window.removeEventListener('suscripcionCreada', handleSuscripcionCreada);
    };
  }, [canchaId, selectedDate]);

  const fetchData = async () => {
    if (!canchaId || !selectedDate) return;
    
    setLoading(true);
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const fecha = `${year}-${month}-${day}`;
      
      // Obtener reservas y suscripciones en paralelo
      const [reservasData, suscripcionesData] = await Promise.all([
        reservaService.obtenerReservasPorFecha(fecha, canchaId),
        suscripcionService.obtenerSuscripcionesPorFecha(fecha, canchaId)
      ]);
      
      setReservas(reservasData);
      setSuscripciones(suscripcionesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setReservas([]);
      setSuscripciones([]);
    } finally {
      setLoading(false);
    }
  };

  const toMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isTimeSlotBooked = (time) => {
    // Verificar si hay una reserva en este horario
    const timeSlotMinutes = toMinutes(time.substring(0, 5));

    const isReserved = reservas.some(reserva => {
      const start = toMinutes(reserva.hora_inicio.substring(0, 5));
      let end = toMinutes(reserva.hora_fin.substring(0, 5));
  
      if (end <= start) {
        end += 1440; // suma 24 horas si cruza la medianoche
      }
  
      let current = timeSlotMinutes;
      if (current < start) {
        current += 1440; // también suma 24h para comparar bien con reserva que cruza medianoche
      }
  
      return current >= start && current < end;
    });  
    
    // Verificar si hay una suscripción en este horario
    const isSubscribed = suscripciones.some(suscripcion => {
      const start = toMinutes(suscripcion.hora_inicio.substring(0, 5));
      let end = toMinutes(suscripcion.hora_fin.substring(0, 5));
  
      if (end <= start) {
        end += 1440;
      }
  
      let current = timeSlotMinutes;
      if (current < start) {
        current += 1440;
      }
  
      return current >= start && current < end;
    });
  
    return isReserved || isSubscribed;
  };

  const handleTimeClick = (time) => {
    // Verificar si el horario está en el pasado o está reservado
    if (!isTimeSlotInPast(time) && !isTimeSlotBooked(time)) {
      setSelectedTime(time);
      onTimeSelect(time);
    }
  };

  const handleDateClick = (date) => {
    onDateChange(date);
    setSelectedTime(null);
  };

  const handlePreviousWeek = () => {
    if (canGoPrevious) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    }
  };

  const handleNextWeek = () => {
    if (canGoNext) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    }
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-AR', { 
        weekday: 'short', 
        day: 'numeric',
        month: 'numeric'
      });
    }
  };

  const getTimeDisplay = (time) => {
    return time;
  };

  return (
    <div className="time-grid-selector">
      {/* Header con información de la cancha */}
      <div className="selector-header">
        <div className="court-info-header">
          <h3 className="court-title">{canchaNombre}</h3>
          <p className="court-subtitle">{canchaDescripcion}</p>
        </div>
        
        <div className="sport-selector">
          <select 
            value={deporte} 
            onChange={(e) => onDeporteChange(e.target.value)}
            className="sport-select"
          >
            <option value="basquet">🏀 BÁSQUET</option>
            <option value="voley">🏐 VOLEY</option>
          </select>
        </div>
      </div>

      {/* Navegación de días */}
      <div className="week-navigation">
        <button 
          className={`nav-arrow ${!canGoPrevious ? 'disabled' : ''}`}
          onClick={handlePreviousWeek}
          disabled={!canGoPrevious}
          aria-label="Semana anterior"
        >
          ‹
        </button>
         
         <div className="days-container">
           {weekDays.map((day, index) => (
             <button
               key={index}
               className={`day-button ${day.isToday ? 'today' : ''} ${isDateSelected(day.date) ? 'selected' : ''}`}
               onClick={() => handleDateClick(day.date)}
             >
               <span className="day-name">{formatDate(day.date)}</span>
               <span className="day-number">{day.day}</span>
             </button>
           ))}
         </div>
         
         <button 
           className={`nav-arrow ${!canGoNext ? 'disabled' : ''}`}
           onClick={handleNextWeek}
           disabled={!canGoNext}
           aria-label="Semana siguiente"
         >
           ›
         </button>
       </div>

      {/* Fecha seleccionada */}
      <div className="selected-date-display">
        <div className="date-info">
          <span className="calendar-icon">📅</span>
          <span className="current-date">
            {selectedDate.toLocaleDateString('es-AR', { 
              weekday: 'long', 
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Grid de horarios */}
      <div className="time-grid-container">
        <div className="time-slots-grid">
          {timeSlots.map(time => {
            const isBooked = isTimeSlotBooked(time);
            const isInPast = isTimeSlotInPast(time);
            const isSelected = selectedTime === time;
            const isDisabled = isBooked || isInPast;
            
            return (
              <div
                key={time}
                className={`time-slot ${isBooked ? 'booked' : ''} ${isInPast ? 'past' : ''} ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => handleTimeClick(time)}
              >
                <div className="time-slot-content">
                  <span className="time-hour">{getTimeDisplay(time)}</span>
                  {isBooked && <span className="booked-text">Ocupado</span>}
                  {isInPast && <span className="past-text">Pasado</span>}
                  {isSelected && !isDisabled && (
                    <span className="selected-text">Seleccionado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Información y leyenda */}
      <div className="selector-footer">
        <div className="info-text">
          <span className="info-icon">ℹ</span>
          Selecciona fecha, horario y deporte para tu reserva
        </div>
        
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color available"></div>
            <span>Disponible</span>
          </div>
          <div className="legend-item">
            <div className="legend-color booked"></div>
            <span>Ocupado</span>
          </div>
          <div className="legend-item">
            <div className="legend-color past"></div>
            <span>Pasado</span>
          </div>
          <div className="legend-item">
            <div className="legend-color selected"></div>
            <span>Seleccionado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeGridSelector; 