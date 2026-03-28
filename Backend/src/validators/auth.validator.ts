// Example: Backend/src/validators/auth.validator.ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
}).strict(); // ✅ Blocks any extra fields sent by attackers