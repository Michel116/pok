'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { BoxType } from '@/lib/types';
import { QrCode, Keyboard, ArrowRight, ArrowLeft, Camera } from 'lucide-react';
import jsQR from 'jsqr';
import { useTerminals } from '@/context/terminals-context';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddTerminalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddTerminal: (serialNumber: string, boxType: BoxType, sectionId?: string) => boolean;
  dialogType: 'regular' | 'rental';
}

type WizardStep = 'placement' | 'boxType' | 'serial';

export function AddTerminalDialog({
  isOpen,
  onOpenChange,
  onAddTerminal,
  dialogType,
}: AddTerminalDialogProps) {
  const { toast } = useToast();
  const { shelfSections } = useTerminals();
  const [step, setStep] = useState<WizardStep>('placement');
  const [activeTab, setActiveTab] = useState('scan');
  const [serialNumber, setSerialNumber] = useState('');
  const [boxType, setBoxType] = useState<BoxType>('type_A');
  const [isPlaced, setIsPlaced] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  const manualInputRef = useRef<HTMLInputElement>(null);

  const availableSections = useMemo(() => {
    const isRentalType = dialogType === 'rental';
    const isRentalSN = serialNumber.startsWith('1792');

    if (isRentalType || isRentalSN) {
      return shelfSections.filter(s => s.tier === 'Аренда');
    }
    return shelfSections.filter(s => s.tier !== 'Аренда');
  }, [shelfSections, dialogType, serialNumber]);

  const stopCamera = useCallback(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraInitializing(false);
  }, []);

  const resetDialog = useCallback(() => {
      stopCamera();
      setError('');
      setSerialNumber('');
      setBoxType('type_A');
      setIsPlaced(false);
      setSelectedSection(undefined);
      setStep('placement');
      setActiveTab('scan');
      setIsCameraInitializing(false);
      setCameraError(null);
  }, [stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow for closing animation
      setTimeout(resetDialog, 300);
    }
  }, [isOpen, resetDialog]);


  const validateSerialNumber = useCallback((sn: string) => {
    if (dialogType === 'rental' && sn && !sn.startsWith('1792')) {
      setError('Серийный номер для аренды должен начинаться с 1792.');
      return false;
    }
    if (dialogType === 'regular' && sn.startsWith('1792')) {
      setError('Обычный терминал не может иметь S/N, начинающийся с 1792.');
      return false;
    }
    setError('');
    return true;
  }, [dialogType]);
  
  const handleScanSuccess = useCallback((scannedSerialNumber: string) => {
    setSerialNumber(scannedSerialNumber);

    if (!validateSerialNumber(scannedSerialNumber)) {
      setActiveTab('manual');
      stopCamera();
      return;
    }

    const success = onAddTerminal(scannedSerialNumber, boxType, isPlaced ? selectedSection : undefined);
    if(success) {
      toast({
        title: 'Терминал добавлен',
        description: `Терминал ${scannedSerialNumber} сосканирован и добавлен.`,
      });
      onOpenChange(false);
    } else {
       setError('Терминал с таким серийным номером уже существует.');
       setActiveTab('manual');
       stopCamera();
    }
  }, [validateSerialNumber, onAddTerminal, boxType, isPlaced, selectedSection, toast, onOpenChange, stopCamera]);


  const scanQrCode = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data && code.data.trim() !== '') {
          handleScanSuccess(code.data);
          return; 
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(scanQrCode);
  }, [handleScanSuccess]);
  
  const startCamera = async () => {
    if (isCameraInitializing || streamRef.current) return;

    setIsCameraInitializing(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraInitializing(false);
        animationFrameRef.current = requestAnimationFrame(scanQrCode);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setIsCameraInitializing(false);

      let message = "Не удалось получить доступ к камере.";
      if (err.name === "NotAllowedError") {
        message = "Доступ к камере заблокирован. Проверьте разрешения в настройках браузера.";
      } else if (err.name === "NotFoundError") {
        message = "Камера не найдена на вашем устройстве.";
      } else if (err.message.includes("not supported")) {
        message = "Ваш браузер не поддерживает работу с камерой. Пожалуйста, используйте HTTPS."
      }
      setCameraError(message);
    }
  };
  
  useEffect(() => {
    if (activeTab === 'scan' && isOpen) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Ваш браузер не поддерживает работу с камерой.");
      }
    } else {
        stopCamera();
    }
  }, [activeTab, isOpen, stopCamera]);


  const handleAdd = () => {
    if (!serialNumber.trim()) {
      setError('Серийный номер не может быть пустым.');
      return;
    }
    if (!validateSerialNumber(serialNumber)) {
      return;
    }

    const success = onAddTerminal(serialNumber, boxType, isPlaced ? selectedSection : undefined);
    if (success) {
      toast({
        title: 'Терминал добавлен',
        description: `Терминал ${serialNumber} был успешно добавлен.`,
      });
      onOpenChange(false);
    } else {
        setError('Терминал с таким серийным номером уже существует.');
    }
  };
  
  const handleNextStep = () => {
    if (step === 'placement') {
      if (isPlaced && !selectedSection) {
        setError('Пожалуйста, выберите стеллаж.');
        return;
      }
      setError('');
      setStep('boxType');
    } else if (step === 'boxType') {
      setStep('serial');
    }
  }

  const handlePrevStep = () => {
    if (step === 'serial') {
      setStep('boxType');
    } else if (step === 'boxType') {
      setStep('placement');
    }
  }
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAdd();
    }
  };

  const dialogTitle = dialogType === 'rental' ? 'Добавить арендный терминал' : 'Добавить новый терминал';
  const dialogDescription = dialogType === 'rental' 
    ? 'Добавление нового терминала в арендный фонд.'
    : 'Добавление нового терминала на основной склад.';

  const progressValue = step === 'placement' ? 33 : step === 'boxType' ? 66 : 100;
  
  const renderStep = () => {
      switch(step) {
        case 'placement':
            return (
                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label htmlFor="is-placed-switch">Терминал уже на стеллаже?</Label>
                            <p className="text-xs text-muted-foreground">
                                Укажите, если терминал размещен на полке.
                            </p>
                        </div>
                        <Switch
                            id="is-placed-switch"
                            checked={isPlaced}
                            onCheckedChange={setIsPlaced}
                        />
                    </div>
                    
                    {isPlaced && (
                        <div className="space-y-2">
                            <Label htmlFor="section">Выберите стеллаж</Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger id="section">
                                    <SelectValue placeholder="Выберите секцию стеллажа" />
                                </SelectTrigger>
                                <SelectContent>
                                    <ScrollArea className="h-[200px]">
                                        {availableSections.length > 0 ? availableSections.map(section => (
                                            <SelectItem key={section.id} value={section.id}>
                                                Секция {section.id} ({section.tier})
                                            </SelectItem>
                                        )) : <p className="p-2 text-xs text-muted-foreground">Нет доступных секций.</p>}
                                    </ScrollArea>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
            );
        case 'boxType':
            return (
                 <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label>Тип коробки</Label>
                        <RadioGroup
                            value={boxType}
                            onValueChange={(value) => setBoxType(value as BoxType)}
                            className="flex items-center gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="type_A" id="r-small" />
                                <Label htmlFor="r-small">Маленькая</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="type_B" id="r-large" />
                                <Label htmlFor="r-large">Большая</Label>
                            </div>
                        </RadioGroup>
                    </div>
                 </div>
            );
        case 'serial':
            return (
                <Tabs value={activeTab} onValueChange={v => setActiveTab(v as string)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual"><Keyboard className="mr-2" /> Вручную</TabsTrigger>
                        <TabsTrigger value="scan"><QrCode className="mr-2" /> Сканировать QR</TabsTrigger>
                    </TabsList>
                    <div className="py-4 min-h-[220px]">
                        <TabsContent value="manual">
                             <div className="space-y-2">
                                <Label htmlFor="serial">Серийный номер</Label>
                                <Input 
                                    ref={manualInputRef}
                                    id="serial" 
                                    placeholder={dialogType === 'rental' ? 'S/N должен начинаться с 1792...' : 'Введите серийный номер'}
                                    value={serialNumber}
                                    onChange={(e) => {
                                        const newSerialNumber = e.target.value;
                                        setSerialNumber(newSerialNumber);
                                        validateSerialNumber(newSerialNumber);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    className={cn(error && 'border-destructive')}
                                />
                                {error && <p className="text-sm text-destructive">{error}</p>}
                            </div>
                        </TabsContent>
                        <TabsContent value="scan">
                            <div className="space-y-4">
                                 <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden border">
                                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                                    {(!streamRef.current && !isCameraInitializing && !cameraError) && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                                            <p className="text-sm text-muted-foreground mb-4">Нажмите, чтобы начать сканирование</p>
                                            <Button onClick={startCamera}>
                                                <Camera className="mr-2 h-4 w-4" />
                                                Включить камеру
                                            </Button>
                                        </div>
                                    )}
                                    {isCameraInitializing && (
                                         <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                                            <p>Запуск камеры...</p>
                                        </div>
                                    )}
                                 </div>
                                {cameraError && (
                                    <Alert variant="destructive">
                                        <AlertTitle>Ошибка камеры</AlertTitle>
                                        <AlertDescription>
                                            {cameraError}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            );
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        
        <Progress value={progressValue} className="w-full" />
        
        <div className="min-h-[150px]">
            {renderStep()}
        </div>

        <DialogFooter className="flex-row justify-between w-full">
            <div>
                 {step !== 'placement' && (
                    <Button variant="ghost" onClick={handlePrevStep}><ArrowLeft className="mr-2"/> Назад</Button>
                 )}
            </div>
            <div className="flex gap-2">
                 <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
                 {step !== 'serial' && (
                    <Button onClick={handleNextStep}>Продолжить <ArrowRight className="ml-2"/></Button>
                 )}
                 {step === 'serial' && activeTab === 'manual' && (
                    <Button onClick={handleAdd}>Добавить</Button>
                 )}
                 {step === 'serial' && activeTab === 'scan' && (
                    <Button disabled={!!streamRef.current || isCameraInitializing}>
                        {isCameraInitializing ? 'Запуск...' : 'Сканирование...'}
                    </Button>
                 )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
