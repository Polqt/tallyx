ALTER TABLE "payments" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE INDEX "credits_store_id_idx" ON "credits" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "credits_customer_id_idx" ON "credits" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "credits_store_status_idx" ON "credits" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "customers_store_id_idx" ON "customers" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "payments_credit_id_idx" ON "payments" USING btree ("credit_id");--> statement-breakpoint
CREATE INDEX "stores_user_id_idx" ON "stores" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key");