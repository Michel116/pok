'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, List, User, Calendar } from "lucide-react";
import type { VerificationRequest, Terminal } from "@/lib/types";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface RequestCardProps {
  request: VerificationRequest;
  terminals: Terminal[];
  onView: () => void;
}

export function RequestCard({ request, terminals, onView }: RequestCardProps) {
  const isPending = request.status === 'pending';

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{request.id}</CardTitle>
          <Badge variant={isPending ? "warning" : "success"} className="whitespace-nowrap">
            {isPending ? <Clock className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
            {isPending ? 'Ожидание' : 'Обработан'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <List className="mr-2 h-4 w-4" />
          <span>{terminals.length} терминал(ов)</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="mr-2 h-4 w-4" />
          <span>Создал: {request.createdBy}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          <span>Создана: {format(new Date(request.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
        </div>
        {!isPending && request.processedAt && (
           <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Обработана: {format(new Date(request.processedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
           </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onView}>
          Просмотреть детали
        </Button>
      </CardFooter>
    </Card>
  );
}
