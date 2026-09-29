import { Link } from 'react-router-dom';
import './Navbar.css'; // 👈 ¡Aquí importamos el CSS con el degradado!

function Navbar() {
    return (
        <nav className="navbar-container">
            
            <h2 className="navbar-brand">
                {/* 🌟 Hacemos que el título también funcione como un botón para ir al Inicio */}
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    🗺️ GEO-EMPRENDE-UTC
                </Link>
            </h2>
            
            <div className="navbar-links">
                {/* 🌟 Nuevo enlace para ir al Inicio */}
                <Link to="/" className="navbar-link-mapa">
                    Inicio
                </Link>

                {/* 🌟 Actualizamos la ruta para que apunte a /mapa */}
                <Link to="/mapa" className="navbar-link-mapa">
                    Ver Mapa
                </Link>

                <Link to="/login" className="navbar-link-admin">
                    Admin Login
                </Link>
            </div>
            
        </nav>
    );
}

export default Navbar;