import { useQuery } from '@tanstack/react-query';
import { customerBrandsAPI } from '../services/endpoints';
import {
  emptyBrandProfile,
  isBrandProfileEmpty,
  normalizeBrandProfile,
} from '../services/brandProfileUtils';
import { useAuth } from './useAuth';

export const useBrandProfile = () => {
  const { brandId } = useAuth();

  const query = useQuery({
    queryKey: ['brand-profile', brandId],
    enabled: Boolean(brandId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await customerBrandsAPI.getById(brandId);
      return normalizeBrandProfile(response?.data, brandId);
    },
  });

  const profile = query.data || {
    ...emptyBrandProfile,
    brandId: brandId || '',
  };

  return {
    ...query,
    brandId: brandId || '',
    profile,
    isMissingBrandId: !brandId,
    isEmpty: Boolean(brandId) && !query.isLoading && !query.isError && isBrandProfileEmpty(profile),
  };
};

export default useBrandProfile;
