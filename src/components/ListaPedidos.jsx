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

    useEffect(() => {
        const cargarVentas = async () => {
            const snap = await getDocs(collection(db, 'ventas'));
            const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            lista.sort((a, b) => b.fecha?.seconds - a.fecha?.seconds);
            setVentas(lista);
            setLoading(false);
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
            const ref = doc(db, 'ventas', ventaSeleccionada.id);
            await updateDoc(ref, {
                estado: 'completada',
                metodoPago,
            });
            setVentas(prev => prev.map(v => v.id === ventaSeleccionada.id ? { ...v, estado: 'completada', metodoPago } : v));
            setVentaSeleccionada(null);
            setMontoPagado('');
            setMetodoPago('Efectivo');
            setMensaje('✅ Venta completada');
            setTimeout(() => setMensaje(''), 2500);
        } catch (err) {
            setMensaje('❌ Error al completar la venta');
        }
    };

    const ventasFiltradas = ventas.filter(v => {
        if (filtroEstado === 'todos') return true;
        return v.estado === filtroEstado;
    });

    const vuelto = metodoPago === 'Efectivo' && montoPagado ? (parseFloat(montoPagado) - ventaSeleccionada?.total).toFixed(2) : null;

    return (
        <div className="max-w-5xl mx-auto p-4">
            <h2 className="text-2xl font-bold text-orange-600 mb-6">📋 Lista de Pedidos</h2>

            <div className="mb-4">
                <label className="mr-2 font-medium">Filtrar por estado:</label>
                <select
                    value={filtroEstado}
                    onChange={e => setFiltroEstado(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value="todos">Todos</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="completada">Pagados</option>
                </select>
            </div>

            {mensaje && (
                <div className={`mb-4 p-3 rounded-md ${mensaje.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mensaje}
                </div>
            )}

            {loading ? (
                <p className="text-gray-500">Cargando ventas...</p>
            ) : ventasFiltradas.length === 0 ? (
                <p className="text-gray-500 italic">No hay ventas registradas.</p>
            ) : (
                <div className="space-y-6">
                    {ventasFiltradas.map(venta => (
                        <div key={venta.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{venta.cliente}</h3>
                                    <p className="text-sm text-gray-500">
                                        {new Date(venta.fecha?.seconds * 1000).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm">
                                        {venta.estado === 'completada' ? (
                                            <span className="text-green-600 font-semibold">Pagado</span>
                                        ) : (
                                            <span className="text-red-600 font-semibold">Pendiente</span>
                                        )}
                                    </p>
                                    <p className="font-bold text-orange-600">S/ {venta.total?.toFixed(2)}</p>
                                </div>
                            </div>

                            <ul className="text-sm text-gray-700 mb-2">
                                {venta.items.map((item, i) => (
                                    <li key={i} className="flex justify-between">
                                        <span>{item.nombre} x {item.cantidad}</span>
                                        <span>S/ {item.subtotal.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => imprimirVenta(venta)}
                                    className="text-sm text-orange-600 hover:underline"
                                >
                                    🖨 Imprimir boleta
                                </button>

                                {venta.estado !== 'completada' && (
                                    <button
                                        onClick={() => setVentaSeleccionada(venta)}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        💳 Terminar venta
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {ventaSeleccionada && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
                    <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
                        <h3 className="font-bold mb-4">Terminar venta de {ventaSeleccionada.cliente}</h3>

                        <div className="flex flex-col gap-4">
                            <select
                                value={metodoPago}
                                onChange={e => setMetodoPago(e.target.value)}
                                className="p-2 border rounded"
                            >
                                <option value="Efectivo">Efectivo</option>
                                <option value="Yape">Yape</option>
                            </select>

                            {metodoPago === 'Efectivo' && (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Monto pagado"
                                        value={montoPagado}
                                        onChange={e => setMontoPagado(e.target.value)}
                                        className="p-2 border rounded"
                                    />
                                    <p className="text-sm text-gray-600">Vuelto: S/ {vuelto >= 0 ? vuelto : '0.00'}</p>
                                </>
                            )}

                            <div className="flex justify-end gap-4 mt-4">
                                <button
                                    onClick={terminarVenta}
                                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded"
                                >
                                    Confirmar
                                </button>
                                <button
                                    onClick={() => setVentaSeleccionada(null)}
                                    className="text-gray-500 hover:underline"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaPedidos;
