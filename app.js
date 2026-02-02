// State
let currentLibrary = 'flash-attn';
let currentVersion = 'all';
let filters = { cuda: 'all', python: 'all', pytorch: 'all', platform: 'all' };
let searchQuery = '';

// Platform labels
const platformLabels = {
  linux_x86_64: 'Linux x86_64',
  linux_aarch64: 'Linux ARM64',
  win_amd64: 'Windows'
};

// Get current wheels based on library and version filter
function getWheels() {
  if (currentLibrary === 'vllm') {
    return vllmWheels || [];
  }
  // Flash Attention
  if (currentVersion === '2') return flashAttn2 || [];
  if (currentVersion === '3') return flashAttn3 || [];
  return [...(flashAttn2 || []), ...(flashAttn3 || [])];
}

// Get unique sorted values
function getUnique(key) {
  const wheels = getWheels();
  const values = [...new Set(wheels.map(w => w[key]).filter(Boolean))];
  return values.sort((a, b) => {
    const aNum = parseFloat(a);
    const bNum = parseFloat(b);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return bNum - aNum;
    }
    return String(a).localeCompare(String(b));
  });
}

// Populate filter dropdowns
function populateFilters() {
  const cudaSelect = document.getElementById('cuda-filter');
  const pythonSelect = document.getElementById('python-filter');
  const pytorchSelect = document.getElementById('pytorch-filter');
  const platformSelect = document.getElementById('platform-filter');

  cudaSelect.innerHTML = '<option value="all">All</option>';
  pythonSelect.innerHTML = '<option value="all">All</option>';
  pytorchSelect.innerHTML = '<option value="all">All</option>';
  platformSelect.innerHTML = '<option value="all">All</option>';

  getUnique('cuda').forEach(v => {
    cudaSelect.innerHTML += `<option value="${v}">${v}</option>`;
  });

  getUnique('py').forEach(v => {
    pythonSelect.innerHTML += `<option value="${v}">${v}</option>`;
  });

  // Only show PyTorch filter for Flash Attention
  const pytorchGroup = pytorchSelect.closest('.filter-group');
  if (currentLibrary === 'vllm') {
    pytorchGroup.style.display = 'none';
  } else {
    pytorchGroup.style.display = 'block';
    getUnique('torch').forEach(v => {
      pytorchSelect.innerHTML += `<option value="${v}">${v}</option>`;
    });
  }

  getUnique('os').forEach(v => {
    platformSelect.innerHTML += `<option value="${v}">${platformLabels[v] || v}</option>`;
  });

  cudaSelect.value = filters.cuda;
  pythonSelect.value = filters.python;
  pytorchSelect.value = filters.pytorch;
  platformSelect.value = filters.platform;
}

// Compare Python versions (e.g., "3.10" > "3.9")
function comparePyVersion(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA !== numB) return numA - numB;
  }
  return 0;
}

// Check if Python version matches (handles "3.8+" style versions)
function pythonMatches(wheelPy, filterPy) {
  if (filterPy === 'all') return true;
  if (wheelPy === filterPy) return true;

  // Handle "3.8+" style - matches any version >= 3.8
  if (wheelPy.endsWith('+')) {
    const minVersion = wheelPy.replace('+', '');
    // filterPy >= minVersion
    return comparePyVersion(filterPy, minVersion) >= 0;
  }

  // Handle filter being "3.8+" style - wheel should be >= 3.8
  if (filterPy.endsWith('+')) {
    const minVersion = filterPy.replace('+', '');
    return comparePyVersion(wheelPy.replace('+', ''), minVersion) >= 0;
  }

  return false;
}

// Filter wheels
function filterWheels() {
  return getWheels().filter(w => {
    if (filters.cuda !== 'all' && w.cuda !== filters.cuda) return false;
    if (!pythonMatches(w.py, filters.python)) return false;
    if (currentLibrary === 'flash-attn' && filters.pytorch !== 'all' && w.torch !== filters.pytorch) return false;
    if (filters.platform !== 'all' && w.os !== filters.platform) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchStr = `${w.v} ${w.cuda} ${w.py} ${w.torch || ''} ${w.os}`.toLowerCase();
      return searchStr.includes(q);
    }
    return true;
  });
}

