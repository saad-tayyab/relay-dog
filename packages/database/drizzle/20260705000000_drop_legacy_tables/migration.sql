-- Drop legacy tables no longer managed by Drizzle ORM.
-- health_checks: replaced by relay_discoveries (monitorPubkey='self' for on-demand checks)
-- monitoring_jobs: replaced by NIP-66 passive ingestor (nip66Ingestor.ts)
DROP TABLE IF EXISTS health_checks CASCADE;
DROP TABLE IF EXISTS monitoring_jobs CASCADE;
