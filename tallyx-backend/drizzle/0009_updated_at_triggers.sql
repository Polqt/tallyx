-- Postgres function that sets updated_at to now() on every row update.
-- Applied as a trigger to all tables that carry an updated_at column so that
-- any UPDATE which forgets .set({ updatedAt: new Date() }) is still correct.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint
CREATE OR REPLACE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

--> statement-breakpoint
CREATE OR REPLACE TRIGGER stores_set_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

--> statement-breakpoint
CREATE OR REPLACE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

--> statement-breakpoint
CREATE OR REPLACE TRIGGER credits_set_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
