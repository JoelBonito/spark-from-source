import { z } from 'zod';

export const patientSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: z
    .string()
    .min(10, 'Telefone inválido')
    .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone deve conter apenas números e caracteres válidos'),
  email: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  birth_date: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      return new Date(date) <= new Date();
    }, 'Data de nascimento não pode ser futura'),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;

export function formatPhoneNumber(phone: string): string {
  // Remove tudo exceto números
  const cleaned = phone.replace(/\D/g, '');
  
  // Formato: (99) 99999-9999
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  // Formato: (99) 9999-9999
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}
