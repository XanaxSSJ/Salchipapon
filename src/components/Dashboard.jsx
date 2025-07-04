import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
    const [ingresos, setIngresos] = useState(0);
    const [gastos, setGastos] = useState(0);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const ventasSnap = await getDocs(collection(db, 'ventas'));
                const totalVentas = ventasSnap.docs.reduce((sum, doc) => sum + doc.data().total, 0);
                setIngresos(totalVentas);

                const gastosSnap = await getDocs(collection(db, 'gastos'));
                const totalGastos = gastosSnap.docs.reduce((sum, doc) => sum + doc.data().monto, 0);
                setGastos(totalGastos);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, []);

    const data = {
        labels: ['Ingresos', 'Gastos', 'Ganancia'],
        datasets: [{
            label: 'Soles (S/)',
            data: [ingresos, gastos, ingresos - gastos],
            backgroundColor: [
                'rgba(76, 175, 80, 0.7)',   // Verde para ingresos
                'rgba(244, 67, 54, 0.7)',   // Rojo para gastos
                'rgba(255, 152, 0, 0.7)'     // Naranja para ganancia
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
                text: 'Resumen Financiero',
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