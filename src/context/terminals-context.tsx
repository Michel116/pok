
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Terminal, ShelfSection, BoxType, Shipment, TerminalStatus, VerificationRequest } from '@/lib/types';
import { useUser } from './user-context';

interface TerminalsContextType {
  terminals: Terminal[];
  shelfSections: ShelfSection[];
  shipments: Shipment[];
  contragents: string[];
  verificationRequests: VerificationRequest[];
  fetchData: () => void;
  addTerminal: (serialNumber: string, boxType: BoxType, sectionId?: string) => Promise<boolean>;
  shipTerminal: (terminalId: string, contragent: string) => Promise<void>;
  rentTerminal: (terminalId: string, contragent: string) => Promise<void>;
  returnTerminal: (terminalId: string) => Promise<void>;
  updateTerminalVerification: (terminalId: string, verificationDate: string, verifiedUntil: string) => Promise<void>;
  updateShipmentDate: (terminalId: string, newShippingDate: string) => Promise<void>;
  verifyTerminal: (terminalId: string, status: 'verified' | 'pending' | 'not_verified', verificationDate?: string, verifiedUntil?: string) => Promise<void>;
  moveTerminal: (terminal: Terminal, newSectionId: string) => Promise<void>;
  addContragent: (name: string) => Promise<boolean>;
  deleteContragent: (name: string) => Promise<void>;
  createVerificationRequest: (terminalIds: string[], customId?: string) => Promise<void>;
  processVerificationRequest: (requestId: string) => Promise<void>;
  updateVerificationRequestDetails: (requestId: string, newId: string, newDate: string) => Promise<void>;
}

const TerminalsContext = createContext<TerminalsContextType | undefined>(undefined);

