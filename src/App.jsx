import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

import Login from './components/Login';
import Venta from './components/Venta';
import Gastos from './components/Gastos';
import Dashboard from './components/Dashboard';
import ListaPedidos from './components/ListaPedidos';

function App() {
    const [usuario, setUsuario] = useState(null);
    const [rol, setRol] = useState('');
    const [vista, setVista] = useState('ventas');
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUsuario(user);
                // Buscar el rol en Firestore
                const docRef = doc(db, 'usuarios', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRol(docSnap.data().rol);
                } else {
                    setRol('vendedor');
                }
            } else {
                setUsuario(null);
                setRol('');
            }
            setCargando(false);
        });
        return () => unsub();
    }, []);

    if (cargando) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-orange-600 text-lg font-medium">Cargando...</div>
        </div>
    );

    if (!usuario) return <Login onLogin={() => {}} />;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-orange-600 px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">🍔 Salchipapon</h1>
                    <button
                        onClick={() => auth.signOut()}
                        className="text-white hover:text-orange-200 text-sm font-medium transition"
                    >
                        Cerrar sesión
                    </button>
                </div>

                {/* Navegación */}
                <div className="border-b border-gray-200 px-6 py-3 flex flex-wrap gap-2">
                    <button
                        onClick={() => setVista('ventas')}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition ${vista === 'ventas' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        🛒 Ventas
                    </button>
                    <button
                        onClick={() => setVista('pedidos')}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition ${vista === 'pedidos' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        📄 Lista pedidos
                    </button>

                    {rol === 'admin' && (
                        <>
                            <button
                                onClick={() => setVista('gastos')}
                                className={`px-4 py-2 rounded-md font-medium text-sm transition ${vista === 'gastos' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                💸 Gastos
                            </button>
                            <button
                                onClick={() => setVista('dashboard')}
                                className={`px-4 py-2 rounded-md font-medium text-sm transition ${vista === 'dashboard' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                📊 Dashboard
                            </button>
                        </>
                    )}
                </div>

                {/* Contenido */}
                <div className="p-6">
                    {vista === 'ventas' && <Venta />}
                    {vista === 'pedidos' && <ListaPedidos />}
                    {vista === 'gastos' && rol === 'admin' && <Gastos />}
                    {vista === 'dashboard' && rol === 'admin' && <Dashboard />}
                </div>
            </div>
        </div>
    );
}

export default App;