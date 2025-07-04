// src/components/Dashboard.jsx
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
    const [ingresos, setIngresos] = useState(0);
    const [gastos, setGastos] = useState(0);

    useEffect(() => {
        const cargarDatos = async () => {
            const ventasSnap = await getDocs(collection(db, 'ventas'));
            const totalVentas = ventasSnap.docs.reduce((sum, doc) => sum + doc.data().total, 0);
            setIngresos(totalVentas);

            const gastosSnap = await getDocs(collection(db, 'gastos'));
            const totalGastos = gastosSnap.docs.reduce((sum, doc) => sum + doc.data().monto, 0);
            setGastos(totalGastos);
        };

        cargarDatos();
    }, []);

    const data = {
        labels: ['Ingresos', 'Gastos', 'Ganancia'],
        datasets: [{
            label: 'Soles',
            data: [ingresos, gastos, ingresos - gastos],
            backgroundColor: ['#4CAF50', '#F44336', '#2196F3']
        }]
    };

    return (
        <div>
            <h2>Dashboard</h2>
            <Bar data={data} />
        </div>
    );
};

export default Dashboard;
