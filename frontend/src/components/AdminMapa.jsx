import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet'; 
import api from '../api';
import Swal from 'sweetalert2'; 
import './AdminMapa.css'; 

// 🎨 LISTA DE COLORES DISPONIBLES PARA LOS PINES
const coloresMarcadores = [
    'blue', 'gold', 'green', 'orange', 'yellow', 'violet', 'grey', 'black'
];

// 🔧 FUNCIÓN PARA CREAR EL ICONO DEL COLOR QUE LE PIDAMOS
const obtenerIcono = (color) => {
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

// 🎨 Función para asignar un color basado en la Actividad
const asignarColorPorActividad = (actividad) => {
    if (!actividad) return 'blue';
    let suma = 0;
    for (let i = 0; i < actividad.length; i++) {
        suma += actividad.charCodeAt(i);
    }
    return coloresMarcadores[suma % coloresMarcadores.length];
};

// 📍 Sub-componente para capturar los clics en el mapa
function CapturadorDeClics({ setNuevaCoordenada, setEmprendimientoEditando, limpiarFormulario }) {
    useMapEvents({
        click: (e) => {
            setEmprendimientoEditando(null); 
            limpiarFormulario(); 
            setNuevaCoordenada(e.latlng); 
        }
    });
    return null;
}

function AdminMapa() {
    const navigate = useNavigate();
    const [emprendimientos, setEmprendimientos] = useState([]);
    
    const [nuevaCoordenada, setNuevaCoordenada] = useState(null); 
    const [emprendimientoEditando, setEmprendimientoEditando] = useState(null); 
    
    const [capaMapa, setCapaMapa] = useState('moderno_claro');
    
    const [formData, setFormData] = useState({
        nombres: '', apellidos: '', cedula: '', correo: '', 
        celular: '', ubicacion: '', nombre_emprendimiento: '', actividad: ''
    });

    const [imagen1, setImagen1] = useState(null);
    const [imagen2, setImagen2] = useState(null);
    const [imagen3, setImagen3] = useState(null);

    // 🌟 Estados para la invitación masiva
    const [asuntoInvitacion, setAsuntoInvitacion] = useState('');
    const [mensajeInvitacion, setMensajeInvitacion] = useState('');
    const [archivoInvitacion, setArchivoInvitacion] = useState(null); 
    const [enviando, setEnviando] = useState(false);
    
    // 📬 NUEVO ESTADO: Controla si la tarjeta de invitación está abierta o cerrada
    const [mostrarInvitacion, setMostrarInvitacion] = useState(false);

    // 👤 NUEVOS ESTADOS: Control de creación de administradores
    const [mostrarRegistroAdmin, setMostrarRegistroAdmin] = useState(false);
    const [adminData, setAdminData] = useState({ username: '', email: '', password: '' });
    const [registrandoAdmin, setRegistrandoAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        cargarDatos();
    }, [navigate]);

    const cargarDatos = () => {
        api.get('emprendimientos/')
            .then(res => setEmprendimientos(res.data))
            .catch(err => console.error(err));
    };

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        let valorValidado = value;

        if (name === 'nombres' || name === 'apellidos') {
            valorValidado = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        }

        if (name === 'cedula' || name === 'celular') {
            valorValidado = value.replace(/\D/g, ''); 
            if (valorValidado.length > 10) {
                valorValidado = valorValidado.slice(0, 10); 
            }
        }

        setFormData({ ...formData, [name]: valorValidado });
    };

    const limpiarFormulario = () => {
        setFormData({ nombres: '', apellidos: '', cedula: '', correo: '', celular: '', ubicacion: '', nombre_emprendimiento: '', actividad: '' });
        setImagen1(null);
        setImagen2(null);
        setImagen3(null);
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => input.value = '');
    };

    const seleccionarParaEditar = (emp) => {
        setNuevaCoordenada(null); 
        setEmprendimientoEditando(emp.id); 
        
        setFormData({
            nombres: emp.nombres,
            apellidos: emp.apellidos,
            cedula: emp.cedula,
            correo: emp.correo || '',
            celular: emp.celular || '',
            ubicacion: emp.ubicacion,
            nombre_emprendimiento: emp.nombre_emprendimiento,
            actividad: emp.actividad
        });

        setImagen1(null);
        setImagen2(null);
        setImagen3(null);
    };

    const procesarPegadoExcel = (e) => {
        const texto = e.target.value;
        if (!texto) return;

        let columnas = texto.split('\t');
        if (columnas.length < 5) {
            columnas = texto.split(',');
        }

        if (columnas.length >= 7) {
            let cedulaLimpia = columnas[3] ? columnas[3].replace(/-/g, '').replace(/\D/g, '').slice(0,10).trim() : '';
            let celularLimpio = columnas[5] ? columnas[5].replace(/\D/g, '').slice(0,10).trim() : '';
            let actividadEncontrada = '';
            
            for (let i = columnas.length - 1; i >= 0; i--) {
                if (columnas[i] && columnas[i].trim() !== '') {
                    actividadEncontrada = columnas[i].trim();
                    break;
                }
            }
            
            setFormData({
                nombres: columnas[1] ? columnas[1].replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim() : '',
                apellidos: columnas[2] ? columnas[2].replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim() : '',
                cedula: cedulaLimpia,
                correo: columnas[4] ? columnas[4].trim() : '',
                celular: celularLimpio,
                ubicacion: columnas[6] ? columnas[6].replace(/['"]/g, '').trim() : '', 
                nombre_emprendimiento: columnas[7] ? columnas[7].trim() : '',
                actividad: actividadEncontrada
            });
            Swal.fire({
                title: '¡Datos cargados!',
                text: 'Revisa que la información pegada sea correcta.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire('Error', 'Por favor, asegúrate de copiar la fila completa desde Excel.', 'error');
        }
        e.target.value = '';
    };

    const guardarEmprendimiento = async (e) => {
        e.preventDefault();

        if (formData.cedula.length !== 10) {
            Swal.fire('Atención', 'La cédula debe tener exactamente 10 dígitos.', 'warning');
            return;
        }

        if (formData.celular && formData.celular.length !== 10) {
            Swal.fire('Atención', 'El celular debe tener exactamente 10 dígitos.', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = { 
                Authorization: `Bearer ${token}`
            };

            let lat = nuevaCoordenada ? nuevaCoordenada.lat : null;
            let lng = nuevaCoordenada ? nuevaCoordenada.lng : null;

            const dataToSubmit = new FormData();
            dataToSubmit.append('nombres', formData.nombres);
            dataToSubmit.append('apellidos', formData.apellidos);
            dataToSubmit.append('cedula', formData.cedula);
            dataToSubmit.append('correo', formData.correo);
            dataToSubmit.append('celular', formData.celular);
            dataToSubmit.append('ubicacion', formData.ubicacion);
            dataToSubmit.append('nombre_emprendimiento', formData.nombre_emprendimiento);
            dataToSubmit.append('actividad', formData.actividad);

            if (imagen1) dataToSubmit.append('imagen_1', imagen1);
            if (imagen2) dataToSubmit.append('imagen_2', imagen2);
            if (imagen3) dataToSubmit.append('imagen_3', imagen3);

            if (emprendimientoEditando) {
                const empOriginal = emprendimientos.find(emp => emp.id === emprendimientoEditando);
                lat = empOriginal.latitud;
                lng = empOriginal.longitud;
                
                dataToSubmit.append('latitud', lat);
                dataToSubmit.append('longitud', lng);
                
                await api.put(`emprendimientos/${emprendimientoEditando}/`, dataToSubmit, { headers });
                Swal.fire('¡Actualizado!', 'Los datos se actualizaron correctamente.', 'success');
            } else {
                if (lat !== null && lng !== null) {
                    dataToSubmit.append('latitud', lat);
                    dataToSubmit.append('longitud', lng);
                }
                
                await api.post('emprendimientos/', dataToSubmit, { headers });
                Swal.fire('¡Guardado!', 'El emprendimiento se ancló en el mapa.', 'success');
            }
            
            setNuevaCoordenada(null);
            setEmprendimientoEditando(null);
            limpiarFormulario();
            cargarDatos();
            
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Ocurrió un problema al guardar el registro.', 'error');
        }
    };

    const eliminarEmprendimiento = async () => {
        const confirmacion = await Swal.fire({
            title: '¿Estás completamente seguro?',
            text: "¡No podrás revertir esto! Se borrará el pin del mapa.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            await api.delete(`emprendimientos/${emprendimientoEditando}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('¡Eliminado!', 'El registro ha sido borrado.', 'success');
            setEmprendimientoEditando(null);
            limpiarFormulario();
            cargarDatos();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
        }
    };

    const enviarInvitacionMasiva = async () => {
        const correosValidos = emprendimientos
            .map(emp => emp.correo)
            .filter(correo => correo && correo.trim() !== '');

        if (correosValidos.length === 0) {
            Swal.fire('Sin destinatarios', 'No hay correos electrónicos registrados en la base de datos.', 'info');
            return;
        }

        if (!asuntoInvitacion.trim() || !mensajeInvitacion.trim()) {
            Swal.fire('Faltan datos', 'Por favor, escribe un asunto y un mensaje para la invitación.', 'warning');
            return;
        }

        const confirmacion = await Swal.fire({
            title: '¿Enviar correos?',
            text: `Se enviará la invitación a ${correosValidos.length} emprendedores.${archivoInvitacion ? ' (Con archivo adjunto)' : ''}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1a7a4a',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, enviar ahora',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        setEnviando(true);
        try {
            const token = localStorage.getItem('token');
            
            const dataToSubmit = new FormData();
            dataToSubmit.append('asunto', asuntoInvitacion);
            dataToSubmit.append('contenido', mensajeInvitacion);
            dataToSubmit.append('correos', JSON.stringify(correosValidos)); 

            if (archivoInvitacion) {
                dataToSubmit.append('archivo', archivoInvitacion);
            }

            await api.post('enviar-invitacion/', dataToSubmit, {
                headers: { 
                    Authorization: `Bearer ${token}`
                }
            });

            Swal.fire('¡Enviado!', 'Invitación masiva enviada con éxito.', 'success');
            
            setAsuntoInvitacion('');
            setMensajeInvitacion('');
            setArchivoInvitacion(null);
            setMostrarInvitacion(false); // 🌟 Se cierra automáticamente al enviar con éxito
            
            const inputArchivo = document.getElementById('input-archivo-invitacion');
            if(inputArchivo) inputArchivo.value = '';

        } catch (error) {
            console.error("Error al enviar correos:", error.response?.data || error);
            const msg = error.response?.data?.error || 'Hubo un error en el servidor.';
            Swal.fire('Error de envío', msg, 'error');
        } finally {
            setEnviando(false);
        }
    };

    // 👤 NUEVA FUNCIÓN: Registrar nuevo administrador / Staff
    const crearNuevoAdmin = async (e) => {
        e.preventDefault();
        
        if (!adminData.username || !adminData.password) {
            Swal.fire('Campos requeridos', 'El usuario y la contraseña son obligatorios.', 'warning');
            return;
        }

        setRegistrandoAdmin(true);
        try {
            const token = localStorage.getItem('token');
            // Nota: Aquí añadimos is_staff: true. Tu endpoint backend ('registrar-admin/')
            // debe procesar este campo de manera segura.
            const payload = {
                ...adminData,
                is_staff: true 
            };

            await api.post('registrar-admin/', payload, {
                headers: { 
                    Authorization: `Bearer ${token}`
                }
            });

            Swal.fire('¡Usuario Creado!', 'El nuevo administrador (Staff) ha sido registrado con éxito.', 'success');
            setMostrarRegistroAdmin(false);
            setAdminData({ username: '', email: '', password: '' });
        } catch (error) {
            console.error("Error al crear admin:", error.response?.data || error);
            const msg = error.response?.data?.error || 'No se pudo crear el administrador. Verifica si el usuario ya existe.';
            Swal.fire('Error', msg, 'error');
        } finally {
            setRegistrandoAdmin(false);
        }
    };

    const ampliarImagen = (urlImagen) => {
        if (!urlImagen) return;
        Swal.fire({
            imageUrl: urlImagen,
            imageAlt: 'Vista previa ampliada',
            width: '80%',
            showConfirmButton: false,
            showCloseButton: true,
            background: 'transparent',
            backdrop: `rgba(0,0,0,0.8)`
        });
    };

    const centroLaMana = [-0.9405, -79.2245];

    const capasDisponibles = {
        google_calles: { url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", attribution: "© Google Maps" },
        google_satelite: { url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", attribution: "© Google Satélite" },
        moderno_claro: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: "© OpenStreetMap © CARTO" },
        moderno_oscuro: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: "© OpenStreetMap © CARTO" }
    };

    const empOriginal = emprendimientoEditando ? emprendimientos.find(emp => emp.id === emprendimientoEditando) : null;

    const preview1 = imagen1 ? URL.createObjectURL(imagen1) : (empOriginal?.imagen_1 || null);
    const preview2 = imagen2 ? URL.createObjectURL(imagen2) : (empOriginal?.imagen_2 || null);
    const preview3 = imagen3 ? URL.createObjectURL(imagen3) : (empOriginal?.imagen_3 || null);

    return (
        <div className="admin-container">
            
            {/* PANEL LATERAL */}
            {(nuevaCoordenada || emprendimientoEditando) && (
                <div className="admin-panel" style={{ maxHeight: '95vh', overflowY: 'auto' }}>
                    <h3 style={{ color: emprendimientoEditando ? '#ffc107' : '#1a7a4a', marginTop: 0, marginBottom: '5px' }}>
                        {emprendimientoEditando ? '✏️ Editar Registro' : '📍 Nuevo Registro'}
                    </h3>
                    
                    {nuevaCoordenada && (
                        <p style={{ fontSize: '12px', color: '#666', marginTop: 0 }}>Lat: {nuevaCoordenada.lat.toFixed(5)} <br/> Lng: {nuevaCoordenada.lng.toFixed(5)}</p>
                    )}

                    <div className="admin-caja-excel">
                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a7a4a' }}>⚡ Autocompletar (Opcional)</label>
                        <input type="text" placeholder="Copia una fila de Excel y pégala aquí..." onChange={procesarPegadoExcel} className="admin-input" style={{ marginTop: '8px' }} />
                    </div>

                    <form onSubmit={guardarEmprendimiento} className="admin-form-group">
                        <input className="admin-input" name="nombre_emprendimiento" placeholder="Nombre Emprendimiento" required value={formData.nombre_emprendimiento} onChange={manejarCambio} />
                        <input className="admin-input" name="actividad" placeholder="Actividad (Ej. Turismo)" required value={formData.actividad} onChange={manejarCambio} />
                        <input className="admin-input" name="ubicacion" placeholder="Dirección escrita" required value={formData.ubicacion} onChange={manejarCambio} />
                        <input className="admin-input" name="nombres" placeholder="Nombres del Dueño" required value={formData.nombres} onChange={manejarCambio} />
                        <input className="admin-input" name="apellidos" placeholder="Apellidos del Dueño" required value={formData.apellidos} onChange={manejarCambio} />
                        <input className="admin-input" type="text" name="cedula" placeholder="Cédula" maxLength="10" required value={formData.cedula} onChange={manejarCambio} />
                        <input className="admin-input" type="text" name="celular" placeholder="Celular" maxLength="10" required value={formData.celular} onChange={manejarCambio} />
                        <input className="admin-input" name="correo" type="email" placeholder="Correo (Opcional)" value={formData.correo} onChange={manejarCambio} />
                        
                        {/* 📸 SECCIÓN DE FOTOS */}
                        <div style={{ margin: '10px 0', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>📸 Fotos (Clic para ampliar):</label>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <input type="file" accept="image/*" onChange={(e) => setImagen1(e.target.files[0])} style={{ flex: 1, fontSize: '11px' }} />
                                {preview1 && <img src={preview1} alt="Preview 1" onClick={() => ampliarImagen(preview1)} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in', border: '1px solid #ccc' }} title="Clic para ampliar" />}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <input type="file" accept="image/*" onChange={(e) => setImagen2(e.target.files[0])} style={{ flex: 1, fontSize: '11px' }} />
                                {preview2 && <img src={preview2} alt="Preview 2" onClick={() => ampliarImagen(preview2)} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in', border: '1px solid #ccc' }} title="Clic para ampliar" />}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="file" accept="image/*" onChange={(e) => setImagen3(e.target.files[0])} style={{ flex: 1, fontSize: '11px' }} />
                                {preview3 && <img src={preview3} alt="Preview 3" onClick={() => ampliarImagen(preview3)} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in', border: '1px solid #ccc' }} title="Clic para ampliar" />}
                            </div>
                        </div>

                        <div className="admin-botones" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <button type="submit" className="admin-btn-guardar" style={{ flex: '1 1 100%' }}>{emprendimientoEditando ? 'Actualizar Datos' : 'Guardar Pin'}</button>
                            {emprendimientoEditando && <button type="button" onClick={eliminarEmprendimiento} style={{ flex: '1', padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Eliminar</button>}
                            <button type="button" onClick={() => { setNuevaCoordenada(null); setEmprendimientoEditando(null); limpiarFormulario(); }} style={{ flex: '1', padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* CONTENEDOR DEL MAPA */}
            <div className="admin-map-wrapper" style={{ position: 'relative' }}>
                
                {/* Selector de capas clásico */}
                <select 
                    value={capaMapa} 
                    onChange={(e) => setCapaMapa(e.target.value)}
                    className="admin-map-select"
                >
                    <option value="moderno_claro">✨ Diseño Moderno</option>
                    <option value="google_calles">🗺️ Google Calles</option>
                    <option value="google_satelite">🛰️ Satélite Híbrido</option>
                    <option value="moderno_oscuro">🌙 Modo Nocturno</option>
                </select>

                {/* 👤 NUEVO: Botón Flotante para Crear Administrador */}
                <button 
                    onClick={() => {
                        setMostrarRegistroAdmin(!mostrarRegistroAdmin);
                        setMostrarInvitacion(false); // Cierra el otro panel si está abierto
                    }}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '260px', 
                        zIndex: 1000,
                        backgroundColor: mostrarRegistroAdmin ? '#dc3545' : '#0d6efd',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        fontSize: '18px',
                        cursor: 'pointer',
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                    }}
                    title={mostrarRegistroAdmin ? "Cerrar Panel" : "Registrar Nuevo Admin (Staff)"}
                >
                    {mostrarRegistroAdmin ? '❌' : '👤'}
                </button>

                {/* 🌟 Botón Flotante de Carta para Abrir/Cerrar la Invitación */}
                <button 
                    onClick={() => {
                        setMostrarInvitacion(!mostrarInvitacion);
                        setMostrarRegistroAdmin(false); // Cierra el otro panel si está abierto
                    }}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '210px', 
                        zIndex: 1000,
                        backgroundColor: mostrarInvitacion ? '#dc3545' : '#1a7a4a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        fontSize: '18px',
                        cursor: 'pointer',
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                    }}
                    title={mostrarInvitacion ? "Cerrar Panel" : "Redactar Invitación Masiva"}
                >
                    {mostrarInvitacion ? '❌' : '✉️'}
                </button>

                {/* 👤 TARJETA DE REGISTRO DE ADMINISTRADOR */}
                {mostrarRegistroAdmin && (
                    <div className="admin-card-registro" style={{
                        position: 'absolute',
                        top: '60px',
                        right: '10px',
                        zIndex: 1000,
                        backgroundColor: 'white',
                        padding: '16px',
                        borderRadius: '24px', 
                        border: '1px solid #ccc',
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                        width: '300px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                    }}>
                        <button 
                            onClick={() => setMostrarRegistroAdmin(false)}
                            style={{
                                position: 'absolute',
                                top: '14px',
                                right: '14px',
                                background: 'none',
                                border: 'none',
                                fontSize: '12px',
                                cursor: 'pointer',
                                color: '#999'
                            }}
                        >
                            ❌
                        </button>

                        <h4 style={{ margin: '0 0 4px 0', color: '#0d6efd', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            👤 Nuevo Administrador
                        </h4>
                        <p style={{ fontSize: '11px', color: '#666', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                            Registra un nuevo usuario con permisos administrativos (Staff).
                        </p>

                        <form onSubmit={crearNuevoAdmin}>
                            <input 
                                type="text"
                                placeholder="Nombre de usuario"
                                value={adminData.username}
                                onChange={(e) => setAdminData({...adminData, username: e.target.value})}
                                style={{
                                    width: '100%', padding: '10px 14px', marginBottom: '10px',
                                    borderRadius: '14px', border: '1px solid #ddd', fontSize: '12px',
                                    boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9f9f9'
                                }}
                                required
                            />
                            
                            <input 
                                type="email"
                                placeholder="Correo electrónico (Opcional)"
                                value={adminData.email}
                                onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                                style={{
                                    width: '100%', padding: '10px 14px', marginBottom: '10px',
                                    borderRadius: '14px', border: '1px solid #ddd', fontSize: '12px',
                                    boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9f9f9'
                                }}
                            />

                            <input 
                                type="password"
                                placeholder="Contraseña"
                                value={adminData.password}
                                onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                                style={{
                                    width: '100%', padding: '10px 14px', marginBottom: '14px',
                                    borderRadius: '14px', border: '1px solid #ddd', fontSize: '12px',
                                    boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9f9f9'
                                }}
                                required
                            />

                            <button 
                                type="submit"
                                disabled={registrandoAdmin}
                                style={{
                                    width: '100%', padding: '11px',
                                    backgroundColor: registrandoAdmin ? '#6c757d' : '#0d6efd',
                                    color: 'white', border: 'none', borderRadius: '18px', 
                                    fontWeight: 'bold', cursor: registrandoAdmin ? 'not-allowed' : 'pointer',
                                    fontSize: '12px', transition: 'background-color 0.2s ease',
                                    boxShadow: '0 2px 5px rgba(13, 110, 253, 0.2)'
                                }}
                                onMouseEnter={(e) => !registrandoAdmin && (e.target.style.backgroundColor = '#0b5ed7')}
                                onMouseLeave={(e) => !registrandoAdmin && (e.target.style.backgroundColor = '#0d6efd')}
                            >
                                {registrandoAdmin ? '⏳ Registrando...' : '✨ Crear Admin'}
                            </button>
                        </form>
                    </div>
                )}

                {/* 📬 TARJETA DE INVITACIÓN CONDICIONAL */}
                {mostrarInvitacion && (
                    <div className="admin-card-invitacion" style={{
                        position: 'absolute',
                        top: '60px',
                        right: '10px',
                        zIndex: 1000,
                        backgroundColor: 'white',
                        padding: '16px',
                        borderRadius: '24px', 
                        border: '1px solid #ccc',
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                        width: '300px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                    }}>
                        {/* Botón rápido para cerrar dentro de la tarjeta */}
                        <button 
                            onClick={() => setMostrarInvitacion(false)}
                            style={{
                                position: 'absolute',
                                top: '14px',
                                right: '14px',
                                background: 'none',
                                border: 'none',
                                fontSize: '12px',
                                cursor: 'pointer',
                                color: '#999'
                            }}
                        >
                            ❌
                        </button>

                        <h4 style={{ margin: '0 0 4px 0', color: '#333', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📩 Redactar Invitación Masiva
                        </h4>
                        <p style={{ fontSize: '11px', color: '#666', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                            El texto ingresado será remitido de forma automática a los correos guardados.
                        </p>

                        <input 
                            type="text"
                            placeholder="Asunto de la invitación..."
                            value={asuntoInvitacion}
                            onChange={(e) => setAsuntoInvitacion(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                marginBottom: '10px',
                                borderRadius: '14px',
                                border: '1px solid #ddd',
                                fontSize: '12px',
                                boxSizing: 'border-box',
                                outline: 'none',
                                backgroundColor: '#f9f9f9'
                            }}
                        />

                        <textarea 
                            placeholder="Redacta el cuerpo de la invitación aquí..."
                            value={mensajeInvitacion}
                            onChange={(e) => setMensajeInvitacion(e.target.value)}
                            rows="5"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                marginBottom: '10px',
                                borderRadius: '14px',
                                border: '1px solid #ddd',
                                fontSize: '12px',
                                resize: 'none',
                                boxSizing: 'border-box',
                                outline: 'none',
                                fontFamily: 'inherit',
                                backgroundColor: '#f9f9f9'
                            }}
                        />

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '4px' }}>
                                📎 Archivo adjunto (Opcional):
                            </label>
                            <input 
                                id="input-archivo-invitacion"
                                type="file" 
                                onChange={(e) => setArchivoInvitacion(e.target.files[0])}
                                style={{
                                    width: '100%',
                                    fontSize: '11px',
                                    color: '#555'
                                }}
                            />
                        </div>

                        <button 
                            onClick={enviarInvitacionMasiva}
                            disabled={enviando}
                            style={{
                                width: '100%',
                                padding: '11px',
                                backgroundColor: enviando ? '#6c757d' : '#1a7a4a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '18px', 
                                fontWeight: 'bold',
                                cursor: enviando ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                transition: 'background-color 0.2s ease',
                                boxShadow: '0 2px 5px rgba(26,122,74,0.2)'
                            }}
                            onMouseEnter={(e) => !enviando && (e.target.style.backgroundColor = '#145d39')}
                            onMouseLeave={(e) => !enviando && (e.target.style.backgroundColor = '#1a7a4a')}
                        >
                            {enviando ? '⏳ Enviando...' : `🚀 Enviar a ${emprendimientos.filter(emp => emp.correo && emp.correo.trim() !== '').length} correos`}
                        </button>
                    </div>
                )}

                <MapContainer center={centroLaMana} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer key={capaMapa} url={capasDisponibles[capaMapa].url} attribution={capasDisponibles[capaMapa].attribution} />
                    <CapturadorDeClics setNuevaCoordenada={setNuevaCoordenada} setEmprendimientoEditando={setEmprendimientoEditando} limpiarFormulario={limpiarFormulario} />

                    {nuevaCoordenada && (
                        <Marker position={[nuevaCoordenada.lat, nuevaCoordenada.lng]} icon={obtenerIcono('red')} opacity={0.8}></Marker>
                    )}

                    {emprendimientos.map(emp => (
                        emp.latitud && emp.longitud ? (
                            <Marker 
                                key={emp.id} 
                                position={[emp.latitud, emp.longitud]}
                                icon={obtenerIcono(asignarColorPorActividad(emp.actividad))} 
                            >
                                <Tooltip direction="top" offset={[0, -20]}>
                                    <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{emp.nombre_emprendimiento}</span>
                                </Tooltip>

                                <Popup>
                                    <strong>{emp.nombre_emprendimiento}</strong><br/>
                                    <em>{emp.actividad}</em>
                                    <button 
                                        onClick={() => seleccionarParaEditar(emp)} 
                                        style={{ display: 'block', width: '100%', marginTop: '8px', padding: '6px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#333' }}>
                                        ✏️ Editar o Eliminar
                                    </button>
                                </Popup>
                            </Marker>
                        ) : null
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}

export default AdminMapa;