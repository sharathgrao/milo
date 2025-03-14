import { makeRelative, loadScript, getConfig } from '../../utils/utils.js';
import {
  throttle,
  parseValue,
  hasPropertyCI,
  propertyNameCI,
  propertyValueCI,
  formatExcelDate,
} from './utils.js';
import getTheme from './chartLightTheme.js';
import { replaceKey } from '../../features/placeholders.js';

export const SMALL = 'small';
export const MEDIUM = 'medium';
export const LARGE = 'large';
export const DESKTOP_BREAKPOINT = 1200;
export const TABLET_BREAKPOINT = 600;
export const colorPalette = {
  seafoam: '#0FB5AE',
  orange: '#F68511',
  indigo: '#4046CA',
  purple: '#7326D3',
  blue: '#147AF3',
  lime: '#72E06A',
  lavender: '#7E84FA',
  magenta: '#DE3D82',
  green: '#008F5D',
  copper: '#CB5D00',
  yellow: '#E8C600',
  chartreuse: '#BCE931',
};
const SECTION_CLASSNAME = 'chart-section';
const chartTypes = [
  'bar',
  'column',
  'line',
  'area',
  'list',
  'donut',
  'pie',
  'oversized-number',
];

export function processDataset(data) {
  const dataset = {};
  const optionalHeaders = ['unit', 'group', 'color'];
  const headers = data?.[0];
  const unitKey = headers ? propertyNameCI(headers, 'unit') : null;
  const units = headers?.[unitKey]?.split('-') || [];
  const cleanHeaders = Object.keys(headers).filter((header) => (
    !optionalHeaders.includes(header.toLowerCase())
  ));
  dataset.source = [cleanHeaders];

  // Use headers to set source
  data.forEach((element) => {
    let values = [];

    if (units[0] === 'date') {
      values = cleanHeaders.map((column, index) => (
        index ? parseValue(element[column]) : formatExcelDate(element[column])
      ));
    } else {
      values = cleanHeaders.map((column) => parseValue(element[column]));
    }

    dataset.source.push(values);
  });

  return { dataset, headers, units };
}

export function processMarkData(series, xAxisType) {
  const seriesOptions = series.reduce((options, mark) => {
    options[mark.Type] ??= { data: [] };

    const markData = options[mark.Type].data;
    const split = mark.Value?.split('-');
    const value = xAxisType === 'date' && mark.Axis === 'xAxis' ? formatExcelDate(split[0]) : parseValue(split[0]);
    const markObject = {
      ...(mark.Name ? { name: mark.Name } : {}),
      ...(mark.Axis ? { [mark.Axis]: value } : {}),
    };

    if (mark.Type === 'markArea') {
      markData[0] ??= [];
      markData[0].push(markObject);

      if (split.length > 1) {
        const endRangeValue = xAxisType === 'date' && mark.Axis === 'xAxis' ? formatExcelDate(split[1]) : parseValue(split[1]);

        markData[0].push((mark.Axis ? { [mark.Axis]: endRangeValue } : {}));
      }
    } else {
      markData.push(markObject);
    }

    return options;
  }, {});

  if (seriesOptions.markLine) {
    seriesOptions.markLine.label = {
      show: false,
      formatter: '{b}',
      position: 'insideStartBottom',
    };
    seriesOptions.markLine.emphasis = { label: { show: true } };
  }

  if (seriesOptions.markArea) {
    seriesOptions.markArea.label = { show: false };
    seriesOptions.markArea.emphasis = {
      label: {
        show: true,
        position: 'top',
        distance: 0,
      },
    };
  }

  return seriesOptions;
}

export async function fetchData(link) {
  const path = makeRelative(link.href);
  const resp = await fetch(path.toLowerCase());

  if (!resp.ok) return {};

  const json = await resp.json();
  return json;
}

export function chartData(json) {
  const data = {};
  // Check the type of data
  if (json[':type'] === 'multi-sheet') {
    const dataSheet = json[':names'].includes('data') ? 'data' : json[':names'].shift();
    const seriesSheet = json[':names'].filter((name) => name !== 'data').shift();
    data.data = json[dataSheet]?.data;
    data.series = json[seriesSheet]?.data;
  } else {
    data.data = json.data;
    data.series = [];
  }
  return data;
}

