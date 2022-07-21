import getUuid from '../../libs/utils/getUuid.js';
import caasTags from '../caas-config/caas-tags.js';

const isKeyValPair = /(\s*\w+\s*:\s*\w+\s*)/;
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
  return (
    findTagByTitle(rootTags, tagName, ['Events'])
    || findTagByTitle(rootTags.events.tags, tagName, [])
  );
};

const getKeyValPairs = (s) => {
  if (!s) return [];
  return s.split(',')
    .filter((v) => v.length)
    .filter((v) => isKeyValPair.test(v))
    .map((v) => {
      const [key, ...value] = v.split(':');
      return {
        key: key.trim(),
        value: value.join(':').trim(),
      };
    });
};

const generateEntityId = () => {

};

/** card metadata props - either a func that computes the value or 0 to use the string as is */
const props = {
  arbitrary: (s) => getKeyValPairs(s).map((pair) => ({ type: pair.key, value: pair.value })),
  badges: (s) => getKeyValPairs(s).map((pair) => ({ [pair.key]: pair.value })),
  'bm-action': 0,
  'bm-enabled': (s) => (s && isBoolText(s) ? s : ''),
  'bm-icon': 0,
  contenttype: (s) => s || getMetaContent('property', 'og:type') || 'Article',
  country: 0,
  created: (s) => s || getMetaContent('name', 'publication-date') || '',
  'cta1-icon': 0,
  'cta1-style': 0,
  'cta1-text': 0,
  'cta1-url': (s) => s || getMetaContent('property', 'og:url') || (window.location.origin + window.location.pathname),
  'cta2-icon': 0,
  'cta2-style': 0,
  'cta2-text': 0,
  'cta2-url': 0,
  description: (s) => s || getMetaContent('name', 'description') || '',
  details: 0,
  'entity-id': (s) => s || generateEntityId(),
  'ev-dur': 0,
  'ev-end': 0,
  'ev-start': 0,
  'fg-color': (s) => s || 'default',
  headline: 0,
  lang: 0,
  modified: 0, // TODO: Will this be available on every page
  origin: (s) => s || 'Milo',
  'play-url': 0,
  'primary-tag': (s) => s || 'article',
  style: (s) => s || 'default',
  tags: {
    d: async () => {
      const tags = [...document.querySelectorAll("meta[property='article:tag']")].map(
        (metaEl) => metaEl.content,
      );

      return tags;
    },
  },
  'thumb-alt': 0,
  'thumb-url': 0,
  title: (s) => s || getMetaContent('property', 'og:title') || '',
  uci: (s) => s || window.location.pathname,
  url: (s) => s || getMetaContent('property', 'og:url') || (window.location.origin + window.location.pathname),
};

const i = props;

const sendProps = () => {};

const caasProps = {
  entityId: i['entity-id'],
  contentId: i.contentid,
  contentType: i.contenttype,
  environment: i.env,
  url: i.url,
  floodGateColor: i['fg-color'],
  universalContentIdentifier: i.uci,
  title: i.title,
  description: i.description,
  createdDate: i.created,
  modifiedDate: i.modified,
  tags: i.tags,
  primaryTag: { id: 'adobe-com-enterprise:product/commerce-cloud' },
  thumbnail: {
    altText: i['thumb-alt'],
    url: i['thumb-url'],
  },
  country: i.country,
  language: i.lang,
  cardData: {
    style: i.style,
    headline: i.headline,
    details: i.details,
    bookmark: {
      enabled: i['bm-enabled'],
      icon: i['bm-icon'],
      action: i['bm-action'],
    },
    badges: i.badges,
    playUrl: i['play-url'],
    cta: {
      primaryCta: {
        text: i['cta1-text'],
        url: i['cta1-url'],
        style: i['cta1-style'],
        icon: i['cta1-icon'],
      },
      secondaryCta: {
        text: i['cta2-text'],
        url: i['cta2-url'],
        style: i['cta2-style'],
        icon: i['cta2-icon'],
      },
    },
    event: {
      duration: i['ev-dur'],
      startDate: i['ev-start'],
      endDate: i['ev-end'],
    },
  },
  origin: i.origin,
  arbitrary: i.arbitrary,
};

const getCaaSMetadata = (pageMd = {}) => {
  const md = {};
  Object.entries(props).forEach(([key, computeVal]) => {
    md[key] = computeVal ? computeVal(pageMd[key]) : pageMd[key] || '';
  });
  return md;
};

export default getCaaSMetadata;
