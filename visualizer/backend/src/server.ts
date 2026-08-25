import { PrismaClient } from "@prisma/client";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { PrismaRepository } from "./db/repository.js";

const prisma = new PrismaClient();
const app = createApp(new PrismaRepository(prisma));
app.listen(config.PORT, "0.0.0.0", () => console.log(`visualizer-api listening on ${config.PORT}`));
process.on("SIGTERM", async () => { await prisma.$disconnect(); process.exit(0); });
