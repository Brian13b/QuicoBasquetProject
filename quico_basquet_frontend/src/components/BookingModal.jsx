import { useState, useEffect } from 'react';
import { getBankingData } from '../utils/checkEnv';
import { useAuth } from '../context/AuthContext';
import '../styles/components/bookingModal.css';

function BookingModal({
  selectedTime,
  duration,
  setDuration,
  metodoPago,
  setMetodoPago,
  precioPorHora,
  onConfirm,
  onCancel,
  deporte,
  canchaNombre,
  fecha
}) {
  const [calculating, setCalculating] = useState(false);
  const [costo, setCosto] = useState(0);
  const [nombreCliente, setNombreCliente] = useState('');
  const { currentUser } = useAuth();
  const bankingData = getBankingData();

  // Verificar si el usuario es admin
  const isAdmin = currentUser?.rol === 'admin';

  // Calcular costo cuando cambia la duración
  useEffect(() => {
    const horas = duration / 60;
    setCosto((precioPorHora * horas).toFixed(2));
  }, [duration, precioPorHora]);

  const handleConfirm = () => {
    // Validar nombre del cliente si es admin
    if (isAdmin && (!nombreCliente || nombreCliente.trim().length < 2)) {
      alert('Por favor, ingresa el nombre del cliente (mínimo 2 caracteres)');
      return;
    }
    
    // Pasar el nombre del cliente al callback
    onConfirm(nombreCliente.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="booking-modal">
        <h3>Confirmar Reserva</h3>
        
        <div className="reserva-info">
          <p><strong>Cancha:</strong> {canchaNombre}</p>
          <p><strong>Deporte:</strong> {deporte === 'basquet' ? '🏀 Básquet' : '🏐 Vóley'}</p>
          <p><strong>Fecha:</strong> {fecha}</p>
          <p><strong>Horario:</strong> {selectedTime}</p>
        </div>

        {/* Campo de nombre del cliente solo para admins */}
        {isAdmin && (
          <div className="form-group">
            <label>Nombre del Cliente: *</label>
            <input
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder="Ingresa el nombre del cliente"
              maxLength={100}
              required
            />
            <small>Mínimo 2 caracteres, máximo 100</small>
          </div>
        )}
        
        <div className="form-group">
          <label>Duración (minutos):</label>
          <select 
            value={duration} 
            onChange={(e) => setDuration(parseInt(e.target.value))}
          >
            <option value={60}>60 minutos</option>
            <option value={90}>90 minutos</option>
            <option value={120}>120 minutos</option>
          </select>
        </div>

        <div className="form-group">
          <label>Método de Pago:</label>
          <select 
            value={metodoPago} 
            onChange={(e) => setMetodoPago(e.target.value)}
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>

        {metodoPago === 'transferencia' && (
          <div className="transferencia-info">
            <h4>Datos para Transferencia</h4>
            <div className="transferencia-datos">
              <div className="dato-item">
                <strong>Alias:</strong> 
                <span className="dato-valor">{bankingData.alias}</span>
                <button 
                  type="button" 
                  className="btn-copiar"
                  onClick={() => navigator.clipboard.writeText(bankingData.alias)}
                  title="Copiar alias"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
              </div>
              <div className="dato-item">
                <strong>CBU:</strong> 
                <span className="dato-valor">{bankingData.cbu}</span>
                <button 
                  type="button" 
                  className="btn-copiar"
                  onClick={() => navigator.clipboard.writeText(bankingData.cbu)}
                  title="Copiar CBU"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
              </div>
              <div className="dato-item">
                <strong>Banco:</strong> 
                <span className="dato-valor">{bankingData.bank}</span>
              </div>
              <div className="dato-item">
                <strong>Titular:</strong> 
                <span className="dato-valor">{bankingData.holder}</span>
              </div>
            </div>
            <div className="transferencia-nota">
              <p><strong>Nota:</strong> Una vez realizada la transferencia, envía el comprobante por WhatsApp al {bankingData.whatsapp}</p>
            </div>
          </div>
        )}

        <div className="resumen-pago">
          <h4>Resumen de Pago</h4>
          <p>Precio por hora: ${precioPorHora}</p>
          <p>Duración: {duration} minutos</p>
          <p className="total">Total: ${costo}</p>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onCancel}>Cancelar</button>
          <button type="button" onClick={handleConfirm} disabled={calculating}>
            {calculating ? 'Confirmando...' : 'Confirmar Reserva'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;