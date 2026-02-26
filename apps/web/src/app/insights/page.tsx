'use client';

import { useState, useEffect } from 'react';
import { insights as insightsApi } from '@/lib/api';

interface Insight {
    type: string;
    title: string;
    description: string;
    score: number;
    sampleSize: number;
    evidence: Record<string, unknown>;
}

export default function InsightsPage() {
    const [insightList, setInsightList] = useState<Insight[]>([]);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);

    useEffect(() => {
        insightsApi.get('2024-01-01', '2025-12-31').then((data: any) => {
            setInsightList(data.insights || []);
            if (data.message) setMsg(data.message);
            setLoading(false);
        });
    }, []);

    const typeConfig: Record<string, { variant: string; label: string; icon: string }> = {
        ERROR_HERE: { variant: 'error', label: 'Erro detectado', icon: '⚠' },
        WORST_TIME: { variant: 'time', label: 'Horário crítico', icon: '⏱' },
        FOCUS_SYMBOL: { variant: 'symbol', label: 'Foco recomendado', icon: '◎' },
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">✦ Insights</h1>
                <p className="page-subtitle">Padrões detectados automaticamente no seu histórico</p>
            </div>

            {loading && (
                <div className="flex items-center gap-sm" style={{ color: 'var(--text-muted)' }}>
                    <span className="spinner" /> Analisando padrões...
                </div>
            )}

            {!loading && msg && (
                <div className="card" style={{ color: 'var(--text-muted)', maxWidth: 500 }}>
                    <div className="empty-state-icon" style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                    <p>{msg}</p>
                </div>
            )}

            {!loading && insightList.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
                    {insightList.map((ins, i) => {
                        const cfg = typeConfig[ins.type] || { variant: 'symbol', label: ins.type, icon: '◎' };
                        return (
                            <div
                                key={i}
                                className={`insight-card ${cfg.variant}`}
                                onClick={() => setExpanded(expanded === i ? null : i)}
                            >
                                <div className="insight-type">{cfg.icon} {cfg.label}</div>
                                <div className="insight-title">{ins.title}</div>
                                <div className="insight-desc">{ins.description}</div>

                                {expanded === i && ins.evidence && (
                                    <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-void)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Evidências</div>
                                        {Object.entries(ins.evidence).map(([k, v]) => (
                                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                                <span style={{ color: 'var(--text-primary)' }}>{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                                    <span>Score: {ins.score}/100 · N={ins.sampleSize} ops</span>
                                    <span>{expanded === i ? '▲ Ocultar' : '▼ Ver evidências'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
