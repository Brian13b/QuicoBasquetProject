import { useNavigate } from 'react-router-dom';
import '../styles/components/hero.css';

function Hero() {
  const navigate = useNavigate();

  const handleReservarClick = () => {
    if (window.location.pathname !== '/') {
      navigate('/');
    }
    
    setTimeout(() => {
      const reservasSection = document.getElementById('reservas');
      if (reservasSection) {
        reservasSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <section className="hero">
      <div className="container">
        <h1>QUICO BASQUET</h1>
        <p>Reserva tu turno de forma rápida y sencilla</p>
        <button onClick={handleReservarClick} className="btn">
          Reservar Ahora
        </button>
      </div>
      <div className="scroll-down">
        <span><i className="fa-solid fa-angles-down"></i></span>
      </div>
    </section>
  );
}

export default Hero;