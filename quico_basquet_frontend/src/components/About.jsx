import '../styles/components/about.css'

function About() {
  return (
    <section className="about">
      <div className="container">
        <div className="about-layout">
          <div className="info-cards">
            <div className="card horarios">
              <h2>Nuestros horarios</h2>
              <ul>
                <li><strong>Lunes a Viernes:</strong> 8:00 - 00:00</li>
                <li><strong>Sábado y Domingo:</strong> 8:00 - 00:00</li>
              </ul>
            </div>

            <div className="card contacto">
              <h2>Contáctanos</h2>
              <p>Si tienes alguna pregunta o necesitas asistencia, no dudes en ponerte en contacto:</p>
              <div className="social-buttons">
                <a href="https://wa.me/+5493434682439" className="btn-social whatsapp" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-whatsapp"></i> WhatsApp
                </a>
                <a href="https://www.instagram.com/quicobasquet" className="btn-social instagram" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i> Instagram
                </a>
                <a href="mailto:basquetquico@gmail.com" className="btn-social gmail" target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-envelope"></i> Gmail
                </a>
              </div>
            </div>

            <div className="card ubicacion">
              <h2>Ubicación</h2>
              <p>Estamos en:</p>
              <p>Avenida Almafuerte 2488, Paraná, Entre Ríos</p>
            </div>
          </div>

          <div className="card mapa">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3392.4584664299077!2d-60.4860224!3d-31.757979299999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b44f2ad5a24bab%3A0xf9ad73f5086e5d0f!2sQuico%20B%C3%A1squet!5e0!3m2!1ses-419!2sar!4v1753747612062!5m2!1ses-419!2sar" 
              title="Ubicación de Quico Basquet"
              width={"100%"}
              height={"100%"}
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About