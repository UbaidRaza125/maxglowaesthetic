import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { appointmentsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);

type AppointmentInput = {
	id: string;
	name: string;
	phone: string;
	date: string;
	message: string;
	treatment: string;
	createdAt?: string;
};

function parseAppointmentInput(body: unknown): AppointmentInput {
	if (!body || typeof body !== "object") throw new Error("Invalid appointment");
	const input = body as Record<string, unknown>;
	const required = ["id", "name", "phone", "date", "treatment"];
	if (required.some((key) => typeof input[key] !== "string" || !input[key])) {
		throw new Error("Missing appointment details");
	}
	return {
		id: input.id as string,
		name: (input.name as string).trim(),
		phone: (input.phone as string).trim(),
		date: input.date as string,
		message: typeof input.message === "string" ? input.message : "",
		treatment: (input.treatment as string).trim(),
		createdAt: typeof input.createdAt === "string" ? input.createdAt : undefined,
	};
}

router.get("/appointments", async (_req, res, next) => {
	try {
		res.json(await db.select().from(appointmentsTable).orderBy(desc(appointmentsTable.createdAt)));
	} catch (error) {
		next(error);
	}
});

router.post("/appointments", async (req, res, next) => {
	try {
		const input = parseAppointmentInput(req.body);
		const [appointment] = await db.insert(appointmentsTable).values({
			...input,
			createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
		}).returning();
		res.status(201).json(appointment);
	} catch (error) {
		next(error);
	}
});

export default router;
