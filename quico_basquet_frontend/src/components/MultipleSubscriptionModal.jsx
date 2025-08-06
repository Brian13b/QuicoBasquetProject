import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { canchaService } from '../api/canchaService';
import { suscripcionService } from '../api/suscripcionService';
import AlertModal from './AlertModal';
import '../styles/components/subscriptionModal.css';

function MultipleSubscriptionModal({ isOpen, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suscripciones, setSuscripciones] = useState([
    { dia_semana: 1, hora_inicio: '18:00', duracion: 60, hora_fin: '19:00' }
  ]);
  
  // Estados para el sistema de alertas
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
    autoClose: true
  });

  const [formData, setFormData] = useState({
    cancha_id: '1',
    deporte: 'basquet',
    fecha_inicio: '',
    fecha_fin: '',
    metodo_pago: 'efectivo'
  });

  const deportes = [
    { value: 'basquet', label: '🏀 BÁSQUET' },
    { value: 'voley', label: '🏐 VOLEY' }
  ];

  const diasSemana = [
    { value: 0, label: 'Lunes' },
    { value: 1, label: 'Martes' },
    { value: 2, label: 'Miércoles' },
    { value: 3, label: 'Jueves' },
    { value: 4, label: 'Viernes' },
    { value: 5, label: 'Sábado' },
    { value: 6, label: 'Domingo' }
  ];

  const duraciones = [
    { value: 60, label: '60 minutos (1 hora)' },
    { value: 90, label: '90 minutos (1.5 horas)' },
    { value: 120, label: '120 minutos (2 horas)' }
  ];

  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' }
  ];

  useEffect(() => {
    if (isOpen) {
      cargarCanchas();
    }
  }, [isOpen]);

  // Calcular automáticamente las horas de fin cuando cambian las suscripciones
  useEffect(() => {
    const suscripcionesActualizadas = suscripciones.map(suscripcion => {
      if (suscripcion.hora_inicio && suscripcion.duracion) {
        const horaFinCalculada = calcularHoraFin(suscripcion.hora_inicio, suscripcion.duracion);
        if (suscripcion.hora_fin !== horaFinCalculada) {
          return {
            ...suscripcion,
            hora_fin: horaFinCalculada
          };
        }
      }
      return suscripcion;
    });
    
    // Solo actualizar si hay cambios reales
    const hayCambios = suscripcionesActualizadas.some((suscripcion, index) => 
      suscripcion.hora_fin !== suscripciones[index].hora_fin
    );
    
    if (hayCambios) {
      setSuscripciones(suscripcionesActualizadas);
    }
  }, [suscripciones.map(s => `${s.hora_inicio}-${s.duracion}`).join(',')]);

  // Función para calcular fecha de fin automáticamente (1 mes desde fecha de inicio)
  const calcularFechaFin = (fechaInicio) => {
    if (!fechaInicio) return '';
    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + 1);
    return fecha.toISOString().split('T')[0];
  };

  // Función para calcular hora de fin basada en duración
  const calcularHoraFin = (horaInicio, duracionMinutos) => {
    if (!horaInicio || !duracionMinutos) return '';
    
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const fecha = new Date(2000, 0, 1, horas, minutos);
    fecha.setMinutes(fecha.getMinutes() + duracionMinutos);
    
    return fecha.toTimeString().slice(0, 5);
  };

  const cargarCanchas = async () => {
    try {
      const data = await canchaService.getCanchas();
      setCanchas(data);
    } catch (error) {
      console.error('Error al cargar canchas:', error);
      showAlert('error', 'Error', 'No se pudieron cargar las canchas.');
    }
  };

  const calcularPrecio = () => {
    if (!formData.cancha_id || !formData.deporte) return 0;
    
    const cancha = canchas.find(c => c.id == formData.cancha_id);
    if (!cancha) return 0;

    // Usar los precios directos de la cancha
    let precioBase = 0;
    if (formData.deporte === 'basquet') {
      precioBase = cancha.precio_basquet;
    } else if (formData.deporte === 'voley') {
      precioBase = cancha.precio_voley;
    }
    
    // Si no hay precio base, retornar 0
    if (!precioBase) return 0;
    
    // Usar el descuento de suscripción de la cancha
    const descuentoSuscripcion = cancha.descuento_suscripcion || 0;
    
    return suscripciones.reduce((total, suscripcion) => {
      const duracion = 1; // 1 hora por sesión
      const precioPorSesion = precioBase * duracion;
      const precioConDescuento = precioPorSesion * (1 - descuentoSuscripcion / 100);
      return total + precioConDescuento;
    }, 0);
  };

  // Calcular precio por hora
  const precioPorHora = (() => {
    if (!formData.cancha_id || !formData.deporte) return 0;
    
    const cancha = canchas.find(c => c.id == formData.cancha_id);
    if (!cancha) return 0;

    if (formData.deporte === 'basquet') {
      return cancha.precio_basquet || 0;
    } else if (formData.deporte === 'voley') {
      return cancha.precio_voley || 0;
    }
    
    return 0;
  })();

  // Función para calcular sesiones por mes basada en fechas reales
  const calcularSesionesPorMes = (fechaInicio, fechaFin, diaSemana) => {
    if (!fechaInicio || !fechaFin) return 0;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    let sesiones = 0;
    const diaActual = new Date(inicio);
    
    // Recorrer cada día desde la fecha de inicio hasta la fecha de fin
    while (diaActual <= fin) {
      // Si el día de la semana coincide con el día de la suscripción
      if (diaActual.getDay() === diaSemana) {
        sesiones++;
      }
      // Avanzar al siguiente día
      diaActual.setDate(diaActual.getDate() + 1);
    }
    
    return sesiones;
  };

  // Función para obtener sesiones por suscripción individual
  const obtenerSesionesPorSuscripcion = (diaSemana) => {
    if (!formData.fecha_inicio || !formData.fecha_fin) return 0;
    return calcularSesionesPorMes(formData.fecha_inicio, formData.fecha_fin, parseInt(diaSemana));
  };

  // Calcular sesiones totales por mes
  const sesionesPorMes = (() => {
    if (!formData.fecha_inicio || !formData.fecha_fin || suscripciones.length === 0) return 0;
    
    let sesionesTotales = 0;
    suscripciones.forEach(suscripcion => {
      const sesiones = calcularSesionesPorMes(
        formData.fecha_inicio, 
        formData.fecha_fin, 
        parseInt(suscripcion.dia_semana)
      );
      sesionesTotales += sesiones;
    });
    
    return sesionesTotales;
  })();

  // Calcular precio estimado mensual
  const precioEstimado = (() => {
    if (!formData.cancha_id || !formData.deporte || suscripciones.length === 0) return 0;
    
    const cancha = canchas.find(c => c.id == formData.cancha_id);
    if (!cancha) return 0;

    // Calcular precio base por sesión
    let precioBase = 0;
    if (formData.deporte === 'basquet') {
      precioBase = cancha.precio_basquet || 0;
    } else if (formData.deporte === 'voley') {
      precioBase = cancha.precio_voley || 0;
    }

    // Si no hay precio base, retornar 0
    if (!precioBase) return 0;

    // Obtener descuentos (igual que el backend)
    let descuentoDeporte = 0;
    if (formData.deporte === 'basquet') {
      descuentoDeporte = cancha.descuento_basquet || 0;
    } else if (formData.deporte === 'voley') {
      descuentoDeporte = cancha.descuento_voley || 0;
    }
    
    const descuentoSuscripcion = cancha.descuento_suscripcion || 0;
    
    
    
    // Calcular precio total por cada suscripción individual
    let precioTotal = 0;
    suscripciones.forEach((suscripcion, index) => {
      // Calcular duración de esta suscripción específica
      const duracionHoras = (suscripcion.duracion || 60) / 60; // Convertir minutos a horas
      
      // Aplicar descuentos en el mismo orden que el backend
      const precioConDescuentoDeporte = precioBase * (1 - descuentoDeporte / 100);
      const precioPorSesion = precioConDescuentoDeporte * (1 - descuentoSuscripcion / 100) * duracionHoras;
      
      // Calcular sesiones para esta suscripción específica
      const sesiones = calcularSesionesPorMes(
        formData.fecha_inicio, 
        formData.fecha_fin, 
        parseInt(suscripcion.dia_semana)
      );
      
      
      
      // Sumar al precio total
      precioTotal += precioPorSesion * sesiones;
    });
    
    const precioFinal = Math.max(0, Math.round(precioTotal));
    
    return precioFinal; // Asegurar que no sea negativo
  })();

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Si se cambia la fecha de inicio, calcular automáticamente la fecha de fin
      if (name === 'fecha_inicio') {
        newData.fecha_fin = calcularFechaFin(value);
      }
      
      return newData;
    });
  };

  const handleSuscripcionChange = (index, field, value) => {
    const nuevasSuscripciones = [...suscripciones];
    nuevasSuscripciones[index] = { ...nuevasSuscripciones[index], [field]: value };
    
    // Si se cambia la hora de inicio o duración, calcular automáticamente la hora de fin
    if (field === 'hora_inicio' || field === 'duracion') {
      const suscripcion = nuevasSuscripciones[index];
      if (suscripcion.hora_inicio && suscripcion.duracion) {
        suscripcion.hora_fin = calcularHoraFin(suscripcion.hora_inicio, suscripcion.duracion);
      }
    }
    
    setSuscripciones(nuevasSuscripciones);
  };

  const agregarSuscripcion = () => {
    setSuscripciones(prev => [...prev, { 
      dia_semana: 1, 
      hora_inicio: '18:00', 
      duracion: 60,
      hora_fin: '19:00' // Calculada automáticamente
    }]);
  };

  const eliminarSuscripcion = (index) => {
    if (suscripciones.length > 1) {
      setSuscripciones(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (!formData.cancha_id) {
        throw new Error('Debes seleccionar una cancha');
      }
      if (!formData.fecha_inicio) {
        throw new Error('Debes seleccionar una fecha de inicio');
      }
      if (!formData.fecha_fin) {
        throw new Error('Debes seleccionar una fecha de fin');
      }

      

      // Crear todas las suscripciones
      const suscripcionesCreadas = [];
      
      for (const suscripcion of suscripciones) {
                 try {
           // Usar el precio del resumen dividido por el número de suscripciones
           // Calcular el precio por suscripción individual
          const precioPorSuscripcion = precioEstimado / suscripciones.length;
          
                     // Preparar datos con formato correcto
           const suscripcionData = {
             user_id: currentUser.id,
             cancha_id: parseInt(formData.cancha_id),
             deporte: formData.deporte,
             dia_semana: parseInt(suscripcion.dia_semana),
             hora_inicio: suscripcion.hora_inicio, // Formato "HH:MM"
             hora_fin: suscripcion.hora_fin,       // Formato "HH:MM"
             fecha_inicio: formData.fecha_inicio,  // Formato "YYYY-MM-DD"
             fecha_fin: formData.fecha_fin,        // Formato "YYYY-MM-DD"
             precio_mensual: Math.round(precioPorSuscripcion),
             descuento: 0.0, // 🔥 FORZADO A 0.0 - No usar descuento adicional, ya se aplican los descuentos de la cancha
             metodo_pago: formData.metodo_pago
           };
           
           
          
          // Validar que todos los campos requeridos estén presentes
          const camposRequeridos = [
            'user_id', 'cancha_id', 'deporte', 'dia_semana', 
            'hora_inicio', 'hora_fin', 'fecha_inicio', 
            'precio_mensual', 'metodo_pago'
          ];
          
          for (const campo of camposRequeridos) {
            if (suscripcionData[campo] === undefined || suscripcionData[campo] === null) {
              throw new Error(`Campo requerido faltante: ${campo}`);
            }
          }

          const nuevaSuscripcion = await suscripcionService.crearSuscripcion(suscripcionData);
          suscripcionesCreadas.push(nuevaSuscripcion);
          
        } catch (error) {
          console.error(`❌ Error al crear suscripción ${suscripcionesCreadas.length + 1}:`, error);
          throw error; // Re-lanzar el error para que se maneje en el catch principal
        }
      }
      
      
      showAlert('success', 'Suscripciones Creadas', `¡${suscripcionesCreadas.length} suscripciones creadas exitosamente!`);
      
      // Forzar actualización del TimeGridSelector
      const event = new CustomEvent('suscripcionCreada', { 
        detail: { 
          canchaId: parseInt(formData.cancha_id),
          suscripciones: suscripcionesCreadas 
        } 
      });
      window.dispatchEvent(event);
      
      setTimeout(() => {
        onSuccess && onSuccess(suscripcionesCreadas);
        onClose();
      }, 2000);

    } catch (err) {
      console.error('❌ Error al crear suscripciones:', err);
      
      // Manejar diferentes tipos de errores con mensajes específicos
      let errorMessage = 'Error al crear las suscripciones';
      let errorTitle = 'Error';
      
      if (err.message) {
        if (err.message.includes('solapamiento') || err.message.includes('ocupado')) {
          errorTitle = 'Horario No Disponible';
          errorMessage = 'Uno de los horarios seleccionados ya está reservado. Por favor, elige otros horarios.';
        } else if (err.message.includes('horario') || err.message.includes('cierre')) {
          errorTitle = 'Horario Fuera de Rango';
          errorMessage = 'Uno de los horarios seleccionados está fuera del horario de atención (8:00 AM - 12:00 AM).';
        } else if (err.message.includes('duración') || err.message.includes('mínima')) {
          errorTitle = 'Duración Inválida';
          errorMessage = 'La duración de las suscripciones debe ser entre 60 y 120 minutos.';
        } else if (err.message.includes('bloqueado')) {
          errorTitle = 'Cuenta Bloqueada';
          errorMessage = 'Tu cuenta ha sido bloqueada. No puedes crear suscripciones.';
        } else if (err.message.includes('Campo requerido faltante')) {
          errorTitle = 'Datos Incompletos';
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }
      
      showAlert('error', errorTitle, errorMessage, false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="subscription-modal-overlay">
      <div className="subscription-modal">
        <div className="modal-header">
          <h2>Crear Suscripción</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <AlertModal
          isOpen={alertConfig.isOpen}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={closeAlert}
          autoClose={alertConfig.autoClose}
        />

        <form onSubmit={handleSubmit} className="subscription-form">
          {/* Configuración general */}
          <div className="form-section">
            <h3>Configuración General</h3>
            
            <div className="form-group">
              <label htmlFor="cancha_id">Cancha *</label>
              <select
                id="cancha_id"
                name="cancha_id"
                value={formData.cancha_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona una cancha</option>
                {canchas.map(cancha => (
                  <option key={cancha.id} value={cancha.id}>
                    {cancha.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="deporte">Deporte *</label>
              <select
                id="deporte"
                name="deporte"
                value={formData.deporte}
                onChange={handleInputChange}
                required
              >
                {deportes.map(deporte => (
                  <option key={deporte.value} value={deporte.value}>
                    {deporte.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fecha_inicio">Fecha de inicio *</label>
                <input
                  type="date"
                  id="fecha_inicio"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleInputChange}
                  min={(() => {
                    const hoy = new Date();
                    const year = hoy.getFullYear();
                    const month = String(hoy.getMonth() + 1).padStart(2, '0');
                    const day = String(hoy.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  })()}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="fecha_fin">Fecha de fin (1 mes) *</label>
                <input
                  type="date"
                  id="fecha_fin"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleInputChange}
                  min={formData.fecha_inicio}
                  required
                  readOnly
                  className="disabled-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="metodo_pago">Método de pago *</label>
              <select
                id="metodo_pago"
                name="metodo_pago"
                value={formData.metodo_pago}
                onChange={handleInputChange}
                required
              >
                {metodosPago.map(metodo => (
                  <option key={metodo.value} value={metodo.value}>
                    {metodo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Suscripciones individuales */}
          <div className="form-section">
            <div className="section-header">
              <h3>Suscripciones ({suscripciones.length})</h3>
              <button 
                type="button" 
                className="btn-add"
                onClick={agregarSuscripcion}
              >
                + Agregar Día
              </button>
            </div>

            {suscripciones.map((suscripcion, index) => (
              <div key={index} className="suscripcion-item">
                <div className="item-header">
                  <h4>Suscripción {index + 1}</h4>
                  {suscripciones.length > 1 && (
                    <button 
                      type="button" 
                      className="btn-remove"
                      onClick={() => eliminarSuscripcion(index)}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Día de la semana *</label>
                    <select
                      value={suscripcion.dia_semana}
                      onChange={(e) => handleSuscripcionChange(index, 'dia_semana', e.target.value)}
                      required
                    >
                      {diasSemana.map(dia => (
                        <option key={dia.value} value={dia.value}>
                          {dia.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Hora de inicio *</label>
                    <input
                      type="time"
                      value={suscripcion.hora_inicio}
                      onChange={(e) => handleSuscripcionChange(index, 'hora_inicio', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Duración *</label>
                    <select
                      value={suscripcion.duracion}
                      onChange={(e) => handleSuscripcionChange(index, 'duracion', parseInt(e.target.value))}
                      required
                    >
                      {duraciones.map(duracion => (
                        <option key={duracion.value} value={duracion.value}>
                          {duracion.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Hora de fin</label>
                    <input
                      type="time"
                      value={suscripcion.hora_fin || ''}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen de precio */}
          <div className="price-summary">
            <h3>Resumen de Precio</h3>
            <div className="price-details">
              <div className="price-item">
                <span>Deporte:</span>
                <span>{deportes.find(d => d.value === formData.deporte)?.label}</span>
              </div>
              <div className="price-item">
                <span>Precio base por hora:</span>
                <span>${precioPorHora.toLocaleString()}</span>
              </div>
              <div className="price-item">
                <span>Suscripciones:</span>
                <span>{suscripciones.length}</span>
              </div>
              <div className="price-item">
                <span>Sesiones por mes:</span>
                <span>{sesionesPorMes}</span>
              </div>
              {(() => {
                const cancha = canchas.find(c => c.id == formData.cancha_id);
                const descuentoDeporte = formData.deporte === 'basquet' ? (cancha?.descuento_basquet || 0) : (cancha?.descuento_voley || 0);
                const descuentoSuscripcion = cancha?.descuento_suscripcion || 0;
                
                // Calcular precio sin descuentos para mostrar el descuento total
                const precioSinDescuentos = (() => {
                  let total = 0;
                  suscripciones.forEach(suscripcion => {
                    const duracionHoras = (suscripcion.duracion || 60) / 60;
                    const sesiones = calcularSesionesPorMes(
                      formData.fecha_inicio, 
                      formData.fecha_fin, 
                      parseInt(suscripcion.dia_semana)
                    );
                    total += precioPorHora * duracionHoras * sesiones;
                  });
                  return total;
                })();
                
                const precioConDescuentoDeporte = precioSinDescuentos * (1 - descuentoDeporte / 100);
                const descuentoTotalDeporte = precioSinDescuentos - precioConDescuentoDeporte;
                const descuentoTotalSuscripcion = precioConDescuentoDeporte * (descuentoSuscripcion / 100);
                
                return (
                  <>
                    {descuentoDeporte > 0 && (
                      <div className="price-item discount">
                        <span>Descuento {formData.deporte} ({descuentoDeporte}%):</span>
                        <span>-${Math.round(descuentoTotalDeporte)}</span>
                      </div>
                    )}
                    {descuentoSuscripcion > 0 && (
                      <div className="price-item discount">
                        <span>Descuento suscripción ({descuentoSuscripcion}%):</span>
                        <span>-${Math.round(descuentoTotalSuscripcion)}</span>
                      </div>
                    )}
                  </>
                );
              })()}
              <div className="price-item total">
                <span>Precio mensual total:</span>
                <span>${precioEstimado.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creando...' : `Crear Suscripción${suscripciones.length > 1 ? 'es' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MultipleSubscriptionModal; 