import { Helmet } from 'react-helmet-async';

const SITE_NAME  = 'JD Virtual Store';
const SITE_URL   = 'https://jd-virtual.vercel.app';
const DEFAULT_IMG = `${SITE_URL}/icons/icon-512.png`;
const DEFAULT_DESC = 'Maquillaje y skincare de marcas auténticas con envíos a todo Costa Rica desde El Roble, Puntarenas.';

export default function SEO({ title, description, image, url, type = 'website', product }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Maquillaje & Skincare | Costa Rica`;
  const desc  = description || DEFAULT_DESC;
  const img   = image || DEFAULT_IMG;
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:type"        content={type} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image"       content={img} />
      <meta property="og:locale"      content="es_CR" />

      {/* Twitter */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={img} />

      {/* Product structured data (JSON-LD) */}
      {product && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description || desc,
            image: img,
            brand: { '@type': 'Brand', name: product.brand },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'CRC',
              price: product.price,
              availability: product.stock === 0
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/InStock',
              seller: { '@type': 'Organization', name: SITE_NAME },
            },
          })}
        </script>
      )}
    </Helmet>
  );
}
