import Header from '../components/Header'
import Hero from '../components/Hero'
import Reservation from '../components/Reservation'
import About from '../components/About'
import Gallery from '../components/Gallery'
import Footer from '../components/Footer'
import '../styles/pages/home.css'

function Home() {
  return (
    <div className="home-page">
      <Header />
      <Hero />
      <Reservation />
      <About />
      <Gallery />
      <Footer />
    </div>
  )
}

export default Home