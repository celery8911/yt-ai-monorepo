import {
	Controller,
	Get,
	Post,
	Body,
	Query,
	UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Get("nonce")
	getNonce(@Query("address") address: string) {
		if (!address) {
			throw new UnauthorizedException("Address is required to generate nonce");
		}
		const nonce = this.authService.generateNonce(address);
		return { nonce };
	}

	@Post("siwe")
	async verifySiwe(
		@Body() body: { message: string; signature: string; address: string },
	) {
		const { message, signature, address } = body;

		if (!message || !signature || !address) {
			throw new UnauthorizedException("Missing required fields");
		}

		const isValid = await this.authService.verifySiwe(
			message,
			signature as `0x${string}`,
			address,
		);

		if (isValid) {
			// In a real app, generate and return a JWT here
			return {
				success: true,
				token: `mock-jwt-token-for-${address}`,
				message: "Authentication successful",
			};
		}
	}
}
