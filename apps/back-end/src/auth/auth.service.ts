import { Injectable, UnauthorizedException } from "@nestjs/common";
import { verifyMessage } from "viem";
import { randomBytes } from "crypto";

@Injectable()
export class AuthService {
	// In a real app, store this in Redis or database with expiration
	private nonceStore = new Map<string, string>();

	generateNonce(address: string): string {
		const nonce = randomBytes(16).toString("hex");
		this.nonceStore.set(address.toLowerCase(), nonce);
		return nonce;
	}

	async verifySiwe(
		message: string,
		signature: `0x${string}`,
		expectedAddress: string,
	): Promise<boolean> {
		try {
			// 1. Parse the message to extract the nonce (basic implementation)
			const nonceMatch = message.match(/Nonce: ([a-zA-Z0-9]+)/);
			if (!nonceMatch) {
				throw new UnauthorizedException("Invalid SIWE message: missing nonce");
			}

			const nonce = nonceMatch[1];
			const storedNonce = this.nonceStore.get(expectedAddress.toLowerCase());

			if (!storedNonce || storedNonce !== nonce) {
				throw new UnauthorizedException("Invalid or expired nonce");
			}

			// 2. Verify the cryptographic signature
			const isValid = await verifyMessage({
				address: expectedAddress as `0x${string}`,
				message,
				signature,
			});

			if (!isValid) {
				throw new UnauthorizedException("Invalid signature");
			}

			// 3. Clear nonce after successful verification
			this.nonceStore.delete(expectedAddress.toLowerCase());

			return true;
		} catch (error) {
			console.error("SIWE Verification Error:", error);
			throw new UnauthorizedException("SIWE verification failed");
		}
	}
}
