import { useMemo } from 'react'
import PropTypes from 'prop-types'

function AdminRevenue({ reservas, filtros, setFiltros }) {
  
  const reporteIngresos = useMemo(() => {
    return reservas
      .filter(reserva => reserva.estado !== 'cancelada') 
      .reduce((acc, reserva) => {
        const metodo = reserva.metodo_pago || 'efectivo'
        acc[metodo] = (acc[metodo] || 0) + (reserva.precio || 0)
        return acc
      }, {})
  }, [reservas])

  const ingresosPorFecha = useMemo(() => {
    const ingresosPorDia = {}
    reservas
      .filter(reserva => reserva.estado !== 'cancelada')
      .forEach(reserva => {
        const fecha = reserva.fecha
        if (!ingresosPorDia[fecha]) {
          ingresosPorDia[fecha] = { efectivo: 0, transferencia: 0, total: 0 }
        }
        const metodo = reserva.metodo_pago || 'efectivo'
        const precio = reserva.precio || 0
        ingresosPorDia[fecha][metodo] += precio
        ingresosPorDia[fecha].total += precio
      })
    
    // Convertir a array y ordenar por fecha
    return Object.entries(ingresosPorDia)
      .map(([fecha, ingresos]) => ({ fecha, ...ingresos }))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 10) // Últimos 10 días
  }, [reservas])

  const totalIngresos = useMemo(() => {
    return (reporteIngresos.efectivo || 0) + (reporteIngresos.transferencia || 0)
  }, [reporteIngresos])

  // Calcular ingresos del mes actual
  const ingresosDelMes = useMemo(() => {
    const hoy = new Date()
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
    
    return reservas
      .filter(reserva => 
        reserva.estado !== 'cancelada' && 
        reserva.fecha && 
        reserva.fecha.startsWith(mesActual)
      )
      .reduce((total, reserva) => total + (reserva.precio || 0), 0)
  }, [reservas])

  const formatearFecha = (fecha) => {
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day);
    return fechaObj.toLocaleDateString('es-AR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  }

  return (
    <div className="ingresos-tab">
      {/* Cards principales de ingresos */}
      <div className="ingresos-principales">
        <h3>💰 Resumen de Ingresos</h3>
        <div className="ingresos-cards-principales">
          <div className="ingreso-card-principal">
            <div className="ingreso-icon-principal">📅</div>
            <div className="ingreso-info-principal">
              <h4>Ingresos del Mes</h4>
              <p className="ingreso-amount-principal">${ingresosDelMes.toLocaleString()}</p>
              <span className="ingreso-subtitle">Mes actual</span>
            </div>
          </div>
          <div className="ingreso-card-principal total">
            <div className="ingreso-icon-principal">🏆</div>
            <div className="ingreso-info-principal">
              <h4>Ingresos Totales</h4>
              <p className="ingreso-amount-principal">${totalIngresos.toLocaleString()}</p>
              <span className="ingreso-subtitle">Histórico completo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desglose por método de pago */}
      <div className="ingresos-overview">
        <h3>💳 Desglose por Método de Pago</h3>
        <div className="ingresos-cards">
          <div className="ingreso-card">
            <div className="ingreso-icon">💵</div>
            <div className="ingreso-info">
              <h4>Ingresos por Efectivo</h4>
              <p className="ingreso-amount">${(reporteIngresos.efectivo || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="ingreso-card">
            <div className="ingreso-icon">💳</div>
            <div className="ingreso-info">
              <h4>Ingresos por Transferencia</h4>
              <p className="ingreso-amount">${(reporteIngresos.transferencia || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de ingresos por día */}
      <div className="ingresos-detalle">
        <h3>📈 Ingresos por Día (Últimos 10 días)</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Efectivo</th>
                <th>Transferencia</th>
                <th>Total</th>
                <th>% del Total</th>
              </tr>
            </thead>
            <tbody>
              {ingresosPorFecha.map((dia) => (
                <tr key={dia.fecha}>
                  <td>{formatearFecha(dia.fecha)}</td>
                  <td className="ingreso-cell">
                    <span className="badge efectivo">
                      ${dia.efectivo.toLocaleString()}
                    </span>
                  </td>
                  <td className="ingreso-cell">
                    <span className="badge transferencia">
                      ${dia.transferencia.toLocaleString()}
                    </span>
                  </td>
                  <td className="ingreso-cell total">
                    <strong>${dia.total.toLocaleString()}</strong>
                  </td>
                  <td className="ingreso-cell">
                    {totalIngresos > 0 ? ((dia.total / totalIngresos) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              {ingresosPorFecha.length === 0 && (
                <tr>
                  <td colSpan="5" className="no-data">
                    📭 No hay datos de ingresos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

AdminRevenue.propTypes = {
  reservas: PropTypes.array.isRequired,
  filtros: PropTypes.object.isRequired,
  setFiltros: PropTypes.func.isRequired
}

export default AdminRevenue
