'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { accounts as accountsApi } from '@/lib/api';

interface Account {
    id: string;
    name: string;
    type: 'PERSONAL' | 'PROP_FIRM' | 'SIMULATOR';
    broker?: string;
    accountNumber?: string;
    isActive: boolean;
}

interface AccountContextType {
    accounts: Account[];
    selectedAccountId: string;
    selectedAccount: Account | null;
    setSelectedAccountId: (id: string) => void;
    isLoading: boolean;
    refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountIdState] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    const refreshAccounts = async () => {
        try {
            const data = await accountsApi.list();
            setAccounts(data);
        } catch (err) {
            console.error('Failed to fetch accounts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshAccounts();
        const savedId = localStorage.getItem('selectedAccountId');
        if (savedId) {
            setSelectedAccountIdState(savedId);
        }
    }, []);

    const setSelectedAccountId = (id: string) => {
        setSelectedAccountIdState(id);
        localStorage.setItem('selectedAccountId', id);
    };

    const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

    return (
        <AccountContext.Provider
            value={{
                accounts,
                selectedAccountId,
                selectedAccount,
                setSelectedAccountId,
                isLoading,
                refreshAccounts,
            }}
        >
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount() {
    const context = useContext(AccountContext);
    if (context === undefined) {
        throw new Error('useAccount must be used within an AccountProvider');
    }
    return context;
}
