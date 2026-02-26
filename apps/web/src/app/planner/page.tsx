'use client';

import { useState, useEffect, FormEvent } from 'react';
import { plans } from '@/lib/api';
import { useAccount } from '@/lib/AccountContext';

interface TradePlan {
    id: string;
    name: string;
    isActive: boolean;
    dailyLossLimit: number;
    maxTradesPerDay: number;
    allowedTimeWindows: { start: string; end: string }[];
    pauseAfterConsecutiveLosses: number;
    pauseMinutes: number;
}

interface Violation {
    date: string;
    type: string;
    description: string;
    severity: 'HIGH' | 'CRITICAL';
}

export default function PlannerPage() {
    const [activePlan, setActivePlan] = useState<TradePlan | null>(null);
    const [violations, setViolations] = useState<Violation[]>([]);
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // Form state
    const [name, setName] = useState('Meu Plano de Trade');
    const [dailyLoss, setDailyLoss] = useState('500');
    const [maxTrades, setMaxTrades] = useState('5');
    const [pauseAfter, setPauseAfter] = useState('2');
    const [pauseMins, setPauseMins] = useState('15');

    const { selectedAccountId } = useAccount();

    useEffect(() => {
        setLoading(true);
        const aid = selectedAccountId === 'all' ? undefined : selectedAccountId;

        Promise.all([
            plans.getActive(aid) as Promise<TradePlan | null>,
            plans.violations('2024-01-01', '2030-12-31', aid) as Promise<{ violations: Violation[] }>,
        ]).then(([plan, v]) => {
            setActivePlan(plan);
            setViolations(v.violations || []);
            if (plan) {
                setName(plan.name);
                setDailyLoss(String(plan.dailyLossLimit));
                setMaxTrades(String(plan.maxTradesPerDay));
                setPauseAfter(String(plan.pauseAfterConsecutiveLosses));
                setPauseMins(String(plan.pauseMinutes));
            } else {
                setName('Meu Plano de Trade');
                setDailyLoss('500');
                setMaxTrades('5');
                setPauseAfter('2');
                setPauseMins('15');
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [selectedAccountId]);

    const isConsolidated = selectedAccountId === 'all';

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg('');
        try {
            const data = {
                name,
                dailyLossLimit: Number(dailyLoss),
                maxTradesPerDay: Number(maxTrades),
                pauseAfterConsecutiveLosses: Number(pauseAfter),
                pauseMinutes: Number(pauseMins),
                accountId: selectedAccountId === 'all' ? undefined : selectedAccountId,
            };
            if (activePlan) {
                await plans.update(activePlan.id, data);
            } else {
                await plans.create(data);
            }
            const updated = await plans.getActive(selectedAccountId === 'all' ? undefined : selectedAccountId) as TradePlan;
            setActivePlan(updated);
            setCreating(false);
            setMsg('✓ Plano salvo com sucesso!');
        } catch (err: unknown) {
            setMsg(`✗ ${err instanceof Error ? err.message : 'Erro ao salvar'}`);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="loading" style={{ padding: 40 }}>Carregando...</div>;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">Plano de Trade</h1>
                    <p className="page-subtitle">Defina suas regras de risco e disciplina</p>
                </div>
                {activePlan && !creating && !isConsolidated && (
                    <button className="btn btn-secondary" onClick={() => setCreating(true)}>
                        ✎ Editar plano
                    </button>
                )}
                {creating && (
                    <button className="btn btn-secondary" onClick={() => setCreating(false)}>
                        Cancelar
                    </button>
                )}
            </div>

            {isConsolidated && (
                <div className="card mb-xl" style={{ borderLeft: '4px solid var(--amber-bright)', background: 'rgba(255, 191, 0, 0.05)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ fontSize: '24px' }}>ℹ</span>
                        <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Visualização Consolidada</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                Selecione uma conta específica no menu lateral para visualizar ou editar as suas regras de risco.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Plan Summary */}
            {activePlan && !creating && (
                <div className="card mb-xl">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Plano ativo</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{activePlan.name}</div>
                        </div>
                        <span className="badge badge-green">Ativo</span>
                    </div>
                    <div className="grid-2" style={{ gap: 12 }}>
                        {[
                            ['Stop diário', `R$ ${Number(activePlan.dailyLossLimit).toLocaleString('pt-BR')}`],
                            ['Máx. operações/dia', String(activePlan.maxTradesPerDay)],
                            ['Pausa após perdas', `${activePlan.pauseAfterConsecutiveLosses} consecutivas`],
                            ['Tempo de pausa', `${activePlan.pauseMinutes} minutos`],
                        ].map(([label, value]) => (
                            <div key={label} style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                                <div className="card-title">{label}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create / Edit Form */}
            {(!activePlan || creating) && (
                <div className="card mb-xl">
                    <div className="card-title" style={{ marginBottom: 16 }}>
                        {activePlan ? 'Editar plano' : 'Criar plano de trade'}
                    </div>

                    {msg && (
                        <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: msg.startsWith('✓') ? 'var(--green-bright)' : 'var(--red-bright)', background: msg.startsWith('✓') ? 'var(--green-bg)' : 'var(--red-bg)' }}>
                            {msg}
                        </div>
                    )}

                    <form onSubmit={handleSave}>
                        {isConsolidated && (
                            <div style={{ marginBottom: 16, padding: '12px', background: 'var(--bg-void)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', color: 'var(--amber-bright)', fontSize: 13 }}>
                                ⚠ Selecione uma conta no menu lateral para salvar um plano.
                            </div>
                        )}
                        <div className="form-group">
                            <label className="input-label">Nome do plano</label>
                            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="input-row">
                            <div className="form-group">
                                <label className="input-label">Stop diário (R$)</label>
                                <input className="input" type="number" min="0" value={dailyLoss} onChange={(e) => setDailyLoss(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Máx. operações/dia</label>
                                <input className="input" type="number" min="1" value={maxTrades} onChange={(e) => setMaxTrades(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Pausa após N perdas consecutivas</label>
                                <input className="input" type="number" min="1" value={pauseAfter} onChange={(e) => setPauseAfter(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Tempo de pausa (min)</label>
                                <input className="input" type="number" min="1" value={pauseMins} onChange={(e) => setPauseMins(e.target.value)} />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={saving || isConsolidated}>
                            {saving ? <><span className="spinner" /> Salvando...</> : '✓ Salvar plano'}
                        </button>
                    </form>
                </div>
            )}

            {/* Violations */}
            <div className="card">
                <div className="card-title" style={{ marginBottom: 16 }}>
                    Violações detectadas no período
                    {violations.length > 0 && (
                        <span className="badge badge-red" style={{ marginLeft: 12 }}>{violations.length}</span>
                    )}
                </div>

                {violations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">✓</div>
                        <p style={{ color: 'var(--green-bright)' }}>Nenhuma violação no período!</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Tipo</th>
                                    <th>Descrição</th>
                                    <th>Severidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {violations.map((v, i) => (
                                    <tr key={i}>
                                        <td className="td-mono" style={{ fontSize: 12 }}>{v.date}</td>
                                        <td className="td-mono" style={{ fontSize: 11 }}>{v.type}</td>
                                        <td style={{ fontSize: 13 }}>{v.description}</td>
                                        <td>
                                            <span className={`badge ${v.severity === 'CRITICAL' ? 'badge-red' : 'badge-amber'}`}>
                                                {v.severity}
                                            </span>
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
