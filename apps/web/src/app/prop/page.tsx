'use client';

import { useState, useEffect, FormEvent } from 'react';
import { prop, accounts as accountsApi } from '@/lib/api';
import { useAccount } from '@/lib/AccountContext';

interface PropChallenge {
    id: string;
    name: string;
    profitTarget: number;
    dailyMaxLoss: number;
    totalMaxDrawdown: number;
    allowedSymbols: string[];
    accountId?: string;
    createdAt: string;
    rulesText?: string;
}

interface Progress {
    totalPnl: string;
    totalTrades: number;
    distanceToTarget: string;
    progressPercent: string;
    maxDrawdownUsed: string;
    drawdownPercent: string;
    drawdownRemaining: string;
    tradingDays: number;
}

export default function PropPage() {
    const { accounts } = useAccount();
    const [challenges, setChallenges] = useState<PropChallenge[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [plan, setPlan] = useState<any>(null);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form
    const [name, setName] = useState('');
    const [profitTarget, setProfitTarget] = useState('');
    const [dailyMaxLoss, setDailyMaxLoss] = useState('');
    const [totalMaxDrawdown, setTotalMaxDrawdown] = useState('');
    const [symbols, setSymbols] = useState(['WIN', 'WDO']);
    const [rulesText, setRulesText] = useState('');
    const [accountId, setAccountId] = useState('');

    useEffect(() => {
        refresh();
    }, []);

    const refresh = () => {
        prop.list().then((data: any) => {
            setChallenges(data);
            if (data.length > 0 && !selected) setSelected(data[0].id);
            setLoading(false);
        });
    };

    useEffect(() => {
        if (!selected) return;
        Promise.all([
            prop.getPlan(selected),
            prop.getProgress(selected, '2020-01-01', '2030-12-31'),
        ]).then(([p, prog]: any) => {
            setPlan(p);
            setProgress(prog.progress);
        });
    }, [selected]);

    function openEditForm(c: PropChallenge) {
        setEditingId(c.id);
        setName(c.name);
        setProfitTarget(String(c.profitTarget));
        setDailyMaxLoss(String(c.dailyMaxLoss));
        setTotalMaxDrawdown(String(c.totalMaxDrawdown));
        setSymbols(c.allowedSymbols);
        setRulesText(c.rulesText || '');
        setAccountId(c.accountId || '');
        setShowForm(true);
    }

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const data = {
                name,
                profitTarget: Number(profitTarget),
                dailyMaxLoss: Number(dailyMaxLoss),
                totalMaxDrawdown: Number(totalMaxDrawdown),
                allowedSymbols: symbols,
                rulesText,
                accountId: accountId || undefined,
            };

            if (editingId) {
                await prop.update(editingId, data);
            } else {
                await prop.create(data);
            }

            refresh();
            resetForm();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    function resetForm() {
        setShowForm(false);
        setEditingId(null);
        setName('');
        setProfitTarget('');
        setDailyMaxLoss('');
        setTotalMaxDrawdown('');
        setSymbols(['WIN', 'WDO']);
        setRulesText('');
        setAccountId('');
    }

    async function handleDelete(id: string) {
        if (!confirm('Excluir este desafio? As operações vinculadas à conta NÃO serão apagadas.')) return;
        await prop.delete(id);
        refresh();
        if (selected === id) setSelected(null);
    }

    const progressPct = parseFloat(progress?.progressPercent || '0');
    const drawdownPct = parseFloat(progress?.drawdownPercent || '0');

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">Mesa Proprietária</h1>
                    <p className="page-subtitle">Simule e planeje aprovação em desafios de prop trading</p>
                </div>
                <button className="btn btn-primary" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
                    {showForm ? 'Cancelar' : '+ Novo challenge'}
                </button>
            </div>

            {showForm && (
                <div className="card mb-xl">
                    <h2 className="card-title" style={{ marginBottom: 'var(--gap-md)' }}>
                        {editingId ? 'Editar Desafio' : 'Novo Desafio'}
                    </h2>
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label className="input-label">Nome do challenge</label>
                            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="ex: SurgeTrader 50K" />
                        </div>
                        <div className="input-row">
                            <div className="form-group">
                                <label className="input-label">Meta de lucro (R$)</label>
                                <input className="input" type="number" value={profitTarget} onChange={(e) => setProfitTarget(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Perda máx. diária (R$)</label>
                                <input className="input" type="number" value={dailyMaxLoss} onChange={(e) => setDailyMaxLoss(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Drawdown máx. total (R$)</label>
                                <input className="input" type="number" value={totalMaxDrawdown} onChange={(e) => setTotalMaxDrawdown(e.target.value)} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Vincular à Conta (Opcional)</label>
                            <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                                <option value="">Nenhuma (Global)</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                ))}
                            </select>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                Se vinculado, o progresso será calculado apenas com trades desta conta.
                            </p>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Ativos permitidos</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {['WIN', 'WDO', 'BTC'].map((s) => (
                                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <input
                                            type="checkbox"
                                            checked={symbols.includes(s)}
                                            onChange={(e) =>
                                                setSymbols((prev) =>
                                                    e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)
                                                )
                                            }
                                        />
                                        {s}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="input-label">Regras extras (opcional)</label>
                            <textarea className="input" value={rulesText} onChange={(e) => setRulesText(e.target.value)} placeholder="Regras específicas da prop..." />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <><span className="spinner" /> Salvando...</> : editingId ? '✓ Atualizar challenge' : '✓ Criar challenge'}
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="loading" style={{ padding: 40 }}>Carregando...</div>
            ) : challenges.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">⬡</div>
                    <p>Nenhum challenge criado ainda.</p>
                    <p style={{ fontSize: 13, marginTop: 8 }}>Clique em "Novo challenge" para começar.</p>
                </div>
            ) : (
                <div className="prop-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: 'var(--gap-lg)' }}>
                    {/* Challenge List Sidebar */}
                    <div className="prop-sidebar">
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Seus Desafios</div>
                        <div className="prop-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {challenges.map(c => (
                                <div
                                    key={c.id}
                                    className={`prop-card ${selected === c.id ? 'active' : ''}`}
                                    onClick={() => setSelected(c.id)}
                                    style={{
                                        padding: '16px',
                                        borderRadius: 'var(--radius-md)',
                                        background: selected === c.id ? 'var(--bg-elevated)' : 'var(--bg-card)',
                                        border: `1px solid ${selected === c.id ? 'var(--border-strong)' : 'var(--border-default)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: selected === c.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{c.name}</h3>
                                            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                                                {c.accountId ? 'Conta Vinculada' : 'Global (Todos os trades)'}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button
                                                className="btn-icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditForm(c);
                                                }}
                                                title="Editar desafio"
                                                style={{ padding: '2px 6px', fontSize: 12 }}
                                            >
                                                ⚙
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(c.id);
                                                }}
                                                title="Excluir desafio"
                                                style={{ padding: '2px 6px', fontSize: 12 }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Challenge Detail */}
                    {selected && plan && (
                        <div>
                            <div className="card mb-lg">
                                <div className="card-title" style={{ marginBottom: 16 }}>Plano de Aprovação Gerado</div>
                                <div className="grid-2" style={{ gap: 12 }}>
                                    {[
                                        ['Risco diário recomendado', `R$ ${plan.approvalPlan?.recommendedDailyRisk}`],
                                        ['Máx. ops/dia', String(plan.approvalPlan?.recommendedMaxTradesPerDay)],
                                        ['Foco em ativos', (plan.approvalPlan?.focusSymbols || []).join(', ')],
                                    ].map(([l, v]) => (
                                        <div key={String(l)} style={{ background: 'var(--bg-void)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{l}</div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{v}</div>
                                        </div>
                                    ))}
                                </div>
                                {plan.approvalPlan?.stopRules && (
                                    <div style={{ marginTop: 16 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Regras de stop</div>
                                        {(plan.approvalPlan.stopRules as string[]).map((r, i) => (
                                            <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-secondary)' }}>
                                                ▸ {r}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {progress && (
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 16 }}>Progresso do Challenge</div>
                                    <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>P&L Acumulado</div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: Number(progress.totalPnl) >= 0 ? 'var(--green-bright)' : 'var(--red-bright)' }}>
                                                R$ {Number(progress.totalPnl).toLocaleString('pt-BR')}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>de R$ {plan.challenge?.profitTarget?.toLocaleString('pt-BR')} meta</div>
                                            <div className="progress-bar" style={{ marginTop: 8 }}>
                                                <div className="progress-fill green" style={{ width: `${Math.min(100, progressPct)}%` }} />
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{progress.progressPercent}% da meta</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Drawdown usado</div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: drawdownPct > 70 ? 'var(--red-bright)' : 'var(--amber-bright)' }}>
                                                R$ {Number(progress.maxDrawdownUsed).toLocaleString('pt-BR')}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>de R$ {plan.challenge?.totalMaxDrawdown?.toLocaleString('pt-BR')} limite</div>
                                            <div className="progress-bar" style={{ marginTop: 8 }}>
                                                <div
                                                    className="progress-fill"
                                                    style={{
                                                        width: `${Math.min(100, drawdownPct)}%`,
                                                        background: drawdownPct > 70 ? 'var(--red-bright)' : 'var(--amber-bright)',
                                                    }}
                                                />
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{progress.drawdownPercent}% do limite</div>
                                        </div>
                                    </div>
                                    <div className="grid-3" style={{ gap: 12 }}>
                                        {[
                                            ['Falta para meta', `R$ ${Number(progress.distanceToTarget).toLocaleString('pt-BR')}`],
                                            ['Total ops', String(progress.totalTrades)],
                                            ['Dias operados', String(progress.tradingDays)],
                                        ].map(([l, v]) => (
                                            <div key={String(l)} style={{ background: 'var(--bg-void)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{l}</div>
                                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{v}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
