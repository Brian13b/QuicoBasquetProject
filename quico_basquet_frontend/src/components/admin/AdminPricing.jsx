import { useState, useEffect } from 'react';
import { canchaService } from '../../api/canchaService';
import AlertModal from '../AlertModal';
import '../../styles/components/adminPricing.css';

function AdminPricing({ token }) {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCancha, setSelectedCancha] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [preciosForm, setPreciosForm] = useState({
    precio_basquet: 0,
    precio_voley: 0,
    descuento_basquet: 0,
    descuento_voley: 0,
    descuento_suscripcion: 0
  });
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    autoClose: true
  });

  useEffect(() => {
    fetchCanchas();
  }, []);

  const fetchCanchas = async () => {
    try {
      setLoading(true);
      const data = await canchaService.getCanchas();
      setCanchas(data);
      if (data.length > 0) {
        setSelectedCancha(data[0].id);
        loadPreciosCancha(data[0]);
      }
    } catch (error) {
      console.error('Error al cargar canchas:', error);
      showAlert('error', 'Error', 'No se pudieron cargar las canchas');
    } finally {
      setLoading(false);
    }
  };

  const loadPreciosCancha = (cancha) => {
    setPreciosForm({
      precio_basquet: cancha.precio_basquet || 0,
      precio_voley: cancha.precio_voley || 0,
      descuento_basquet: cancha.descuento_basquet || 0,
      descuento_voley: cancha.descuento_voley || 0,
      descuento_suscripcion: cancha.descuento_suscripcion || 0
    });
  };

  const handleCanchaChange = (canchaId) => {
    const cancha = canchas.find(c => c.id === parseInt(canchaId));
    if (cancha) {
      setSelectedCancha(parseInt(canchaId));
      loadPreciosCancha(cancha);
      setEditMode(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPreciosForm(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
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

  const handleSave = async () => {
    try {
      await canchaService.updatePrecios(selectedCancha, preciosForm, token);
      showAlert('success', 'Éxito', 'Precios actualizados correctamente');
      setEditMode(false);
      fetchCanchas(); 
    } catch (error) {
      console.error('Error al actualizar precios:', error);
      showAlert('error', 'Error', 'No se pudieron actualizar los precios');
    }
  };

  const handleCancel = () => {
    if (selectedCancha) {
      const cancha = canchas.find(c => c.id === selectedCancha);
      if (cancha) {
        loadPreciosCancha(cancha);
      }
    }
    setEditMode(false);
  };

  const calcularPrecioFinal = (deporte, esSuscripcion = false) => {
    const precioBase = deporte === 'basquet' ? preciosForm.precio_basquet : preciosForm.precio_voley;
    const descuentoDeporte = deporte === 'basquet' ? preciosForm.descuento_basquet : preciosForm.descuento_voley;
    const descuentoSuscripcion = esSuscripcion ? preciosForm.descuento_suscripcion : 0;

    const precioConDescuentoDeporte = precioBase * (1 - descuentoDeporte / 100);
    const precioFinal = precioConDescuentoDeporte * (1 - descuentoSuscripcion / 100);

    return Math.round(precioFinal);
  };

  if (loading) {
    return <div className="loading">Cargando precios...</div>;
  }

  return (
    <div className="admin-pricing">
      <div className="pricing-header">
        <h2>Gestión de Precios y Descuentos</h2>
        <p>Configura los precios por deporte y descuentos</p>
      </div>

      <div className="pricing-controls">
        <div className="form-group">
          <label htmlFor="cancha-select">Seleccionar Cancha:</label>
          <select
            id="cancha-select"
            value={selectedCancha || ''}
            onChange={(e) => handleCanchaChange(e.target.value)}
          >
            {canchas.map(cancha => (
              <option key={cancha.id} value={cancha.id}>
                {cancha.nombre}
              </option>
            ))}
          </select>
        </div>

        {selectedCancha && (
          <div className="action-buttons">
            {!editMode ? (
              <button className="btn-edit" onClick={() => setEditMode(true)}>
                ✏️ Editar Precios
              </button>
            ) : (
              <>
                <button className="btn-save" onClick={handleSave}>
                  💾 Guardar
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  ❌ Cancelar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {selectedCancha && (
        <div className="pricing-content">
          <div className="pricing-grid">
            {/* Precios por Deporte */}
            <div className="pricing-section">
              <h3>💰 Precios por Hora</h3>
              <div className="pricing-row">
                <label>Básquet:</label>
                <div className="price-input">
                  <input
                    type="number"
                    value={preciosForm.precio_basquet}
                    onChange={(e) => handleInputChange('precio_basquet', e.target.value)}
                    disabled={!editMode}
                    min="0"
                    step="1000"
                  />
                  <span>ARS</span>
                </div>
              </div>
              <div className="pricing-row">
                <label>Vóley:</label>
                <div className="price-input">
                  <input
                    type="number"
                    value={preciosForm.precio_voley}
                    onChange={(e) => handleInputChange('precio_voley', e.target.value)}
                    disabled={!editMode}
                    min="0"
                    step="1000"
                  />
                  <span>ARS</span>
                </div>
              </div>
            </div>

            {/* Descuentos por Deporte */}
            <div className="pricing-section">
              <h3>🎯 Descuentos por Deporte</h3>
              <div className="pricing-row">
                <label>Básquet:</label>
                <div className="discount-input">
                  <input
                    type="number"
                    value={preciosForm.descuento_basquet}
                    onChange={(e) => handleInputChange('descuento_basquet', e.target.value)}
                    disabled={!editMode}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span>%</span>
                </div>
              </div>
              <div className="pricing-row">
                <label>Vóley:</label>
                <div className="discount-input">
                  <input
                    type="number"
                    value={preciosForm.descuento_voley}
                    onChange={(e) => handleInputChange('descuento_voley', e.target.value)}
                    disabled={!editMode}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            {/* Descuento de Suscripción */}
            <div className="pricing-section">
              <h3>📅 Descuento de Suscripción</h3>
              <div className="pricing-row">
                <label>Descuento General:</label>
                <div className="discount-input">
                  <input
                    type="number"
                    value={preciosForm.descuento_suscripcion}
                    onChange={(e) => handleInputChange('descuento_suscripcion', e.target.value)}
                    disabled={!editMode}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vista Previa de Precios */}
          <div className="pricing-preview">
            <h3>Vista Previa de Precios Finales</h3>
            <div className="preview-grid">
              <div className="preview-card">
                <h4>🏀 Básquet</h4>
                <p><strong>Reserva (1 hora):</strong> ${calcularPrecioFinal('basquet', false)}</p>
                <p><strong>Suscripción (1 hora):</strong> ${calcularPrecioFinal('basquet', true)}</p>
              </div>
              <div className="preview-card">
                <h4>🏐 Vóley</h4>
                <p><strong>Reserva (1 hora):</strong> ${calcularPrecioFinal('voley', false)}</p>
                <p><strong>Suscripción (1 hora):</strong> ${calcularPrecioFinal('voley', true)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
        autoClose={alertConfig.autoClose}
      />
    </div>
  );
}

export default AdminPricing; 