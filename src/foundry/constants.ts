// Module identity + storage keys. The Garden lives on the actor under a single
// flag (decision D19: registry on the actor too, no separate journal storage).

export const MODULE_ID = 'fungal-garden';

/** Flag key under which the { garden, registry } bundle is stored on the actor. */
export const FLAG_KEY = 'data';
