CREATE TYPE "public"."payment_method" AS ENUM('CARD', 'PAYPAL', 'SEPA');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'CANCELLED_PENDING', 'INACTIVE', 'PAST_DUE', 'UNPAID');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN', 'PARTNER');--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status" "subscription_status" DEFAULT 'INACTIVE' NOT NULL,
	"period_end" timestamp with time zone,
	"plan" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"payment_method" "payment_method",
	"billing_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"partner_id" text,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"behavior" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_credits_non_negative" CHECK ("users"."credits" >= 0)
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;