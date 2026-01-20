
'use client'
import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getColumns } from "./components/columns";
import VerificationTable from "./components/verification-table";
import { useTerminals } from "@/context/terminals-context";
import { VerificationDetailsSheet } from './components/verification-details-sheet';
import type { Terminal, TerminalStatus } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Search, ShieldCheck } from 'lucide-react';
import { VerificationFilters } from './components/verification-filters';
import { useUser } from '@/context/user-context';

export default function VerificationPage() {
    const { terminals, verifyTerminal } = useTerminals();
    const { user } = useUser();
    const { toast } = useToast();
    const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
    const [sheetTab, setSheetTab] = useState<'details' | 'history'>('details');
    const [globalFilter, setGlobalFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState<TerminalStatus | 'all'>('all');
    const [loadingTerminals, setLoadingTerminals] = useState<Set<string>>(new Set());
    const [resultTerminals, setResultTerminals] = useState<Map<string, 'idle' | 'searching' | 'success' | 'error'>>(new Map());

    const verificationData = useMemo(() => {
        return terminals.filter(t => 
            t.status === 'pending' || 
            t.status === 'verified' || 
            t.status === 'not_verified' ||
            t.status === 'expired'
        );
    }, [terminals]);

    const handleViewDetails = useCallback((terminal: Terminal) => {
        setSheetTab('details');
        setSelectedTerminal(terminal);
    }, []);
    
    const handleViewHistory = useCallback((terminal: Terminal) => {
        setSheetTab('history');
        setSelectedTerminal(terminal);
    }, []);

    const handleBotCheck = useCallback(async (terminal: Terminal, attempt = 1) => {
        if (user?.role !== 'Administrator' && user?.role !== 'Verifier') {
            toast({ title: 'Доступ запрещен', description: 'У вас нет прав для выполнения этой операции.', variant: 'destructive'});
            return;
        };

        setResultTerminals(prev => new Map(prev).set(terminal.serialNumber, 'searching'));
        try {
            const response = await fetch('/api/arshin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serialNumber: terminal.serialNumber })
            });
            const data = await response.json();
            if (response.ok) {
                verifyTerminal(terminal.serialNumber, 'verified', data.lastVerificationDate, data.verifiedUntil);
                setResultTerminals(prev => new Map(prev).set(terminal.serialNumber, 'success'));
                toast({
                    title: 'Данные обновлены',
                    description: 'Поверка успешно проверена в Аршин',
                });
                setTimeout(() => {
                    setResultTerminals(prev => { const newMap = new Map(prev); newMap.delete(terminal.serialNumber); return newMap; });
                }, 5000);
            } else if (data.error === 'No results found in Arshin' && attempt === 1) {
                setTimeout(() => {
                    handleBotCheck(terminal, 2);
                }, 3000);
            } else {
                setResultTerminals(prev => new Map(prev).set(terminal.serialNumber, 'error'));
                toast({
                    title: 'Ошибка проверки',
                    description: data.error || 'Не удалось получить данные из Аршина',
                    variant: 'destructive'
                });
                setTimeout(() => {
                    setResultTerminals(prev => { const newMap = new Map(prev); newMap.delete(terminal.serialNumber); return newMap; });
                }, 5000);
            }
        } catch (error) {
            setResultTerminals(prev => new Map(prev).set(terminal.serialNumber, 'error'));
            toast({
                title: 'Ошибка подключения',
                description: 'Не удалось подключиться к Аршин. Проверьте интернет-соединение.',
                variant: 'destructive'
            });
            setTimeout(() => {
                setResultTerminals(prev => { const newMap = new Map(prev); newMap.delete(terminal.serialNumber); return newMap; });
            }, 5000);
        }
    }, [verifyTerminal, toast, user]);

    const handleSheetOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedTerminal(null);
        }
    };
    
    const handleVerifyTerminal = (terminalId: string, status: 'verified' | 'pending' | 'not_verified', verificationDate?: string, verifiedUntil?: string) => {
        verifyTerminal(terminalId, status, verificationDate, verifiedUntil);
        toast({
            title: 'Статус обновлен',
            description: `Статус терминала ${terminalId} был успешно обновлен.`,
        });
        setSelectedTerminal(null); // Close sheet on success
    };
    
    const columns = useMemo(() => getColumns({
        onView: handleViewDetails,
        onHistory: handleViewHistory,
        onBot: handleBotCheck,
        loadingTerminals,
        resultTerminals,
    }), [handleViewDetails, handleViewHistory, handleBotCheck, loadingTerminals, resultTerminals]);
    
    return (
        <>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Проверка терминалов</h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow w-full sm:w-auto md:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Поиск по S/N..."
                            className="pl-8 w-full"
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            
            <Card>
                <CardHeader className="flex-col md:flex-row md:items-center md:justify-between gap-4">
                     <div className="flex items-center gap-4">
                         <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
                         <div>
                            <CardTitle>Терминалы для проверки</CardTitle>
                            <CardDescription>Управление терминалами, ожидающими проверки, и просмотр недавно проверенных.</CardDescription>
                         </div>
                    </div>
                     <VerificationFilters 
                        terminals={verificationData}
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                    />
                </CardHeader>
                <CardContent>
                    <VerificationTable 
                        columns={columns} 
                        data={verificationData} 
                        onRowClick={handleViewDetails}
                        globalFilter={globalFilter}
                        activeFilter={activeFilter}
                    />
                </CardContent>
            </Card>
            <VerificationDetailsSheet 
                terminal={selectedTerminal}
                isOpen={!!selectedTerminal}
                onOpenChange={handleSheetOpenChange}
                onVerify={handleVerifyTerminal}
                initialTab={sheetTab}
            />
        </>
    );
}
