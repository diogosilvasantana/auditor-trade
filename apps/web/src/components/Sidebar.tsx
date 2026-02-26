'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAccount } from '@/lib/AccountContext';
import { auth } from '@/lib/api';

const navItems = [
    {
        section: 'Principal',
        items: [
            { href: '/dashboard', label: 'Dashboard', icon: '◉' },
            { href: '/imports', label: 'Importações', icon: '↑' },
            { href: '/analytics', label: 'Auditoria', icon: '◎' },
            { href: '/insights', label: 'Insights', icon: '✦' },
        ],
    },
    {
        section: 'Ferramentas',
        items: [
            { href: '/planner', label: 'Plano de Trade', icon: '≡' },
            { href: '/prop', label: 'Mesa Proprietária', icon: '⬡' },
            { href: '/journal', label: 'Diário', icon: '✎' },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { accounts, selectedAccountId, setSelectedAccountId } = useAccount();

    async function handleLogout() {
        await auth.logout();
        router.push('/login');
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-text">Trade Auditor</div>
                <div className="sidebar-logo-subtitle">Pro · V1 MVP</div>
            </div>

            <div className="account-selector-container">
                <label className="account-selector-label">Conta Ativa</label>
                <select
                    className="account-selector-select"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                    <option value="all">Consolidado (Todas)</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.type})
                        </option>
                    ))}
                </select>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => (
                    <div key={section.section}>
                        <div className="nav-section-title">{section.section}</div>
                        {section.items.map((item) => {
                            const active = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`nav-item ${active ? 'active' : ''}`}
                                >
                                    <span className="nav-item-icon" style={{ fontSize: '14px' }}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="btn btn-ghost btn-sm btn-block" onClick={handleLogout}>
                    Sair
                </button>
            </div>
        </aside>
    );
}
