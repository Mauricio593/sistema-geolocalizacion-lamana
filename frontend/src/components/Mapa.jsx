import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import api from '../api';
import './Mapa.css';

// 🎨 1. FUNCIÓN PARA CREAR ICONOS DE COLORES
const crearIcono = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// 🎨 2. DICCIONARIO DE COLORES DISPONIBLES
const iconos = {
    azul: crearIcono('blue'),
    rojo: crearIcono('red'),
    verde: crearIcono('green'),
    naranja: crearIcono('orange'),
    amarillo: crearIcono('gold'),
    violeta: crearIcono('violet'),
    gris: crearIcono('grey'),
    negro: crearIcono('black')
};

// 🧠 3. LÓGICA PARA ASIGNAR COLOR SEGÚN LA ACTIVIDAD
const obtenerIconoPorActividad = (actividad) => {
    if (!actividad) return iconos.azul;
    
    const act = actividad.toLowerCase();
    
    if (act.includes('alimentos') || act.includes('bebidas') || act.includes('café')) return iconos.rojo;
    if (act.includes('naturales') || act.includes('orgánicos') || act.includes('ecoturismo')) return iconos.verde;
    if (act.includes('tecnología') || act.includes('sistemas')) return iconos.negro;
    if (act.includes('ropa') || act.includes('textil')) return iconos.violeta;
    if (act.includes('turismo') || act.includes('hotel')) return iconos.naranja;
    
    return iconos.azul; 
};

// 🖼️ 4. FUNCIÓN PARA CORREGIR LA URL DE LA IMAGEN
const obtenerUrlImagen = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    
    const path = url.startsWith('/') ? url : `/${url}`;
    
    if (!path.startsWith('/media/')) {
        return `http://localhost:8000/media${path}`;
    }
    
    return `http://localhost:8000${path}`;
};

// 🚀 COMPONENTE: Dibuja la ruta y calcula distancia/tiempo
function Rutador({ origen, destino, setInfoRuta }) {
    const map = useMap();

    useEffect(() => {
        if (!origen || !destino) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(origen.lat, origen.lng),
                L.latLng(destino.lat, destino.lng)
            ],
            routeWhileDragging: false,
            addWaypoints: false, 
            fitSelectedRoutes: true, 
            lineOptions: {
                styles: [{ color: '#007bff', weight: 6, opacity: 0.8 }]
            },
            show: false,
            createMarker: () => null,
            router: L.Routing.osrmv1({
                language: 'es',
                profile: 'driving'
            })
        }).addTo(map);

        routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            const summary = routes[0].summary;
            
            const distanciaKm = (summary.totalDistance / 1000).toFixed(1);
            const tiempoMinutos = Math.round(summary.totalTime % 3600 / 60);
            const tiempoHoras = Math.floor(summary.totalTime / 3600);
            
            let textoTiempo = '';
            if (tiempoHoras > 0) textoTiempo += `${tiempoHoras}h `;
            textoTiempo += `${tiempoMinutos} min`;

            setInfoRuta({ distancia: distanciaKm, tiempo: textoTiempo });
        });

        routingControl.on('routingerror', function(e) {
            console.error("No se pudo calcular la ruta:", e);
            alert("📍 No se encontró una ruta válida desde tu ubicación.");
            setInfoRuta(null); 
        });

        return () => map.removeControl(routingControl);
    }, [map, origen, destino, setInfoRuta]);

    return null;
}

