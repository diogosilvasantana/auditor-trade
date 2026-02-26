'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await auth.login(email, password);
            router.push('/dashboard');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Falha no login');
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

                <h1 className="auth-title">Entrar na conta</h1>

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
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="input-label" htmlFor="password">Senha</label>
                        <input
                            id="password"
                            className="input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading}
                        style={{ marginTop: '8px' }}
                    >
                        {loading ? <><span className="spinner" /> Entrando...</> : 'Entrar'}
                    </button>
                </form>

                <div className="auth-footer">
                    Não tem conta? <Link href="/register">Criar conta</Link>
                </div>
            </div>
        </div>
    );
}
