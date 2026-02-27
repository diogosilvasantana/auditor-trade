'use client';

import { useState, useEffect, FormEvent } from 'react';
import { journal as journalApi } from '@/lib/api';
import { useAccount } from '@/lib/AccountContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JournalEntry {
    id: string;
    date: string;
    emotion: string;
    followedPlan: string;
    triggers: string[];
    notes?: string;
}

interface DayDetail {
    entry: JournalEntry | null;
    context: { pnl: number; trades: number; wins: number; losses: number } | null;
}

const EMOTIONS = ['CALMO', 'ANSIOSO', 'IRRITADO', 'EUFORICO', 'OUTRO'];
const EMOTION_LABELS: Record<string, string> = {
    CALMO: '😌 Calmo', ANSIOSO: '😰 Ansioso',
    IRRITADO: '😤 Irritado', EUFORICO: '🤩 Eufórico', OUTRO: '🤔 Outro',
};
const FOLLOWED_PLAN_OPTIONS = [
    { value: 'SIM', label: '✓ Sim, segui o plano' },
    { value: 'PARCIAL', label: '△ Parcialmente' },
    { value: 'NAO', label: '✗ Não segui' },
];
const TRIGGERS = ['FOMO', 'REVANCHE', 'PRESSA', 'MEDO_STOP', 'OVERTRADING'];
const TRIGGER_LABELS: Record<string, string> = {
    FOMO: 'FOMO', REVANCHE: 'Revanche',
    PRESSA: 'Pressa', MEDO_STOP: 'Medo do stop', OVERTRADING: 'Overtrading',
};

