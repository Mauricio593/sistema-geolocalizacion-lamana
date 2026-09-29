import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Inicio.css';

function Inicio() {
    const navigate = useNavigate();
    const [emprendimientos, setEmprendimientos] = useState([]);

    useEffect(() => {
        api.get('emprendimientos/')
            .then(res => {
                setEmprendimientos(res.data);
            })
            .catch(err => console.error("Error al cargar datos:", err));
    }, []);

    const resenasEjemplo = [
        { id: 1, autor: "María Pérez", texto: "¡Excelente iniciativa! Gracias al mapa pude encontrar negocios locales que no sabía que existían en La Maná.", calificacion: "⭐⭐⭐⭐⭐" },
        { id: 2, autor: "Juan Carlos Gómez", texto: "Me encanta la variedad de emprendimientos. Fui a un lugar de comida rápida recomendado aquí y estuvo genial.", calificacion: "⭐⭐⭐⭐⭐" },
        { id: 3, autor: "Andrea Salazar", texto: "Muy buena plataforma, aunque me gustaría ver más fotos de los productos de cada local.", calificacion: "⭐⭐⭐⭐" }
    ];

    return (
        <div className="inicio-container">
            {/* 🌟 BARRA DE NAVEGACIÓN */}
            <nav className="inicio-navbar">
                
            </nav>

            {/* 🌟 SECCIÓN HERO (Banner Principal) */}
            <header className="inicio-hero">
                <div className="hero-content">
                    <h1>   Descubre lo mejor de los emprendimientos locales  </h1>
                    <p>    Apoya el comercio local, encuentra servicios cerca de ti y conéctate con los mejores emprendedores de nuestro cantón.</p>
                    <button className="btn-hero-accion" onClick={() => navigate('/mapa')}>
                        Explorar el Mapa Interactivo
                    </button>
                </div>
            </header>

            {/* 🌟 SECCIÓN DE EMPRENDIMIENTOS DESTACADOS */}
            <section className="inicio-destacados">
                <h2>🌟 Emprendimientos Destacados</h2>
                <p className="subtitulo-seccion">Conoce algunas de las increíbles propuestas de nuestra comunidad.</p>
                
                <div className="grid-emprendimientos">
                    {emprendimientos.length > 0 ? (
                        emprendimientos.map(emp => (
                            <div key={emp.id} className="card-emprendimiento">
                                <div className="card-imagen" style={{ backgroundImage: `url(${emp.imagen_1 || 'https://via.placeholder.com/300x200?text=Sin+Imagen'})` }}>
                                    <span className="badge-actividad">{emp.actividad}</span>
                                </div>
                                <div className="card-info">
                                    <h3>{emp.nombre_emprendimiento}</h3>
                                    <p><strong>📍 Ubicación:</strong> {emp.ubicacion}</p>
                                    <p><strong>👤 Dueño:</strong> {emp.nombres} {emp.apellidos}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Cargando emprendimientos...</p>
                    )}
                </div>
            </section>

            {/* 🌟 SECCIÓN DE RESEÑAS */}
            <section className="inicio-resenas">
                <h2>💬 Lo que dice la comunidad</h2>
                <div className="grid-resenas">
                    {resenasEjemplo.map(resena => (
                        <div key={resena.id} className="card-resena">
                            <div className="resena-estrellas">{resena.calificacion}</div>
                            <p className="resena-texto">"{resena.texto}"</p>
                            <h4 className="resena-autor">- {resena.autor}</h4>
                        </div>
                    ))}
                </div>
            </section>

            {/* 🌟 PIE DE PÁGINA */}
            <footer className="inicio-footer">
                <p>© {new Date().getFullYear()} Red de Emprendedores. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}

export default Inicio;