export const barTooltipFormatter = ({
  seriesName,
  marker,
  value,
  encode: { x = [] },
  name,
} = {}, unit = '') => (
  `${seriesName}<br />${marker} ${value[x[0]]}${unit} ${name}<i class="tooltip-icon"></i>`
);

export const donutTooltipFormatter = ({
  marker,
  data,
  encode: { value = [] },
  name,
  percent,
} = {}, unit = '') => (
  `${marker} ${name}<br />${data[value[0]]}${unit} ${percent}%<i class="tooltip-icon"></i>`
);

export const pieTooltipFormatter = ({
  marker,
  data,
  encode: { value = [] },
  name,
} = {}, unit = '') => (
  `${name}<br />${marker} ${data[value[0]]}${unit}<i class="tooltip-icon"></i>`
);

export const tooltipFormatter = (params, units) => {
  const hasUnit2 = typeof units[1] !== 'undefined';
  let tooltip = params[0].name;
  params.forEach(({
    marker,
    value,
    encode: { y = [] },
    seriesName,
    seriesIndex,
  } = {}) => {
    const unit = hasUnit2 ? units[seriesIndex] : units[0];
    tooltip += `<br />${marker} ${value[y[0]]}${unit} ${seriesName}`;
  });
  tooltip += '<i class="tooltip-icon"></i>';
  return tooltip;
};

export const barSeriesOptions = (chartType, hasOverride, firstDataset, colors, size, units) => {
  const isLarge = size === LARGE;
  const isBar = chartType === 'bar';

  return firstDataset.map((value, index) => ({
    type: 'bar',
    label: {
      show: isBar,
      formatter: `{@[${index + 1}]}${units[0]}`,
      position: 'right',
      textBorderColor: '#000',
      distance: 8,
      fontSize: isLarge ? 16 : 14,
    },
    colorBy: hasOverride ? 'data' : 'series',
    showBackground: isBar,
    backgroundStyle: {
      color: colors[index],
      borderRadius: 3,
      opacity: 0.35,
    },
    itemStyle: { borderRadius: 3 },
    barCategoryGap: isBar ? 0 : '33.3%',
    barGap: '33.3%',
    yAxisIndex: typeof units[1] !== 'undefined' ? index : 0,
  }));
};

export const lineSeriesOptions = (series, firstDataset, units, xAxisType) => {
  const marks = processMarkData(series, xAxisType);

  return firstDataset.map((value, index) => {
    let options = {
      type: 'line',
      symbol: 'none',
      lineStyle: { width: 3 },
      yAxisIndex: typeof units[1] !== 'undefined' ? index : 0,
    };

    if (index === 0 && marks) {
      options = { ...options, ...marks };
    }

    return options;
  });
};

export const areaSeriesOptions = (firstDataset) => (
  firstDataset.map(() => ({
    type: 'line',
    symbol: 'none',
    areaStyle: { opacity: 1 },
    stack: 'area',
  }))
);

const donutTitleFormatter = (label, unit = '', title = '') => [`{a|${label?.toLocaleString()}${unit}}`, `{b|${title}}`].join('\n');

export const setDonutTitle = (chart, label, unit = '', title = '') => {
  chart.setOption({ title: { text: donutTitleFormatter(label, unit, title) } });
};

export const handleDonutSelect = (source, selected, chart, unit, title) => {
  const selectedSum = source.reduce((total, current) => {
    if (selected[current[1]]) return total + current[0];
    return total;
  }, 0);
  setDonutTitle(chart, selectedSum, unit, title);

  return selectedSum;
};

