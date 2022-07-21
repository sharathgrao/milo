import getUuid from '../../libs/utils/getUuid.js';
import caasTags from '../../libs/blocks/caas-config/caas-tags.js';

const isKeyValPair = /(\s*\w+\s*:\s*\w+\s*)/;
const isBoolText = (s) => s === 'true' || s === 'false';
const isValidDate = (d) => d instanceof Date && !isNaN(d);
const isValidUrl = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;

let errors = [];
const addError = (s) => errors.push(s);

const getMetaContent = (propType, propName) => {
  const metaEl = document.querySelector(`meta[${propType}='${propName}']`);
  if (!metaEl) return undefined;
  return metaEl.content;
};

// Case-insensitive search through tag name, path, id and title for the searchStr
const findTag = (tags, searchStr, ignore = []) => {
  const childTags = [];
  let matchingTag = Object.values(tags).find((tag) => {
    if (ignore.includes(tag.title)
      || ignore.includes(tag.name)
      || ignore.includes(tag.path)
      || ignore.includes(tag.tagID)) return false;

    if (tag.tags && Object.keys(tag.tags).length) {
      childTags.push(tag.tags);
    }

    const tagMatches = [
      tag.title.toLowerCase(),
      tag.name,
      tag.path,
      tag.path.replace('/content/cq:tags/', ''),
      tag.tagID,
    ];

    if (tagMatches.includes(searchStr.toLowerCase())) return true;

    // if (tag.title.toLowerCase() === lowerSearch
    //   || tag.name === lowerSearch
    //   || tag.path === lowerSearch
    //   || tag.path.replace('/content/cq:tags/', '') === lowerSearch
    //   || tag.tagID === lowerSearch) return true;

    return false;
  });

  if (!matchingTag) {
    childTags.some((childTag) => {
      matchingTag = findTag(childTag, searchStr, ignore);
      return matchingTag;
    });
  }

  return matchingTag;
};

const getTag = (tagName) => {
  if (!tagName) return undefined;
  const rootTags = caasTags.namespaces.caas.tags;
  // search all except Events first
  const tag = findTag(rootTags, tagName, ['Events'])
    || findTag(rootTags.events.tags, tagName, []);

  if (!tag) {
    addError(`Tag not found: ${tagName}`);
  }

  return tag;
};

const getTags = (s) => {
  let tags = [];
  if (s) {
    tags = s.split(',').map((t) => t.trim());
  } else {
    tags = [...document.querySelectorAll("meta[property='article:tag']")].map(
      (metaEl) => metaEl.content,
    );
  }

  return tags.map((tag) => getTag(tag))
    .filter((tag) => tag !== undefined)
    .map((tag) => ({ id: tag.tagID }));
};

console.log(caasTags.namespaces.caas.tags);

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

const getDateProp = (dateStr, errorMsg) => {
  if (!dateStr) return undefined;
  try {
    return new Date(dateStr).toISOString();
  } catch (e) {
    addError(errorMsg);
  }
  return undefined;
};

/** card metadata props - either a func that computes the value or 0 to use the string as is */
const props = {
  arbitrary: (s) => getKeyValPairs(s).map((pair) => ({ type: pair.key, value: pair.value })),
  badges: (s) => getKeyValPairs(s).map((pair) => ({ [pair.key]: pair.value })),
  bookmarkAction: 0,
  bookmarkEnabled: (s) => {
    if (s) {
      const lcs = s.toLowerCase();
      if (isBoolText(lcs)) return lcs;
      addError(`Invalid value for bookmarkEnabled - must be "true" or "false". Got: ${s}`);
    }
    return undefined;
  },
  bookmarkIcon: 0,
  contentId: 0, // TODO
  contentType: (s) => s || getMetaContent('property', 'og:type') || 'Article',
  // TODO - automatically get country
  country: (s) => s || 'us',
  created: (s) => (s
    ? isValidDate(s)
    : getMetaContent('name', 'publication-date') || new Date().toISOString()),
  cta1Icon: 0,
  cta1Style: 0,
  cta1Text: 0,
  cta1Url: (s, options) => s || options.prodUrl
    || (window.location.origin + window.location.pathname),
  cta2Icon: 0,
  cta2Style: 0,
  cta2Text: 0,
  cta2Url: 0,
  description: (s) => s || getMetaContent('name', 'description') || '',
  details: 0,
  entityId: (_, options) => getUuid(options.prodUrl),
  env: (s) => s || '',
  eventDuration: 0,
  eventEnd: (s) => getDateProp(s, `Invalid Event End Date: ${s}`),
  eventStart: (s) => getDateProp(s, `Invalid Event Start Date: ${s}`),
  floodgateColor: (s) => s || 'default',
  headline: 0,
  // TODO: automatically get lang
  lang: (s) => s || 'en',
  modified: (s) => (s
    ? getDateProp(s, `Invalid Event End Date: ${s}`)
    : new Date(document.lastModified).toISOString()),
  origin: (s) => s || 'Milo',
  playUrl: 0,
  primaryTag: (s) => s || 'article',
  style: (s) => s || 'default',
  tags: (s) => getTags(s),
  thumbAlt: 0,
  thumbUrl: 0,
  title: (s) => s || getMetaContent('property', 'og:title') || '',
  uci: (s) => s || window.location.pathname,
  url: (s, options) => s || options.prodUrl
    || (window.location.origin + window.location.pathname),
};

