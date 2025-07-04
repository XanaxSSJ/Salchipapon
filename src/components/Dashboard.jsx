import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
    const [ingresos, setIngresos] = useState(0);
    const [gastos, setGastos] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [filtro, setFiltro] = useState({
        mes: new Date().getMonth() + 1,
        año: new Date().getFullYear()
    });

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const años = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setCargando(true);

                // Crear rango de fechas para el mes seleccionado
                const primerDia = new Date(filtro.año, filtro.mes - 1, 1);
                const ultimoDia = new Date(filtro.año, filtro.mes, 0);

                // Consulta ventas del mes
                const qVentas = query(
                    collection(db, 'ventas'),
                    where('fecha', '>=', primerDia),
                    where('fecha', '<=', ultimoDia)
                );

                const ventasSnap = await getDocs(qVentas);
                const totalVentas = ventasSnap.docs.reduce((sum, doc) => sum + doc.data().total, 0);
                setIngresos(totalVentas);

                // Consulta gastos del mes
                const qGastos = query(
                    collection(db, 'gastos'),
                    where('fecha', '>=', primerDia),
                    where('fecha', '<=', ultimoDia)
                );

                const gastosSnap = await getDocs(qGastos);
                const totalGastos = gastosSnap.docs.reduce((sum, doc) => sum + doc.data().monto, 0);
                setGastos(totalGastos);
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
        setFiltro(prev => ({
            ...prev,
            [name]: parseInt(value)
        }));
    };

    const data = {
        labels: ['Ingresos', 'Gastos', 'Ganancia'],
        datasets: [{
            label: 'Soles (S/)',
            data: [ingresos, gastos, ingresos - gastos],
            backgroundColor: [
                'rgba(76, 175, 80, 0.7)',
                'rgba(244, 67, 54, 0.7)',
                'rgba(255, 152, 0, 0.7)'
            ],
            borderColor: [
                'rgba(76, 175, 80, 1)',
                'rgba(244, 67, 54, 1)',
                'rgba(255, 152, 0, 1)'
            ],
            borderWidth: 1,
            borderRadius: 4
        }]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `Resumen Financiero - ${meses[filtro.mes - 1]} ${filtro.año}`,
                font: {
                    size: 16
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return 'S/ ' + value.toLocaleString('es-PE');
                    }
                }
            }
        }
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

            <div className="bg-white p-6 rounded-lg shadow">
                <Bar data={data} options={options} />
            </div>

            <div className="mt-6 text-sm text-gray-500">
                <p>Última actualización: {new Date().toLocaleString('es-PE')}</p>
            </div>
        </div>
    );
};

export default Dashboard;