export const donutTitleOptions = (source, seriesData, unit, size) => {
  // Remove header names
  const sourceData = (source && source[0].every((i) => typeof i === 'string')) ? source.slice(1) : source;
  const sum = sourceData?.reduce((total, current) => total + current[0], 0);
  const firstSeries = seriesData?.[0];
  const title = firstSeries ? propertyValueCI(firstSeries, 'title') : '';
  const sizeLarge = size === LARGE;
  const sizeSmall = size === SMALL;

  return {
    show: true,
    left: 'center',
    bottom: sizeSmall ? '48%' : '46%',
    text: donutTitleFormatter(sum, unit, title),
    textStyle: {
      rich: {
        a: {
          fontSize: sizeLarge ? 64 : 44,
          lineHeight: sizeLarge ? 80 : 55,
          fontWeight: 'bolder',
        },
        b: {
          fontSize: sizeLarge ? 28 : 20,
          lineHeight: sizeLarge ? 32 : 30,
          fontWeight: sizeLarge ? 'bold' : 'normal',
        },
      },
      color: '#000',
    },
  };
};

export const donutSeriesOptions = (size) => [{
  type: 'pie',
  radius: ['70%', '90%'],
  avoidLabelOverlap: true,
  height: size === SMALL ? '90%' : 'auto',
  silent: false,
  label: { show: false },
  labelLine: { show: false },
  emphasis: { label: { show: false } },
  center: ['50%', '46%'],
}];

export const pieSeriesOptions = (size) => {
  const isSmall = size === SMALL;

  return [{
    type: 'pie',
    radius: isSmall ? '90%' : '80%',
    height: isSmall ? '90%' : 'auto',
    silent: false,
    label: {
      show: !isSmall,
      fontSize: '16px',
      fontWeight: 'normal',
      color: '#2c2c2c',
      bleedMargin: 0,
    },
    labelLine: {
      length: 10,
      length2: 10,
    },
    center: ['50%', '46%'],
  }];
};

/**
 * Returns object of echart options
 * @param {string} chartType
 * @param {object} dataset
 * @param {object} series
 * @param {array} headers
 * @param {array} colors
 * @param {string} size
 * @param {array} units
 * @returns {object}
 */
export const getChartOptions = (chartType, dataset, series, headers, colors, size, units = []) => {
  const hasOverride = headers ? hasPropertyCI(headers, 'color') : false;
  const xAxisType = units[0] === 'date' ? units[0] : '';
  const source = dataset?.source;
  const firstDataset = source?.[1]?.slice() || [];
  const isBar = chartType === 'bar';
  const isColumn = chartType === 'column';
  const isPie = chartType === 'pie';
  const isDonut = chartType === 'donut';

  if (xAxisType) {
    units.shift();
  }

  firstDataset.shift();

  return {
    dataset,
    color: colors,
    legend: {
      show: true,
      inactiveColor: '#6C6C6C',
      type: 'scroll',
    },
    title: isDonut ? donutTitleOptions(source, series, units[0], size) : {},
    tooltip: {
      show: true,
      formatter: ((params) => {
        if (isBar) return barTooltipFormatter(params, units[0]);
        if (isPie) return pieTooltipFormatter(params, units[0]);
        if (isDonut) return donutTooltipFormatter(params, units[0]);
        return tooltipFormatter(params, units);
      }),
      trigger: isBar || isPie || isDonut ? 'item' : 'axis',
      axisPointer: { type: isColumn ? 'none' : 'line' },
    },
    xAxis: {
      type: isBar ? 'value' : 'category',
      axisLabel: { show: !isBar },
      axisTick: { show: !isBar },
      max: (value) => {
        if (!isBar) return null;
        // This adds extra space on xAxis so labels will fit
        const extraSpace = 1;
        return Math.ceil((value.max + (value.max * extraSpace)) / 10) * 10;
      },
      boundaryGap: isColumn,
    },
    yAxis: (() => (
      units.map((unit) => (
        {
          type: isBar ? 'category' : 'value',
          axisLabel: {
            show: !isBar,
            formatter: (params) => `${params}${unit}`,
            padding: 0,
          },
          axisTick: { show: !isBar },
          alignTicks: true,
        }
      ))
    ))(),
    series: (() => {
      if (isBar || isColumn) {
        return barSeriesOptions(chartType, hasOverride, firstDataset, colors, size, units);
      }
      if (chartType === 'line') return lineSeriesOptions(series, firstDataset, units, xAxisType);
      if (chartType === 'area') return areaSeriesOptions(firstDataset);
      if (isDonut) return donutSeriesOptions(size);
      if (isPie) return pieSeriesOptions(size);
      return [];
    })(),
  };
};

