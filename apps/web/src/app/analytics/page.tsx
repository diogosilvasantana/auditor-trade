'use client';

import { useState, useEffect } from 'react';
import { analytics } from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

type Tab = 'overview' | 'symbol' | 'heatmap' | 'weekday' | 'trades';

function pnlColor(val: number) {
    return val >= 0 ? 'var(--green-bright)' : 'var(--red-bright)';
}

function HeatmapGrid({ data }: { data: any[] }) {
    if (!data.length) return <div className="empty-state"><p>Sem dados suficientes</p></div>;

    const maxAbs = Math.max(...data.map((d) => Math.abs(Number(d.avgPnl))));

    function cellClass(avg: number) {
        const ratio = maxAbs ? Math.abs(avg) / maxAbs : 0;
        if (avg >= 0) return ratio > 0.5 ? 'hm-strong-green' : 'hm-green';
        return ratio > 0.5 ? 'hm-strong-red' : 'hm-red';
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 4 }}>
            {data.map((d) => (
                <div
                    key={d.time}
                    className={`heatmap-cell ${d.count > 0 ? cellClass(Number(d.avgPnl)) : 'hm-neutral'}`}
                    title={`${d.time}: R$ ${d.avgPnl}/op (${d.count} ops)`}
                >
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{d.time}</div>
                    <div style={{ fontSize: 10 }}>R$ {d.avgPnl}</div>
                    <div style={{ fontSize: 9, opacity: 0.7 }}>{d.count} ops</div>
                </div>
            ))}
        </div>
    );
}

