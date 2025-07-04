import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AgregarProducto = () => {
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [mensaje, setMensaje] = useState('');

    const guardarProducto = async () => {
        if (!nombre || !precio || !stock) {
            setMensaje('❌ Completa todos los campos');
            return;
        }

        try {
            await addDoc(collection(db, 'productos'), {
                nombre,
                precio: parseFloat(precio),
                stock: parseInt(stock),
            });

            setNombre('');
            setPrecio('');
            setStock('');
            setMensaje('✅ Producto agregado correctamente');
        } catch (err) {
            setMensaje('❌ Error al guardar producto');
            console.error(err);
        }

        setTimeout(() => setMensaje(''), 2500);
    };

    return (
        <div className="max-w-md mx-auto bg-white shadow p-4 rounded-lg">
            <h2 className="text-lg font-bold text-orange-600 mb-4">Agregar Producto</h2>

            {mensaje && (
                <div className={`mb-3 p-2 rounded ${mensaje.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mensaje}
                </div>
            )}

            <input
                type="text"
                placeholder="Nombre del producto"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full p-2 mb-2 border border-gray-300 rounded"
            />
            <input
                type="number"
                placeholder="Precio"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                className="w-full p-2 mb-2 border border-gray-300 rounded"
            />
            <input
                type="number"
                placeholder="Stock"
                value={stock}
                onChange={e => setStock(e.target.value)}
                className="w-full p-2 mb-4 border border-gray-300 rounded"
            />
            <button
                onClick={guardarProducto}
                className="w-full bg-orange-600 text-white font-bold py-2 rounded hover:bg-orange-700"
            >
                Guardar
            </button>
        </div>
    );
};

export default AgregarProducto;