// Render wheel card
function renderWheel(wheel) {
  const pipCmd = `pip install ${wheel.url}`;
  const uvCmd = `uv pip install ${wheel.url}`;

  let badgesHtml = `<span class="badge badge-version">v${wheel.v}</span>`;
  badgesHtml += `<span class="badge">CUDA ${wheel.cuda}</span>`;
  if (wheel.torch) {
    badgesHtml += `<span class="badge">PyTorch ${wheel.torch}</span>`;
  }
  badgesHtml += `<span class="badge">Python ${wheel.py}</span>`;
  badgesHtml += `<span class="badge">${platformLabels[wheel.os] || wheel.os}</span>`;

  return `
    <div class="wheel-card">
      <div class="wheel-header">
        ${badgesHtml}
      </div>

      <div class="command-group">
        <div class="command-label">pip</div>
        <div class="command-box">
          <code>${pipCmd}</code>
          <button class="copy-btn" onclick="copyCmd(this, '${pipCmd.replace(/'/g, "\\'")}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="command-group">
        <div class="command-label">uv (faster)</div>
        <div class="command-box">
          <code>${uvCmd}</code>
          <button class="copy-btn" onclick="copyCmd(this, '${uvCmd.replace(/'/g, "\\'")}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="wheel-footer">
        <span class="wheel-size">${wheel.size}</span>
        <a href="${wheel.url}" target="_blank" class="download-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download
        </a>
      </div>
    </div>
  `;
}

// Render all wheels
function render() {
  const wheels = filterWheels();
  const list = document.getElementById('wheel-list');
  const count = document.getElementById('count');

  count.textContent = wheels.length;

  if (wheels.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No wheels found.</p>
        <button class="clear-link" onclick="clearFilters()">Clear filters</button>
      </div>
    `;
    list.style.background = 'transparent';
    return;
  }

  list.style.background = 'var(--black)';
  list.innerHTML = wheels.map(renderWheel).join('');
}

// Update version toggle visibility
function updateVersionToggle() {
  const versionToggle = document.getElementById('version-toggle');
  if (currentLibrary === 'vllm') {
    versionToggle.style.display = 'none';
  } else {
    versionToggle.style.display = 'flex';
  }
}

// Switch library
function switchLibrary(lib) {
  currentLibrary = lib;
  currentVersion = 'all';
  filters = { cuda: 'all', python: 'all', pytorch: 'all', platform: 'all' };

  // Update library buttons
  document.querySelectorAll('#library-toggle .version-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-library') === lib);
  });

  // Reset version buttons
  document.querySelectorAll('#version-toggle .version-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-version') === 'all');
  });

  updateVersionToggle();
  populateFilters();
  render();
}

// Switch version
function switchVersion(ver) {
  currentVersion = ver;

  document.querySelectorAll('#version-toggle .version-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-version') === ver);
  });

  populateFilters();
  render();
}

// Copy command to clipboard
async function copyCmd(btn, cmd) {
  await navigator.clipboard.writeText(cmd);
  btn.classList.add('copied');
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
  }, 1500);
}

// Clear all filters
function clearFilters() {
  filters = { cuda: 'all', python: 'all', pytorch: 'all', platform: 'all' };
  searchQuery = '';
  document.getElementById('search').value = '';
  populateFilters();
  render();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  populateFilters();
  updateVersionToggle();
  render();

  // Library toggle - use onclick directly
  document.querySelectorAll('#library-toggle .version-btn').forEach(btn => {
    btn.onclick = function() {
      const lib = this.getAttribute('data-library');
      switchLibrary(lib);
    };
  });

  // Version toggle
  document.querySelectorAll('#version-toggle .version-btn').forEach(btn => {
    btn.onclick = function() {
      const ver = this.getAttribute('data-version');
      switchVersion(ver);
    };
  });

  // Search
  document.getElementById('search').oninput = function() {
    searchQuery = this.value;
    render();
  };

  // Filters
  document.getElementById('cuda-filter').onchange = function() {
    filters.cuda = this.value;
    render();
  };

  document.getElementById('python-filter').onchange = function() {
    filters.python = this.value;
    render();
  };

  document.getElementById('pytorch-filter').onchange = function() {
    filters.pytorch = this.value;
    render();
  };

  document.getElementById('platform-filter').onchange = function() {
    filters.platform = this.value;
    render();
  };
});
