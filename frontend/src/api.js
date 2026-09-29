import axios from 'axios';

// Creamos una conexión base hacia nuestro backend en Django
const api = axios.create({
    baseURL: 'https://backend-lamana.onrender.com/api/' 
     // <-- Aquí está la corrección con las barras //
});

// 🛡️ INTERCEPTOR DE PETICIONES: Se ejecuta ANTES de enviar al servidor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        
        // Si hay token, lo inyectamos (ideal para crear, editar, eliminar)
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 🛡️ NUEVO: INTERCEPTOR DE RESPUESTAS: Se ejecuta al RECIBIR del servidor
api.interceptors.response.use(
    (response) => {
        return response; // Si todo sale bien, dejamos pasar la respuesta
    },
    (error) => {
        // Si el servidor nos da un 401 (No Autorizado) o el token expiró
        if (error.response && error.response.status === 401) {
            console.warn("Sesión expirada o no autorizada. Limpiando credenciales...");
            localStorage.removeItem('token'); // Borramos el token caducado
            
            // Redirigir sutilmente al login solo si estamos en la zona de admin
            if (window.location.pathname.includes('/admin')) {
                window.location.href = '/login'; 
            }
        }
        return Promise.reject(error);
    }
);

export default api;