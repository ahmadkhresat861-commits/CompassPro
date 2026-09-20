import { useEffect } from 'react';

const SITE_NAME = 'CompassPro';
const SITE_URL = 'https://edu-course-platform-two.vercel.app';

function setMetaByAttr(attrName, attrValue, content) {
  if (!content) return;

  let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

/**
 * useSEO — sets document.title, meta description, Open Graph,
 * Twitter Card, and canonical URL for the current page.
 *
 * path should be the route path starting with "/", e.g. "/courses".
 */
export function useSEO({ title, description, path, structuredData }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    setMetaByAttr('name', 'description', description);
    setMetaByAttr('property', 'og:title', fullTitle);
    setMetaByAttr('property', 'og:description', description);
    setMetaByAttr('property', 'og:site_name', SITE_NAME);
    setMetaByAttr('name', 'twitter:title', fullTitle);
    setMetaByAttr('name', 'twitter:description', description);

    const canonicalUrl = path ? `${SITE_URL}${path}` : SITE_URL;

    setMetaByAttr('property', 'og:url', canonicalUrl);

    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalUrl);

    // Structured data (Schema.org JSON-LD)
    let ldTag = document.getElementById('seo-structured-data');

    if (structuredData) {
      if (!ldTag) {
        ldTag = document.createElement('script');
        ldTag.type = 'application/ld+json';
        ldTag.id = 'seo-structured-data';
        document.head.appendChild(ldTag);
      }
      ldTag.textContent = JSON.stringify(structuredData);
    } else if (ldTag) {
      ldTag.remove();
    }
  }, [title, description, path, structuredData]);
}
