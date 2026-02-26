'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');

        if (password !== confirm) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            await auth.register(email, password);
            await auth.login(email, password);
            router.push('/dashboard');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Falha no cadastro');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-layout">
            <div className="auth-card">
                <div className="auth-brand">
                    <div className="auth-brand-name">Trade Auditor</div>
                    <div className="auth-brand-tagline">Auditoria profissional de day trade</div>
                </div>

                <h1 className="auth-title">Criar conta</h1>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="input-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            className="input"
                            type="email"
                            placeholder="trader@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="input-label" htmlFor="password">Senha</label>
                        <input
                            id="password"
                            className="input"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="input-label" htmlFor="confirm">Confirmar senha</label>
                        <input
                            id="confirm"
                            className="input"
                            type="password"
                            placeholder="Repita a senha"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading}
                        style={{ marginTop: '8px' }}
                    >
                        {loading ? <><span className="spinner" /> Criando...</> : 'Criar conta'}
                    </button>
                </form>

                <div className="auth-footer">
                    Já tem conta? <Link href="/login">Entrar</Link>
                </div>
            </div>
        </div>
    );
}
