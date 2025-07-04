import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

const Gastos = () => {
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [gastos, setGastos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState('');

    const cargarGastos = async () => {
        try {
            setCargando(true);
            const snapshot = await getDocs(collection(db, 'gastos'));
            const datos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                fecha: doc.data().fecha?.toDate() || new Date()
            }));
            // Ordenar por fecha (más recientes primero)
            setGastos(datos.sort((a, b) => b.fecha - a.fecha));
        } catch (error) {
            console.error("Error cargando gastos:", error);
            setMensaje('❌ Error al cargar gastos');
        } finally {
            setCargando(false);
        }
    };

    const agregarGasto = async () => {
        if (!descripcion || !monto) {
            setMensaje('❌ Completa todos los campos');
            setTimeout(() => setMensaje(''), 3000);
            return;
        }

        try {
            setCargando(true);
            await addDoc(collection(db, 'gastos'), {
                descripcion,
                monto: parseFloat(monto),
                fecha: Timestamp.now()
            });
            setDescripcion('');
            setMonto('');
            setMensaje('✅ Gasto agregado correctamente');
            setTimeout(() => setMensaje(''), 3000);
            await cargarGastos();
        } catch (error) {
            console.error("Error agregando gasto:", error);
            setMensaje('❌ Error al agregar gasto');
            setTimeout(() => setMensaje(''), 3000);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarGastos();
    }, []);

    const total = gastos.reduce((sum, g) => sum + g.monto, 0);

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold text-orange-600 mb-6">Registro de Gastos</h2>

            {/* Mensaje de estado */}
            {mensaje && (
                <div className={`mb-4 p-3 rounded-md ${mensaje.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mensaje}
                </div>
            )}

            {/* Formulario para agregar gastos */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Agregar Nuevo Gasto</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Descripción</label>
                        <input
                            placeholder="Ej. Materiales de oficina"
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Monto (S/)</label>
                        <input
                            placeholder="0.00"
                            value={monto}
                            onChange={e => setMonto(e.target.value)}
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                </div>

                <button
                    onClick={agregarGasto}
                    disabled={cargando}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
                >
                    {cargando ? 'Agregando...' : 'Agregar Gasto'}
                </button>
            </div>

            {/* Listado de gastos */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-700">Historial de Gastos</h3>
                    <div className="text-xl font-bold text-red-600">
                        Total: S/ {total.toFixed(2)}
                    </div>
                </div>

                {cargando && gastos.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                ) : gastos.length === 0 ? (
                    <p className="text-gray-500 italic py-4">No hay gastos registrados</p>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {gastos.map(gasto => (
                            <div key={gasto.id} className="py-3 flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{gasto.descripcion}</p>
                                    <p className="text-sm text-gray-500">
                                        {gasto.fecha.toLocaleDateString('es-PE', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="text-red-600 font-medium">
                                    S/ {gasto.monto.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gastos;