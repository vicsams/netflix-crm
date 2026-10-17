import * as z from "zod";

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

export const createServiceSchema = z.object({
  serviceName: z.string().min(1, "Required"),
  price: z.number().nonnegative(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().optional(),
  textColor: z.string().regex(hexColorRegex, "Invalid HEX color"),
  backgroundColor: z.string().regex(hexColorRegex, "Invalid HEX color"),
});

export type CreateServiceValues = z.infer<typeof createServiceSchema>;

export const createClientSchema = z.object({
  clientName: z
    .string()
    .max(40, "El nombre del cliente debe tener como maximo 40 caracteres")
    .min(1, "Required"),
  phoneNumber: z.string().min(1, "Required"),
});

export type CreateClientValues = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();

export type UpdateClientValues = z.infer<typeof updateClientSchema>;

export const createActiveAccountSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  serviceId: z.string().min(1, "Service is required"),
  expirationDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date string",
  }),
});

export type CreateActiveAccountValues = z.infer<
  typeof createActiveAccountSchema
>;

export const createClientStatusSchema = z
  .object({
    clientId: z.string().min(1, "Required"),
    clientName: z
      .string()
      .max(40, "El nombre del cliente debe tener como maximo 40 caracteres")
      .optional(),
    phoneNumber: z.string().optional(),
    activeAccountId: z.string().min(1, "Required"),
    serviceId: z.string().min(1, "Required"),
    screenId: z.string().min(1, "Required"),
    status: z.enum(["ACTIVE", "EXPIRED", "NEAR_EXPIRATION"]),
    expirationDate: z.string().optional().nullable(),
    amount: z.number().int().optional().nullable(),
    priceSource: z.enum(["BINANCE", "CUSTOM"]),
    customUsdtRate: z.number().optional().nullable(),
    supplierPrice: z.number().min(0, "Required"),
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
  clientId: z.string().min(1, "Required"),
  clientName: z
    .string()
    .max(40, "El nombre del cliente debe tener como maximo 40 caracteres")
    .optional(),
  phoneNumber: z.string().optional(),
  activeAccountId: z.string().min(1, "Required"),
  serviceId: z.string().min(1, "Required"),
  screenId: z.string().min(1, "Required"),
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
      message: "Invalid date string",
    }),
    amount: z.number().int().optional().nullable(),
    priceSource: z.enum(["BINANCE", "CUSTOM"]),
    customUsdtRate: z.number().optional().nullable(),
    supplierPrice: z.number().min(0, "Required"),
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
  clientId: z.string().min(1, "Required").optional(),
  clientName: z
    .string()
    .max(40, "El nombre del cliente debe tener como maximo 40 caracteres")
    .min(1, "Required")
    .optional(),
  phoneNumber: z.string().min(1, "Required").optional(),
  activeAccountId: z.string().min(1, "Required").optional(),
  serviceId: z.string().min(1, "Required").optional(),
  screenId: z.string().min(1, "Required").optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "NEAR_EXPIRATION"]).optional(),
  expirationDate: z.string().optional().nullable(),
  amount: z.number().int().optional().nullable(),
});

export type UpdateClientStatusValues = z.infer<typeof updateClientStatusSchema>;

export const createScreenSchema = z.object({
  profileName: z.string().min(1, "Required"),
  profilePIN: z.coerce
    .number()
    .int()
    .gte(1000, "Must be at least 4 digits")
    .lte(9999, "Must be no more than 4 digits"),
  activeAccountId: z.string().min(1, "Required"),
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
    .number()
    .int()
    .gte(1000, "Must be at least 4 digits")
    .lte(9999, "Must be no more than 4 digits"),
});

export type UpdateScreenFormValues = z.input<typeof updateScreenSchema>;

// Best practice: infer the type directly from the schema
export type UpdateScreenValues = z.infer<typeof updateScreenSchema>;

// SIGN IN SCHEMA

export const signInFormSchema = z.object({
  email: z.email("Correo no valido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;

// SIGN UP SCHEMA

export const signUpFormSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.email("Correo no valido"),
  // Same limits as Better Auth's defaults (8–128), which the server enforces
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede tener más de 128 caracteres"),
});

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;

// FORGOT PASSWORD SCHEMA

export const forgotPasswordFormSchema = z.object({
  email: z.email("Correo no valido"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export type CheckEmailResponse =
  | { exists: false; emailVerified: false }
  | { exists: true; emailVerified: boolean };

// RESET PASSWORD

export const resetPasswordFormSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});
