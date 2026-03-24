import { PrismaClient } from "@prisma/client";
import { seedBills } from "./bills.seed";

const prisma = new PrismaClient();

async function main() {
	console.log("🚀 Starting database seeding...");

	try {
		// Seed bills
		await seedBills();

		console.log("✨ Database seeding completed successfully!");
	} catch (error) {
		console.error("❌ Error during database seeding:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
