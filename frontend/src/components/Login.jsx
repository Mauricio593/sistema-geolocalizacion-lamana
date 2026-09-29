import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // 👈 Asegúrate de poner la ruta relativa correcta hacia tu archivo de Axios
import './Login.css';

function Login() {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [error, setError] = useState(''); 

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Limpiamos errores previos

        try {
            // 💥 Conectamos con Django usando tu cliente 'api'
            // Nota: En Django se suele usar 'username'. Si tu backend espera 'email', cambia la clave aquí abajo.
            // Añadimos la barra '/' al final ('login/') porque Django es estricto con las URL slash.
            const response = await api.post('login/', {
                username: usuario, 
                password: password
            });

            // Capturamos el token. Dependiendo de cómo lo devuelva tu Django (Simple JWT usa 'access', Token Auth usa 'token')
            const token = response.data.token || response.data.access;

            if (token) {
                localStorage.setItem('token', token); // Lo guardamos para tus interceptores
            }
            
            // 🚀 Redirección exitosa a tu ruta registrada en App.jsx
            navigate('/admin-mapa'); 

        } catch (err) {
            console.error("Error en el inicio de sesión:", err);
            
            // Si el backend respondió con un mensaje de error legible
            if (err.response && err.response.data) {
                setError(err.response.data.detail || err.response.data.error || 'Usuario o contraseña incorrectos.');
            } else {
                setError('Error de conexión. Asegúrate de que el servidor de Django (Puerto 8000) esté encendido.');
            }
        }
    };

    return (
        <div className="login-wrapper">
            {/* 🌟 LADO IZQUIERDO: IMAGEN (Con el difuminado y sin la línea gris) */}
            <div className="login-image-side"></div>

            {/* 🌟 LADO DERECHO: FORMULARIO */}
            <div className="login-form-side">
                <div className="login-box">
                    <h2 className="login-title">Iniciar Sesión</h2>
                    
                    {/* Alerta de Error Dinámica */}
                    {error && <div className="login-error">{error}</div>}

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="login-input-group">
                            <input 
                                type="text" 
                                placeholder="Usuario o Correo" 
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="login-input-group">
                            <input 
                                type={mostrarPassword ? "text" : "password"} 
                                placeholder="Contraseña" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                            <span 
                                className="password-eye" 
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                            >
                                {mostrarPassword ? "👁️" : "🙈"}
                            </span>
                        </div>

                        <div className="login-options">
                            <label className="checkbox-container">
                                <input type="checkbox" /> Recordarme
                            </label>
                            <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
                        </div>

                        <button type="submit" className="login-btn-submit">
                            Ingresar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;