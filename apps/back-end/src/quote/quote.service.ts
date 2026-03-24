import { Injectable, BadRequestException } from "@nestjs/common";
import { verifyTypedData } from "viem";

export interface Quote {
	id: string;
	agentId: string;
	owner: string;
	price: string;
	nonce: number;
	deadline: number;
	signature: string;
	createdAt: number;
}

@Injectable()
export class QuoteService {
	// In-memory store for demo purposes. Real app would use DB.
	private quotes: Quote[] = [];

	async verifyAndStoreQuote(
		quoteData: Omit<Quote, "id" | "createdAt">,
	): Promise<Quote> {
		const { agentId, owner, price, nonce, deadline, signature } = quoteData;

		if (Date.now() / 1000 > deadline) {
			throw new BadRequestException("Quote has expired");
		}

		// Verify EIP-712 Signature
		const domain = {
			name: "CyberAgent",
			version: "1",
			chainId: 11155111, // Sepolia for demo
			verifyingContract:
				"0x0000000000000000000000000000000000000000" as `0x${string}`, // Placeholder
		};

		const types = {
			Quote: [
				{ name: "agentId", type: "string" },
				{ name: "owner", type: "address" },
				{ name: "price", type: "uint256" },
				{ name: "nonce", type: "uint256" },
				{ name: "deadline", type: "uint256" },
			],
		};

		const message = {
			agentId,
			owner: owner as `0x${string}`,
			price: BigInt(price),
			nonce: BigInt(nonce),
			deadline: BigInt(deadline),
		};

		try {
			const isValid = await verifyTypedData({
				address: owner as `0x${string}`,
				domain,
				types,
				primaryType: "Quote",
				message,
				signature: signature as `0x${string}`,
			});

			if (!isValid) {
				throw new BadRequestException("Invalid signature for quote");
			}

			const newQuote: Quote = {
				...quoteData,
				id: Math.random().toString(36).substring(7),
				createdAt: Date.now(),
			};

			this.quotes.push(newQuote);
			return newQuote;
		} catch (error) {
			console.error("Quote verification error:", error);
			throw new BadRequestException("Failed to verify quote signature");
		}
	}

	getQuotesByAgent(agentId: string): Quote[] {
		return this.quotes
			.filter((q) => q.agentId === agentId && Date.now() / 1000 <= q.deadline)
			.sort((a, b) => b.createdAt - a.createdAt);
	}
}
