// src/components/Gastos.jsx
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

const Gastos = () => {
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [gastos, setGastos] = useState([]);

    const cargarGastos = async () => {
        const snapshot = await getDocs(collection(db, 'gastos'));
        const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGastos(datos);
    };

    const agregarGasto = async () => {
        await addDoc(collection(db, 'gastos'), {
            descripcion,
            monto: parseFloat(monto),
            fecha: Timestamp.now()
        });
        setDescripcion('');
        setMonto('');
        cargarGastos();
    };

    useEffect(() => {
        cargarGastos();
    }, []);

    const total = gastos.reduce((sum, g) => sum + g.monto, 0);

    return (
        <div>
            <h2>Gastos del mes</h2>
            <input placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
            <input placeholder="Monto" value={monto} onChange={e => setMonto(e.target.value)} type="number" />
            <button onClick={agregarGasto}>Agregar gasto</button>

            <ul>
                {gastos.map(g => (
                    <li key={g.id}>{g.descripcion} - S/ {g.monto.toFixed(2)}</li>
                ))}
            </ul>

            <h3>Total gastos: S/ {total.toFixed(2)}</h3>
        </div>
    );
};

export default Gastos;
