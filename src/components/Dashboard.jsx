import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const Dashboard = () => {
    const [ingresos, setIngresos] = useState(0);
    const [gastos, setGastos] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [filtro, setFiltro] = useState({
        mes: new Date().getMonth() + 1,
        año: new Date().getFullYear()
    });
    const [ventasPorDia, setVentasPorDia] = useState([]);

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const años = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setCargando(true);

                const primerDia = new Date(filtro.año, filtro.mes - 1, 1);
                const ultimoDia = new Date(filtro.año, filtro.mes, 0);

                const qVentas = query(
                    collection(db, 'ventas'),
                    where('fecha', '>=', primerDia),
                    where('fecha', '<=', ultimoDia)
                );

                const ventasSnap = await getDocs(qVentas);
                const ventas = ventasSnap.docs.map(doc => doc.data());

                const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
                setIngresos(totalVentas);

                const qGastos = query(
                    collection(db, 'gastos'),
                    where('fecha', '>=', primerDia),
                    where('fecha', '<=', ultimoDia)
                );

                const gastosSnap = await getDocs(qGastos);
                const totalGastos = gastosSnap.docs.reduce((sum, doc) => sum + doc.data().monto, 0);
                setGastos(totalGastos);

                const ventasAgrupadas = {};
                ventas.forEach(v => {
                    const d = v.fecha.toDate().toLocaleDateString('es-PE');
                    ventasAgrupadas[d] = (ventasAgrupadas[d] || 0) + v.total;
                });

                const ventasPorDiaArray = Object.entries(ventasAgrupadas).map(([fecha, total]) => ({ fecha, total }));
                ventasPorDiaArray.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                setVentasPorDia(ventasPorDiaArray);

            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [filtro]);

    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltro(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-orange-600">Dashboard Financiero</h2>

                <div className="flex gap-4">
                    <select
                        name="mes"
                        value={filtro.mes}
                        onChange={handleFiltroChange}
                        className="bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        {meses.map((mes, index) => (
                            <option key={index} value={index + 1}>{mes}</option>
                        ))}
                    </select>

                    <select
                        name="año"
                        value={filtro.año}
                        onChange={handleFiltroChange}
                        className="bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        {años.map(año => (
                            <option key={año} value={año}>{año}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 font-medium">Ingresos</h3>
                    <p className="text-2xl font-bold text-green-600">
                        S/ {ingresos.toLocaleString('es-PE')}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                    <h3 className="text-gray-500 font-medium">Gastos</h3>
                    <p className="text-2xl font-bold text-red-600">
                        S/ {gastos.toLocaleString('es-PE')}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
                    <h3 className="text-gray-500 font-medium">Ganancia Neta</h3>
                    <p className="text-2xl font-bold text-orange-600">
                        S/ {(ingresos - gastos).toLocaleString('es-PE')}
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-400 mt-6">
                <h3 className="text-lg font-bold mb-4 text-orange-600">Ventas por Día</h3>

                <table className="w-full table-auto text-sm border border-gray-200 rounded overflow-hidden">
                    <thead className="bg-orange-100 text-gray-700">
                    <tr>
                        <th className="px-4 py-2 text-left">Fecha</th>
                        <th className="px-4 py-2 text-left">Total Ventas</th>
                    </tr>
                    </thead>
                    <tbody>
                    {ventasPorDia.map(({ fecha, total }, i) => (
                        <tr key={i} className="border-t hover:bg-orange-50">
                            <td className="px-4 py-2">{fecha}</td>
                            <td className="px-4 py-2 font-semibold text-green-700">S/ {total.toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 text-sm text-gray-500">
                <p>Última actualización: {new Date().toLocaleString('es-PE')}</p>
            </div>
        </div>
    );
};

export default Dashboard;
