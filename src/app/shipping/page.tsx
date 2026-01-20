
'use client'
import { useMemo, useState, useCallback } from "react";
import type { ShipmentWithDetails, Terminal } from "@/lib/types";
import { useTerminals } from "@/context/terminals-context";
import { useUser } from "@/context/user-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipmentDetailsSheet } from "./components/shipment-details-sheet";
import ShippingHistoryTable from "./components/shipping-history-table";
import { getColumns } from "./components/columns";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Truck, Search, ChevronsUpDown, CheckCircle, Users } from "lucide-react";
import { InitiateShipmentDialog } from "./components/initiate-shipment-dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ManageContragentsDialog } from "./components/manage-contragents-dialog";

export default function ShippingPage() {
    const { terminals, shipments, updateTerminalVerification, shipTerminal, updateShipmentDate, contragents, addContragent, deleteContragent } = useTerminals();
    const { user } = useUser();
    const [selectedShipment, setSelectedShipment] = useState<ShipmentWithDetails | null>(null);
    const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);
    const [isManageContragentsOpen, setIsManageContragentsOpen] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [contragentFilter, setContragentFilter] = useState('');
    const [isContragentPopoverOpen, setContragentPopoverOpen] = useState(false);
    const [newContragentName, setNewContragentName] = useState('');

    const { toast } = useToast();

    const canShip = user?.role === 'Administrator' || user?.role === 'User';
    const canManageContragents = user?.role === 'Administrator';

    const shipmentData: ShipmentWithDetails[] = useMemo(() => {
        return shipments.map(shipment => {
            const terminal = terminals.find(t => t.serialNumber === shipment.terminalId);
            return {
                ...shipment,
                serialNumber: terminal?.serialNumber || shipment.terminalId,
                initialStatus: shipment.statusBeforeShipment,
                model: terminal?.model || 'N/A',
                boxType: terminal?.boxType,
                history: terminal?.history || [],
                lastVerificationDate: terminal?.lastVerificationDate,
                verifiedUntil: terminal?.verifiedUntil,
            } as ShipmentWithDetails;
        })
        .filter(item => !!item.boxType)
        .sort((a, b) => new Date(b.shippingDate).getTime() - new Date(a.shippingDate).getTime());
    }, [terminals, shipments]);
    
    const handleAddNewContragent = (name: string): boolean => {
        const success = addContragent(name);
        if (success) {
            setContragentFilter(name); // Select the newly added contragent
            toast({
                title: 'Контрагент добавлен',
                description: `Новый контрагент "${name}" был успешно добавлен.`,
            });
            return true;
        }
        return false;
    };

    const handleRowClick = (shipment: ShipmentWithDetails) => {
        setSelectedShipment(shipment);
    };
    
    const handleSheetOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedShipment(null);
        }
    };
    
    const handleUpdateVerification = (terminalId: string, verificationDate: string, verifiedUntil: string) => {
        updateTerminalVerification(terminalId, verificationDate, verifiedUntil);
        toast({
            title: 'Поверка обновлена',
            description: `Дата поверки для терминала ${terminalId} была успешно обновлена.`,
        });
        setSelectedShipment(null);
    }
    
    const handleUpdateShipmentDate = (terminalId: string, newShippingDate: string) => {
        updateShipmentDate(terminalId, newShippingDate);
        toast({
            title: 'Дата отгрузки обновлена',
            description: `Дата отгрузки для терминала ${terminalId} была успешно обновлена.`,
        });
        
        setSelectedShipment(prev => prev ? { ...prev, shippingDate: newShippingDate } : null);
    }
    
    const handleShipTerminal = (terminalId: string, contragent: string) => {
        shipTerminal(terminalId, contragent);
        toast({
            title: 'Терминал отгружен',
            description: `Терминал ${terminalId} был успешно отгружен для ${contragent}.`,
        });
        setIsShipDialogOpen(false);
    }

    const columns = useMemo(() => getColumns({
        onView: handleRowClick,
    }), [handleRowClick]);
    
    const availableTerminalsForShipment = useMemo(() => {
        return terminals.filter(t => t.status !== 'shipped' && t.status !== 'awaits_verification_after_shipping' && t.status !== 'rented');
    }, [terminals]);

    return (
        <>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold tracking-tight">История отправок</h1>
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
                     <Popover open={isContragentPopoverOpen} onOpenChange={setContragentPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isContragentPopoverOpen}
                          className="w-full sm:w-[200px] justify-between"
                        >
                          <span className="truncate">{contragentFilter || "Все контрагенты"}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                           <CommandInput 
                                placeholder="Поиск..."
                                value={newContragentName}
                                onValueChange={setNewContragentName}
                            />
                          <CommandList>
                            <CommandEmpty>
                                 <div className="p-2 text-sm text-center text-muted-foreground">
                                    Не найдено.
                                 </div>
                            </CommandEmpty>
                             <CommandGroup>
                                 <CommandItem key="all-contragents" value="Все контрагенты" onSelect={() => { setContragentFilter(''); setNewContragentName(''); setContragentPopoverOpen(false); }}>
                                    <CheckCircle className={cn("mr-2 h-4 w-4", !contragentFilter ? "opacity-100" : "opacity-0")}/>
                                    Все контрагенты
                                </CommandItem>
                                {contragents.map((c) => (
                                  <CommandItem
                                    key={c}
                                    value={c}
                                    onSelect={(currentValue) => {
                                      setContragentFilter(currentValue.toLowerCase() === contragentFilter.toLowerCase() ? "" : currentValue);
                                      setNewContragentName('');
                                      setContragentPopoverOpen(false);
                                    }}
                                  >
                                    <CheckCircle className={cn("mr-2 h-4 w-4", contragentFilter.toLowerCase() === c.toLowerCase() ? "opacity-100" : "opacity-0")}/>
                                    {c}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {canManageContragents && (
                      <Button variant="outline" onClick={() => setIsManageContragentsOpen(true)}>
                        <Users className="mr-2 h-4 w-4" />
                        Контрагенты
                      </Button>
                    )}

                    {canShip && (
                     <Button onClick={() => setIsShipDialogOpen(true)} className="w-full sm:w-auto">
                        <Truck className="mr-2 h-4 w-4"/>
                        Новая отгрузка
                    </Button>
                    )}
                </div>
              </div>

            <Card>
                <CardHeader>
                    <CardTitle>Журнал отправок</CardTitle>
                    <CardDescription>Просмотр полного журнала всех отправок терминалов.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ShippingHistoryTable 
                        columns={columns} 
                        data={shipmentData} 
                        onRowClick={handleRowClick}
                        globalFilter={globalFilter}
                        contragentFilter={contragentFilter}
                    />
                </CardContent>
            </Card>

            <ShipmentDetailsSheet
                shipment={selectedShipment}
                isOpen={!!selectedShipment}
                onOpenChange={handleSheetOpenChange}
                onUpdateVerification={handleUpdateVerification}
                onUpdateShipmentDate={handleUpdateShipmentDate}
            />
            
            {canShip && (
              <InitiateShipmentDialog
                  isOpen={isShipDialogOpen}
                  onOpenChange={setIsShipDialogOpen}
                  terminals={availableTerminalsForShipment}
                  onShip={handleShipTerminal}
                  contragents={contragents}
                  addContragent={addContragent}
              />
            )}

            {canManageContragents && (
              <ManageContragentsDialog
                isOpen={isManageContragentsOpen}
                onOpenChange={setIsManageContragentsOpen}
                contragents={contragents}
                onAddContragent={addContragent}
                onDeleteContragent={deleteContragent}
              />
            )}
        </>
    );
}