export default function AnalyticsPage() {
    const [tab, setTab] = useState<Tab>('overview');
    const [overviewData, setOverviewData] = useState<any>(null);
    const [symbolData, setSymbolData] = useState<any[]>([]);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [weekdayData, setWeekdayData] = useState<any[]>([]);
    const [tradesData, setTradesData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const start = '2020-01-01';
    const end = '2030-12-31';

    useEffect(() => {
        setLoading(true);
        console.log(`[Analytics] Fetching data for range: ${start} - ${end}`);
        Promise.all([
            analytics.overview(start, end),
            analytics.bySymbol(start, end),
            analytics.heatmap({ start, end }),
            analytics.byWeekday(start, end),
            analytics.trades(start, end),
        ]).then(([ov, sym, heat, weekday, trd]) => {
            console.log('[Analytics] Data fetched successfully');
            setOverviewData(ov as any);
            setSymbolData(sym as any[]);
            setHeatmapData(heat as any[]);
            setWeekdayData(weekday as any[]);
            setTradesData(trd as any[]);
            setLoading(false);
        }).catch((err) => {
            console.error('[Analytics] Error fetching data:', err);
            setLoading(false);
        });
    }, []);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Auditoria</h1>
                <p className="page-subtitle">Analise padrões por ativo, horário e dia da semana</p>
            </div>

            <div className="tabs">
                {([
                    ['overview', 'Visão Geral'],
                    ['symbol', 'Por Ativo'],
                    ['heatmap', 'Por Horário'],
                    ['weekday', 'Por Dia da Semana'],
                    ['trades', 'Operações'],
                ] as const).map(([key, label]) => (
                    <button
                        key={key}
                        className={`tab ${tab === key ? 'active' : ''}`}
                        onClick={() => setTab(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="flex items-center gap-sm" style={{ color: 'var(--text-muted)' }}>
                    <span className="spinner" /> Carregando...
                </div>
            )}

            {!loading && tab === 'overview' && overviewData && (
                <div>
                    <div className="grid-4 mb-lg">
                        <div className="card">
                            <div className="card-title">P&L Total</div>
                            <div className="card-value mono" style={{ color: pnlColor(Number(overviewData.summary.totalPnl)) }}>
                                R$ {Number(overviewData.summary.totalPnl).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-title">Win Rate</div>
                            <div className="card-value mono text-amber">{overviewData.summary.winRate}</div>
                        </div>
                        <div className="card">
                            <div className="card-title">Total Trades</div>
                            <div className="card-value mono" style={{ color: 'var(--text-primary)' }}>{overviewData.summary.totalTrades}</div>
                        </div>
                        <div className="card">
                            <div className="card-title">Dias Operados</div>
                            <div className="card-value mono" style={{ color: 'var(--text-primary)' }}>{overviewData.summary.tradingDays}</div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-title" style={{ marginBottom: 16 }}>P&L Diário</div>
                        <div style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={overviewData?.daily || []} margin={{ left: 0, right: 0 }}>
                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 2, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                                    />
                                    <Bar dataKey="pnl" radius={[1, 1, 0, 0]}>
                                        {overviewData?.daily?.map((d: any, i: number) => (
                                            <Cell key={i} fill={d.pnl >= 0 ? 'var(--green-bright)' : 'var(--red-bright)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {!loading && tab === 'symbol' && (
                <div className="card">
                    <div className="card-title" style={{ marginBottom: 16 }}>Performance por Ativo</div>
                    {symbolData.length === 0 ? (
                        <div className="empty-state"><p>Nenhum dado encontrado</p></div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Ativo</th>
                                        <th>P&L Total</th>
                                        <th>P&L Médio/Op</th>
                                        <th>Trades</th>
                                        <th>Wins</th>
                                        <th>Losses</th>
                                        <th>Consistência (σ)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {symbolData.map((s) => (
                                        <tr key={s.symbol}>
                                            <td><span className="badge badge-muted">{s.symbol}</span></td>
                                            <td className={`td-mono ${Number(s.totalPnl) >= 0 ? 'text-green' : 'text-red'}`}>
                                                R$ {Number(s.totalPnl).toLocaleString('pt-BR')}
                                            </td>
                                            <td className={`td-mono ${Number(s.avgPnlPerTrade) >= 0 ? 'text-green' : 'text-red'}`}>
                                                R$ {s.avgPnlPerTrade}
                                            </td>
                                            <td className="td-mono">{s.totalTrades}</td>
                                            <td className="td-mono text-green">{s.wins}</td>
                                            <td className="td-mono text-red">{s.losses}</td>
                                            <td className="td-mono text-amber">{s.consistency}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {!loading && tab === 'heatmap' && (
                <div className="card">
                    <div className="card-header" style={{ marginBottom: 16 }}>
                        <div className="card-title">Heatmap por Horário (janelas de 30min)</div>
                        <div style={{ display: 'flex', gap: 8, fontSize: 11, alignItems: 'center' }}>
                            <span style={{ background: 'var(--green-bg)', color: 'var(--green-bright)', padding: '2px 8px', borderRadius: 2 }}>■ Ganho</span>
                            <span style={{ background: 'var(--red-bg)', color: 'var(--red-bright)', padding: '2px 8px', borderRadius: 2 }}>■ Perda</span>
                        </div>
                    </div>
                    <HeatmapGrid data={heatmapData} />
                </div>
            )}

            {!loading && tab === 'weekday' && (
                <div className="card">
                    <div className="card-title" style={{ marginBottom: 16 }}>P&L Médio por Dia da Semana</div>
                    <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weekdayData} margin={{ left: 0, right: 0 }}>
                                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 2, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                                />
                                <Bar dataKey="avgPnl" radius={[2, 2, 0, 0]}>
                                    {weekdayData.map((d, i) => (
                                        <Cell key={i} fill={Number(d.avgPnl) >= 0 ? 'var(--green-bright)' : 'var(--red-bright)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="table-wrapper" style={{ marginTop: 16 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Dia</th>
                                    <th>P&L Médio</th>
                                    <th>Total Trades</th>
                                </tr>
                            </thead>
                            <tbody>
                                {weekdayData.filter(d => d.totalTrades > 0).map((d) => (
                                    <tr key={d.day}>
                                        <td>{d.day}</td>
                                        <td className={`td-mono ${Number(d.avgPnl) >= 0 ? 'text-green' : 'text-red'}`}>R$ {d.avgPnl}</td>
                                        <td className="td-mono">{d.totalTrades}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {!loading && tab === 'trades' && (
                <div className="card">
                    <div className="card-title" style={{ marginBottom: 16 }}>Histórico de Operações</div>
                    {tradesData.length === 0 ? (
                        <div className="empty-state"><p>Nenhum dado encontrado</p></div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Data/Hora</th>
                                        <th>Ativo</th>
                                        <th>Qtd</th>
                                        <th>P&L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tradesData.map((t) => (
                                        <tr key={t.id}>
                                            <td className="td-mono">{new Date(t.tradeDate).toLocaleString('pt-BR')}</td>
                                            <td><span className="badge badge-muted">{t.symbol}</span></td>
                                            <td className="td-mono">{t.quantity}</td>
                                            <td className={`td-mono ${Number(t.pnl) >= 0 ? 'text-green' : 'text-red'}`}>
                                                R$ {Number(t.pnl).toLocaleString('pt-BR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