export default function JournalPage() {
    const { accounts } = useAccount();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // Form state
    const [emotion, setEmotion] = useState('CALMO');
    const [followedPlan, setFollowedPlan] = useState('SIM');
    const [triggers, setTriggers] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        journalApi.list().then((data: any) => setEntries(data));
    }, []);

    useEffect(() => {
        journalApi.getByDate(selectedDate, selectedAccount || undefined).then((data: any) => {
            setDayDetail(data);
            if (data.entry) {
                setEmotion(data.entry.emotion);
                setFollowedPlan(data.entry.followedPlan);
                setTriggers(data.entry.triggers || []);
                setNotes(data.entry.notes || '');
            } else {
                setEmotion('CALMO');
                setFollowedPlan('SIM');
                setTriggers([]);
                setNotes('');
            }
        });
    }, [selectedDate, selectedAccount]);

    function toggleTrigger(t: string) {
        setTriggers((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
        );
    }

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg('');
        try {
            await journalApi.create({ date: selectedDate, emotion, followedPlan, triggers, notes });
            const updated: any = await journalApi.list();
            setEntries(updated);
            setMsg('✓ Diário salvo!');
            const detail: any = await journalApi.getByDate(selectedDate, selectedAccount || undefined);
            setDayDetail(detail);
        } catch (err: unknown) {
            setMsg(`✗ ${err instanceof Error ? err.message : 'Erro ao salvar'}`);
        } finally {
            setSaving(false);
        }
    }

    const pnlColor = (v: number) => v >= 0 ? 'var(--green-bright)' : 'var(--red-bright)';

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Diário do Dia</h1>
                <p className="page-subtitle">Registre seu estado emocional e qualidade de execução</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--gap-lg)' }}>
                {/* Left: History list */}
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                        Histórico
                    </div>
                    <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                        {entries.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>Nenhuma entrada ainda.</div>
                        ) : (
                            entries.map((e) => (
                                <button
                                    key={e.id}
                                    onClick={() => setSelectedDate(e.date.slice(0, 10))}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '10px 14px',
                                        marginBottom: 4,
                                        background: selectedDate === e.date.slice(0, 10) ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                                        border: `1px solid ${selectedDate === e.date.slice(0, 10) ? 'var(--border-strong)' : 'var(--border-default)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 2 }}>
                                        {format(new Date(e.date), 'dd/MM/yyyy', { locale: ptBR })}
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                                        {EMOTION_LABELS[e.emotion] || e.emotion}
                                    </div>
                                    <div style={{ fontSize: 11, marginTop: 2 }}>
                                        <span className={e.followedPlan === 'SIM' ? 'text-green' : e.followedPlan === 'NAO' ? 'text-red' : 'text-amber'}>
                                            {e.followedPlan === 'SIM' ? '✓ Seguiu o plano' : e.followedPlan === 'NAO' ? '✗ Não seguiu' : '△ Parcial'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Form */}
                <div>
                    <div className="card">
                        <div className="card-header" style={{ marginBottom: 16 }}>
                            <div>
                                <div className="card-title">Registro do dia</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                                    {format(new Date(selectedDate + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <select
                                    className="input"
                                    style={{ width: 'auto' }}
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                >
                                    <option value="">Todas as Contas</option>
                                    {accounts.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="date"
                                    className="input"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{ width: 'auto' }}
                                />
                            </div>
                        </div>

                        {/* Trading Context */}
                        {dayDetail?.context && (
                            <div style={{ background: 'var(--bg-void)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                {[
                                    ['P&L', `R$ ${Number(dayDetail.context.pnl).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, pnlColor(dayDetail.context.pnl)],
                                    ['Trades', String(dayDetail.context.trades), 'var(--text-primary)'],
                                    ['Wins', String(dayDetail.context.wins), 'var(--green-bright)'],
                                    ['Losses', String(dayDetail.context.losses), 'var(--red-bright)'],
                                ].map(([l, v, c]) => (
                                    <div key={String(l)}>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{l}</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: c }}>{v}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {msg && (
                            <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: msg.startsWith('✓') ? 'var(--green-bright)' : 'var(--red-bright)', background: msg.startsWith('✓') ? 'var(--green-bg)' : 'var(--red-bg)' }}>
                                {msg}
                            </div>
                        )}

                        <form onSubmit={handleSave}>
                            {/* Emotion */}
                            <div className="form-group">
                                <label className="input-label">Como você estava?</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {EMOTIONS.map((e) => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => setEmotion(e)}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: `1px solid ${emotion === e ? 'var(--amber-bright)' : 'var(--border-default)'}`,
                                                background: emotion === e ? 'var(--amber-bg)' : 'var(--bg-void)',
                                                color: emotion === e ? 'var(--amber-bright)' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: 13,
                                                fontWeight: emotion === e ? 600 : 400,
                                            }}
                                        >
                                            {EMOTION_LABELS[e]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Followed Plan */}
                            <div className="form-group">
                                <label className="input-label">Seguiu o plano?</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {FOLLOWED_PLAN_OPTIONS.map((o) => (
                                        <button
                                            key={o.value}
                                            type="button"
                                            onClick={() => setFollowedPlan(o.value)}
                                            style={{
                                                padding: '7px 16px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: `1px solid ${followedPlan === o.value ? 'var(--green-bright)' : 'var(--border-default)'}`,
                                                background: followedPlan === o.value ? 'var(--green-bg)' : 'var(--bg-void)',
                                                color: followedPlan === o.value ? 'var(--green-bright)' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: 13,
                                                fontWeight: followedPlan === o.value ? 600 : 400,
                                            }}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Triggers */}
                            <div className="form-group">
                                <label className="input-label">Gatilhos emocionais (opcional)</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {TRIGGERS.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => toggleTrigger(t)}
                                            style={{
                                                padding: '5px 12px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: `1px solid ${triggers.includes(t) ? 'var(--red-dim)' : 'var(--border-default)'}`,
                                                background: triggers.includes(t) ? 'var(--red-bg)' : 'var(--bg-void)',
                                                color: triggers.includes(t) ? 'var(--red-bright)' : 'var(--text-muted)',
                                                cursor: 'pointer',
                                                fontSize: 12,
                                            }}
                                        >
                                            {TRIGGER_LABELS[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="form-group">
                                <label className="input-label">Anotações (opcional)</label>
                                <textarea
                                    className="input"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="O que aconteceu hoje? Lições aprendidas..."
                                    rows={4}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <><span className="spinner" /> Salvando...</> : '✓ Salvar diário'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