const getCaasProps = (p) => {
  const caasProps = ({
    entityId: p.entityId,
    contentId: p.contentId,
    contentType: p.contentType,
    environment: p.env,
    url: p.url,
    floodGateColor: p.floodgateColor,
    universalContentIdentifier: p.uci,
    title: p.title,
    description: p.description,
    createdDate: p.created,
    modifiedDate: p.modified,
    tags: p.tags,
    // TODO
    primaryTag: { id: 'adobe-com-enterprise:product/commerce-cloud' },
    ...(p.thumbUrl && {
      thumbnail: {
        altText: p.thumbAlt,
        url: p.thumbUrl,
      },
    }),
    country: p.country,
    language: p.lang,
    cardData: {
      style: p.style,
      headline: p.headline || p.title,
      ...(p.details && { details: p.details }),
      ...((p.bookmarkEnabled || p.bookmarkIcon || p.bookmarkAction) && {
        bookmark: {
          enabled: p.bookmarkEnabled,
          bookmarkIcon: p.bookmarkIcon,
          action: p.bookmarkAction,
        },
      }),
      badges: p.badges,
      ...(p.playUrl && { playUrl: p.playUrl }),
      cta: {
        primaryCta: {
          text: p.cta1Text,
          url: p.cta1Url,
          style: p.cta1Style,
          icon: p.cta1Icon,
        },
        ...(p.cta2Url && {
          secondaryCta: {
            text: p.cta2Text,
            url: p.cta2Url,
            style: p.cta2Style,
            icon: p.cta2Icon,
          },
        }),
      },
      ...((p.eventDuration || p.eventStart || p.eventEnd) && {
        event: {
          duration: p.eventDuration,
          startDate: p.eventStart,
          endDate: p.eventEnd,
        },
      }),
    },
    origin: p.origin,
    ...(p.arbitrary?.length && { arbitrary: p.arbitrary }),
  });
  return caasProps;
};

const getCaaSMetadata = async (pageMd, options) => {
  const md = {};
  // for-of required to await any async computeVal's
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, computeVal] of Object.entries(props)) {
    // eslint-disable-next-line no-await-in-loop
    const val = computeVal ? await computeVal(pageMd[key], options) : pageMd[key];
    if (val !== undefined) md[key] = val;
  }
  return md;
};

const getCardMetadata = async (options) => {
  const pageMd = {};
  const mdEl = document.querySelector('.card-metadata');
  if (mdEl) {
    mdEl.childNodes.forEach((n) => {
      const key = n.children[0]?.textContent.toLowerCase();
      const val = n.children[1]?.textContent.toLowerCase();
      if (!key) return;

      pageMd[key] = val;
    });
  }
  const cassMetadata = await getCaaSMetadata(pageMd, options);
  return cassMetadata;
};

const publishToCaaS = async (prodHost, sidekick) => {
  errors = [];
  const options = { prodUrl: `${prodHost}${window.location.pathname}` };
  const md = await getCardMetadata(options);
  if (errors.length) {
    errors.unshift('There were problems with the following:');
    errors.push('Publishing to CaaS aborted, please fix errors and try again.');
    sidekick.showModal(errors, true);
    return;
  }
  const propsObj = getCaasProps(md);
  console.log(md)
  console.log(propsObj);

};

export default publishToCaaS;
