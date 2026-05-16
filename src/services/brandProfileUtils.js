/**
 * @typedef {Object} BrandProfileResponse
 * @property {string=} brandName
 * @property {string=} brandEmail
 * @property {string=} icon
 */

/**
 * @typedef {Object} BrandProfile
 * @property {string} brandId
 * @property {string} brandName
 * @property {string} brandEmail
 * @property {string} icon
 */

const toText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

/** @type {BrandProfile} */
export const emptyBrandProfile = Object.freeze({
  brandId: '',
  brandName: '',
  brandEmail: '',
  icon: '',
});

/**
 * @param {BrandProfileResponse | { data?: BrandProfileResponse } | null | undefined} payload
 * @param {string} [brandId]
 * @returns {BrandProfile}
 */
export const normalizeBrandProfile = (payload, brandId = '') => {
  const source = payload?.data && typeof payload.data === 'object'
    ? payload.data
    : payload || {};

  return {
    brandId: toText(brandId || source.brandId),
    brandName: toText(source.brandName),
    brandEmail: toText(source.brandEmail),
    icon: toText(source.icon),
  };
};

/**
 * @param {BrandProfile | null | undefined} profile
 * @returns {boolean}
 */
export const isBrandProfileEmpty = (profile) => (
  !profile?.brandName && !profile?.brandEmail && !profile?.icon
);
