'use client';

import { useState, useEffect, FormEvent } from 'react';
import { accounts as accountsApi } from '@/lib/api';
import { useAccount } from '@/lib/AccountContext';

interface Account {
    id: string;
    name: string;
    type: 'PERSONAL' | 'PROP_FIRM' | 'SIMULATOR';
    broker?: string;
    accountNumber?: string;
    isActive: boolean;
    feePerContract?: number;
    profitSplit?: number;
}

export default function AccountsPage() {
    const { refreshAccounts } = useAccount();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState<'PERSONAL' | 'PROP_FIRM' | 'SIMULATOR'>('PERSONAL');
    const [broker, setBroker] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [feePerContract, setFeePerContract] = useState('');
    const [profitSplit, setProfitSplit] = useState('100');

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const data = await accountsApi.list();
            setAccounts(data);
        } catch (err) {
            console.error('Error loading accounts:', err);
        } finally {
            setLoading(false);
        }
    };

    function openEdit(acc: Account) {
        setEditingId(acc.id);
        setName(acc.name);
        setType(acc.type);
        setBroker(acc.broker || '');
        setAccountNumber(acc.accountNumber || '');
        setFeePerContract(acc.feePerContract ? String(acc.feePerContract) : '');
        setProfitSplit(acc.profitSplit ? String(acc.profitSplit) : '100');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetForm() {
        setEditingId(null);
        setName('');
        setType('PERSONAL');
        setBroker('');
        setAccountNumber('');
        setFeePerContract('');
        setProfitSplit('100');
        setShowForm(false);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name,
                type,
                broker,
                accountNumber,
                feePerContract: feePerContract ? Number(feePerContract) : undefined,
                profitSplit: profitSplit ? Number(profitSplit) : undefined
            };
            if (editingId) {
                await accountsApi.update(editingId, payload);
            } else {
                await accountsApi.create(payload);
            }
            await load();
            await refreshAccounts(); // Update global context
            resetForm();
        } catch (err) {
            console.error('Error saving account:', err);
            alert('Erro ao salvar conta.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem a certeza que deseja eliminar esta conta? Todos os trades vinculados ficarão sem conta (Consolidado).')) return;
        try {
            await accountsApi.delete(id);
            await load();
            await refreshAccounts();
        } catch (err) {
            console.error('Error deleting account:', err);
        }
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Gerir Contas</h1>
                    <p className="page-subtitle">Cadastre e organize as suas contas pessoais e mesas proprietárias</p>
                </div>
                <button
                    className={`btn ${showForm ? 'btn-ghost' : 'btn-primary'}`}
                    onClick={() => showForm ? resetForm() : setShowForm(true)}
                >
                    {showForm ? 'Cancelar' : '+ Nova Conta'}
                </button>
            </div>

            {showForm && (
                <div className="card mb-xl">
                    <h2 className="card-title" style={{ marginBottom: 'var(--gap-md)' }}>
                        {editingId ? 'Editar Conta' : 'Nova Conta'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid-2" style={{ gap: 'var(--gap-md)' }}>
                            <div className="form-group">
                                <label className="input-label">Nome da Conta</label>
                                <input
                                    className="input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    placeholder="Ex: BTG Pessoal, MyFundedFX Challenge..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Tipo de Conta</label>
                                <select
                                    className="input"
                                    value={type}
                                    onChange={e => setType(e.target.value as any)}
                                >
                                    <option value="PERSONAL">Pessoal (Real)</option>
                                    <option value="PROP_FIRM">Mesa Proprietária</option>
                                    <option value="SIMULATOR">Simulador</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid-2" style={{ gap: 'var(--gap-md)' }}>
                            <div className="form-group">
                                <label className="input-label">Corretora (Opcional)</label>
                                <input
                                    className="input"
                                    value={broker}
                                    onChange={e => setBroker(e.target.value)}
                                    placeholder="Ex: BTG, XP, MyFundedFX"
                                />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Nº da Conta no Profit (Opcional)</label>
                                <input
                                    className="input"
                                    value={accountNumber}
                                    onChange={e => setAccountNumber(e.target.value)}
                                    placeholder="Para auto-deteção em importações"
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: 'var(--gap-md)' }}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Salvando...' : editingId ? '✓ Guardar Alterações' : '✓ Criar Conta'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <div className="card-title">As suas Contas</div>
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando contas...</div>
                ) : accounts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">💳</div>
                        <p>Ainda não registou nenhuma conta.</p>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)} style={{ marginTop: 12 }}>
                            Registar primeira conta
                        </button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Tipo</th>
                                    <th>Corretora</th>
                                    <th>Nº Conta</th>
                                    <th>Taxas / Split</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(acc => (
                                    <tr key={acc.id}>
                                        <td style={{ fontWeight: 600 }}>{acc.name}</td>
                                        <td>
                                            <span className={`badge ${acc.type === 'PERSONAL' ? 'badge-green' :
                                                acc.type === 'PROP_FIRM' ? 'badge-amber' :
                                                    'badge-muted'
                                                }`}>
                                                {acc.type === 'PERSONAL' ? 'Pessoal' :
                                                    acc.type === 'PROP_FIRM' ? 'Mesa Prop' :
                                                        'Simulador'}
                                            </span>
                                        </td>
                                        <td className="text-secondary">{acc.broker || '-'}</td>
                                        <td className="td-mono text-muted">{acc.accountNumber || '-'}</td>
                                        <td className="text-secondary">
                                            {acc.feePerContract ? `R$ ${Number(acc.feePerContract).toFixed(2)}` : '-'}
                                            {acc.profitSplit ? ` (${acc.profitSplit}%)` : ''}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(acc)}>Editar</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(acc.id)}>Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
