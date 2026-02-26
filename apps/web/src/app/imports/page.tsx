'use client';

import { useState, useRef } from 'react';
import { imports as importsApi } from '@/lib/api';

interface Import {
    id: string;
    filenameOriginal: string;
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
    totalRows: number;
    importedRows: number;
    skippedRows: number;
    errorMessage?: string;
    createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        PENDING: 'badge-muted',
        PROCESSING: 'badge-amber',
        DONE: 'badge-green',
        ERROR: 'badge-red',
    };
    const labels: Record<string, string> = {
        PENDING: 'Aguardando',
        PROCESSING: 'Processando',
        DONE: 'Concluído',
        ERROR: 'Erro',
    };
    return (
        <span className={`badge ${map[status] || 'badge-muted'}`}>
            {labels[status] || status}
        </span>
    );
}

export default function ImportsPage() {
    const [importList, setImportList] = useState<Import[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploadMsg, setUploadMsg] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    async function loadImports() {
        const data = (await importsApi.list()) as Import[];
        setImportList(data);
        setLoaded(true);
    }

    async function handleFile(file: File) {
        if (!file) return;
        setUploading(true);
        setUploadMsg('');
        try {
            await importsApi.upload(file);
            setUploadMsg('✓ Upload iniciado! Aguarde o processamento.');
            await loadImports();
        } catch (err: unknown) {
            setUploadMsg(`✗ ${err instanceof Error ? err.message : 'Erro no upload'}`);
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id: string) {
        await importsApi.delete(id);
        await loadImports();
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }

    // Load on mount
    if (!loaded) {
        loadImports();
        return null;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Importações</h1>
                <p className="page-subtitle">Importe relatórios do Profit (CSV ou XLSX)</p>
            </div>

            {/* Upload Zone */}
            <div
                className={`upload-zone mb-xl ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
            >
                <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <div style={{ fontSize: 36, marginBottom: 12 }}>
                    {uploading ? '⏳' : '↑'}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {uploading ? 'Enviando...' : 'Arraste o arquivo ou clique para selecionar'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Aceita CSV e XLSX · Relatório do Profit Chart · Máx. 10MB
                </div>
                {uploadMsg && (
                    <div
                        style={{
                            marginTop: 16,
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 13,
                            color: uploadMsg.startsWith('✓') ? 'var(--green-bright)' : 'var(--red-bright)',
                            background: uploadMsg.startsWith('✓') ? 'var(--green-bg)' : 'var(--red-bg)',
                        }}
                    >
                        {uploadMsg}
                    </div>
                )}
            </div>

            {/* Import List */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title">Histórico de importações</div>
                    <button className="btn btn-ghost btn-sm" onClick={loadImports}>↻ Atualizar</button>
                </div>

                {importList.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📄</div>
                        <p>Nenhuma importação ainda</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Arquivo</th>
                                    <th>Status</th>
                                    <th>Importados</th>
                                    <th>Ignorados</th>
                                    <th>Data</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importList.map((imp) => (
                                    <tr key={imp.id}>
                                        <td className="td-mono" style={{ fontSize: 12 }}>{imp.filenameOriginal}</td>
                                        <td>
                                            <StatusBadge status={imp.status} />
                                            {imp.errorMessage && (
                                                <div style={{ fontSize: 11, color: 'var(--red-bright)', marginTop: 4 }}>
                                                    {imp.errorMessage.slice(0, 60)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="td-mono text-green">{imp.importedRows}</td>
                                        <td className="td-mono text-muted">{imp.skippedRows}</td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {new Date(imp.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(imp.id)}
                                            >
                                                Remover
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sample CSV hint */}
            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                💡 Dica: use o arquivo <code style={{ fontFamily: 'var(--font-mono)' }}>docs/sample-trades.csv</code> para testar a importação.
            </div>
        </div>
    );
}
