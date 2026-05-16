import { useEffect, useMemo, useState } from 'react';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';

const getInitial = (name) => {
  const trimmedName = String(name || '').trim();
  return trimmedName ? trimmedName.charAt(0).toUpperCase() : '';
};

const BrandAvatar = ({
  name = '',
  icon = '',
  alt = '',
  className = '',
  sizeClassName = 'h-12 w-12',
  roundedClassName = 'rounded-2xl',
  textClassName = 'text-base',
  iconClassName = 'h-6 w-6',
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [icon]);

  const initial = useMemo(() => getInitial(name), [name]);
  const showImage = Boolean(icon) && !imageFailed;

  if (showImage) {
    return (
      <img
        src={icon}
        alt={alt || name || 'Brand icon'}
        onError={() => setImageFailed(true)}
        className={`${sizeClassName} ${roundedClassName} shrink-0 object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] ${sizeClassName} ${roundedClassName} ${className}`}
      aria-hidden="true"
    >
      {initial ? (
        <span className={`font-semibold ${textClassName}`}>{initial}</span>
      ) : (
        <BuildingStorefrontIcon className={iconClassName} />
      )}
    </div>
  );
};

export default BrandAvatar;
