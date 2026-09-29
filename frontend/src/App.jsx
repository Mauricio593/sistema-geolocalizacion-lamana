import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Inicio from './components/Inicio'; // <-- 1. Importamos el nuevo componente Inicio
import Mapa from './components/Mapa';
import Login from './components/Login';
import AdminMapa from './components/AdminMapa'; 

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* 2. El Inicio ahora es la primera pantalla que se muestra */}
        <Route path="/" element={<Inicio />} />
        
        {/* 3. El Mapa ahora tiene su propia ruta dedicada */}
        <Route path="/mapa" element={<Mapa />} />
        
        <Route path="/login" element={<Login />} />
        
        {/* Ruta privada para el admin */}
        <Route path="/admin-mapa" element={<AdminMapa />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;