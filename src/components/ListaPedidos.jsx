import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const ListaPedidos = () => {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [montoPagado, setMontoPagado] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        const cargarVentas = async () => {
            try {
                setLoading(true);
                const snap = await getDocs(collection(db, 'ventas'));
                const lista = snap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    fecha: doc.data().fecha?.toDate() || new Date()
                }));
                lista.sort((a, b) => b.fecha - a.fecha);
                setVentas(lista);
            } catch (error) {
                console.error("Error cargando ventas:", error);
                setMensaje('❌ Error al cargar ventas');
            } finally {
                setLoading(false);
            }
        };
        cargarVentas();
    }, []);

    const imprimirVenta = (venta) => {
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
            <div>Cliente: <strong>${venta.cliente || 'Consumidor final'}</strong></div>
            <div>Fecha: ${new Date(venta.fecha?.seconds * 1000).toLocaleString()}</div>
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

    const terminarVenta = async () => {
        if (!ventaSeleccionada) return;

        if (metodoPago === 'Efectivo') {
            if (!montoPagado || parseFloat(montoPagado) < ventaSeleccionada.total) {
                setMensaje('❌ El monto es insuficiente');
                setTimeout(() => setMensaje(''), 2500);
                return;
            }
        }

        try {
            setLoading(true);
            const ref = doc(db, 'ventas', ventaSeleccionada.id);
            await updateDoc(ref, {
                estado: 'completada',
                metodoPago,
            });
            setVentas(prev => prev.map(v => v.id === ventaSeleccionada.id ? {
                ...v,
                estado: 'completada',
                metodoPago
            } : v));
            setVentaSeleccionada(null);
            setMontoPagado('');
            setMetodoPago('Efectivo');
            setMensaje('✅ Venta completada');
        } catch (err) {
            console.error("Error completando venta:", err);
            setMensaje('❌ Error al completar la venta');
        } finally {
            setLoading(false);
            setTimeout(() => setMensaje(''), 2500);
        }
    };

    const ventasFiltradas = ventas.filter(v => {
        // Filtro por estado
        if (filtroEstado !== 'todos' && v.estado !== filtroEstado) return false;

        // Filtro por búsqueda
        if (busqueda && !v.cliente.toLowerCase().includes(busqueda.toLowerCase())) return false;

        return true;
    });

    const vuelto = metodoPago === 'Efectivo' && montoPagado
        ? (parseFloat(montoPagado) - ventaSeleccionada?.total).toFixed(2)
        : null;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-2xl font-bold text-orange-600 mb-4 md:mb-0">📋 Lista de Pedidos</h2>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
                        />
                        <svg
                            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="completada">Completados</option>
                    </select>
                </div>
            </div>

            {mensaje && (
                <div className={`mb-6 p-3 rounded-md ${mensaje.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mensaje}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
            ) : ventasFiltradas.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                    <p className="text-gray-500 text-lg">No se encontraron pedidos</p>
                    <p className="text-gray-400 text-sm mt-2">
                        {filtroEstado !== 'todos' || busqueda ? 'Intenta con otros filtros' : 'No hay pedidos registrados'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {ventasFiltradas.map(venta => (
                        <div key={venta.id} className={`bg-white p-4 md:p-6 rounded-lg shadow-sm border-l-4 ${
                            venta.estado === 'completada' ? 'border-green-500' : 'border-orange-500'
                        } hover:shadow-md transition`}>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {venta.cliente || 'Consumidor final'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {venta.fecha.toLocaleString('es-PE', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        venta.estado === 'completada'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-orange-100 text-orange-800'
                                    }`}>
                                        {venta.estado === 'completada' ? 'Pagado' : 'Pendiente'}
                                    </span>
                                    <p className="text-xl font-bold text-orange-600 mt-1">
                                        S/ {venta.total?.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Productos:</h4>
                                <ul className="divide-y divide-gray-100">
                                    {venta.items.map((item, i) => (
                                        <li key={i} className="py-2 flex justify-between">
                                            <div>
                                                <span className="font-medium">{item.nombre}</span>
                                                <span className="text-gray-500 text-sm ml-2">x {item.cantidad}</span>
                                            </div>
                                            <span className="font-medium">S/ {item.subtotal.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <div className="text-sm text-gray-500">
                                    {venta.metodoPago && (
                                        <span>Método: {venta.metodoPago}</span>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => imprimirVenta(venta)}
                                        className="text-orange-600 hover:text-orange-800 flex items-center text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                        </svg>
                                        Imprimir
                                    </button>

                                    {venta.estado !== 'completada' && (
                                        <button
                                            onClick={() => setVentaSeleccionada(venta)}
                                            className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium"
                                        >
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            Completar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal para completar venta */}
            {ventaSeleccionada && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                Completar venta de {ventaSeleccionada.cliente || 'Consumidor final'}
                            </h3>
                            <p className="text-gray-600 mb-6">Total: <span className="font-bold text-orange-600">S/ {ventaSeleccionada.total?.toFixed(2)}</span></p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Método de pago</label>
                                    <select
                                        value={metodoPago}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Yape">Yape</option>
                                        <option value="Transferencia">Transferencia</option>
                                    </select>
                                </div>

                                {metodoPago === 'Efectivo' && (
                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-1">Monto recibido</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={montoPagado}
                                            onChange={(e) => setMontoPagado(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            step="0.01"
                                            min="0"
                                        />
                                        {vuelto !== null && (
                                            <p className="text-sm mt-1">
                                                Vuelto: <span className={`font-medium ${
                                                vuelto >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                    S/ {vuelto >= 0 ? vuelto : '0.00'}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setVentaSeleccionada(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={terminarVenta}
                                disabled={loading || (metodoPago === 'Efectivo' && (!montoPagado || parseFloat(montoPagado) < ventaSeleccionada.total))}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Procesando...' : 'Confirmar Pago'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaPedidos;