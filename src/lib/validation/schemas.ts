import { z } from "zod";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const documentUploadSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ALLOWED_MIME_TYPES),
  size: z.number().min(1).max(MAX_FILE_SIZE),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
