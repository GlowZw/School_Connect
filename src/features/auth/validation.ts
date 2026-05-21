import { z } from 'zod';

import type { UserRole } from '@/types/auth';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  schoolId: z.string().min(2),
  role: z.enum(['parent', 'teacher', 'admin'] satisfies [UserRole, ...UserRole[]]),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
