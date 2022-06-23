import { isValidUuid } from '../../utils/utils.js';
import caasTags from '../caas-config/caas-tags.js';

const isKeyValPair = /(\w+\s?:\s?\w+)/g;
const isBoolText = (s) => s === 'true' || s === 'false';

const isValidUrl = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;

const getMetaContent = (propType, propName) => {
  const metaEl = document.querySelector(`meta[${propType}='${propName}']`);
  if (!metaEl) return undefined;
  return metaEl.content;
};

const findTagByTitle = (tags, title, ignore = []) => {
  const childTags = [];
  const lowerTitle = title.toLowerCase();
  let matchingTag = Object.values(tags).find((tag) => {
    if (ignore.includes(tag.title)) return false;

    if (tag.tags && Object.keys(tag.tags).length) {
      childTags.push(tag.tags);
    }

    if (tag.title.toLowerCase() === lowerTitle) {
      return true;
    }
    return false;
  });

  if (!matchingTag) {
    childTags.some((childTag) => {
      matchingTag = findTagByTitle(childTag, title, ignore);
      return matchingTag;
    });
  }

  return matchingTag;
};

const getTag = (tagName) => {
  if (tagName.includes('caas/') || tagName.includes('cq:tags')) {
    return tagName;
  }

  const rootTags = caasTags.namespaces.caas.tags;
  // search all except Events first
  return findTagByTitle(rootTags, tagName, ['Events']) || findTagByTitle(rootTags.events.tags, tagName, []);
};

console.log(getTag('Adobe Live'))

/** card metadata props
 * r = required ( 0 == false, 1 == true), v = validation function, d = default value */
const props = {
  arbitrary: {
    r: 0,
    v: (s) => {
      s.split(',')
        .filter((v) => v.length)
        .every((v) => isKeyValPair.test(v));
    },
  },
  badges: {
    r: 0,
    v: (s) => {
      s.split(',')
        .filter((v) => v.length)
        // TODO: restrict to 'text' && 'image' for key
        .every((v) => isKeyValPair.test(v));
    },
  },
  'bm-action': { r: 0 },
  'bm-enabled': {
    r: 0,
    v: isBoolText,
  },
  'bm-icon': { r: 0 },
  contenttype: {
    r: 1,
    d: () => (getMetaContent('property', 'og:type') || 'Article'),
  },
  country: { r: 0 },
  created: {
    r: 1,
    d: () => getMetaContent('name', 'publication-date') || '',
  },
  'cta1-icon': { r: 0 },
  'cta1-style': { r: 0 },
  'cta1-text': { r: 0 },
  'cta1-url': { r: 0 },
  'cta2-icon': { r: 0 },
  'cta2-style': { r: 0 },
  'cta2-text': { r: 0 },
  'cta2-url': { r: 0 },
  description: {
    r: 1,
    d: () => getMetaContent('name', 'description') || '',
  },
  details: { r: 0 },
  'entity-id': {
    r: 1,
    v: (s) => isValidUuid(s),
  },
  'ev-dur': { r: 0 },
  'ev-end': { r: 0 },
  'ev-start': { r: 0 },
  'fg-color': {
    r: 0,
    d: () => 'default',
  },
  headline: { r: 0 },
  lang: { r: 0 },
  modified: { r: 0 }, // TODO: Will this be available on every page
  origin: { r: 1 },
  'play-url': { r: 0 },
  'primary-tag': { r: 1, d: () => 'article' },
  style: { r: 0, d: () => 'default' },
  tags: {
    r: 0, // ??
    d: async () => {
      const tags = [...document.querySelectorAll('meta[property=\'article:tag\']')]
        .map((metaEl) => metaEl.content);

      return tags;
    },
  },
  'thumb-alt': { r: 0 },
  'thumb-url': { r: 0 },
  title: {
    r: 1,
    d: () => getMetaContent('property', 'og:title') || '',
  },
  uci: { r: 1 },
  url: {
    r: 1,
    d: () => getMetaContent('property', 'og:url') || (window.location.origin + window.location.pathname),
  },
};

// TODO: verification
const getCaaSMetadata = (config = {}) => {
  const md = {};
  Object.entries(props).forEach(([key, conf]) => {
    if (config[key] !== undefined) {
      md[key] = config[key];
    } else if (conf.d) {
      md[key] = conf.d();
    }
  });
  return md;
};

export default getCaaSMetadata;
