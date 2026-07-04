import { defineRelations } from 'drizzle-orm';
import {
  relayDiscovered,
  relayEvents,
  relayInfoSnapshots,
  relayListEntries,
  relays,
} from './schema';

export const relations = defineRelations(
  {
    relayDiscovered,
    relayEvents,
    relayInfoSnapshots,
    relayListEntries,
    relays,
  },
  (r) => ({
    relays: {
      infoSnapshots: r.many.relayInfoSnapshots({
        from: r.relays.id,
        to: r.relayInfoSnapshots.relayId,
      }),
      events: r.many.relayEvents({
        from: r.relays.id,
        to: r.relayEvents.relayId,
      }),
    },

    relayInfoSnapshots: {
      relay: r.one.relays({
        from: r.relayInfoSnapshots.relayId,
        to: r.relays.id,
      }),
    },

    relayEvents: {
      relay: r.one.relays({
        from: r.relayEvents.relayId,
        to: r.relays.id,
      }),
    },
  }),
);
