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
    // Agregar hora en punto
    timeSlots.push(hour.toString().padStart(2, '0') + ':00');
    // Agregar media hora (excepto para las 23:00 que es el último horario)
    if (hour < 23) {
      timeSlots.push(hour.toString().padStart(2, '0') + ':30');
    }
  }

  // Días de la semana para navegación (5 días por vista)
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

  // Obtener solo 5 días para mostrar (con navegación)
  const startIndex = currentWeekIndex * 5;
  const weekDays = allDays.slice(startIndex, startIndex + 5);

  // Verificar si un día está seleccionado (fuera del loop para evitar recálculos)
  const isDateSelected = (date) => {
    const isSelected = date.toDateString() === selectedDate.toDateString();
    if (isSelected) {
      console.log('✅ Día seleccionado:', date.toDateString());
    }
    return isSelected;
  };

  const canGoPrevious = currentWeekIndex > 0;
  const canGoNext = startIndex + 5 < allDays.length;

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
        // Formatear la fecha actual para comparar
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const fechaActual = `${year}-${month}-${day}`;
        
        // Si la reserva fue creada para la fecha actual, actualizar
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

  const isTimeSlotBooked = (time) => {
    // Verificar si hay una reserva en este horario
    const isReserved = reservas.some(reserva => {
      const reservaStart = reserva.hora_inicio.substring(0, 5);
      const reservaEnd = reserva.hora_fin.substring(0, 5);
      const timeSlot = time.substring(0, 5);
      
      const isInRange = timeSlot >= reservaStart && timeSlot < reservaEnd;
      
      if (isInRange) {
      }
      
      return isInRange;
    });
    
    // Verificar si hay una suscripción en este horario
    const isSubscribed = suscripciones.some(suscripcion => {
      const suscripcionStart = suscripcion.hora_inicio.substring(0, 5);
      const suscripcionEnd = suscripcion.hora_fin.substring(0, 5);
      const timeSlot = time.substring(0, 5);
      
      const isInRange = timeSlot >= suscripcionStart && timeSlot < suscripcionEnd;
      
      if (isInRange) {
      }
      
      return isInRange;
    });
    
    return isReserved || isSubscribed;
  };

  const handleTimeClick = (time) => {
    if (!isTimeSlotBooked(time)) {
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
            const isSelected = selectedTime === time;
            
            return (
              <div
                key={time}
                className={`time-slot ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleTimeClick(time)}
              >
                                 <div className="time-slot-content">
                   <span className="time-hour">{getTimeDisplay(time)}</span>
                   {isBooked && <span className="booked-text">Ocupado</span>}
                   {isSelected && !isBooked && (
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
            <div className="legend-color selected"></div>
            <span>Seleccionado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeGridSelector; 