function Mapa() {
    const [emprendimientos, setEmprendimientos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [ruta, setRuta] = useState({ origen: null, destino: null });
    const [capaMapa, setCapaMapa] = useState('moderno_claro');
    const [infoRuta, setInfoRuta] = useState(null); 
    
    const [imagenAmpliada, setImagenAmpliada] = useState(null); 
    const [infoAmpliada, setInfoAmpliada] = useState(null); 

    useEffect(() => {
        api.get('emprendimientos/')
            .then(response => {
                setEmprendimientos(response.data);
            })
            .catch(error => console.error("Error al cargar los datos: ", error));
    }, []);

    const centroLaMana = [-0.9405, -79.2245];

    const htmlEmprendimientosFiltrados = emprendimientos.filter(emp => 
        emp.nombre_emprendimiento.toLowerCase().includes(busqueda.toLowerCase()) ||
        emp.actividad.toLowerCase().includes(busqueda.toLowerCase())
    );

    const trazarRutaDesdeMiUbicacion = (latDestino, lngDestino) => {
        if (!navigator.geolocation) {
            alert("Tu navegador no soporta geolocalización.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setInfoRuta(null); 
                setRuta({
                    origen: { lat: position.coords.latitude, lng: position.coords.longitude },
                    destino: { lat: latDestino, lng: lngDestino }
                });
            },
            (error) => {
                alert("Para trazar la ruta, debes permitir el acceso a tu ubicación.");
                console.error(error);
            }
        );
    };

    const limpiarRuta = () => {
        setRuta({ origen: null, destino: null });
        setInfoRuta(null); 
    };

    const capasDisponibles = {
        google_calles: {
            url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
            attribution: "© Google Maps"
        },
        google_satelite: {
            url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
            attribution: "© Google Satélite"
        },
        moderno_claro: {
            url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            attribution: "© OpenStreetMap © CARTO"
        },
        moderno_oscuro: {
            url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            attribution: "© OpenStreetMap © CARTO"
        }
    };

    return (
        <div className="mapa-container">
            
            <div className="mapa-top-bar" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                    type="text" 
                    placeholder="🔍 Buscar emprendimiento o actividad..." 
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="mapa-search-input"
                />

                <select 
                    value={capaMapa} 
                    onChange={(e) => setCapaMapa(e.target.value)}
                    className="mapa-select"
                >
                    <option value="moderno_claro">✨ Diseño Moderno</option>
                    <option value="google_calles">🗺️ Google Calles</option>
                    <option value="google_satelite">🛰️ Satélite Híbrido</option>
                    <option value="moderno_oscuro">🌙 Modo Nocturno</option>
                </select>
                
                {infoRuta && (
                    <div style={{ 
                        backgroundColor: '#e3f2fd', color: '#0d47a1', padding: '8px 12px', 
                        borderRadius: '5px', fontWeight: 'bold', border: '1px solid #bbdefb',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <span>🚗 {infoRuta.distancia} km</span>
                        <span>|</span>
                        <span>⏱️ {infoRuta.tiempo}</span>
                    </div>
                )}
                
                {ruta.origen && (
                    <button onClick={limpiarRuta} className="mapa-btn-quitar">
                        ❌ Quitar Ruta
                    </button>
                )}
            </div>

            <div className="mapa-wrapper">
                <MapContainer center={centroLaMana} zoom={14} className="mapa-leaflet">
                    <TileLayer
                        key={capaMapa}
                        url={capasDisponibles[capaMapa].url}
                        attribution={capasDisponibles[capaMapa].attribution}
                    />
                    
                    <Rutador origen={ruta.origen} destino={ruta.destino} setInfoRuta={setInfoRuta} />

                    {ruta.origen && (
                        <Marker position={[ruta.origen.lat, ruta.origen.lng]} icon={iconos.amarillo}>
                            <Popup>📍 Estás aquí</Popup>
                        </Marker>
                    )}
                    
                    {htmlEmprendimientosFiltrados.map(emp => (
                        emp.latitud && emp.longitud ? (
                            <Marker 
                                key={emp.id} 
                                position={[emp.latitud, emp.longitud]}
                                icon={obtenerIconoPorActividad(emp.actividad)}
                            >
                                {/* 🏷️ NOMBRE DINÁMICO EN HOVER (Aparece solo al pasar el cursor) */}
                                <Tooltip direction="top" offset={[0, -30]} opacity={0.9}>
                                    <span style={{ fontWeight: 'bold', color: '#333', fontSize: '11px' }}>
                                        {emp.nombre_emprendimiento}
                                    </span>
                                </Tooltip>

                                <Popup minWidth={250}>
                                    <h3 className="popup-title" style={{ margin: '0 0 5px 0' }}>{emp.nombre_emprendimiento}</h3>
                                    <span className="popup-actividad" style={{ display: 'block', marginBottom: '10px' }}>
                                        {emp.actividad}
                                    </span>

                                    {(emp.imagen_1 || emp.imagen_2 || emp.imagen_3) && (
                                        <div style={{ 
                                            display: 'flex', gap: '8px', overflowX: 'auto', 
                                            marginBottom: '10px', paddingBottom: '5px', maxWidth: '250px' 
                                        }}>
                                            {emp.imagen_1 && (
                                                <img 
                                                    src={obtenerUrlImagen(emp.imagen_1)} 
                                                    alt="Foto 1" 
                                                    onClick={() => setImagenAmpliada(obtenerUrlImagen(emp.imagen_1))}
                                                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, cursor: 'pointer' }} 
                                                />
                                            )}
                                            {emp.imagen_2 && (
                                                <img 
                                                    src={obtenerUrlImagen(emp.imagen_2)} 
                                                    alt="Foto 2" 
                                                    onClick={() => setImagenAmpliada(obtenerUrlImagen(emp.imagen_2))}
                                                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, cursor: 'pointer' }} 
                                                />
                                            )}
                                            {emp.imagen_3 && (
                                                <img 
                                                    src={obtenerUrlImagen(emp.imagen_3)} 
                                                    alt="Foto 3" 
                                                    onClick={() => setImagenAmpliada(obtenerUrlImagen(emp.imagen_3))}
                                                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, cursor: 'pointer' }} 
                                                />
                                            )}
                                        </div>
                                    )}
                                    
                                    <hr className="popup-divider" style={{ margin: '10px 0' }} />
                                    
                                    <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>👨‍💼 <strong>Dueño:</strong> {emp.nombres} {emp.apellidos}</p>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>📍 <strong>Dir:</strong> {emp.ubicacion}</p>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '13px' }}>📱 <strong>Telf:</strong> {emp.celular}</p>
                                    
                                    <div className="popup-btn-ruta-container" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <button 
                                            onClick={() => setInfoAmpliada(emp)}
                                            style={{ width: '100%', padding: '8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            📋 Ver detalles completos
                                        </button>

                                        <button 
                                            onClick={() => trazarRutaDesdeMiUbicacion(emp.latitud, emp.longitud)}
                                            className="popup-btn-ruta"
                                            style={{ width: '100%', padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            🚗 Ir desde mi ubicación
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ) : null
                    ))}
                </MapContainer>
            </div>

            {/* 📸 MODAL 1: PARA AMPLIAR IMAGEN INDIVIDUAL */}
            {imagenAmpliada && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}
                    onClick={() => setImagenAmpliada(null)}
                >
                    <span style={{ position: 'absolute', top: '20px', right: '40px', color: 'white', fontSize: '40px', cursor: 'pointer' }}>&times;</span>
                    <img src={imagenAmpliada} alt="Imagen Ampliada" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', objectFit: 'contain' }} />
                </div>
            )}

            {/* 📋 MODAL 2: PARA MAXIMIZAR TODA LA INFORMACIÓN */}
            {infoAmpliada && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99998,
                        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
                    }}
                    onClick={() => setInfoAmpliada(null)}
                >
                    <div 
                        style={{
                            backgroundColor: 'white', padding: '30px', borderRadius: '12px',
                            maxWidth: '550px', width: '100%', boxShadow: '0 5px 25px rgba(0,0,0,0.3)',
                            position: 'relative', display: 'flex', flexDirection: 'column', gap: '15px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span 
                            style={{ position: 'absolute', top: '10px', right: '20px', fontSize: '32px', cursor: 'pointer', color: '#aaa' }}
                            onClick={() => setInfoAmpliada(null)}
                        >
                            &times;
                        </span>

                        <h2 style={{ margin: '0 0 5px 0', color: '#007bff' }}>{infoAmpliada.nombre_emprendimiento}</h2>
                        <span style={{ backgroundColor: '#e2e8f0', padding: '5px 10px', borderRadius: '20px', fontSize: '14px', width: 'fit-content', fontWeight: 'bold', color: '#4a5568' }}>
                            🏷️ {infoAmpliada.actividad}
                        </span>
                        
                        <hr style={{ border: '0', height: '1px', backgroundColor: '#e2e8f0', margin: '5px 0' }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '15px' }}>
                            <p style={{ margin: 0 }}>👤 <strong>Propietario:</strong> {infoAmpliada.nombres} {infoAmpliada.apellidos}</p>
                            <p style={{ margin: 0 }}>📍 <strong>Dirección Exacta:</strong> {infoAmpliada.ubicacion}</p>
                            <p style={{ margin: 0 }}>📱 <strong>Teléfono Celular:</strong> {infoAmpliada.celular}</p>
                            {infoAmpliada.correo && <p style={{ margin: 0 }}>📧 <strong>Correo Electrónico:</strong> {infoAmpliada.correo}</p>}
                        </div>

                        {(infoAmpliada.imagen_1 || infoAmpliada.imagen_2 || infoAmpliada.imagen_3) && (
                            <div>
                                <h4 style={{ margin: '10px 0' }}>📸 Galería del Emprendimiento:</h4>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {infoAmpliada.imagen_1 && <img src={obtenerUrlImagen(infoAmpliada.imagen_1)} alt="g1" style={{ width: '130px', height: '130px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />}
                                    {infoAmpliada.imagen_2 && <img src={obtenerUrlImagen(infoAmpliada.imagen_2)} alt="g2" style={{ width: '130px', height: '130px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />}
                                    {infoAmpliada.imagen_3 && <img src={obtenerUrlImagen(infoAmpliada.imagen_3)} alt="g3" style={{ width: '130px', height: '130px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />}
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => {
                                trazarRutaDesdeMiUbicacion(infoAmpliada.latitud, infoAmpliada.longitud);
                                setInfoAmpliada(null);
                            }}
                            style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '10px' }}
                        >
                            🚗 Trazar Ruta Óptima hacia aquí
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Mapa;