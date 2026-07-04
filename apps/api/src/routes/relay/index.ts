import { Hono } from 'hono';
import crudRoutes from './crud';
import discoverRoutes from './discover';
import healthRoutes from './health';
import lookupRoutes from './lookup';
import popularityRoutes from './popularity';

const relayRoutes = new Hono();

// Mount sub-route modules — order matters for path matching
relayRoutes.route('/', lookupRoutes);
relayRoutes.route('/', crudRoutes);
relayRoutes.route('/', healthRoutes);
relayRoutes.route('/', discoverRoutes);
relayRoutes.route('/', popularityRoutes);

export default relayRoutes;
