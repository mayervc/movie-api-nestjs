import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/** Converts a decimal ticket price (e.g. from PostgreSQL numeric) to Stripe amount in cents. */
export function ticketPriceToCents(price: number | string): number {
  return Math.round(Number(price) * 100);
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secretKey
      ? new Stripe(secretKey, {
          typescript: true
        })
      : null;
    if (!this.stripe) {
      this.logger.warn(
        'STRIPE_SECRET_KEY is not set; paid purchases and refunds are disabled'
      );
    }
  }

  isConfigured(): boolean {
    return this.stripe !== null;
  }

  /**
   * Verifies that the PaymentIntent succeeded and matches the expected total for this purchase.
   */
  async assertPaymentIntentMatchesPurchase(
    paymentIntentId: string,
    unitTicketPrice: number | string,
    seatCount: number
  ): Promise<void> {
    if (!this.stripe) {
      throw new BadRequestException(
        'Stripe is not configured; cannot process paid purchases'
      );
    }

    const expectedTotalCents = ticketPriceToCents(unitTicketPrice) * seatCount;

    try {
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (intent.status !== 'succeeded') {
        throw new BadRequestException(
          `Payment is not completed (status: ${intent.status})`
        );
      }

      const paidCents =
        typeof intent.amount_received === 'number'
          ? intent.amount_received
          : intent.amount;

      if (paidCents !== expectedTotalCents) {
        throw new BadRequestException(
          'Payment amount does not match the selected seats and showtime price'
        );
      }
    } catch (error: unknown) {
      this.rethrowStripeError(error);
    }
  }

  /**
   * Creates a Stripe Checkout session for a ticket purchase.
   * Returns the session id and hosted checkout URL.
   */
  async createCheckoutSession(params: {
    totalCents: number;
    seatCount: number;
    showtimeId: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    if (!this.stripe) {
      throw new BadRequestException(
        'Stripe is not configured; cannot create checkout session'
      );
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(params.totalCents / params.seatCount),
              product_data: { name: 'Movie ticket' }
            },
            quantity: params.seatCount
          }
        ],
        metadata: { showtimeId: String(params.showtimeId) },
        success_url: params.successUrl,
        cancel_url: params.cancelUrl
      });

      return { sessionId: session.id, url: session.url as string };
    } catch (error: unknown) {
      this.rethrowStripeError(error);
    }
  }

  /**
   * Creates a Stripe Checkout session for a subscription plan.
   * Requires a Stripe Price ID (from env) for the chosen plan.
   */
  async createSubscriptionCheckoutSession(params: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    if (!this.stripe) {
      throw new BadRequestException(
        'Stripe is not configured; cannot create subscription checkout session'
      );
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: params.priceId, quantity: 1 }],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl
      });

      return { sessionId: session.id, url: session.url as string };
    } catch (error: unknown) {
      this.rethrowStripeError(error);
    }
  }

  /**
   * Issues a partial refund for one seat against a shared PaymentIntent (test and live modes).
   */
  async refundSingleSeat(params: {
    paymentIntentId: string;
    amountCents: number;
    idempotencyKey: string;
  }): Promise<void> {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'Stripe is not configured; cannot refund this ticket'
      );
    }

    try {
      await this.stripe.refunds.create(
        {
          payment_intent: params.paymentIntentId,
          amount: params.amountCents
        },
        { idempotencyKey: params.idempotencyKey }
      );
    } catch (error: unknown) {
      this.rethrowStripeError(error);
    }
  }

  /**
   * Verifies the Stripe webhook signature and constructs the event object.
   * Throws BadRequestException if the signature is invalid.
   */
  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) {
      throw new BadRequestException(
        'Stripe is not configured; cannot process webhook'
      );
    }
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET'
    );
    if (!webhookSecret) {
      throw new BadRequestException(
        'STRIPE_WEBHOOK_SECRET is not set; cannot verify webhook signature'
      );
    }
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (error: unknown) {
      this.rethrowStripeError(error);
    }
  }

  private rethrowStripeError(error: unknown): never {
    if (error instanceof BadRequestException) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}
