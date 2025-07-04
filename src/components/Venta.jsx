import { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    Timestamp,
} from 'firebase/firestore';

const Venta = () => {
    const [productos, setProductos] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [items, setItems] = useState([]);
    const [cliente, setCliente] = useState('');
    const [mensaje, setMensaje] = useState('');

    // Utils
    const setMensajeTemporal = (texto, tiempo = 2500) => {
        setMensaje(texto);
        setTimeout(() => setMensaje(''), tiempo);
    };

    const getProducto = (id) => productos.find(p => p.id === id);

    // Cargar productos una sola vez
    useEffect(() => {
        const cargarProductos = async () => {
            const snap = await getDocs(collection(db, 'productos'));
            const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProductos(lista);
        };
        cargarProductos();
    }, []);

    // Agregar producto
    const agregar = () => {
        const producto = getProducto(productoSeleccionado);
        const cantidadInt = parseInt(cantidad);

        if (!producto || cantidadInt < 1) return;

        if (producto.stock < cantidadInt) {
            return setMensajeTemporal(`❌ No hay stock suficiente para "${producto.nombre}".`);
        }

        setItems(prevItems => {
            const itemExistente = prevItems.find(item => item.id === producto.id);
            if (itemExistente) {
                return prevItems.map(item =>
                    item.id === producto.id
                        ? {
                            ...item,
                            cantidad: item.cantidad + cantidadInt,
                            subtotal: item.precio * (item.cantidad + cantidadInt)
                        }
                        : item
                );
            } else {
                return [
                    ...prevItems,
                    {
                        ...producto,
                        cantidad: cantidadInt,
                        subtotal: producto.precio * cantidadInt,
                    }
                ];
            }
        });

        setCantidad(1);
        setProductoSeleccionado('');
    };

    // Modificar cantidad
    const modificarCantidad = (id, nuevaCantidad) => {
        if (nuevaCantidad < 1) return;

        const producto = getProducto(id);
        if (producto && producto.stock < nuevaCantidad) {
            return setMensajeTemporal(`❌ No hay suficiente stock para "${producto.nombre}".`);
        }

        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id
                    ? { ...item, cantidad: nuevaCantidad, subtotal: item.precio * nuevaCantidad }
                    : item
            )
        );
    };

    const eliminarProducto = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Guardar venta
    const guardarVenta = async () => {
        if (items.length === 0) {
            return setMensajeTemporal('❌ No hay productos en la venta');
        }

        setMensaje('Guardando venta...');

        const ventaData = {
            cliente: cliente.trim() || 'Consumidor final',
            items: items.map(({ id, nombre, precio, cantidad, subtotal }) => ({
                id, nombre, precio, cantidad, subtotal
            })),
            total,
            fecha: Timestamp.now(),
            estado: 'pendiente',
            metodoPago: '',
        };

        try {
            const ventaRef = await addDoc(collection(db, 'ventas'), ventaData);

            // Actualizar stock
            await Promise.all(
                items.map(item =>
                    updateDoc(doc(db, 'productos', item.id), {
                        stock: item.stock - item.cantidad
                    })
                )
            );

            // Limpiar campos
            setItems([]);
            setCliente('');
            setMensaje('✅ Venta registrada correctamente!');
            abrirNotaParaImprimir(ventaData);

        } catch (error) {
            console.error('Error al guardar venta:', error);
            setMensaje(`❌ Error: ${error.message}`);
        }
    };

    const abrirNotaParaImprimir = (venta) => {
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`
            <html>
                <head>
                    <title>Boleta de Venta</title>
                    <style>
                        body { font-family: Arial; font-size: 12px; margin: 0; padding: 10px; }
                        .boleta { width: 240px; margin: auto; text-align: center; }
                        .titulo { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
                        .linea { border-top: 1px dashed #000; margin: 8px 0; }
                        .producto { text-align: left; margin: 2px 0; }
                        .total { font-weight: bold; margin-top: 10px; }
                        .metodo { margin-top: 5px; }
                    </style>
                </head>
                <body onload="window.print(); setTimeout(() => window.close(), 500);">
                    <div class="boleta">
                        <div class="titulo">BOLETA DE VENTA</div>
                        <div>Cliente: <strong>${venta.cliente}</strong></div>
                        <div>Fecha: ${new Date().toLocaleString()}</div>
                        <div class="linea"></div>
                        <div style="text-align:left">
                            ${venta.items.map(item => `
                                <div class="producto">
                                    ${item.nombre}<br />
                                    ${item.cantidad} x S/ ${item.precio.toFixed(2)} = S/ ${item.subtotal.toFixed(2)}
                                </div>
                            `).join('')}
                        </div>
                        <div class="linea"></div>
                        <div class="total">TOTAL: S/ ${venta.total.toFixed(2)}</div>
                        <div class="metodo">Pago: ${venta.metodoPago || '---'}</div>
                        <div>${venta.estado === 'completada' ? '✅ Pagado' : '❌ Pendiente'}</div>
                        <div class="linea"></div>
                        <div>Gracias por su compra</div>
                    </div>
                </body>
            </html>
        `);
        win.document.close();
    };

    // El render del JSX permanece igual...

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold text-orange-600 mb-6">Registro de Ventas</h2>

            {/* Mensaje de estado */}
            {mensaje && (
                <div className={`mb-4 p-3 rounded-md ${mensaje.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mensaje}
                </div>
            )}

            {/* Sección Cliente */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <label className="block text-gray-700 mb-2 font-medium">Cliente</label>
                <input
                    type="text"
                    value={cliente}
                    placeholder="Nombre del cliente"
                    onChange={e => setCliente(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
            </div>

            {/* Sección Agregar Productos */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Agregar Productos</h3>

                <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <select
                        value={productoSeleccionado}
                        onChange={e => setProductoSeleccionado(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="">Seleccionar producto</option>
                        {productos.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} - S/ {p.precio.toFixed(2)} ({p.stock} disp.)
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        value={cantidad}
                        min={1}
                        placeholder="Cantidad"
                        onChange={e => setCantidad(e.target.value)}
                        className="w-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />

                    <button
                        onClick={agregar}
                        disabled={!productoSeleccionado || cantidad < 1}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
                    >
                        Agregar
                    </button>
                </div>
            </div>

            {/* Lista de Productos */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Productos en la venta</h3>

                {items.length === 0 ? (
                    <p className="text-gray-500 italic">No hay productos agregados</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {items.map((item) => (
                            <li key={item.id} className="py-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="font-medium">{item.nombre}</span>
                                        <span className="text-gray-600 ml-2">(S/ {item.precio.toFixed(2)})</span>
                                    </div>
                                    <div className="font-medium">S/ {item.subtotal.toFixed(2)}</div>
                                </div>

                                <div className="flex items-center mt-2 gap-2">
                                    <button
                                        onClick={() => modificarCantidad(item.id, item.cantidad - 1)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded"
                                    >
                                        -
                                    </button>

                                    <span className="w-10 text-center">{item.cantidad}</span>

                                    <button
                                        onClick={() => modificarCantidad(item.id, item.cantidad + 1)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 rounded"
                                    >
                                        +
                                    </button>

                                    <button
                                        onClick={() => eliminarProducto(item.id)}
                                        className="ml-4 text-red-500 hover:text-red-700"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-4 pt-3 border-t border-gray-200">
                    <h3 className="text-xl font-bold text-right text-orange-600">
                        Total: S/ {total.toFixed(2)}
                    </h3>
                </div>
            </div>

            {/* Botón Guardar */}
            <div className="text-center">
                <button
                    onClick={guardarVenta}
                    disabled={items.length === 0}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Guardar Venta
                </button>
            </div>
        </div>
    );
};

export default Venta;