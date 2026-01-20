'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { TerminalStatus } from '@/lib/types';

interface FiltersProps {
  onFilterChange: (filter: TerminalStatus | 'all') => void;
}

const filterOptions: { value: TerminalStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'verified', label: 'Поверен' },
    { value: 'pending', label: 'Ожидание' },
    { value: 'not_verified', label: 'Не поверен' },
    { value: 'expired', label: 'Просрочен' },
];

export function Filters({ onFilterChange }: FiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Фильтры</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          defaultValue="all"
          onValueChange={(value: any) => onFilterChange(value)}
          className="space-y-2"
        >
          {filterOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`r-${option.value}`} />
              <Label htmlFor={`r-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
