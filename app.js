// State
let currentVersion = 'all';
let filters = { cuda: 'all', python: 'all', pytorch: 'all', platform: 'all' };
let searchQuery = '';

// Platform labels
const platformLabels = {
  linux_x86_64: 'Linux x86_64',
  linux_aarch64: 'Linux ARM64',
  win_amd64: 'Windows'
};

// Get current wheels based on version filter
function getWheels() {
  if (currentVersion === '2') return flashAttn2;
  if (currentVersion === '3') return flashAttn3;
  return [...flashAttn2, ...flashAttn3];
}

// Get unique sorted values
function getUnique(key) {
  const wheels = getWheels();
  const values = [...new Set(wheels.map(w => w[key]))];
  return values.sort((a, b) => parseFloat(b) - parseFloat(a));
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

  getUnique('torch').forEach(v => {
    pytorchSelect.innerHTML += `<option value="${v}">${v}</option>`;
  });

  getUnique('os').forEach(v => {
    platformSelect.innerHTML += `<option value="${v}">${platformLabels[v] || v}</option>`;
  });

  cudaSelect.value = filters.cuda;
  pythonSelect.value = filters.python;
  pytorchSelect.value = filters.pytorch;
  platformSelect.value = filters.platform;
}

// Filter wheels
function filterWheels() {
  return getWheels().filter(w => {
    if (filters.cuda !== 'all' && w.cuda !== filters.cuda) return false;
    if (filters.python !== 'all' && w.py !== filters.python) return false;
    if (filters.pytorch !== 'all' && w.torch !== filters.pytorch) return false;
    if (filters.platform !== 'all' && w.os !== filters.platform) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return w.v.includes(q) || w.cuda.includes(q) || w.py.includes(q) ||
             w.torch.includes(q) || w.os.toLowerCase().includes(q);
    }
    return true;
  });
}

// Render wheel card
function renderWheel(wheel) {
  const isV3 = wheel.v.startsWith('3');
  const pipCmd = `pip install ${wheel.url}`;
  const uvCmd = `uv pip install ${wheel.url}`;

  return `
    <div class="wheel-card">
      <div class="wheel-header">
        <span class="badge badge-version">v${wheel.v}</span>
        <span class="badge">CUDA ${wheel.cuda}</span>
        <span class="badge">PyTorch ${wheel.torch}</span>
        <span class="badge">Python ${wheel.py}</span>
        <span class="badge">${platformLabels[wheel.os] || wheel.os}</span>
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
  render();

  // Version toggle
  document.querySelectorAll('.version-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.version-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentVersion = btn.dataset.version;
      populateFilters();
      render();
    });
  });

  // Search
  document.getElementById('search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
  });

  // Filters
  document.getElementById('cuda-filter').addEventListener('change', (e) => {
    filters.cuda = e.target.value;
    render();
  });

  document.getElementById('python-filter').addEventListener('change', (e) => {
    filters.python = e.target.value;
    render();
  });

  document.getElementById('pytorch-filter').addEventListener('change', (e) => {
    filters.pytorch = e.target.value;
    render();
  });

  document.getElementById('platform-filter').addEventListener('change', (e) => {
    filters.platform = e.target.value;
    render();
  });
});
