import '../styles/components/footer.css'

function Footer() {
  return (
    <footer>
      <div className="footer-container">
        <p className="copyright">&copy; {new Date().getFullYear()} Quico Basquet. Todos los derechos reservados.</p>
        <p className="creditos">
          Diseñado por <a href="https://www.linkedin.com/in/brian-battauz-75691a217" target="_blank" rel="noopener noreferrer">
            <strong>Brian Battauz</strong>
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer