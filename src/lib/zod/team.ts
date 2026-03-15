import { z } from "zod";

export const createTeamRequestSchema = z.object({
	teamName: z.string().min(3, "Team Name must be at least 3 characters").max(100),
	userGroup: z
		.string()
		.max(100)
		.refine((val) => val.startsWith("PRC-"), {
			message: "User Group must start with PRC-",
		}),
	adminGroup: z
		.string()
		.max(100)
		.refine((val) => val.startsWith("PRC-"), {
			message: "Admin Group must start with PRC-",
		}),
	contactName: z.string().min(2, "Contact Name is required"),
	contactEmail: z.string().email("Invalid contact email address").max(255),
});
