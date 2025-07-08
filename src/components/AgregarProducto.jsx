import { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const AgregarProducto = () => {
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [productos, setProductos] = useState([]);
    const [modoEdicion, setModoEdicion] = useState(null);
    const [contrasena, setContrasena] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'platos', 'bebidas'
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        setCargando(true);
        try {
            const snap = await getDocs(collection(db, 'productos'));
            const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProductos(lista);
        } catch (error) {
            setMensaje('❌ Error al cargar productos');
            console.error(error);
        } finally {
            setCargando(false);
        }
    };

    const guardarProducto = async () => {
        if (!nombre || !precio || !stock) {
            setMensaje('❌ Completa todos los campos');
            setTimeout(() => setMensaje(''), 2500);
            return;
        }

        try {
            setCargando(true);
            await addDoc(collection(db, 'productos'), {
                nombre,
                precio: parseFloat(precio),
                stock: parseInt(stock),
            });

            setNombre('');
            setPrecio('');
            setStock('');
            setMensaje('✅ Producto agregado correctamente');
            await cargarProductos();
        } catch (err) {
            setMensaje('❌ Error al guardar producto');
            console.error(err);
        } finally {
            setCargando(false);
            setTimeout(() => setMensaje(''), 2500);
        }
    };

    const confirmarEdicion = async (producto) => {
        if (!contrasena) {
            setMensaje('❌ Ingresa tu contraseña para confirmar');
            setTimeout(() => setMensaje(''), 2500);
            return;
        }

        try {
            setCargando(true);
            const credential = EmailAuthProvider.credential(auth.currentUser.email, contrasena);
            await reauthenticateWithCredential(auth.currentUser, credential);

            const ref = doc(db, 'productos', producto.id);
            await updateDoc(ref, {
                nombre: producto.nombre,
                precio: parseFloat(producto.precio),
                stock: parseInt(producto.stock)
            });

            setMensaje('✅ Producto actualizado');
            setModoEdicion(null);
            setContrasena('');
            await cargarProductos();
        } catch (err) {
            setMensaje('❌ Contraseña incorrecta o error');
            console.error(err);
        } finally {
            setCargando(false);
            setTimeout(() => setMensaje(''), 2500);
        }
    };

    const handleEditarCampo = (id, campo, valor) => {
        setProductos(prev => prev.map(p => p.id === id ? { ...p, [campo]: valor } : p));
    };

    const productosFiltrados = productos.filter(p => {
        if (filtroTipo === 'todos') return true;
        if (filtroTipo === 'platos') return p.stock === 999;
        if (filtroTipo === 'bebidas') return p.stock !== 999;
        return true;
    });

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Sección Agregar Producto */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold text-orange-600 mb-4 border-b pb-2">Agregar Nuevo Producto</h2>

                {mensaje && (
                    <div className={`mb-4 p-3 rounded-md ${mensaje.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {mensaje}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Nombre</label>
                        <input
                            type="text"
                            placeholder="Nombre del producto"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Precio (S/)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={precio}
                            onChange={e => setPrecio(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Stock</label>
                        <input
                            type="number"
                            placeholder="Cantidad"
                            min="0"
                            value={stock}
                            onChange={e => setStock(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                </div>

                <button
                    onClick={guardarProducto}
                    disabled={cargando}
                    className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-md transition disabled:opacity-50"
                >
                    {cargando ? 'Guardando...' : 'Guardar Producto'}
                </button>
            </div>

            {/* Sección Lista de Productos */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <h2 className="text-xl font-bold text-orange-600 mb-2 md:mb-0">Lista de Productos</h2>

                    <div className="flex items-center space-x-4">
                        <span className="text-gray-700">Filtrar:</span>
                        <select
                            value={filtroTipo}
                            onChange={e => setFiltroTipo(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="todos">Todos</option>
                            <option value="platos">Platos</option>
                            <option value="bebidas">Bebidas</option>
                        </select>
                    </div>
                </div>

                {cargando && productos.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                ) : productosFiltrados.length === 0 ? (
                    <p className="text-gray-500 italic py-4">No hay productos registrados</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {productosFiltrados.map(p => (
                            <div key={p.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                {modoEdicion === p.id ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-gray-700 text-sm mb-1">Nombre</label>
                                            <input
                                                type="text"
                                                value={p.nombre}
                                                onChange={e => handleEditarCampo(p.id, 'nombre', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-700 text-sm mb-1">Precio</label>
                                                <input
                                                    type="number"
                                                    value={p.precio}
                                                    onChange={e => handleEditarCampo(p.id, 'precio', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-sm mb-1">Stock</label>
                                                <input
                                                    type="number"
                                                    value={p.stock}
                                                    onChange={e => handleEditarCampo(p.id, 'stock', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 text-sm mb-1">Contraseña</label>
                                            <input
                                                type="password"
                                                placeholder="Tu contraseña"
                                                value={contrasena}
                                                onChange={e => setContrasena(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div className="flex space-x-2 pt-2">
                                            <button
                                                onClick={() => confirmarEdicion(p)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                onClick={() => setModoEdicion(null)}
                                                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-gray-800">{p.nombre}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                p.stock === 999
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {p.stock === 999 ? 'Plato' : 'Bebida'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <p className="text-gray-500 text-sm">Precio</p>
                                                <p className="font-medium">S/ {p.precio.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm">Stock</p>
                                                <p className="font-medium">{p.stock}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setModoEdicion(p.id)}
                                            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                        >
                                            Editar Producto
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgregarProducto;