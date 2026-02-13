import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url,
  type = 'website' 
}: SEOProps) => {
  const fullTitle = title.includes('JEFTINO.RS') ? title : `${title} | JEFTINO.RS`;
  const defaultImage = '/og-image.png'; // We'll assume this is the hero gradient or similar
  const fullImage = image ? (image.startsWith('http') ? image : `${window.location.origin}${image}`) : `${window.location.origin}${defaultImage}`;
  const fullUrl = url ? (url.startsWith('http') ? url : `${window.location.origin}${url}`) : window.location.href;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      {keywords && <meta name='keywords' content={keywords} />}

      {/* Open Graph tags */}
      <meta property='og:type' content={type} />
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:image' content={fullImage} />
      <meta property='og:url' content={fullUrl} />
      <meta property='og:site_name' content='JEFTINO.RS' />

      {/* Twitter tags */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={fullImage} />
    </Helmet>
  );
};