const setDonutListeners = (chart, source, seriesData, units = []) => {
  // Remove header names
  const sourceData = (source && source[0].every((i) => typeof i === 'string')) ? source.slice(1) : source;
  const sum = sourceData?.reduce((total, current) => total + current[0], 0);
  const firstSeries = seriesData?.[0];
  const title = firstSeries ? propertyValueCI(firstSeries, 'title') : '';
  let mouseOutValue = sum;

  chart.on('mouseover', (value) => setDonutTitle(chart, value?.data?.[0], units?.[0], title));
  chart.on('mouseout', () => setDonutTitle(chart, mouseOutValue, units?.[0], title));
  chart.on('legendselectchanged', ({ selected }) => { mouseOutValue = handleDonutSelect(sourceData, selected, chart, units?.[0], title); });
};

const initChart = (chartWrapper, chartType, { data, series }, colors, size) => {
  const themeName = getTheme(size);
  const { dataset, headers, units } = processDataset(data);
  const chartOptions = getChartOptions(chartType, dataset, series, headers, colors, size, units);
  const chart = window.echarts?.init(chartWrapper, themeName, { renderer: 'svg' });

  chartWrapper.tabIndex = 0;
  chart.setOption(chartOptions);

  if (chartType === 'donut') {
    setDonutListeners(chart, dataset?.source, series, units);
  }

  return chart;
};

const handleIntersect = (chartWrapper, chartType, data, colors, size) => (entries, observer) => {
  if (!Array.isArray(entries)) return;

  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      initChart(chartWrapper, chartType, data, colors, size);
      observer.unobserve(entry.target);
    }
  });
};

export const getColors = (authoredColor) => {
  const colorList = Object.values(colorPalette);

  if (!authoredColor || !Object.hasOwnProperty.call(colorPalette, authoredColor)) return colorList;

  const colorIndex = colorList.indexOf(colorPalette[authoredColor]);

  return colorList.concat(colorList.splice(0, colorIndex));
};

export const getOverrideColors = (authoredColor, data) => data.map((row) => {
  const overrideColor = propertyValueCI(row, 'color');

  return colorPalette[overrideColor || authoredColor] || Object.values(colorPalette)[0];
});

export const getResponsiveSize = (authoredSize) => {
  const width = window.innerWidth;
  let size = LARGE;

  if (width < TABLET_BREAKPOINT || authoredSize === SMALL) {
    size = SMALL;
  } else if (width < DESKTOP_BREAKPOINT || authoredSize === MEDIUM) {
    size = MEDIUM;
  }

  return size;
};

/* c8 ignore next 19 */
const handleResize = (el, authoredSize, chartType, data, colors) => {
  const currentSize = getResponsiveSize(authoredSize);
  const previousSize = el?.getAttribute('data-responsive-size');
  const previousIsLarge = previousSize === LARGE;
  const currentIsLarge = currentSize === LARGE;
  const chartWrapper = el?.querySelector('.chart-wrapper');
  const chartInstance = window.echarts?.getInstanceByDom(chartWrapper);

  if (currentSize !== previousSize) {
    el.setAttribute('data-responsive-size', currentSize);
  }

  if (previousIsLarge !== currentIsLarge) {
    chartInstance?.dispose();
    initChart(chartWrapper, chartType, data, colors, currentSize);
  } else {
    chartInstance?.resize();
  }
};

export const getOversizedNumberSize = (charLength) => {
  let fontSize = 240; // max font size, for 1 char
  let titleY = 60; // vertical alignment by percent
  let subtitleY = 70; // vertical alignment by percent

  if (charLength > 0 && charLength <= 6) {
    // Decrease the font size by 30 for every additional character
    fontSize -= 30 * (charLength - 1);
  } else {
    fontSize = 90;
  }

  // Reduce the vertical spacing for small font sizes
  if (fontSize <= 100) {
    titleY -= 5;
    subtitleY -= 5;
  }

  return [fontSize, titleY, subtitleY];
};

