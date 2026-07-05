import { resolveBundleId, bundleIdVariants } from '@gulfos/shared';

/** Resolve bundle ID and return MongoDB query filter for bundleId field */
export function bundleIdFilter(bundleId: string): { bundleId: { $in: string[] } } {
  return { bundleId: { $in: bundleIdVariants(resolveBundleId(bundleId)) } };
}

export { resolveBundleId, bundleIdVariants };
