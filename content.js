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

  // ---------- 关键词预设配置 ----------
  const PRESETS_STORAGE_KEY = 'bili-archaeology-presets';
  let factoryPresets = {};
  let keywordPresets = {};
  let defaultExpandedYear = 2018;
  let isPresetEditMode = false;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function loadPresets() {
    try {
      const url = chrome.runtime.getURL('presets.json');
      const res = await fetch(url);
      const factory = await res.json();
      factoryPresets = factory.presets || {};
      defaultExpandedYear = factory.defaultExpandedYear || 2018;
    } catch (e) {
      factoryPresets = {};
      defaultExpandedYear = 2018;
    }
    keywordPresets = JSON.parse(JSON.stringify(factoryPresets));
    try {
      const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored.presets) keywordPresets = stored.presets;
      }
    } catch (e) {}
  }

  function savePresets() {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify({
        version: '1',
        presets: keywordPresets
      }));
    } catch (e) {}
  }

  function resetPresets() {
    if (!confirm('确定恢复默认关键词预设？所有自定义修改将丢失。')) return;
    keywordPresets = JSON.parse(JSON.stringify(factoryPresets));
    try { localStorage.removeItem(PRESETS_STORAGE_KEY); } catch (e) {}
    renderPresetKeywords();
  }

  function getSortedYears() {
    return Object.keys(keywordPresets).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
  }

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

  // ---------- 关键词预设渲染与 CRUD ----------
  function renderPresetKeywords() {
    const wrapper = document.getElementById('archaeology-preset-keywords');
    if (!wrapper) return;

    const years = getSortedYears();
    if (years.length === 0) {
      wrapper.innerHTML = `
        <div class="preset-year-section">
          <div class="preset-year-header">
            <span class="preset-year-arrow">▶</span>
            <span class="preset-year-label">暂无预设</span>
          </div>
        </div>
      `;
      return;
    }

    const keywordSectionsHtml = years.map(year => {
      const isExpanded = year === defaultExpandedYear;
      const keywords = keywordPresets[String(year)] || [];
      if (isPresetEditMode) {
        const editRows = keywords.map((k, idx) => `
          <div class="preset-edit-row" data-year="${year}" data-index="${idx}">
            <input type="text" class="preset-edit-input" value="${escapeHtml(k)}" data-year="${year}" data-index="${idx}">
            <button class="preset-delete-btn" data-year="${year}" data-index="${idx}" title="删除">✕</button>
          </div>
        `).join('');
        return `
          <div class="preset-year-section" data-year="${year}">
            <div class="preset-year-header" data-year="${year}">
              <span class="preset-year-arrow">▼</span>
              <span class="preset-year-label">${year}</span>
              <button class="preset-delete-year-btn" data-year="${year}" title="删除该年份">删除</button>
            </div>
            <div class="preset-year-buttons" style="display:block">
              ${editRows}
              <div class="preset-add-row" data-year="${year}">
                <input type="text" class="preset-add-input" data-year="${year}" placeholder="添加关键词...">
                <button class="preset-add-btn" data-year="${year}">添加</button>
              </div>
            </div>
          </div>
        `;
      }
      const buttons = keywords.map(k =>
        `<button class="preset-keyword" data-keyword="${escapeHtml(k)}">${escapeHtml(k)}</button>`
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

    const addYearRow = isPresetEditMode ? `
      <div class="preset-add-year-row">
        <input type="text" class="preset-add-year-input" id="archaeology-add-year-input" placeholder="新年份，如 2027">
        <button class="preset-add-year-btn" id="archaeology-add-year-btn">添加年份</button>
      </div>
    ` : '';

    wrapper.innerHTML = keywordSectionsHtml + addYearRow;

    setupPresetKeywords();
    if (isPresetEditMode) setupPresetCrud();
  }

  // ---------- 创建悬浮框 ----------
  function createSearchEnhancer() {
    const container = document.createElement('div');
    container.id = 'bili-archaeology-tool';
    container.setAttribute('data-extension', 'bili-archaeology');

    const partitionOptions = PARTITIONS.map(p => `<option value="${p.value}">${p.label}</option>`).join('');

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
        </div>
        <div class="preset-toolbar">
          <span class="preset-toolbar-label">📌 关键词预设</span>
          <div class="preset-toolbar-actions">
            <button class="preset-toolbar-btn" id="archaeology-preset-reset-btn" style="display:none">↺ 恢复默认</button>
            <button class="preset-toolbar-btn" id="archaeology-preset-edit-btn">⚙ 管理</button>
          </div>
        </div>
        <div class="preset-keywords" id="archaeology-preset-keywords">
          <!-- 由 renderPresetKeywords() 动态填充 -->
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
        <div class="filter-row action-row">
          <button id="archaeology-search-btn" class="action-btn primary-btn" type="button">🚀 考古</button>
          <button id="archaeology-random-btn" class="action-btn bilibili-blue-btn" type="button">🎲 随机跳跃模式</button>
        </div>
      </div>

      <div class="info-row">
        <span id="archaeology-status">💗 准备考古...</span>
        <div class="info-actions">
          <button id="archaeology-anim-toggle-btn" class="anim-toggle-btn" title="时空跳转动画">✨ 动画</button>
          <button id="archaeology-reset-btn">↺ 重置</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    renderPresetKeywords();

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
  let minimizeBtn, closeBtn, collapsedTab, animToggleBtn;
  let presetEditBtn, presetResetBtn;

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
    animToggleBtn = document.getElementById('archaeology-anim-toggle-btn');
    minimizeBtn = document.getElementById('archaeology-minimize-btn');
    closeBtn = document.getElementById('archaeology-close-btn');
    collapsedTab = document.getElementById('archaeology-collapsed-tab');
    presetEditBtn = document.getElementById('archaeology-preset-edit-btn');
    presetResetBtn = document.getElementById('archaeology-preset-reset-btn');

    // 根据设置更新开关按钮状态
    if (animToggleBtn) {
      animToggleBtn.classList.toggle('anim-toggle-on', isAnimEnabled());
    }

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

  // ---------- 时空跳转动画 ----------
  const ANIM_STORAGE_KEY = 'bili-archaeology-anim-enabled';

  function isAnimEnabled() {
    try {
      const stored = localStorage.getItem(ANIM_STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    } catch { return true; }
  }

  function setAnimEnabled(enabled) {
    try { localStorage.setItem(ANIM_STORAGE_KEY, String(enabled)); } catch {}
  }

  function createAnimOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'bili-archaeology-anim-overlay';
    overlay.innerHTML = `
      <div class="anim-core">
        <div class="anim-ring ring-1"></div>
        <div class="anim-ring ring-2"></div>
        <div class="anim-ring ring-3"></div>
        <div class="anim-particle-field"></div>
        <div class="anim-text">时空跳跃中...</div>
      </div>
      <div class="anim-skip">点击任意处跳过</div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function playTimeWarpAnimation(onComplete) {
    if (!isAnimEnabled()) { onComplete(); return; }

    const overlay = createAnimOverlay();
    let skipped = false;

    const skip = () => {
      if (skipped) return;
      skipped = true;
      overlay.classList.add('anim-skipping');
      setTimeout(() => { overlay.remove(); onComplete(); }, 300);
    };

    overlay.addEventListener('click', skip);
    overlay.addEventListener('touchstart', skip, { passive: true });

    // 动画将在 CSS 中处理，1.2s 后自动触发完成
    overlay._timer = setTimeout(() => { if (!skipped) { skip(); } }, 1200);
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
    const allKeywords = Object.values(keywordPresets).flat().filter(k => String(k).trim());
    if (allKeywords.length === 0) {
      statusDisplay.textContent = '⚠️ 没有可用的关键词预设';
      return;
    }
    const randomKeyword = allKeywords[Math.floor(Math.random() * allKeywords.length)];

    setTimelineFromIndices(startIdx, endIdx);
    partitionSelect.value = randomPartition;
    orderSelect.value = 'click';
    searchInput.value = randomKeyword;

    const timeLabel = formatRange(timelineStartMonth, timelineEndMonth);
    const partitionLabel = partitionSelect.options[partitionSelect.selectedIndex]?.text || '全部';
    statusDisplay.textContent = `🎲 随机跳跃: "${randomKeyword}" · ${timeLabel} · ${partitionLabel}`;

    playTimeWarpAnimation(() => { performSearch(); });
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
    const defaultSection = container.querySelector(`.preset-year-section[data-year="${defaultExpandedYear}"]`);
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
      header.addEventListener('click', (e) => {
        // 编辑模式下不切换展开状态；避免点击删除按钮时触发
        if (isPresetEditMode) return;
        if (e.target.closest('.preset-delete-year-btn')) return;
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

    if (isPresetEditMode) return;

    // 默认展开年份并滚动到该位置
    const defaultYear = defaultExpandedYear;
    const defaultSection = document.querySelector(`.preset-year-section[data-year="${defaultYear}"]`);
    if (defaultSection) {
      const defaultButtons = defaultSection.querySelector('.preset-year-buttons');
      const defaultArrow = defaultSection.querySelector('.preset-year-arrow');
      if (defaultButtons && defaultButtons.style.display === 'none') {
        defaultButtons.style.display = '';
        if (defaultArrow) defaultArrow.textContent = '▼';
      }
      setTimeout(() => {
        defaultSection.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 100);
    }
  }

  // ---------- 关键词预设 CRUD ----------
  function setupPresetCrud() {
    // 修改关键词
    document.querySelectorAll('.preset-edit-input').forEach(input => {
      input.addEventListener('change', () => {
        const year = input.dataset.year;
        const idx = parseInt(input.dataset.index, 10);
        const value = input.value.trim();
        if (!year || isNaN(idx) || !keywordPresets[year]) return;
        if (!value) {
          input.value = keywordPresets[year][idx];
          return;
        }
        keywordPresets[year][idx] = value;
        savePresets();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      });
    });

    // 删除关键词
    document.querySelectorAll('.preset-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const year = btn.dataset.year;
        const idx = parseInt(btn.dataset.index, 10);
        if (!year || isNaN(idx) || !keywordPresets[year]) return;
        keywordPresets[year].splice(idx, 1);
        if (keywordPresets[year].length === 0) {
          delete keywordPresets[year];
        }
        savePresets();
        renderPresetKeywords();
      });
    });

    // 添加关键词
    document.querySelectorAll('.preset-add-input').forEach(input => {
      const doAdd = () => {
        const year = input.dataset.year;
        const value = input.value.trim();
        if (!year || !value || !keywordPresets[year]) return;
        keywordPresets[year].push(value);
        savePresets();
        renderPresetKeywords();
      };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doAdd();
        }
      });
      const addBtn = input.parentElement.querySelector('.preset-add-btn');
      if (addBtn) addBtn.addEventListener('click', doAdd);
    });

    // 删除年份
    document.querySelectorAll('.preset-delete-year-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const year = btn.dataset.year;
        if (!year || !keywordPresets[year]) return;
        if (!confirm(`确定删除 ${year} 年的所有关键词预设？`)) return;
        delete keywordPresets[year];
        savePresets();
        renderPresetKeywords();
      });
    });

    // 添加年份
    const addYearBtn = document.getElementById('archaeology-add-year-btn');
    const addYearInput = document.getElementById('archaeology-add-year-input');
    if (addYearBtn && addYearInput) {
      const doAddYear = () => {
        const value = addYearInput.value.trim();
        const year = parseInt(value, 10);
        if (!value || isNaN(year) || year < 1900 || year > 2100) {
          alert('请输入有效的年份（1900-2100）');
          return;
        }
        const yearKey = String(year);
        if (keywordPresets[yearKey]) {
          alert(`${year} 年已存在`);
          return;
        }
        keywordPresets[yearKey] = [];
        savePresets();
        renderPresetKeywords();
      };
      addYearBtn.addEventListener('click', doAddYear);
      addYearInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doAddYear();
        }
      });
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

    animToggleBtn.addEventListener('click', () => {
      const enabled = isAnimEnabled();
      const newEnabled = !enabled;
      setAnimEnabled(newEnabled);
      animToggleBtn.classList.toggle('anim-toggle-on', newEnabled);
      animToggleBtn.title = newEnabled ? '时空跳转动画：开（点击关闭）' : '时空跳转动画：关（点击开启）';
    });
    animToggleBtn.title = isAnimEnabled() ? '时空跳转动画：开（点击关闭）' : '时空跳转动画：关（点击开启）';

    minimizeBtn.addEventListener('click', minimizePanel);
    closeBtn.addEventListener('click', closePanel);

    if (presetEditBtn) {
      presetEditBtn.addEventListener('click', () => {
        isPresetEditMode = !isPresetEditMode;
        presetEditBtn.textContent = isPresetEditMode ? '✓ 完成' : '⚙ 管理';
        if (presetResetBtn) presetResetBtn.style.display = isPresetEditMode ? '' : 'none';
        renderPresetKeywords();
      });
    }
    if (presetResetBtn) {
      presetResetBtn.addEventListener('click', resetPresets);
    }

    partitionSelect.addEventListener('change', updateStatusPreview);
    orderSelect.addEventListener('change', updateStatusPreview);

    window.addEventListener('resize', () => {
      updateTimelineUI();
    });
  }

  // ---------- 初始化 ----------
  async function init() {
    if (document.getElementById('bili-archaeology-tool')) return;

    await loadPresets();

    timelineTotalMonths = getTimelineTotalMonths();
    timelineEndMonth = timelineTotalMonths - 1;

    createSearchEnhancer();
    if (!initElements()) return;

    setupTimeline();
    bindEvents();
    setupDrag();
    setupCollapsedTabDrag();
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
