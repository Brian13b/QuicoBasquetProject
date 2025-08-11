import '../styles/components/gallery.css'

const images = [
  { src: 'quico_basquet_frontend/public/assets/cancha-1.jpg', alt: 'Cancha de básquet vista frontal' },
  { src: 'quico_basquet_frontend/public/assets/cancha-2.jpg', alt: 'Cancha de básquet iluminada de noche' },
  { src: 'quico_basquet_frontend/public/assets/cancha-3.jpg', alt: 'Partido en la cancha de Quico Basquet' },
  { src: 'quico_basquet_frontend/public/assets/cancha-4.jpg', alt: 'Vista aérea de las instalaciones' }
]

function Gallery() {
  return (
    <section className="gallery-section">
      <div className="gallery-grid">
        {images.map((image, index) => (
          <div className="gallery-item" key={index}>
            <img src={image.src} alt={image.alt} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default Gallery