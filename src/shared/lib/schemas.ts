import * as z from "zod";

// Default validation messages in Spanish, for any rule without its own message.
// This module is loaded by both the forms and the API routes
z.config(z.locales.es());

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

export const createServiceSchema = z.object({
  serviceName: z.string().min(1, "El nombre del servicio es obligatorio"),
  price: z
    .number({ error: "Ingresa un precio válido" })
    .nonnegative("El precio no puede ser negativo"),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().optional(),
  textColor: z
    .string()
    .regex(hexColorRegex, "Color HEX inválido (ej: #1a2b3c)"),
  backgroundColor: z
    .string()
    .regex(hexColorRegex, "Color HEX inválido (ej: #1a2b3c)"),
});

export type CreateServiceValues = z.infer<typeof createServiceSchema>;

export const createClientSchema = z.object({
  clientName: z
    .string()
    .max(40, "El nombre del cliente debe tener como máximo 40 caracteres")
    .min(1, "El nombre del cliente es obligatorio"),
  phoneNumber: z.string().min(1, "El teléfono es obligatorio"),
});

export type CreateClientValues = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();

export type UpdateClientValues = z.infer<typeof updateClientSchema>;

export const createActiveAccountSchema = z.object({
  email: z.email("Correo no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
  serviceId: z.string().min(1, "Selecciona un servicio"),
  expirationDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Fecha inválida",
  }),
});

export type CreateActiveAccountValues = z.infer<
  typeof createActiveAccountSchema
>;

export const createClientStatusSchema = z
  .object({
    clientId: z.string().min(1, "Selecciona un cliente"),
    clientName: z
      .string()
      .max(40, "El nombre del cliente debe tener como máximo 40 caracteres")
      .optional(),
    phoneNumber: z.string().optional(),
    activeAccountId: z.string().min(1, "Selecciona una cuenta"),
    serviceId: z.string().min(1, "Selecciona un servicio"),
    screenId: z.string().min(1, "Selecciona un perfil"),
    status: z.enum(["ACTIVE", "EXPIRED", "NEAR_EXPIRATION"]),
    expirationDate: z.string().optional().nullable(),
    amount: z.number().int().optional().nullable(),
    priceSource: z.enum(["BINANCE", "CUSTOM"]),
    customUsdtRate: z.number().optional().nullable(),
    supplierPrice: z
      .number()
      .min(0, "El precio del proveedor no puede ser negativo"),
  })
  .superRefine((data, ctx) => {
    if (data.priceSource === "CUSTOM") {
      if (
        data.customUsdtRate === null ||
        data.customUsdtRate === undefined ||
        data.customUsdtRate < 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customUsdtRate"],
          message: "La tasa USDT manual es requerida",
        });
      }
    }
  });

export type CreateClientStatusValues = z.infer<typeof createClientStatusSchema>;

export const createClientStatusRequestSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  clientName: z
    .string()
    .max(40, "El nombre del cliente debe tener como máximo 40 caracteres")
    .optional(),
  phoneNumber: z.string().optional(),
  activeAccountId: z.string().min(1, "Selecciona una cuenta"),
  serviceId: z.string().min(1, "Selecciona un servicio"),
  screenId: z.string().min(1, "Selecciona un perfil"),
  status: z.enum(["ACTIVE", "EXPIRED", "NEAR_EXPIRATION"]),
  expirationDate: z.string().optional().nullable(),
  amount: z.number().int().optional().nullable(),
});

export type CreateClientStatusRequestValues = z.infer<
  typeof createClientStatusRequestSchema
>;

export const renewClientStatusSchema = z
  .object({
    expirationDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Fecha inválida",
    }),
    amount: z.number().int().optional().nullable(),
    priceSource: z.enum(["BINANCE", "CUSTOM"]),
    customUsdtRate: z.number().optional().nullable(),
    supplierPrice: z
      .number()
      .min(0, "El precio del proveedor no puede ser negativo"),
  })
  .superRefine((data, ctx) => {
    if (data.priceSource === "CUSTOM") {
      if (
        data.customUsdtRate === null ||
        data.customUsdtRate === undefined ||
        data.customUsdtRate < 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customUsdtRate"],
          message: "La tasa USDT manual es requerida",
        });
      }
    }
  });

export type RenewClientStatusValues = z.infer<typeof renewClientStatusSchema>;

export const updateClientStatusSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente").optional(),
  clientName: z
    .string()
    .max(40, "El nombre del cliente debe tener como máximo 40 caracteres")
    .min(1, "El nombre del cliente es obligatorio")
    .optional(),
  phoneNumber: z.string().min(1, "El teléfono es obligatorio").optional(),
  activeAccountId: z.string().min(1, "Selecciona una cuenta").optional(),
  serviceId: z.string().min(1, "Selecciona un servicio").optional(),
  screenId: z.string().min(1, "Selecciona un perfil").optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "NEAR_EXPIRATION"]).optional(),
  expirationDate: z.string().optional().nullable(),
  amount: z.number().int().optional().nullable(),
});

export type UpdateClientStatusValues = z.infer<typeof updateClientStatusSchema>;

export const createScreenSchema = z.object({
  profileName: z.string().min(1, "El nombre del perfil es obligatorio"),
  profilePIN: z.coerce
    .number({ error: "El PIN debe tener 4 dígitos" })
    .int()
    .gte(1000, "El PIN debe tener 4 dígitos")
    .lte(9999, "El PIN debe tener 4 dígitos"),
  activeAccountId: z.string().min(1, "Selecciona una cuenta"),
});

export type CreateScreenValues = z.infer<typeof createScreenSchema>;

// export const updateScreenSchema = z.object({
//   profileName: z.string().min(1, "Required").optional(),
//   profilePIN: z.coerce
//     .number()
//     .int()
//     .gte(1000, "Must be at least 4 digits")
//     .lte(9999, "Must be no more than 4 digits")
//     .optional(),
// });

// export type UpdateScreenValues = z.infer<typeof updateScreenSchema>;

export const updateScreenSchema = z.object({
  profileName: z.string().optional(),
  profilePIN: z.coerce
    .number({ error: "El PIN debe tener 4 dígitos" })
    .int()
    .gte(1000, "El PIN debe tener 4 dígitos")
    .lte(9999, "El PIN debe tener 4 dígitos"),
});

export type UpdateScreenFormValues = z.input<typeof updateScreenSchema>;

// Best practice: infer the type directly from the schema
export type UpdateScreenValues = z.infer<typeof updateScreenSchema>;

// SIGN IN SCHEMA

export const signInFormSchema = z.object({
  email: z.email("Correo no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;

// SIGN UP SCHEMA

export const signUpFormSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.email("Correo no válido"),
  // Same limits as Better Auth's defaults (8–128), which the server enforces
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede tener más de 128 caracteres"),
});

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;

// FORGOT PASSWORD SCHEMA

export const forgotPasswordFormSchema = z.object({
  email: z.email("Correo no válido"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export type CheckEmailResponse =
  | { exists: false; emailVerified: false }
  | { exists: true; emailVerified: boolean };

// RESET PASSWORD

export const resetPasswordFormSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});
