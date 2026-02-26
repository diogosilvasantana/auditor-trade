'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { analytics, insights } from '@/lib/api';
import { useAccount } from '@/lib/AccountContext';

interface DailyStat {
    date: string;
    pnl: number;
    trades: number;
}

interface Overview {
    summary: {
        totalPnl: string;
        totalTrades: number;
        winRate: string;
        tradingDays: number;
    };
    daily: DailyStat[];
}

interface Insight {
    type: string;
    title: string;
    description: string;
    score: number;
    sampleSize: number;
    evidence: Record<string, unknown>;
}

function InsightCard({ insight }: { insight: Insight }) {
    const [expanded, setExpanded] = useState(false);

    const variant =
        insight.type === 'ERROR_HERE'
            ? 'error'
            : insight.type === 'WORST_TIME'
                ? 'time'
                : 'symbol';

    const typeLabel =
        insight.type === 'ERROR_HERE'
            ? '⚠ Erro detectado'
            : insight.type === 'WORST_TIME'
                ? '⏱ Horário crítico'
                : '◎ Foco recomendado';

    return (
        <div className={`insight-card ${variant}`} onClick={() => setExpanded((e) => !e)}>
            <div className="insight-type">{typeLabel}</div>
            <div className="insight-title">{insight.title}</div>
            <div className="insight-desc">{insight.description}</div>

            {expanded && insight.evidence && (
                <div
                    style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: 'var(--bg-void)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                    }}
                >
                    {Object.entries(insight.evidence).map(([k, v]) => (
                        <div key={k} style={{ marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                            {String(v)}
                        </div>
                    ))}
                </div>
            )}

            <div
                style={{
                    marginTop: '12px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <span>N={insight.sampleSize} ops</span>
                <span>{expanded ? '▲ Ocultar' : '▼ Ver evidências'}</span>
            </div>
        </div>
    );
}

function PnlTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    return (
        <div
            style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
            }}
        >
            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
            <div style={{ color: val >= 0 ? 'var(--green-bright)' : 'var(--red-bright)', fontWeight: 700 }}>
                R$ {Number(val).toFixed(0)}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { selectedAccountId } = useAccount();
    const [overview, setOverview] = useState<Overview | null>(null);
    const [insightData, setInsightData] = useState<Insight[]>([]);
    const [insightsMsg, setInsightsMsg] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const start = '2020-01-01';
        const end = '2030-12-31';
        const aid = selectedAccountId === 'all' ? undefined : selectedAccountId;

        Promise.all([
            analytics.overview(start, end, aid) as Promise<Overview>,
            insights.get(start, end, aid) as Promise<{ insights: Insight[]; message?: string }>,
        ]).then(([ov, ins]) => {
            setOverview(ov);
            setInsightData(ins.insights || []);
            setInsightsMsg(ins.message || '');
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [selectedAccountId]);

    const totalPnlNum = parseFloat(overview?.summary.totalPnl || '0');
    const isPositive = totalPnlNum >= 0;

    if (loading) {
        return (
            <div className="flex items-center justify-between loading" style={{ minHeight: '50vh', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    const noData = !overview?.daily?.length;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">
                    {noData
                        ? 'Importe seu histórico para ver a auditoria'
                        : `${overview?.summary.tradingDays} dias operados · ${overview?.summary.totalTrades} operações`}
                </p>
            </div>

            {noData ? (
                <div className="empty-state card" style={{ maxWidth: 480 }}>
                    <div className="empty-state-icon">📂</div>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Nenhum dado importado</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                        Faça o upload do relatório do Profit para começar a auditoria.
                    </p>
                    <Link href="/imports" className="btn btn-primary">
                        ↑ Importar histórico
                    </Link>
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    <div className="grid-4 mb-xl">
                        <div className="card">
                            <div className="card-title">P&L Total</div>
                            <div className={`card-value ${isPositive ? 'text-green' : 'text-red'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                                {isPositive ? '+' : ''}R$ {totalPnlNum.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </div>
                            <div className="card-subtitle">no período</div>
                        </div>

                        <div className="card">
                            <div className="card-title">Win Rate</div>
                            <div className="card-value mono text-amber">{overview?.summary.winRate}</div>
                            <div className="card-subtitle">{overview?.summary.totalTrades} operações</div>
                        </div>

                        <div className="card">
                            <div className="card-title">Dias Operados</div>
                            <div className="card-value mono" style={{ color: 'var(--text-primary)' }}>
                                {overview?.summary.tradingDays}
                            </div>
                            <div className="card-subtitle">dias com trades</div>
                        </div>

                        <div className="card">
                            <div className="card-title">Ops / Dia</div>
                            <div className="card-value mono" style={{ color: 'var(--text-primary)' }}>
                                {overview?.summary.tradingDays
                                    ? (overview.summary.totalTrades / overview.summary.tradingDays).toFixed(1)
                                    : '—'}
                            </div>
                            <div className="card-subtitle">média diária</div>
                        </div>
                    </div>

                    {/* P&L Chart */}
                    <div className="card mb-xl">
                        <div className="card-header">
                            <div className="card-title">P&L por Dia</div>
                            <Link href="/analytics" className="btn btn-ghost btn-sm">Ver auditoria completa →</Link>
                        </div>
                        <div style={{ height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={overview?.daily || []} margin={{ left: 0, right: 0, top: 4, bottom: 4 }}>
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                                        tickFormatter={(v) => v.slice(5)}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip content={<PnlTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="pnl"
                                        stroke="var(--green-bright)"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, fill: 'var(--green-bright)', stroke: 'var(--bg-base)' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Insights */}
                    <div className="page-header" style={{ marginBottom: 'var(--gap-md)' }}>
                        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            ✦ Insights
                        </h2>
                    </div>

                    {insightsMsg ? (
                        <div className="card" style={{ color: 'var(--text-muted)' }}>{insightsMsg}</div>
                    ) : (
                        <div className="grid-3">
                            {insightData.map((ins, i) => (
                                <InsightCard key={i} insight={ins} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

