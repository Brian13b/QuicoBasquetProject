import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { canchaService } from '../api/canchaService';
import TimeGridSelector from './TimeGridSelector';
import BookingModal from './BookingModal';
import MultipleSubscriptionModal from './MultipleSubscriptionModal';
import AlertModal from './AlertModal';
import '../styles/components/reservation.css';

function Reservation() {
  const { currentUser } = useAuth();
  const { createReserva } = useBooking();
  
  const [canchas, setCanchas] = useState([]);
  const [loadingCanchas, setLoadingCanchas] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedCancha, setSelectedCancha] = useState(null);
  const [deporte, setDeporte] = useState('basquet');
  const [duration, setDuration] = useState(60);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMultipleSubscriptionModal, setShowMultipleSubscriptionModal] = useState(false);
  
  // Estados para el sistema de alertas
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
    autoClose: true
  });

  useEffect(() => {
    fetchCanchas();
  }, []);

  const fetchCanchas = async () => {
    try {
      setLoadingCanchas(true);
      const data = await canchaService.getCanchas();
      setCanchas(data);
      
      // Seleccionar automáticamente la primera cancha disponible para el deporte seleccionado
      if (data && data.length > 0) {
        const canchasFiltradas = data.filter(c => 
          c.deportes_permitidos && c.deportes_permitidos.includes(deporte)
        );
        if (canchasFiltradas.length > 0) {
          setSelectedCancha(canchasFiltradas[0].id);
        } else if (data.length > 0) {
          // Si no hay canchas para el deporte seleccionado, seleccionar la primera disponible
          setSelectedCancha(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error al cargar canchas:', error);
      showAlert('error', 'Error', 'No se pudieron cargar las canchas. Por favor, recarga la página.');
    } finally {
      setLoadingCanchas(false);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setShowBookingModal(true);
  };

  const showAlert = (type, title, message, autoClose = true) => {
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message,
      autoClose
    });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleSubmitReserva = async () => {
    if (!currentUser) {
      showAlert('error', 'Error de Autenticación', 'Debes iniciar sesión para crear una reserva.');
      return;
    }

    if (!selectedTime || !selectedCancha) {
      showAlert('error', 'Datos Incompletos', 'Por favor selecciona una cancha y un horario.');
      return;
    }

    const horaInicio = new Date(`2000-01-01T${selectedTime}`);
    const horaFin = new Date(horaInicio.getTime() + duration * 60000);
    
    // Formatear fecha de manera consistente con TimeGridSelector
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const fechaLocal = `${year}-${month}-${day}`;

    const reservaData = {
      cancha_id: selectedCancha,
      fecha: fechaLocal,
      hora_inicio: horaInicio.toTimeString().split(' ')[0].substring(0, 5),
      hora_fin: horaFin.toTimeString().split(' ')[0].substring(0, 5),
      deporte,
      metodo_pago: metodoPago
    };

    try {
      await createReserva(reservaData);
      showAlert('success', 'Reserva Creada', '¡Tu reserva ha sido creada exitosamente!');
      setShowBookingModal(false);
      
      // Forzar actualización del TimeGridSelector
      const event = new CustomEvent('reservaCreada', { detail: { fecha: fechaLocal, canchaId: selectedCancha } });
      window.dispatchEvent(event);
      
      setTimeout(() => {
        setSelectedTime(null);
      }, 3000);
    } catch (err) {
      console.error('❌ Error al crear reserva:', err);
      
      // Manejar diferentes tipos de errores con mensajes específicos
      let errorMessage = 'Error al crear la reserva';
      let errorTitle = 'Error';
      
      if (err.message) {
        if (err.message.includes('solapamiento') || err.message.includes('ocupado')) {
          errorTitle = 'Horario No Disponible';
          errorMessage = 'El horario seleccionado ya está reservado. Por favor, elige otro horario.';
        } else if (err.message.includes('horario') || err.message.includes('cierre')) {
          errorTitle = 'Horario Fuera de Rango';
          errorMessage = 'El horario seleccionado está fuera del horario de atención (8:00 AM - 12:00 AM). La última reserva posible es a las 23:00.';
        } else if (err.message.includes('duración') || err.message.includes('mínima')) {
          errorTitle = 'Duración Inválida';
          errorMessage = 'La duración de la reserva debe ser entre 60 y 120 minutos.';
        } else if (err.message.includes('bloqueado')) {
          errorTitle = 'Cuenta Bloqueada';
          errorMessage = 'Tu cuenta ha sido bloqueada. No puedes crear reservas.';
        } else {
          errorMessage = err.message;
        }
      }
      
      showAlert('error', errorTitle, errorMessage, false);
    }
  };

  // Calcular precio por hora según el deporte seleccionado
  const calcularPrecioPorHora = () => {
    if (!selectedCancha || !deporte) return 0;
    
    const cancha = canchas.find(c => c.id === selectedCancha);
    if (!cancha) return 0;
    
    if (deporte === 'basquet') {
      return cancha.precio_basquet || 0;
    } else if (deporte === 'voley') {
      return cancha.precio_voley || 0;
    }
    
    return 0;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const canchasFiltradas = canchas.filter(c => 
    c.deportes_permitidos && c.deportes_permitidos.includes(deporte)
  );

  return (
    <section className="reservation-section" id="reservas">
      <div className="container">
        <div className="section-header">
          <h2>Reservar Cancha</h2>
          <button 
            className="btn-subscription"
            onClick={() => setShowMultipleSubscriptionModal(true)}
          >
            Crear Suscripción
          </button>
        </div>

        <div className="reservation-controls">
          <div className="form-group">
            <label>Cancha:</label>
            <select 
              value={selectedCancha || ''} 
              onChange={(e) => setSelectedCancha(parseInt(e.target.value))}
              disabled={loadingCanchas || canchasFiltradas.length === 0}
            >
              {loadingCanchas ? (
                <option>Cargando canchas...</option>
              ) : canchasFiltradas.length === 0 ? (
                <option>No hay canchas disponibles</option>
              ) : (
                canchasFiltradas.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {selectedCancha && (
          <TimeGridSelector
             selectedDate={selectedDate}
             onDateChange={setSelectedDate}
             onTimeSelect={handleTimeSelect}
             canchaId={selectedCancha}
             deporte={deporte}
             canchaNombre={canchas.find(c => c.id === selectedCancha)?.nombre || 'Cancha'}
             canchaDescripcion={canchas.find(c => c.id === selectedCancha)?.descripcion || 'Cancha'}
             onDeporteChange={setDeporte}
           />
        )}

        {showBookingModal && (
          <BookingModal
            selectedTime={selectedTime}
            duration={duration}
            setDuration={setDuration}
            metodoPago={metodoPago}
            setMetodoPago={setMetodoPago}
            precioPorHora={calcularPrecioPorHora()}
            onConfirm={handleSubmitReserva}
            onCancel={() => setShowBookingModal(false)}
            deporte={deporte}
            canchaNombre={canchas.find(c => c.id === selectedCancha)?.nombre || 'Cancha'}
            fecha={formatDate(selectedDate)}
          />
        )}

        {showMultipleSubscriptionModal && (
          <MultipleSubscriptionModal
            isOpen={showMultipleSubscriptionModal}
            onClose={() => setShowMultipleSubscriptionModal(false)}
            onSuccess={() => {
              setShowMultipleSubscriptionModal(false);
              showAlert('success', 'Suscripción Creada', '¡Tu suscripción ha sido creada exitosamente!');
            }}
          />
        )}

        {/* Componente de alerta tipo cartel */}
        <AlertModal
          isOpen={alertConfig.isOpen}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={closeAlert}
          autoClose={alertConfig.autoClose}
        />
      </div>
    </section>
  );
}

export default Reservation;