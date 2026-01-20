
'use client';

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, List, Check, Clock, ChevronDown } from "lucide-react";
import { useTerminals } from "@/context/terminals-context";
import { useUser } from "@/context/user-context";
import { CreateRequestDialog } from "./components/create-request-dialog";
import { RequestCard } from "./components/request-card";
import { RequestDetailsSheet } from "./components/request-details-sheet";
import type { VerificationRequest, Terminal } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


export default function RequestsPage() {
  const { terminals, verificationRequests, createVerificationRequest, processVerificationRequest, updateVerificationRequestDetails } = useTerminals();
  const { user } = useUser();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);

  const canCreate = user?.role === 'Administrator' || user?.role === 'Verifier';

  const availableTerminals = useMemo(() => {
    return terminals.filter(t => t.status === 'not_verified' || t.status === 'expired');
  }, [terminals]);
  
  const pendingRequests = useMemo(() => {
    return verificationRequests.filter(r => r.status === 'pending');
  }, [verificationRequests]);
  
  const processedRequests = useMemo(() => {
    return verificationRequests.filter(r => r.status === 'processed');
  }, [verificationRequests]);
  
  const handleCreateRequest = (terminalIds: string[], customId?: string) => {
    createVerificationRequest(terminalIds, customId);
    setIsCreateDialogOpen(false);
  };
  
  const handleViewRequest = (request: VerificationRequest) => {
    setSelectedRequest(request);
  }
  
  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedRequest(null);
    }
  }
  
  const getTerminalsForRequest = (terminalIds: string[]): Terminal[] => {
    return terminals.filter(t => terminalIds.includes(t.serialNumber));
  }
  
  const handleUpdateDetails = (requestId: string, newId: string, newDate: string) => {
    updateVerificationRequestDetails(requestId, newId, newDate);
    setSelectedRequest(prev => prev ? { ...prev, id: newId, createdAt: newDate } : null);
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Заявки на поверку</h1>
          {canCreate && (
            <Button onClick={() => setIsCreateDialogOpen(true)} disabled={availableTerminals.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Создать заявку
            </Button>
          )}
        </div>
        
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-6 w-6 text-yellow-500"/>
                        Ожидают обработки
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {pendingRequests.length > 0 ? (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {pendingRequests.map(req => (
                                <RequestCard 
                                    key={req.id} 
                                    request={req} 
                                    terminals={getTerminalsForRequest(req.terminalIds)}
                                    onView={() => handleViewRequest(req)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center border-2 border-dashed rounded-lg">
                            <List className="h-10 w-10 text-muted-foreground" />
                            <p className="text-muted-foreground">Нет заявок, ожидающих обработки.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="processed-requests" className="border-0">
                <Card>
                  <AccordionTrigger className="w-full hover:no-underline">
                    <CardHeader className="flex-1 p-4">
                        <CardTitle className="flex items-center justify-between gap-2 text-left">
                           <div className="flex items-center gap-2">
                             <Check className="h-6 w-6 text-green-500"/>
                             Обработанные
                           </div>
                           <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                        </CardTitle>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent>
                        {processedRequests.length > 0 ? (
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {processedRequests.map(req => (
                                    <RequestCard 
                                        key={req.id} 
                                        request={req} 
                                        terminals={getTerminalsForRequest(req.terminalIds)}
                                        onView={() => handleViewRequest(req)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center border-2 border-dashed rounded-lg">
                                <List className="h-10 w-10 text-muted-foreground" />
                                <p className="text-muted-foreground">Нет обработанных заявок.</p>
                            </div>
                        )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
        </div>

      </div>

      {canCreate && (
        <CreateRequestDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          terminals={availableTerminals}
          onCreate={handleCreateRequest}
        />
      )}
      
      <RequestDetailsSheet
        request={selectedRequest}
        terminals={selectedRequest ? getTerminalsForRequest(selectedRequest.terminalIds) : []}
        isOpen={!!selectedRequest}
        onOpenChange={handleSheetOpenChange}
        onProcess={processVerificationRequest}
        onUpdateDetails={handleUpdateDetails}
      />
    </>
  );
}