const init = (el) => {
  const children = el?.querySelectorAll(':scope > div');
  const chartWrapper = children[2]?.querySelector(':scope > div');
  children[0]?.classList.add('title');
  children[1]?.classList.add('subtitle');
  children[2]?.classList.add('chart-container');
  children[3]?.classList.add('footnote');
  chartWrapper?.classList.add('chart-wrapper');

  const chartStyles = el?.classList;
  const section = el?.parentElement?.matches('.section') ? el.parentElement : null;
  const sectionChildren = section?.querySelectorAll(':scope > div:not(.section-metadata)');
  const upNumber = sectionChildren?.length;
  section?.classList.add(`up-${upNumber}`);
  section?.classList.add(SECTION_CLASSNAME);

  let authoredSize = SMALL;
  if (upNumber === 1) authoredSize = LARGE;
  if (upNumber === 2) authoredSize = MEDIUM;

  const size = getResponsiveSize(authoredSize);
  el.classList.add(authoredSize);
  el.setAttribute('data-responsive-size', size);

  const chartType = chartTypes?.find((type) => el?.className?.indexOf(type) !== -1);
  const dataLink = chartWrapper?.querySelector('a[href$="json"]');

  dataLink?.remove();

  if (!chartType || !chartWrapper || !dataLink) return;

  const authoredColor = Array.from(chartStyles)?.find((style) => style in colorPalette);

  if (chartType === 'list') {
    // Must use chained promise. Await will cause loading issues
    Promise.all([fetchData(dataLink), import('./list.js')])
      .then(([json, { default: initList }]) => {
        initList(chartWrapper, json, colorPalette[authoredColor]);
      })
      .catch((error) => console.log('Error loading script:', error));
    return;
  }

  if (chartType === 'oversized-number') {
    // Must use chained promise. Await will cause loading issues
    fetchData(dataLink)
      .then((json) => {
        const data = json?.data?.[0];
        const number = data?.number;
        const [fontSize, titleY, subtitleY] = getOversizedNumberSize(number?.length);

        const html = `<svg viewBox="0 0 430 430">
            <circle cx="50%" cy="50%" r="50%" fill="${colorPalette[authoredColor]}" />
            <text x="50%" y="${titleY}%" class="number" font-size="${fontSize}px">${number}</text>
            <text x="50%" y="${subtitleY}%" class="subtitle">${data?.subtitle}</text>
        </svg>`;

        chartWrapper.innerHTML = html;
      })
      .catch((error) => console.log('Error loading script:', error));
    return;
  }

  const config = getConfig();
  const base = config.miloLibs || config.codeRoot;

  // Must use chained promise. Await will cause loading issues
  Promise.all([fetchData(dataLink), loadScript(`${base}/deps/echarts.common.min.js`)])
    .then(async (values) => {
      const json = values[0];
      const data = chartData(json);

      if (!data) return;

      const hasOverride = hasPropertyCI(data?.data[0], 'color');
      const colors = hasOverride
        ? getOverrideColors(authoredColor, data.data)
        : getColors(authoredColor);

      if (!(window.IntersectionObserver)) {
        initChart(chartWrapper, chartType, data, colors, size);
      } else {
        /* c8 ignore next 12 */
        const observerOptions = {
          root: null,
          rootMargin: '0px',
          threshold: 0.5,
        };

        const observer = new IntersectionObserver(
          handleIntersect(chartWrapper, chartType, data, colors, size),
          observerOptions,
        );
        observer.observe(el);
      }

      const title = children[0]?.textContent.trim() || children[1]?.textContent.trim();
      chartWrapper.setAttribute('aria-label', `${await replaceKey(`${chartType}-chart`, config)}: ${title}`);

      window.addEventListener('resize', throttle(
        1000,
        () => handleResize(el, authoredSize, chartType, data, colors),
      ));
    })
    .catch((error) => console.log('Error loading script:', error));
};

export default init;
