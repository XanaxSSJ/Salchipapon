import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            onLogin(); // Cambia vista
        } catch (err) {
            setError("Credenciales incorrectas");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-orange-600">Iniciar sesión</h2>

                {error && (
                    <div className="mb-4 p-2 bg-red-100 border-l-4 border-red-500 text-red-700">
                        <p>{error}</p>
                    </div>
                )}

                <div className="mb-4">
                    <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>

                <div className="mb-6">
                    <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Contraseña"
                        type="password"
                        value={pass}
                        onChange={e => setPass(e.target.value)}
                    />
                </div>

                <button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                    onClick={handleLogin}
                >
                    Ingresar
                </button>
            </div>
        </div>
    );
};

export default Login;