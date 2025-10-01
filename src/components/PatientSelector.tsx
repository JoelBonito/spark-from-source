import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { getAllPatients, Patient } from '@/services/patientService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface PatientSelectorProps {
  value: string | null;
  onChange: (patientId: string | null) => void;
  onCreateNew: () => void;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  value,
  onChange,
  onCreateNew
}) => {
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await getAllPatients();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === value);

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
          >
            {selectedPatient ? selectedPatient.name : "Selecionar paciente..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar paciente..." />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Carregando...' : 'Nenhum paciente encontrado.'}
              </CommandEmpty>
              <CommandGroup>
                {patients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    value={patient.id}
                    onSelect={() => {
                      onChange(patient.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === patient.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{patient.name}</span>
                      <span className="text-xs text-muted-foreground">{patient.phone}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="outline"
        onClick={onCreateNew}
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Novo
      </Button>
    </div>
  );
};
