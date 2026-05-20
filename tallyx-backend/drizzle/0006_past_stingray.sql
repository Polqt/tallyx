ALTER TABLE "credits" ALTER COLUMN "on_chain_credit_id" SET DATA TYPE bigint;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_sync_status_check"
  CHECK ("sync_status" IN ('local', 'pending', 'syncing', 'synced', 'failed'));