export function TerminalsProvider({ children }: { children: ReactNode }) {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [dbShelfSections, setDbShelfSections] = useState<Omit<ShelfSection, 'terminals' | 'currentBoxType'>[]>([]);
  const [contragents, setContragents] = useState<string[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const { user } = useUser();

  const fetchData = useCallback(async () => {
    try {
        const [terminalsRes, shipmentsRes, sectionsRes, contragentsRes, requestsRes] = await Promise.all([
            fetch('/api/terminals'),
            fetch('/api/shipments'),
            fetch('/api/shelves'),
            fetch('/api/contragents'),
            fetch('/api/requests'),
        ]);

        if (!terminalsRes.ok || !shipmentsRes.ok || !sectionsRes.ok || !contragentsRes.ok || !requestsRes.ok) {
            throw new Error('Failed to fetch initial data');
        }

        const terminalsData = await terminalsRes.json();
        const shipmentsData = await shipmentsRes.json();
        const sectionsData = await sectionsRes.json();
        const contragentsData = await contragentsRes.json();
        const requestsData = await requestsRes.json();
        
        setTerminals(terminalsData);
        setShipments(shipmentsData);
        setDbShelfSections(sectionsData);
        setContragents(contragentsData.map((c: {name: string}) => c.name));
        setVerificationRequests(requestsData);

    } catch (error) {
        console.error("Failed to fetch data:", error);
    }
  }, []);

  useEffect(() => {
    if (user) { // Fetch data only when user is logged in
      fetchData();
    } else { // Clear data on logout
      setTerminals([]);
      setShipments([]);
      setDbShelfSections([]);
      setContragents([]);
      setVerificationRequests([]);
    }
  }, [user, fetchData]);


  const shelfSections = useMemo(() => {
    const sectionsMap = new Map<string, ShelfSection>();
    dbShelfSections.forEach(s => sectionsMap.set(s.id, { ...s, terminals: [], currentBoxType: null }));

    terminals.forEach(t => {
      if (t.location) {
        const section = sectionsMap.get(t.location.sectionId);
        if (section) {
          section.terminals.push(t);
        }
      }
    });

    sectionsMap.forEach(section => {
      if (section.terminals.length > 0) {
        section.currentBoxType = section.terminals[0].boxType;
      } else {
        section.currentBoxType = null;
      }
    });

    return Array.from(sectionsMap.values());
  }, [terminals, dbShelfSections]);


  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const terminalsToUpdate = terminals.filter(t => {
        if (t.status === 'verified' && t.verifiedUntil) {
            const verifiedUntilDate = new Date(t.verifiedUntil);
            verifiedUntilDate.setHours(0,0,0,0);
            return verifiedUntilDate < now;
        }
        return false;
    });

    if (terminalsToUpdate.length > 0) {
        (async () => {
            try {
                const response = await fetch('/api/terminals/status', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        terminalIds: terminalsToUpdate.map(t => t.serialNumber),
                        status: 'expired',
                        event: 'Статус изменен на "Просрочен" из-за истечения срока поверки',
                        responsible: 'Система'
                    }),
                });
                if (response.ok) {
                    fetchData();
                }
            } catch (error) {
                console.error("Failed to update expired terminals:", error);
            }
        })();
    }
  }, [terminals, fetchData]);


  const apiCall = async (url: string, method: string, body: any, successMessage?: string) => {
    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API call failed');
        }
        
        fetchData(); // Re-fetch all data to ensure UI is in sync
        return true;
    } catch (error) {
        console.error(`Error with ${method} ${url}:`, error);
        return false;
    }
  };

  const addTerminal = (serialNumber: string, boxType: BoxType, sectionId?: string) => apiCall('/api/terminals', 'POST', { serialNumber, boxType, sectionId, user: user?.name });
  const shipTerminal = (terminalId: string, contragent: string) => apiCall('/api/shipments', 'POST', { terminalId, contragent, type: 'ship', user: user?.name });
  const rentTerminal = (terminalId: string, contragent: string) => apiCall('/api/shipments', 'POST', { terminalId, contragent, type: 'rent', user: user?.name });
  const returnTerminal = (terminalId: string) => apiCall('/api/terminals/return', 'POST', { terminalId, user: user?.name });
  const updateTerminalVerification = (terminalId: string, verificationDate: string, verifiedUntil: string) => apiCall(`/api/terminals/${terminalId}/verify-shipped`, 'PUT', { verificationDate, verifiedUntil, user: user?.name });
  const updateShipmentDate = (terminalId: string, newShippingDate: string) => apiCall(`/api/shipments/${terminalId}`, 'PUT', { newShippingDate });
  const verifyTerminal = (terminalId: string, status: 'verified' | 'pending' | 'not_verified', verificationDate?: string, verifiedUntil?: string) => apiCall(`/api/terminals/${terminalId}/status`, 'PUT', { status, verificationDate, verifiedUntil, user: user?.name });
  const moveTerminal = (terminal: Terminal, newSectionId: string) => apiCall(`/api/terminals/${terminal.serialNumber}/move`, 'PUT', { newSectionId, boxType: terminal.boxType, user: user?.name });
  const addContragent = (name: string) => apiCall('/api/contragents', 'POST', { name });
  const deleteContragent = (name: string) => apiCall('/api/contragents', 'DELETE', { name });
  const createVerificationRequest = (terminalIds: string[], customId?: string) => apiCall('/api/requests', 'POST', { terminalIds, customId, user: user?.name });
  const processVerificationRequest = (requestId: string) => apiCall(`/api/requests/${requestId}`, 'PUT', { status: 'processed' });
  const updateVerificationRequestDetails = (requestId: string, newId: string, newDate: string) => apiCall(`/api/requests/${requestId}`, 'PUT', { newId, newDate });

  const value = {
      terminals,
      shelfSections,
      shipments,
      contragents,
      verificationRequests,
      fetchData,
      addTerminal,
      shipTerminal,
      rentTerminal,
      returnTerminal,
      updateTerminalVerification,
      updateShipmentDate,
      verifyTerminal,
      moveTerminal,
      addContragent,
      deleteContragent,
      createVerificationRequest,
      processVerificationRequest,
      updateVerificationRequestDetails,
  };

  return (
    <TerminalsContext.Provider value={value}>
      {children}
    </TerminalsContext.Provider>
  );
}

export function useTerminals() {
  const context = useContext(TerminalsContext);
  if (context === undefined) {
    throw new Error('useTerminals must be used within a TerminalsProvider');
  }
  return context;
}
