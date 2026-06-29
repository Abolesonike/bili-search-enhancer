(function() {
  'use strict';

  // ---------- 配置数据 ----------
  const TIMELINE_MIN_YEAR = 2009;

  const PARTITIONS = [
    { value: '0', label: '全部' },
    { value: '1', label: '动画' },
    { value: '3', label: '音乐' },
    { value: '4', label: '游戏' },
    { value: '5', label: '娱乐' },
    { value: '36', label: '科技' },
    { value: '160', label: '生活' },
    { value: '155', label: '时尚' },
    { value: '181', label: '影视' },
    { value: '177', label: '纪录片' },
    { value: '23', label: '鬼畜' },
    { value: '11', label: '电视剧' },
    { value: '129', label: '美食' },
    { value: '188', label: '国创' },
    { value: '33', label: '知识' },
  ];

  // 预设关键词按年份划分，展开时渲染按钮，收起时隐藏
  // 默认展开 2018 年
  const KEYWORD_PRESETS_BY_YEAR = {
    2009: ['占位词1', '占位词2', '占位词3'],
    2010: ['占位词1', '占位词2', '占位词3'],
    2011: ['占位词1', '占位词2', '占位词3'],
    2012: ['占位词1', '占位词2', '占位词3'],
    2013: ['占位词1', '占位词2', '占位词3'],
    2014: ['占位词1', '占位词2', '占位词3'],
    2015: ['占位词1', '占位词2', '占位词3'],
    2016: ['占位词1', '占位词2', '占位词3'],
    2017: ['占位词1', '占位词2', '占位词3'],
    2018: ['占位词1', '占位词2', '占位词3'],
    2019: ['占位词1', '占位词2', '占位词3'],
    2020: ['占位词1', '占位词2', '占位词3'],
    2021: ['占位词1', '占位词2', '占位词3'],
    2022: ['占位词1', '占位词2', '占位词3'],
    2023: ['占位词1', '占位词2', '占位词3'],
    2024: ['占位词1', '占位词2', '占位词3'],
    2025: ['占位词1', '占位词2', '占位词3'],
    2026: ['占位词1', '占位词2', '占位词3'],
  };
  const DEFAULT_EXPANDED_YEAR = 2018;

  // ---------- 时间轴工具函数 ----------
  function getCurrentYearMonth() {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  function getTimelineTotalMonths() {
    const { year, month } = getCurrentYearMonth();
    return (year - TIMELINE_MIN_YEAR) * 12 + month;
  }

  function monthIndexToYearMonth(idx) {
    const year = TIMELINE_MIN_YEAR + Math.floor(idx / 12);
    const month = (idx % 12) + 1;
    return { year, month };
  }

  function monthIndexToUnix(idx, isEnd) {
    const { year, month } = monthIndexToYearMonth(idx);
    if (isEnd) {
      const totalMonths = getTimelineTotalMonths();
      if (idx >= totalMonths - 1) {
        return Math.floor(Date.now() / 1000);
      }
      const d = new Date(year, month, 0, 23, 59, 59);
      return Math.floor(d.getTime() / 1000);
    }
    const d = new Date(year, month - 1, 1, 0, 0, 0);
    return Math.floor(d.getTime() / 1000);
  }

  function unixToMonthIndex(ts) {
    const d = new Date(parseInt(ts) * 1000);
    const year = d.getFullYear();
    const month = d.getMonth();
    return (year - TIMELINE_MIN_YEAR) * 12 + month;
  }

  function formatRange(startIdx, endIdx) {
    const s = monthIndexToYearMonth(startIdx);
    const e = monthIndexToYearMonth(endIdx);
    const pad = n => String(n).padStart(2, '0');
    return `${s.year}-${pad(s.month)} ~ ${e.year}-${pad(e.month)}`;
  }

  // ---------- 创建悬浮框 ----------
  function createSearchEnhancer() {
    const container = document.createElement('div');
    container.id = 'bili-archaeology-tool';
    container.setAttribute('data-extension', 'bili-archaeology');

    const partitionOptions = PARTITIONS.map(p => `<option value="${p.value}">${p.label}</option>`).join('');
    const years = Object.keys(KEYWORD_PRESETS_BY_YEAR).map(Number).sort();
    const keywordSectionsHtml = years.map(year => {
      const isExpanded = year === DEFAULT_EXPANDED_YEAR;
      const buttons = KEYWORD_PRESETS_BY_YEAR[year].map(k =>
        `<button class="preset-keyword" data-keyword="${k}">${k}</button>`
      ).join('');
      return `
        <div class="preset-year-section" data-year="${year}">
          <div class="preset-year-header" data-year="${year}">
            <span class="preset-year-arrow">${isExpanded ? '▼' : '▶'}</span>
            <span class="preset-year-label">${year}</span>
          </div>
          <div class="preset-year-buttons" ${isExpanded ? '' : 'style="display:none"'}>
            ${buttons}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="drag-handle" title="拖拽移动">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#FB7299" stroke-width="2" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="#FB7299" stroke-width="2" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="#FB7299" stroke-width="2" stroke-linejoin="round"/>
        </svg>
        <span class="drag-title">考古时间胶囊</span>
        <span class="badge">BETA</span>
        <button class="panel-btn minimize-btn" id="archaeology-minimize-btn" title="最小化">─</button>
        <button class="panel-btn close-btn" id="archaeology-close-btn" title="关闭">✕</button>
      </div>

      <div class="search-section">
        <div class="search-row">
          <input type="text" id="archaeology-search-input" placeholder="输入考古关键词..." autocomplete="off">
          <button id="archaeology-search-btn">🚀 考古</button>
        </div>
        <div class="preset-keywords">
          ${keywordSectionsHtml}
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-row timeline-row">
          <label>📅 时间范围</label>
          <div class="timeline-wrap" id="archaeology-timeline">
            <div class="timeline-readout" id="archaeology-timeline-readout">2009-01 ~ 今天</div>
            <div class="timeline-track" id="archaeology-timeline-track">
              <div class="timeline-range" id="archaeology-timeline-range"></div>
              <div class="timeline-handle" id="archaeology-handle-start" data-handle="start" tabindex="0" aria-label="开始时间"></div>
              <div class="timeline-handle" id="archaeology-handle-end" data-handle="end" tabindex="0" aria-label="结束时间"></div>
            </div>
            <div class="timeline-ticks" id="archaeology-timeline-ticks">
              <span>2009</span>
            </div>
          </div>
        </div>
        <div class="filter-row">
          <label>📂 分区</label>
          <select id="archaeology-partition-select">
            ${partitionOptions}
          </select>
        </div>
        <div class="filter-row">
          <label>📊 排序</label>
          <select id="archaeology-order-select">
            <option value="totalrank">综合排序</option>
            <option value="pubdate">最新发布</option>
            <option value="click">最多播放</option>
            <option value="stow">最多收藏</option>
            <option value="dm">最多弹幕</option>
          </select>
        </div>
        <div class="filter-row random-row">
          <label></label>
          <button id="archaeology-random-btn" class="random-jump-btn" type="button">🎲 随机跳跃模式</button>
        </div>
      </div>

      <div class="info-row">
        <span id="archaeology-status">💗 准备考古...</span>
        <button id="archaeology-reset-btn">↺ 重置</button>
      </div>
    `;
    document.body.appendChild(container);

    // 折叠后的悬浮标签作为 container 的兄弟元素，单独追加到 body
    const collapsedTabEl = document.createElement('div');
    collapsedTabEl.id = 'archaeology-collapsed-tab';
    collapsedTabEl.className = 'collapsed-tab';
    collapsedTabEl.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      </svg>
      <span>考古</span>
    `;
    document.body.appendChild(collapsedTabEl);
    collapsedTab = collapsedTabEl;
    return container;
  }

  // ---------- DOM 引用 ----------
  let container, searchInput, searchBtn, partitionSelect, orderSelect, statusDisplay, resetBtn;
  let timelineTrackEl, timelineRangeEl, timelineReadoutEl, timelineTicksEl;
  let handleStartEl, handleEndEl, randomBtn;
  let minimizeBtn, closeBtn, collapsedTab;

  // ---------- 时间轴状态 ----------
  let timelineTotalMonths = getTimelineTotalMonths();
  let timelineStartMonth = 0;
  let timelineEndMonth = timelineTotalMonths - 1;
  let isDraggingHandle = null;

  function initElements() {
    container = document.getElementById('bili-archaeology-tool');
    if (!container) return false;
    searchInput = document.getElementById('archaeology-search-input');
    searchBtn = document.getElementById('archaeology-search-btn');
    partitionSelect = document.getElementById('archaeology-partition-select');
    orderSelect = document.getElementById('archaeology-order-select');
    statusDisplay = document.getElementById('archaeology-status');
    resetBtn = document.getElementById('archaeology-reset-btn');
    minimizeBtn = document.getElementById('archaeology-minimize-btn');
    closeBtn = document.getElementById('archaeology-close-btn');
    collapsedTab = document.getElementById('archaeology-collapsed-tab');

    timelineTrackEl = document.getElementById('archaeology-timeline-track');
    timelineRangeEl = document.getElementById('archaeology-timeline-range');
    timelineReadoutEl = document.getElementById('archaeology-timeline-readout');
    timelineTicksEl = document.getElementById('archaeology-timeline-ticks');
    handleStartEl = document.getElementById('archaeology-handle-start');
    handleEndEl = document.getElementById('archaeology-handle-end');
    randomBtn = document.getElementById('archaeology-random-btn');
    return true;
  }

  // ---------- 时间轴 UI ----------
  function generateTimelineTicks() {
    const totalYears = Math.ceil(timelineTotalMonths / 12);
    const ticks = [TIMELINE_MIN_YEAR];
    const { year: currentYear } = getCurrentYearMonth();

    if (totalYears > 4) {
      const step = Math.max(1, Math.floor((currentYear - TIMELINE_MIN_YEAR) / 4));
      for (let y = TIMELINE_MIN_YEAR + step; y < currentYear; y += step) {
        ticks.push(y);
      }
    }
    if (ticks[ticks.length - 1] !== currentYear) {
      ticks.push(currentYear);
    }

    timelineTicksEl.innerHTML = ticks.map(y => `<span>${y}</span>`).join('');
  }

  function pointerToMonthIndex(clientX) {
    const rect = timelineTrackEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = rect.width > 0 ? x / rect.width : 0;
    const idx = Math.round(ratio * (timelineTotalMonths - 1));
    return Math.max(0, Math.min(idx, timelineTotalMonths - 1));
  }

  function setTimelineFromIndices(startIdx, endIdx) {
    timelineStartMonth = Math.max(0, Math.min(startIdx, timelineTotalMonths - 1));
    timelineEndMonth = Math.max(timelineStartMonth, Math.min(endIdx, timelineTotalMonths - 1));
    updateTimelineUI();
  }

  function updateTimelineUI() {
    if (!timelineTrackEl || !timelineRangeEl || !handleStartEl || !handleEndEl || !timelineReadoutEl) return;

    const total = timelineTotalMonths - 1;
    const startPct = total > 0 ? (timelineStartMonth / total) * 100 : 0;
    const endPct = total > 0 ? (timelineEndMonth / total) * 100 : 100;

    handleStartEl.style.left = `calc(${startPct}% - 8px)`;
    handleEndEl.style.left = `calc(${endPct}% - 8px)`;

    timelineRangeEl.style.left = `${startPct}%`;
    timelineRangeEl.style.width = `${Math.max(0, endPct - startPct)}%`;

    timelineReadoutEl.textContent = formatRange(timelineStartMonth, timelineEndMonth);
  }

  // ---------- 构建搜索URL ----------
  function buildSearchUrl(keyword, startIdx, endIdx, partition, order) {
    const base = 'https://search.bilibili.com/all';
    const params = new URLSearchParams();
    params.set('keyword', keyword.trim());

    const isFullRange = startIdx === 0 && endIdx === timelineTotalMonths - 1;
    if (!isFullRange) {
      params.set('pubtime_begin_s', monthIndexToUnix(startIdx, false));
      params.set('pubtime_end_s', monthIndexToUnix(endIdx, true));
    }

    if (partition && partition !== '0') {
      params.set('tids', partition);
    }

    if (order && order !== 'totalrank') {
      params.set('order', order);
    }

    return `${base}?${params.toString()}`;
  }

  // ---------- 执行考古搜索 ----------
  function performSearch() {
    const keyword = searchInput.value.trim();
    if (!keyword) {
      searchInput.focus();
      searchInput.style.borderColor = '#FB7299';
      searchInput.style.boxShadow = '0 0 0 3px rgba(251,114,153,0.25)';
      setTimeout(() => {
        searchInput.style.borderColor = '';
        searchInput.style.boxShadow = '';
      }, 600);
      return;
    }

    const partition = partitionSelect.value;
    const order = orderSelect.value;
    const url = buildSearchUrl(keyword, timelineStartMonth, timelineEndMonth, partition, order);

    const partitionLabel = partitionSelect.options[partitionSelect.selectedIndex]?.text || '全部';
    const timeLabel = formatRange(timelineStartMonth, timelineEndMonth);
    statusDisplay.textContent = `🔎 考古 "${keyword}" · ${timeLabel} · ${partitionLabel}`;

    window.location.href = url;
  }

  // ---------- 随机跳跃模式 ----------
  function performRandomJump() {
    const minSpan = 3;
    const maxSpan = Math.max(minSpan, timelineTotalMonths);
    const span = Math.floor(Math.random() * (maxSpan - minSpan + 1)) + minSpan;
    const maxStart = Math.max(0, timelineTotalMonths - span);
    const startIdx = Math.floor(Math.random() * (maxStart + 1));
    const endIdx = Math.min(startIdx + span - 1, timelineTotalMonths - 1);

    const randomPartition = PARTITIONS[Math.floor(Math.random() * PARTITIONS.length)].value;
    const allKeywords = Object.values(KEYWORD_PRESETS_BY_YEAR).flat();
    const randomKeyword = allKeywords[Math.floor(Math.random() * allKeywords.length)];

    setTimelineFromIndices(startIdx, endIdx);
    partitionSelect.value = randomPartition;
    orderSelect.value = 'click';
    searchInput.value = randomKeyword;

    const timeLabel = formatRange(timelineStartMonth, timelineEndMonth);
    const partitionLabel = partitionSelect.options[partitionSelect.selectedIndex]?.text || '全部';
    statusDisplay.textContent = `🎲 随机跳跃: "${randomKeyword}" · ${timeLabel} · ${partitionLabel}`;

    setTimeout(() => {
      performSearch();
    }, 180);
  }

  // ---------- 最小化/恢复/关闭 ----------
  function minimizePanel() {
    container.style.display = 'none';
    collapsedTab.style.display = 'flex';
  }

  function restorePanel() {
    container.style.display = '';
    collapsedTab.style.display = 'none';
    // 恢复后再次滚动到默认年份
    const defaultSection = container.querySelector(`.preset-year-section[data-year="${DEFAULT_EXPANDED_YEAR}"]`);
    if (defaultSection) {
      setTimeout(() => {
        defaultSection.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 100);
    }
  }

  function closePanel() {
    container.style.display = 'none';
    collapsedTab.style.display = 'none';
  }

  // ---------- 重置 ----------
  function resetFilters() {
    timelineTotalMonths = getTimelineTotalMonths();
    setTimelineFromIndices(0, timelineTotalMonths - 1);
    partitionSelect.value = '0';
    orderSelect.value = 'totalrank';
    searchInput.value = '';
    statusDisplay.textContent = '💗 已重置，准备新的考古之旅';
    searchInput.focus();
  }

  // ---------- 自动填充 ----------
  function autoFillFromUrl() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const keyword = urlParams.get('keyword');
      if (keyword) {
        searchInput.value = decodeURIComponent(keyword);
      }

      timelineTotalMonths = getTimelineTotalMonths();
      const pubtime_begin_s = urlParams.get('pubtime_begin_s');
      const pubtime_end_s = urlParams.get('pubtime_end_s');
      if (pubtime_begin_s && pubtime_end_s) {
        let startIdx = unixToMonthIndex(pubtime_begin_s);
        let endIdx = unixToMonthIndex(pubtime_end_s);
        startIdx = Math.max(0, Math.min(startIdx, timelineTotalMonths - 1));
        endIdx = Math.max(0, Math.min(endIdx, timelineTotalMonths - 1));
        setTimelineFromIndices(startIdx, endIdx);
      } else {
        setTimelineFromIndices(0, timelineTotalMonths - 1);
      }

      const tids = urlParams.get('tids');
      if (tids) {
        const partitionOption = Array.from(partitionSelect.options).find(opt => opt.value === tids);
        if (partitionOption) {
          partitionSelect.value = tids;
        }
      }

      const order = urlParams.get('order');
      if (order) {
        const orderOption = Array.from(orderSelect.options).find(opt => opt.value === order);
        if (orderOption) {
          orderSelect.value = order;
        }
      }

      if (keyword) {
        const partitionLabel = partitionSelect.options[partitionSelect.selectedIndex]?.text || '全部';
        const timeLabel = formatRange(timelineStartMonth, timelineEndMonth);
        statusDisplay.textContent = `🔎 考古 "${decodeURIComponent(keyword)}" · ${timeLabel} · ${partitionLabel}`;
      }
    } catch (e) {}
  }

  // ---------- 关键词预设（按年份展开收起） ----------
  function setupPresetKeywords() {
    // 年份表头点击展开/收起
    document.querySelectorAll('.preset-year-header').forEach(header => {
      header.addEventListener('click', () => {
        const year = header.dataset.year;
        const section = header.closest('.preset-year-section');
        const buttons = section.querySelector('.preset-year-buttons');
        const arrow = header.querySelector('.preset-year-arrow');
        const isExpanded = buttons.style.display !== 'none';
        if (isExpanded) {
          buttons.style.display = 'none';
          arrow.textContent = '▶';
        } else {
          buttons.style.display = '';
          arrow.textContent = '▼';
        }
      });
    });

    // 关键词按钮点击搜索
    document.querySelectorAll('.preset-keyword').forEach(btn => {
      btn.addEventListener('click', () => {
        searchInput.value = btn.dataset.keyword;
        performSearch();
      });
    });

    // 默认展开 2018 年并滚动到该位置
    const defaultYear = DEFAULT_EXPANDED_YEAR;
    const defaultSection = document.querySelector(`.preset-year-section[data-year="${defaultYear}"]`);
    if (defaultSection) {
      // 确保 2018 年已展开（模板中已按 defaultExpandedYear 判断，这里保险一下）
      const defaultButtons = defaultSection.querySelector('.preset-year-buttons');
      const defaultArrow = defaultSection.querySelector('.preset-year-arrow');
      if (defaultButtons && defaultButtons.style.display === 'none') {
        defaultButtons.style.display = '';
        if (defaultArrow) defaultArrow.textContent = '▼';
      }
      // 延迟滚动，等待面板渲染完成
      setTimeout(() => {
        defaultSection.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 100);
    }
  }

  // ---------- 时间轴交互 ----------
  function setupTimeline() {
    generateTimelineTicks();
    updateTimelineUI();

    [handleStartEl, handleEndEl].forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isDraggingHandle = handle.dataset.handle;
        container.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      });

      handle.addEventListener('keydown', (e) => {
        const isStart = handle.dataset.handle === 'start';
        let current = isStart ? timelineStartMonth : timelineEndMonth;
        const other = isStart ? timelineEndMonth : timelineStartMonth;
        let delta = 0;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = 1;
        if (e.key === 'Home') delta = isStart ? -current : (timelineTotalMonths - 1 - current);
        if (e.key === 'End') delta = isStart ? (timelineTotalMonths - 1 - current) : -current;

        if (delta === 0) return;
        e.preventDefault();

        let next = current + delta;
        if (isStart) {
          next = Math.max(0, Math.min(next, other));
          timelineStartMonth = next;
        } else {
          next = Math.max(other, Math.min(next, timelineTotalMonths - 1));
          timelineEndMonth = next;
        }
        updateTimelineUI();
        updateStatusPreview();
      });
    });

    // 点击轨道直接跳转最近的手柄
    timelineTrackEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('timeline-handle')) return;
      const idx = pointerToMonthIndex(e.clientX);
      const distStart = Math.abs(idx - timelineStartMonth);
      const distEnd = Math.abs(idx - timelineEndMonth);
      if (distStart <= distEnd) {
        timelineStartMonth = Math.max(0, Math.min(idx, timelineEndMonth));
      } else {
        timelineEndMonth = Math.max(timelineStartMonth, Math.min(idx, timelineTotalMonths - 1));
      }
      updateTimelineUI();
      updateStatusPreview();
    });
  }

  function updateStatusPreview() {
    if (searchInput.value.trim()) {
      const partitionLabel = partitionSelect.options[partitionSelect.selectedIndex]?.text || '全部';
      const timeLabel = formatRange(timelineStartMonth, timelineEndMonth);
      statusDisplay.textContent = `🔎 考古 "${searchInput.value.trim()}" · ${timeLabel} · ${partitionLabel}`;
    }
  }

  // ---------- 拖拽 ----------
  function setupDrag() {
    const dragHandle = container.querySelector('.drag-handle');
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    dragHandle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      // 防止按钮点击触发拖拽
      if (e.target.closest('button')) return;
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      isDragging = true;
      container.style.cursor = 'grabbing';
      container.style.transition = 'none';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (isDraggingHandle) {
        e.preventDefault();
        const idx = pointerToMonthIndex(e.clientX);
        if (isDraggingHandle === 'start') {
          timelineStartMonth = Math.max(0, Math.min(idx, timelineEndMonth));
        } else {
          timelineEndMonth = Math.max(timelineStartMonth, Math.min(idx, timelineTotalMonths - 1));
        }
        updateTimelineUI();
        updateStatusPreview();
        return;
      }
      if (!isDragging) return;
      e.preventDefault();
      let left = e.clientX - offsetX;
      let top = e.clientY - offsetY;
      const maxX = window.innerWidth - container.offsetWidth;
      const maxY = window.innerHeight - container.offsetHeight;
      left = Math.max(0, Math.min(left, maxX));
      top = Math.max(0, Math.min(top, maxY));
      container.style.left = left + 'px';
      container.style.top = top + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (isDraggingHandle) {
        isDraggingHandle = null;
        container.style.cursor = '';
        document.body.style.userSelect = '';
      }
      if (isDragging) {
        isDragging = false;
        container.style.cursor = '';
        container.style.transition = '';
        document.body.style.userSelect = '';
      }
    });
  }

  // ---------- 折叠标签拖拽 ----------
  function setupCollapsedTabDrag() {
    let isDragging = false;
    let tabWasDragged = false;
    let offsetX = 0, offsetY = 0;

    collapsedTab.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('button')) return;
      e.preventDefault();
      const rect = collapsedTab.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      isDragging = true;
      tabWasDragged = false;
      collapsedTab.style.cursor = 'grabbing';
      collapsedTab.style.transition = 'none';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      tabWasDragged = true;
      let left = e.clientX - offsetX;
      let top = e.clientY - offsetY;
      const maxX = window.innerWidth - collapsedTab.offsetWidth;
      const maxY = window.innerHeight - collapsedTab.offsetHeight;
      left = Math.max(0, Math.min(left, maxX));
      top = Math.max(0, Math.min(top, maxY));
      collapsedTab.style.left = left + 'px';
      collapsedTab.style.top = top + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      collapsedTab.style.cursor = '';
      collapsedTab.style.transition = '';
      document.body.style.userSelect = '';
    });

    collapsedTab.addEventListener('click', (e) => {
      if (tabWasDragged) { tabWasDragged = false; return; }
      restorePanel();
    });
  }

  // ---------- 绑定事件 ----------
  function bindEvents() {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
    resetBtn.addEventListener('click', resetFilters);
    randomBtn.addEventListener('click', performRandomJump);

    minimizeBtn.addEventListener('click', minimizePanel);
    closeBtn.addEventListener('click', closePanel);

    partitionSelect.addEventListener('change', updateStatusPreview);
    orderSelect.addEventListener('change', updateStatusPreview);

    window.addEventListener('resize', () => {
      updateTimelineUI();
    });
  }

  // ---------- 初始化 ----------
  function init() {
    if (document.getElementById('bili-archaeology-tool')) return;

    timelineTotalMonths = getTimelineTotalMonths();
    timelineEndMonth = timelineTotalMonths - 1;

    createSearchEnhancer();
    if (!initElements()) return;

    setupTimeline();
    bindEvents();
    setupDrag();
    setupCollapsedTabDrag();
    setupPresetKeywords();
    autoFillFromUrl();

    if (!searchInput.value) {
      setTimeout(() => {
        if (document.activeElement?.tagName !== 'INPUT') {
          searchInput.focus();
        }
      }, 400);
    }

    console.log('💗 [B站考古工具] 时间胶囊已启动');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
