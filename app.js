/**
 * FinFlow - Manajemen Keuangan Profesional
 * Offline-first Personal Finance & Budgeting PWA
 */

(function () {
  'use strict';

  // --- STORAGE KEYS ---
  const STORAGE_KEY = 'finflow_data_v2';

  // --- DEFAULT CATEGORIES (PROFESSIONAL BASELINE) ---
  const DEFAULT_CATEGORIES = [
    { id: 'cat_food', name: 'Konsumsi & Makanan', type: 'expense', icon: '🍽️', color: '#f59e0b' },
    { id: 'cat_groceries', name: 'Kebutuhan Rumah Tangga', type: 'expense', icon: '🛒', color: '#ec4899' },
    { id: 'cat_transport', name: 'Transportasi & Bahan Bakar', type: 'expense', icon: '🚗', color: '#06b6d4' },
    { id: 'cat_bills', name: 'Tagihan, Utilitas & Internet', type: 'expense', icon: '⚡', color: '#eab308' },
    { id: 'cat_personal', name: 'Perawatan Pribadi & Gaya Hidup', type: 'expense', icon: '✂️', color: '#3b82f6' },
    { id: 'cat_health', name: 'Kesehatan & Medis', type: 'expense', icon: '💊', color: '#10b981' },
    { id: 'cat_entertainment', name: 'Hiburan & Hobi', type: 'expense', icon: '🎬', color: '#a855f7' },
    { id: 'cat_education', name: 'Pendidikan & Pengembangan Diri', type: 'expense', icon: '📚', color: '#6366f1' },
    { id: 'cat_donation', name: 'Donasi, Zakat & Sosial', type: 'expense', icon: '🤲', color: '#14b8a6' },
    { id: 'cat_other_exp', name: 'Pengeluaran Lainnya', type: 'expense', icon: '📦', color: '#64748b' },
    { id: 'cat_salary', name: 'Pendapatan Pokok / Gaji', type: 'income', icon: '💼', color: '#10b981' },
    { id: 'cat_business', name: 'Hasil Usaha & Bisnis', type: 'income', icon: '📈', color: '#3b82f6' },
    { id: 'cat_investment', name: 'Investasi, Dividen & Bunga', type: 'income', icon: '🌱', color: '#8b5cf6' },
    { id: 'cat_bonus', name: 'Bonus, Tunjangan & Hadiah', type: 'income', icon: '🎁', color: '#f59e0b' },
    { id: 'cat_other_inc', name: 'Pemasukan Lainnya', type: 'income', icon: '✨', color: '#06b6d4' }
  ];

  // --- CLEAN INITIAL STATE (NO DUMMY TRANSACTIONS) ---
  const CLEAN_INITIAL_STATE = {
    wallets: [
      { id: 'w_bank', name: 'Rekening Bank', type: 'bank', balance: 0, initialBalance: 0, color: '#0284c7' },
      { id: 'w_cash', name: 'Kas Tunai', type: 'cash', balance: 0, initialBalance: 0, color: '#10b981' },
      { id: 'w_ewallet', name: 'Dompet Digital', type: 'ewallet', balance: 0, initialBalance: 0, color: '#0d9488' }
    ],
    categories: DEFAULT_CATEGORIES,
    transactions: [], // 100% Bersih tanpa riwayat palsu
    debts: [],        // 100% Bersih
    budgetsByPeriod: {}, // { "2026-10": { global: 0, categories: { [catId]: 0 } } }
    settings: {
      hideBalance: false,
      activePeriod: ''
    }
  };

  // --- STATE ---
  let appState = null;
  let currentPeriod = getCurrentPeriodString(); // "YYYY-MM"
  let activeDebtSubtab = 'receivable'; // 'receivable' (Piutang) or 'payable' (Utang)
  let activeDebtFilter = 'unpaid';     // 'unpaid' or 'paid'

  // --- UTILS ---
  function getCurrentPeriodString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function getCurrentDateFormatted() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getCurrentTimeFormatted() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  function formatPeriodDisplay(periodStr) {
    if (!periodStr) return '';
    const parts = periodStr.split('-');
    if (parts.length === 2) {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${months[mIdx]} ${parts[0]}`;
    }
    return periodStr;
  }

  function formatRupiah(num) {
    if (num === null || num === undefined || isNaN(num)) return 'Rp 0';
    const absNum = Math.abs(Math.round(num));
    const formatted = absNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (num < 0 ? '-Rp ' : 'Rp ') + formatted;
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const day = parseInt(parts[2], 10);
        const monthName = months[parseInt(parts[1], 10) - 1];
        return `${day} ${monthName} ${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  function getShiftedPeriod(periodStr, shiftMonths) {
    const parts = periodStr.split('-');
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;

    const date = new Date(year, month + shiftMonths, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    return `${newY}-${newM}`;
  }

  // --- PERSISTENCE ---
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        appState = JSON.parse(saved);
        if (!appState.wallets || appState.wallets.length === 0) appState.wallets = CLEAN_INITIAL_STATE.wallets;
        if (!appState.categories || appState.categories.length === 0) appState.categories = DEFAULT_CATEGORIES;
        if (!appState.transactions) appState.transactions = [];
        if (!appState.debts) appState.debts = [];
        if (!appState.budgetsByPeriod) appState.budgetsByPeriod = {};
        if (!appState.settings) appState.settings = { hideBalance: false };
      } else {
        // First-time install: 100% clean state
        appState = JSON.parse(JSON.stringify(CLEAN_INITIAL_STATE));
        saveState();
      }
    } catch (e) {
      console.error('Gagal membaca data dari memori lokal', e);
      appState = JSON.parse(JSON.stringify(CLEAN_INITIAL_STATE));
    }

    currentPeriod = getCurrentPeriodString();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error('Gagal menyimpan perubahan ke memori', e);
      showToast('Gagal menyimpan data ke memori perangkat!', 'error');
    }
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // --- CALCULATIONS & STATS ---
  function calculateTotalNetWorth() {
    return appState.wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  }

  function getPeriodStats(targetPeriod) {
    let income = 0;
    let expense = 0;
    const categoryTotals = {};

    appState.transactions.forEach(tx => {
      if (!tx.date || !tx.date.startsWith(targetPeriod)) return;

      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amt;
      } else if (tx.type === 'expense') {
        expense += amt;
        if (tx.categoryId) {
          categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + amt;
        }
      } else if (tx.type === 'transfer' && tx.fee) {
        expense += Number(tx.fee) || 0;
      }
    });

    return { income, expense, categoryTotals, targetPeriod };
  }

  function getPeriodBudget(periodStr) {
    if (!appState.budgetsByPeriod) appState.budgetsByPeriod = {};
    if (!appState.budgetsByPeriod[periodStr]) {
      appState.budgetsByPeriod[periodStr] = {
        global: 0,
        categories: {}
      };
    }
    return appState.budgetsByPeriod[periodStr];
  }

  function getDebtsSummary() {
    let receivableTotal = 0; // Piutang belum lunas
    let payableTotal = 0;    // Utang belum lunas
    let receivableCount = 0;
    let payableCount = 0;

    appState.debts.forEach(d => {
      if (d.status !== 'paid') {
        const remaining = Number(d.remainingAmount) || 0;
        if (d.debtType === 'payable') {
          payableTotal += remaining;
          payableCount++;
        } else {
          receivableTotal += remaining;
          receivableCount++;
        }
      }
    });

    return { receivableTotal, payableTotal, receivableCount, payableCount };
  }

  // --- RENDER FUNCTIONS ---

  // 1. Dashboard View
  function renderDashboard() {
    const netWorth = calculateTotalNetWorth();
    const stats = getPeriodStats(currentPeriod);
    const budgetConfig = getPeriodBudget(currentPeriod);

    // Period Display & Badge
    const realPeriod = getCurrentPeriodString();
    document.getElementById('dash-period-text').textContent = formatPeriodDisplay(currentPeriod);
    const badge = document.getElementById('dash-period-badge');
    if (currentPeriod === realPeriod) {
      badge.className = 'badge badge-safe period-status-badge';
      badge.textContent = 'Periode Aktif';
    } else if (currentPeriod > realPeriod) {
      badge.className = 'badge badge-warning period-status-badge';
      badge.textContent = 'Periode Mendatang';
    } else {
      badge.className = 'badge period-status-badge';
      badge.style.background = 'rgba(255,255,255,0.08)';
      badge.style.color = 'var(--text-muted)';
      badge.textContent = 'Arsip Periode';
    }

    // Net Worth display
    const masterElem = document.getElementById('master-net-worth');
    if (appState.settings.hideBalance) {
      masterElem.textContent = '••••••••';
    } else {
      masterElem.textContent = formatRupiah(netWorth).replace('Rp ', '');
    }

    document.getElementById('dash-month-income').textContent = formatRupiah(stats.income);
    document.getElementById('dash-month-expense').textContent = formatRupiah(stats.expense);

    // Budget Overview Progress
    const globalBudget = budgetConfig.global || 0;
    const spent = stats.expense;
    const remaining = Math.max(0, globalBudget - spent);
    const percentSpent = globalBudget > 0 ? Math.min(100, Math.round((spent / globalBudget) * 100)) : 0;

    const budgetBar = document.getElementById('budget-main-progress');
    budgetBar.style.width = `${percentSpent}%`;
    budgetBar.className = 'progress-fill' + (percentSpent > 90 ? ' danger' : percentSpent > 70 ? ' warning' : '');

    document.getElementById('budget-spent-txt').textContent = formatRupiah(spent);
    document.getElementById('budget-limit-txt').textContent = formatRupiah(globalBudget);

    const budgetBadge = document.getElementById('budget-status-badge');
    if (spent > globalBudget && globalBudget > 0) {
      budgetBadge.className = 'badge badge-danger';
      budgetBadge.textContent = 'Melebihi Anggaran';
    } else if (globalBudget === 0) {
      budgetBadge.className = 'badge badge-safe';
      budgetBadge.textContent = 'Belum Diatur';
    } else {
      budgetBadge.className = percentSpent > 75 ? 'badge badge-warning' : 'badge badge-safe';
      budgetBadge.textContent = `${100 - percentSpent}% Tersedia`;
    }

    // Daily Cap (Aman Belanja)
    const now = new Date();
    const periodParts = currentPeriod.split('-');
    const daysInMonth = new Date(parseInt(periodParts[0], 10), parseInt(periodParts[1], 10), 0).getDate();
    let daysLeft = daysInMonth;
    if (currentPeriod === realPeriod) {
      daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
    }
    const safeDaily = globalBudget > 0 ? Math.max(0, Math.floor(remaining / daysLeft)) : 0;
    document.getElementById('budget-safe-daily-txt').textContent = `${formatRupiah(safeDaily)} / hari`;

    // Wallets Carousel
    renderWalletsCarousel();

    // Utang & Piutang Banner
    const debtsSummary = getDebtsSummary();
    document.getElementById('dash-receivable-total').textContent = formatRupiah(debtsSummary.receivableTotal);
    document.getElementById('dash-payable-total').textContent = formatRupiah(debtsSummary.payableTotal);

    // Recent Transactions
    renderRecentTransactions();
  }

  function renderWalletsCarousel() {
    const container = document.getElementById('dash-wallets-row');
    if (!container) return;

    document.getElementById('wallet-count-badge').textContent = appState.wallets.length;

    let html = '';
    appState.wallets.forEach(w => {
      const typeIcons = {
        bank: '🏦',
        cash: '💵',
        ewallet: '📱',
        savings: '🌱',
        credit: '💳'
      };
      const icon = typeIcons[w.type] || '💰';
      const bal = appState.settings.hideBalance ? '••••••' : formatRupiah(w.balance);

      html += `
        <div class="wallet-chip" data-id="${w.id}" style="border-top: 3px solid ${w.color || '#10b981'};">
          <div class="wallet-chip-top">
            <div class="wallet-icon" style="background: ${w.color || '#10b981'};">
              ${icon}
            </div>
            <span class="wallet-type-tag">${w.type}</span>
          </div>
          <div>
            <div class="wallet-name" title="${escapeHtml(w.name)}">${escapeHtml(w.name)}</div>
            <div class="wallet-balance amount-display">${bal}</div>
          </div>
        </div>
      `;
    });

    html += `
      <div class="wallet-chip wallet-chip-add" id="dash-btn-add-wallet">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <span style="font-size: 0.72rem; font-weight: 700;">+ Akun</span>
      </div>
    `;

    container.innerHTML = html;

    container.querySelectorAll('.wallet-chip[data-id]').forEach(chip => {
      chip.addEventListener('click', () => openEditWalletModal(chip.dataset.id));
    });

    const addBtn = document.getElementById('dash-btn-add-wallet');
    if (addBtn) addBtn.addEventListener('click', () => openAddWalletModal());
  }

  function renderRecentTransactions() {
    const container = document.getElementById('dash-recent-transactions');
    if (!container) return;

    const recent = [...appState.transactions]
      .filter(tx => tx.date && tx.date.startsWith(currentPeriod))
      .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))
      .slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">Belum ada mutasi pada periode ini</div>
          <div class="empty-desc">Ketuk tombol (+) di bawah untuk mencatat pengeluaran atau pemasukan pertama Anda.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = recent.map(tx => renderTransactionItemHtml(tx)).join('');
    attachTransactionItemEvents(container);
  }

  function renderTransactionItemHtml(tx) {
    const isExpense = tx.type === 'expense';
    const isIncome = tx.type === 'income';
    const isTransfer = tx.type === 'transfer';
    const isReceivable = tx.type === 'receivable_lend' || tx.type === 'receivable_repay';
    const isPayable = tx.type === 'payable_borrow' || tx.type === 'payable_repay';

    let iconBox = '📦';
    let iconBg = 'rgba(255,255,255,0.06)';
    let title = tx.note || 'Transaksi';
    let subtitle = '';
    let amountSign = '-';
    let amountClass = 'text-expense';

    const wallet = appState.wallets.find(w => w.id === tx.walletId);
    const walletName = wallet ? wallet.name : 'Rekening';

    if (isExpense) {
      const cat = appState.categories.find(c => c.id === tx.categoryId);
      iconBox = cat ? cat.icon : '💸';
      iconBg = 'var(--color-expense-bg)';
      amountSign = '-';
      amountClass = 'text-expense';
      subtitle = `${cat ? cat.name : 'Pengeluaran'} • <span class="tx-wallet-badge">${walletName}</span>`;
    } else if (isIncome) {
      const cat = appState.categories.find(c => c.id === tx.categoryId);
      iconBox = cat ? cat.icon : '💰';
      iconBg = 'var(--color-income-bg)';
      amountSign = '+';
      amountClass = 'text-income';
      subtitle = `${cat ? cat.name : 'Pemasukan'} • <span class="tx-wallet-badge">${walletName}</span>`;
    } else if (isTransfer) {
      iconBox = '⇄';
      iconBg = 'var(--color-transfer-bg)';
      const targetWallet = appState.wallets.find(w => w.id === tx.targetWalletId);
      amountSign = '';
      amountClass = 'text-transfer';
      subtitle = `Transfer: ${walletName} &rarr; ${targetWallet ? targetWallet.name : 'Rekening'}`;
    } else if (isReceivable) {
      iconBox = '🤝';
      iconBg = 'rgba(16, 185, 129, 0.15)';
      if (tx.type === 'receivable_lend') {
        amountSign = '-';
        amountClass = 'text-debt';
        title = `Piutang: ${tx.personName || 'Pihak Terkait'}`;
        subtitle = `Dana dipinjamkan • <span class="tx-wallet-badge">${walletName}</span>`;
      } else {
        amountSign = '+';
        amountClass = 'text-income';
        title = `Pelunasan Piutang: ${tx.personName || 'Pihak Terkait'}`;
        subtitle = `Diterima di • <span class="tx-wallet-badge">${walletName}</span>`;
      }
    } else if (isPayable) {
      iconBox = '📑';
      iconBg = 'rgba(244, 63, 94, 0.15)';
      if (tx.type === 'payable_borrow') {
        amountSign = '+';
        amountClass = 'text-income';
        title = `Pinjaman Diterima (Utang): ${tx.personName || 'Kreditur'}`;
        subtitle = `Masuk ke • <span class="tx-wallet-badge">${walletName}</span>`;
      } else {
        amountSign = '-';
        amountClass = 'text-expense';
        title = `Pembayaran Utang: ${tx.personName || 'Kreditur'}`;
        subtitle = `Dibayar dari • <span class="tx-wallet-badge">${walletName}</span>`;
      }
    }

    const formattedAmount = `${amountSign} ${formatRupiah(tx.amount)}`;

    return `
      <div class="transaction-item" data-tx-id="${tx.id}">
        <div class="tx-left">
          <div class="tx-icon-box" style="background: ${iconBg};">
            ${iconBox}
          </div>
          <div class="tx-details">
            <div class="tx-title">${escapeHtml(title)}</div>
            <div class="tx-sub-info">${subtitle}</div>
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-amount amount-display ${amountClass}">${formattedAmount}</div>
          <div class="tx-time">${formatShortDate(tx.date)} ${tx.time ? tx.time : ''}</div>
        </div>
      </div>
    `;
  }

  function attachTransactionItemEvents(container) {
    container.querySelectorAll('.transaction-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.txId;
        const tx = appState.transactions.find(t => t.id === id);
        if (!tx) return;

        if (confirm(`Hapus catatan mutasi "${tx.note || 'Transaksi'}" sebesar ${formatRupiah(tx.amount)}?`)) {
          deleteTransaction(id);
        }
      });
    });
  }

  // 2. Transactions View
  function renderTransactionsTab() {
    const listContainer = document.getElementById('transactions-full-list');
    const searchVal = document.getElementById('tx-search-input').value.toLowerCase().trim();
    const typeFilter = document.querySelector('#tx-type-filter-row .pill-filter.active').dataset.type;
    const walletFilter = document.getElementById('tx-wallet-filter').value;
    const timeFilter = document.getElementById('tx-time-filter').value;

    const todayStr = getCurrentDateFormatted();

    let filtered = appState.transactions.filter(tx => {
      // Type
      if (typeFilter !== 'all') {
        if (typeFilter === 'debt') {
          if (!tx.type.startsWith('receivable_') && !tx.type.startsWith('payable_')) return false;
        } else if (tx.type !== typeFilter) {
          return false;
        }
      }

      // Wallet
      if (walletFilter !== 'all' && tx.walletId !== walletFilter && tx.targetWalletId !== walletFilter) {
        return false;
      }

      // Time
      if (timeFilter === 'today' && tx.date !== todayStr) return false;
      if (timeFilter === 'month' && !tx.date.startsWith(currentPeriod)) return false;

      // Search
      if (searchVal) {
        const matchNote = (tx.note || '').toLowerCase().includes(searchVal);
        const matchPerson = (tx.personName || '').toLowerCase().includes(searchVal);
        const cat = appState.categories.find(c => c.id === tx.categoryId);
        const matchCat = cat ? cat.name.toLowerCase().includes(searchVal) : false;
        if (!matchNote && !matchPerson && !matchCat) return false;
      }

      return true;
    });

    filtered.sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">Tidak ada mutasi yang sesuai</div>
          <div class="empty-desc">Silakan sesuaikan filter pencarian atau pilih periode lainnya.</div>
        </div>
      `;
      return;
    }

    const grouped = {};
    filtered.forEach(tx => {
      const d = tx.date || 'Lainnya';
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(tx);
    });

    let html = '';
    for (const [dateStr, txs] of Object.entries(grouped)) {
      let dateLabel = formatShortDate(dateStr);
      if (dateStr === todayStr) dateLabel = 'Hari Ini • ' + dateLabel;

      const dayTotalExpense = txs.reduce((sum, t) => sum + (t.type === 'expense' || t.type === 'receivable_lend' || t.type === 'payable_repay' ? Number(t.amount) : 0), 0);
      const dayTotalIncome = txs.reduce((sum, t) => sum + (t.type === 'income' || t.type === 'receivable_repay' || t.type === 'payable_borrow' ? Number(t.amount) : 0), 0);

      html += `
        <div class="transaction-group">
          <div class="transaction-group-header">
            <span>${dateLabel}</span>
            <span>
              ${dayTotalIncome > 0 ? `<span class="text-income">+${formatRupiah(dayTotalIncome)}</span> ` : ''}
              ${dayTotalExpense > 0 ? `<span class="text-expense">-${formatRupiah(dayTotalExpense)}</span>` : ''}
            </span>
          </div>
          ${txs.map(t => renderTransactionItemHtml(t)).join('')}
        </div>
      `;
    }

    listContainer.innerHTML = html;
    attachTransactionItemEvents(listContainer);
  }

  // 3. Budget & Category View
  function renderBudgetTab() {
    const stats = getPeriodStats(currentPeriod);
    const budgetConfig = getPeriodBudget(currentPeriod);
    const realPeriod = getCurrentPeriodString();

    // Period Navigation
    document.getElementById('budget-period-text').textContent = formatPeriodDisplay(currentPeriod);
    const badge = document.getElementById('budget-period-badge');
    if (currentPeriod === realPeriod) {
      badge.className = 'badge badge-safe period-status-badge';
      badge.textContent = 'Periode Aktif';
    } else if (currentPeriod > realPeriod) {
      badge.className = 'badge badge-warning period-status-badge';
      badge.textContent = 'Perencanaan Anggaran';
    } else {
      badge.className = 'badge period-status-badge';
      badge.style.background = 'rgba(255,255,255,0.08)';
      badge.style.color = 'var(--text-muted)';
      badge.textContent = 'Arsip Periode';
    }

    const globalLimit = budgetConfig.global || 0;
    const spent = stats.expense;
    const remaining = Math.max(0, globalLimit - spent);
    const percentSpent = globalLimit > 0 ? Math.min(100, Math.round((spent / globalLimit) * 100)) : 0;

    document.getElementById('budget-page-total-limit').textContent = formatRupiah(globalLimit);
    document.getElementById('budget-page-spent').textContent = formatRupiah(spent);
    document.getElementById('budget-page-remaining').textContent = formatRupiah(remaining);

    const progressElem = document.getElementById('budget-page-progress');
    progressElem.style.width = `${percentSpent}%`;
    progressElem.className = 'progress-fill' + (percentSpent > 90 ? ' danger' : percentSpent > 70 ? ' warning' : '');

    const badgeElem = document.getElementById('budget-page-badge');
    if (spent > globalLimit && globalLimit > 0) {
      badgeElem.className = 'badge badge-danger';
      badgeElem.textContent = `Defisit +${formatRupiah(spent - globalLimit)}`;
    } else if (globalLimit === 0) {
      badgeElem.className = 'badge badge-safe';
      badgeElem.textContent = 'Belum Diatur';
    } else {
      badgeElem.className = percentSpent > 75 ? 'badge badge-warning' : 'badge badge-safe';
      badgeElem.textContent = `Tersedia ${100 - percentSpent}%`;
    }

    // Days left calculator
    const now = new Date();
    const periodParts = currentPeriod.split('-');
    const daysInMonth = new Date(parseInt(periodParts[0], 10), parseInt(periodParts[1], 10), 0).getDate();
    let daysLeft = daysInMonth;
    if (currentPeriod === realPeriod) {
      daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
    }
    const safeDaily = globalLimit > 0 ? Math.max(0, Math.floor(remaining / daysLeft)) : 0;
    document.getElementById('budget-days-left-desc').textContent = `Sisa waktu: ${daysLeft} hari (${daysInMonth} hari total bulan ini).`;
    document.getElementById('budget-page-daily-safe').textContent = formatRupiah(safeDaily);

    // Render Categories List (Expenses and Income)
    const categoryListElem = document.getElementById('category-budgets-list');
    let catHtml = '';

    appState.categories.forEach(cat => {
      const isExpense = cat.type === 'expense';
      const catBudget = (budgetConfig.categories && budgetConfig.categories[cat.id]) !== undefined
        ? budgetConfig.categories[cat.id]
        : (cat.budget || 0);

      const actualSpent = stats.categoryTotals[cat.id] || 0;
      const catPercent = catBudget > 0 ? Math.min(100, Math.round((actualSpent / catBudget) * 100)) : 0;
      const catRemaining = Math.max(0, catBudget - actualSpent);

      catHtml += `
        <div class="category-card-item">
          <div class="cat-header-row">
            <div class="cat-info-group">
              <span style="font-size: 1.3rem;">${cat.icon || '🏷️'}</span>
              <div>
                <strong style="font-size: 0.92rem; color: #fff;">${escapeHtml(cat.name)}</strong>
                <div style="font-size: 0.72rem; color: var(--text-muted);">
                  ${isExpense ? 'Pos Pengeluaran' : 'Pos Pemasukan'} • Alokasi: ${catBudget > 0 ? formatRupiah(catBudget) : 'Belum ditentukan'}
                </div>
              </div>
            </div>
            <div class="cat-actions-group">
              <button class="cat-mini-btn btn-edit-category" data-id="${cat.id}" title="Edit Kategori">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="cat-mini-btn danger btn-delete-category" data-id="${cat.id}" title="Hapus Kategori">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px; margin-bottom: 6px;">
            <span style="font-size: 0.74rem; color: var(--text-subtle);">Realisasi: <strong class="amount-display text-expense">${formatRupiah(actualSpent)}</strong></span>
            ${catBudget > 0 ? `<span style="font-size: 0.74rem; color: var(--color-primary-light);">Sisa: <strong class="amount-display">${formatRupiah(catRemaining)}</strong></span>` : ''}
          </div>

          ${catBudget > 0 ? `
            <div class="progress-track" style="height: 6px; margin-bottom: 0;">
              <div class="progress-fill ${catPercent > 90 ? 'danger' : catPercent > 70 ? 'warning' : ''}" style="width: ${catPercent}%;"></div>
            </div>
          ` : ''}
        </div>
      `;
    });

    categoryListElem.innerHTML = catHtml;

    // Attach event listeners for category edit and delete
    categoryListElem.querySelectorAll('.btn-edit-category').forEach(btn => {
      btn.addEventListener('click', () => openEditCategoryModal(btn.dataset.id));
    });

    categoryListElem.querySelectorAll('.btn-delete-category').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const cat = appState.categories.find(c => c.id === id);
        if (!cat) return;
        if (confirm(`Hapus kategori "${cat.name}"? Transaksi yang sudah tercatat tidak akan terhapus.`)) {
          deleteCategory(id);
        }
      });
    });
  }

  // 4. Wallets Tab View
  function renderWalletsTab() {
    const netWorth = calculateTotalNetWorth();
    document.getElementById('wallets-tab-net-worth').textContent = formatRupiah(netWorth);
    document.getElementById('wallets-tab-count').textContent = appState.wallets.length;

    const container = document.getElementById('wallets-full-list');
    let html = '';

    appState.wallets.forEach(w => {
      const typeIcons = {
        bank: '🏦',
        cash: '💵',
        ewallet: '📱',
        savings: '🌱',
        credit: '💳'
      };
      const icon = typeIcons[w.type] || '💰';

      html += `
        <div class="card" style="margin-bottom: 0; padding: 16px; border-left: 5px solid ${w.color || '#10b981'}; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: ${w.color || '#10b981'}; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
              ${icon}
            </div>
            <div>
              <h3 style="font-size: 1rem; font-weight: 700;">${escapeHtml(w.name)}</h3>
              <span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-muted); padding: 2px 6px; font-size: 0.65rem;">
                ${w.type.toUpperCase()}
              </span>
            </div>
          </div>

          <div style="text-align: right;">
            <div class="amount-display" style="font-size: 1.15rem; font-weight: 800; color: #fff;">
              ${appState.settings.hideBalance ? '••••••' : formatRupiah(w.balance)}
            </div>
            <button class="btn btn-secondary btn-edit-wallet" data-id="${w.id}" style="padding: 4px 10px; font-size: 0.72rem; margin-top: 6px;">
              Ubah / Hapus
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.btn-edit-wallet').forEach(btn => {
      btn.addEventListener('click', () => openEditWalletModal(btn.dataset.id));
    });
  }

  // 5. Utang & Piutang Tab View
  function renderDebtTab() {
    const summary = getDebtsSummary();
    const isReceivable = activeDebtSubtab === 'receivable';

    const kpiLabel = document.getElementById('debt-kpi-label');
    const kpiTotal = document.getElementById('debt-page-total');
    const kpiBadge = document.getElementById('debt-page-badge');
    const kpiDesc = document.getElementById('debt-kpi-desc');
    const kpiCard = document.getElementById('debt-kpi-card');

    if (isReceivable) {
      kpiLabel.textContent = 'Total Piutang Belum Dilunasi (Hak Tagih)';
      kpiLabel.style.color = '#34d399';
      kpiTotal.textContent = formatRupiah(summary.receivableTotal);
      kpiBadge.textContent = `${summary.receivableCount} Debitur`;
      kpiBadge.className = 'badge badge-safe';
      kpiDesc.textContent = 'Uang Anda yang dipinjam atau ditalangi untuk pihak lain. Saat menerima pelunasan, saldo rekening yang Anda pilih otomatis bertambah.';
      kpiCard.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      kpiCard.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(20, 30, 51, 0.8) 100%)';
    } else {
      kpiLabel.textContent = 'Total Utang Belum Dibayar (Kewajiban)';
      kpiLabel.style.color = '#fb7185';
      kpiTotal.textContent = formatRupiah(summary.payableTotal);
      kpiBadge.textContent = `${summary.payableCount} Kreditur`;
      kpiBadge.className = 'badge badge-danger';
      kpiDesc.textContent = 'Kewajiban pinjaman yang harus Anda bayarkan kepada pihak lain. Saat Anda membayar utang, saldo rekening yang Anda pilih otomatis terpotong.';
      kpiCard.style.borderColor = 'rgba(244, 63, 94, 0.3)';
      kpiCard.style.background = 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(20, 30, 51, 0.8) 100%)';
    }

    const container = document.getElementById('debts-list-container');
    const filtered = appState.debts.filter(d => {
      if ((d.debtType || 'receivable') !== activeDebtSubtab) return false;
      if (activeDebtFilter === 'unpaid') return d.status !== 'paid';
      return d.status === 'paid';
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${isReceivable ? '🤝' : '📑'}</div>
          <div class="empty-title">Tidak ada catatan ${isReceivable ? 'piutang' : 'utang'} ${activeDebtFilter === 'unpaid' ? 'yang belum lunas' : 'pada riwayat selesai'}</div>
          <div class="empty-desc">
            ${activeDebtFilter === 'unpaid'
              ? (isReceivable ? 'Seluruh piutang Anda telah dilunasi dengan tertib.' : 'Anda tidak memiliki kewajiban utang aktif saat ini.')
              : 'Belum ada riwayat pelunasan pada kategori ini.'}
          </div>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(debt => {
      const isPaid = debt.status === 'paid';
      const wallet = appState.wallets.find(w => w.id === debt.walletId);
      const walletName = wallet ? wallet.name : 'Rekening';

      html += `
        <div class="debt-card">
          <div class="debt-card-header">
            <div class="debt-person">
              <span>👤 ${escapeHtml(debt.personName)}</span>
            </div>
            <span class="debt-status-tag ${isPaid ? 'debt-status-paid' : 'debt-status-unpaid'}">
              ${isPaid ? 'Lunas' : debt.status === 'partial' ? 'Sebagian' : 'Belum Lunas'}
            </span>
          </div>

          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
            ${escapeHtml(debt.note || (isReceivable ? 'Piutang' : 'Kewajiban Utang'))}
          </div>

          <div class="debt-details-row">
            <div>
              <span style="font-size: 0.72rem; color: var(--text-subtle); display: block;">Sisa yang Belum Selesai:</span>
              <div class="debt-amount-big amount-display" style="color: ${isReceivable ? 'var(--color-primary-light)' : '#fb7185'};">
                ${formatRupiah(debt.remainingAmount)}
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.72rem; color: var(--text-subtle); display: block;">Nominal Pokok Awal:</span>
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main);">${formatRupiah(debt.originalAmount)}</div>
              <span class="tx-wallet-badge" style="font-size: 0.65rem;">Rekening: ${walletName}</span>
            </div>
          </div>

          <div class="debt-actions">
            ${!isPaid ? `
              <button class="btn btn-primary btn-repay-debt" data-id="${debt.id}" style="padding: 7px 14px; font-size: 0.8rem; flex: 1;">
                ${isReceivable ? '💰 Catat Pelunasan (Uang Masuk)' : '💳 Catat Pembayaran (Uang Keluar)'}
              </button>
            ` : ''}
            <button class="btn btn-secondary btn-delete-debt" data-id="${debt.id}" style="padding: 7px 12px; font-size: 0.8rem;">
              Hapus
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.btn-repay-debt').forEach(btn => {
      btn.addEventListener('click', () => openRepayDebtModal(btn.dataset.id));
    });

    container.querySelectorAll('.btn-delete-debt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('Hapus catatan ini?')) {
          deleteDebt(id);
        }
      });
    });
  }

  // 6. Reports View
  function renderReportsTab() {
    const monthSelect = document.getElementById('reports-month-select');

    if (monthSelect.children.length === 0) {
      const now = new Date();
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = formatPeriodDisplay(val);
        monthSelect.appendChild(opt);
      }
    }

    const selectedMonth = monthSelect.value || currentPeriod;
    const stats = getPeriodStats(selectedMonth);

    document.getElementById('reports-total-expense').textContent = formatRupiah(stats.expense);

    drawDonutChart(stats);
    drawCashflowBarChart(stats);
  }

  function drawDonutChart(stats) {
    const canvas = document.getElementById('category-donut-chart');
    const legend = document.getElementById('donut-legend-container');
    if (!canvas || !legend) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const total = stats.expense;
    const catEntries = Object.entries(stats.categoryTotals)
      .map(([catId, amount]) => {
        const cat = appState.categories.find(c => c.id === catId);
        return {
          id: catId,
          name: cat ? cat.name : 'Lainnya',
          icon: cat ? cat.icon : '📦',
          color: cat ? cat.color : '#64748b',
          amount
        };
      })
      .sort((a, b) => b.amount - a.amount);

    if (total === 0 || catEntries.length === 0) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 80, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 24;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 13px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Belum Ada Pengeluaran', w / 2, h / 2);
      legend.innerHTML = '';
      return;
    }

    const centerX = w / 2;
    const centerY = h / 2;
    const radius = 80;
    const lineWidth = 26;

    let startAngle = -Math.PI / 2;

    catEntries.forEach(item => {
      const sliceAngle = (item.amount / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = item.color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'butt';
      ctx.stroke();

      startAngle = endAngle;
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Total Pengeluaran', centerX, centerY - 10);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px Plus Jakarta Sans, sans-serif';
    ctx.fillText(formatRupiah(total), centerX, centerY + 10);

    legend.innerHTML = catEntries.map(item => {
      const pct = Math.round((item.amount / total) * 100);
      return `
        <div class="legend-item">
          <div class="legend-color-dot" style="background: ${item.color};"></div>
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${item.icon} ${escapeHtml(item.name)} <strong>(${pct}%)</strong>
          </span>
        </div>
      `;
    }).join('');
  }

  function drawCashflowBarChart(stats) {
    const canvas = document.getElementById('cashflow-bar-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(stats.income, stats.expense, 100000);
    const paddingBottom = 40;
    const chartHeight = h - paddingBottom - 20;

    const incomeBarH = (stats.income / maxVal) * chartHeight;
    const expenseBarH = (stats.expense / maxVal) * chartHeight;

    const barWidth = 60;
    const xIncome = w * 0.3 - barWidth / 2;
    const xExpense = w * 0.7 - barWidth / 2;

    ctx.fillStyle = '#10b981';
    roundRect(ctx, xIncome, h - paddingBottom - incomeBarH, barWidth, incomeBarH, 8);
    ctx.fill();

    ctx.fillStyle = '#f43f5e';
    roundRect(ctx, xExpense, h - paddingBottom - expenseBarH, barWidth, expenseBarH, 8);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';

    ctx.fillText('Pemasukan', w * 0.3, h - 14);
    ctx.fillText('Pengeluaran', w * 0.7, h - 14);

    ctx.fillStyle = '#34d399';
    ctx.font = '700 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText(formatRupiah(stats.income), w * 0.3, Math.max(16, h - paddingBottom - incomeBarH - 8));

    ctx.fillStyle = '#fb7185';
    ctx.fillText(formatRupiah(stats.expense), w * 0.7, Math.max(16, h - paddingBottom - expenseBarH - 8));
  }

  function roundRect(ctx, x, y, width, height, radius) {
    if (height < 2) height = 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // --- CRUD ACTIONS ---

  function addTransaction(txData) {
    const id = generateId('tx');
    const amount = Number(txData.amount) || 0;
    if (amount <= 0) {
      showToast('Nominal transaksi harus lebih dari 0', 'error');
      return false;
    }

    const sourceWallet = appState.wallets.find(w => w.id === txData.walletId);
    if (!sourceWallet) {
      showToast('Pilih rekening sumber yang valid!', 'error');
      return false;
    }

    if (txData.type === 'expense') {
      sourceWallet.balance -= amount;
    } else if (txData.type === 'income') {
      sourceWallet.balance += amount;
    } else if (txData.type === 'transfer') {
      const targetWallet = appState.wallets.find(w => w.id === txData.targetWalletId);
      if (!targetWallet) {
        showToast('Pilih rekening tujuan transfer!', 'error');
        return false;
      }
      if (sourceWallet.id === targetWallet.id) {
        showToast('Rekening asal dan tujuan tidak boleh sama!', 'error');
        return false;
      }
      const fee = Number(txData.fee) || 0;
      sourceWallet.balance -= (amount + fee);
      targetWallet.balance += amount;
    } else if (txData.type === 'debt') {
      const debtType = txData.debtType || 'receivable';
      const debtId = generateId('debt');

      if (debtType === 'receivable') {
        // Piutang: Uang kita keluar dipinjamkan ke pihak lain
        sourceWallet.balance -= amount;
        txData.type = 'receivable_lend';
      } else {
        // Utang: Uang pinjaman masuk ke dompet kita
        sourceWallet.balance += amount;
        txData.type = 'payable_borrow';
      }

      appState.debts.unshift({
        id: debtId,
        debtType, // 'receivable' or 'payable'
        personName: txData.personName || 'Pihak Terkait',
        originalAmount: amount,
        remainingAmount: amount,
        walletId: sourceWallet.id,
        note: txData.note || (debtType === 'receivable' ? 'Piutang' : 'Pinjaman Utang'),
        date: txData.date,
        dueDate: txData.dueDate || '',
        status: 'unpaid',
        repayments: []
      });

      txData.debtId = debtId;
    }

    const newTx = {
      id,
      type: txData.type,
      amount,
      walletId: txData.walletId,
      targetWalletId: txData.targetWalletId || null,
      categoryId: txData.categoryId || null,
      note: txData.note || '',
      personName: txData.personName || '',
      debtId: txData.debtId || null,
      fee: txData.fee || 0,
      date: txData.date || getCurrentDateFormatted(),
      time: getCurrentTimeFormatted()
    };

    appState.transactions.unshift(newTx);
    saveState();
    refreshAllViews();
    showToast('Mutasi transaksi berhasil disimpan ✓', 'success');
    return true;
  }

  function deleteTransaction(id) {
    const idx = appState.transactions.findIndex(t => t.id === id);
    if (idx === -1) return;

    const tx = appState.transactions[idx];
    const amount = Number(tx.amount) || 0;
    const sourceWallet = appState.wallets.find(w => w.id === tx.walletId);

    if (sourceWallet) {
      if (tx.type === 'expense' || tx.type === 'receivable_lend' || tx.type === 'payable_repay') {
        sourceWallet.balance += amount;
      } else if (tx.type === 'income' || tx.type === 'payable_borrow' || tx.type === 'receivable_repay') {
        sourceWallet.balance -= amount;
      } else if (tx.type === 'transfer') {
        sourceWallet.balance += (amount + (Number(tx.fee) || 0));
        const targetWallet = appState.wallets.find(w => w.id === tx.targetWalletId);
        if (targetWallet) targetWallet.balance -= amount;
      }
    }

    appState.transactions.splice(idx, 1);
    saveState();
    refreshAllViews();
    showToast('Catatan mutasi berhasil dihapus', 'info');
  }

  function repayDebt(debtId, amount, targetWalletId, note, date) {
    const debt = appState.debts.find(d => d.id === debtId);
    if (!debt) return false;

    const targetWallet = appState.wallets.find(w => w.id === targetWalletId);
    if (!targetWallet) {
      showToast('Pilih rekening transaksi!', 'error');
      return false;
    }

    const repayAmt = Number(amount) || 0;
    if (repayAmt <= 0) {
      showToast('Nominal pembayaran tidak valid!', 'error');
      return false;
    }

    const isReceivable = (debt.debtType || 'receivable') === 'receivable';

    if (isReceivable) {
      // Pelunasan Piutang: Pihak lain membayar -> uang MASUK ke dompet kita
      targetWallet.balance += repayAmt;
    } else {
      // Pembayaran Utang: Kita membayar utang -> uang KELUAR dari dompet kita
      targetWallet.balance -= repayAmt;
    }

    debt.remainingAmount = Math.max(0, debt.remainingAmount - repayAmt);
    debt.status = debt.remainingAmount === 0 ? 'paid' : 'partial';
    debt.repayments.push({
      date: date || getCurrentDateFormatted(),
      amount: repayAmt,
      walletId: targetWalletId,
      note: note || ''
    });

    const txType = isReceivable ? 'receivable_repay' : 'payable_repay';
    const txId = generateId('tx');
    appState.transactions.unshift({
      id: txId,
      type: txType,
      amount: repayAmt,
      walletId: targetWalletId,
      personName: debt.personName,
      debtId: debt.id,
      note: (isReceivable ? 'Pelunasan piutang: ' : 'Pembayaran utang kepada: ') + debt.personName + (note ? ' - ' + note : ''),
      date: date || getCurrentDateFormatted(),
      time: getCurrentTimeFormatted()
    });

    saveState();
    refreshAllViews();
    showToast(`Transaksi pembayaran berhasil dikonfirmasi ✓`, 'success');
    return true;
  }

  function deleteDebt(debtId) {
    const idx = appState.debts.findIndex(d => d.id === debtId);
    if (idx === -1) return;
    appState.debts.splice(idx, 1);
    saveState();
    refreshAllViews();
    showToast('Catatan berhasil dihapus', 'info');
  }

  // Category CRUD
  function saveCategory(catData) {
    const name = catData.name.trim();
    if (!name) {
      showToast('Nama kategori harus diisi!', 'error');
      return false;
    }

    const budget = Number(catData.budget) || 0;

    if (catData.id) {
      const cat = appState.categories.find(c => c.id === catData.id);
      if (!cat) return false;
      cat.name = name;
      cat.type = catData.type;
      cat.icon = catData.icon || '🏷️';
      cat.budget = budget;

      // Update current period budget allocation
      const pBudget = getPeriodBudget(currentPeriod);
      if (!pBudget.categories) pBudget.categories = {};
      pBudget.categories[cat.id] = budget;

      showToast(`Kategori "${name}" berhasil diperbarui ✓`, 'success');
    } else {
      const newId = generateId('cat');
      const newCat = {
        id: newId,
        name,
        type: catData.type,
        icon: catData.icon || '🏷️',
        color: catData.color || '#3b82f6',
        budget
      };
      appState.categories.push(newCat);

      const pBudget = getPeriodBudget(currentPeriod);
      if (!pBudget.categories) pBudget.categories = {};
      pBudget.categories[newId] = budget;

      showToast(`Kategori "${name}" berhasil ditambahkan ✓`, 'success');
    }

    saveState();
    refreshAllViews();
    return true;
  }

  function deleteCategory(catId) {
    const idx = appState.categories.findIndex(c => c.id === catId);
    if (idx === -1) return;

    const name = appState.categories[idx].name;
    appState.categories.splice(idx, 1);

    // Remove from period budget allocations
    Object.values(appState.budgetsByPeriod || {}).forEach(b => {
      if (b.categories && b.categories[catId]) {
        delete b.categories[catId];
      }
    });

    saveState();
    refreshAllViews();
    showToast(`Kategori "${name}" telah dihapus`, 'info');
  }

  // Wallet CRUD
  function saveWallet(walletData) {
    const name = walletData.name.trim();
    if (!name) {
      showToast('Nama rekening/akun harus diisi!', 'error');
      return false;
    }

    const balance = Number(walletData.balance) || 0;

    if (walletData.id) {
      const w = appState.wallets.find(x => x.id === walletData.id);
      if (!w) return false;
      w.name = name;
      w.type = walletData.type;
      w.balance = balance;
      w.color = walletData.color;
      showToast(`Akun "${name}" diperbarui ✓`, 'success');
    } else {
      const newWallet = {
        id: generateId('w'),
        name,
        type: walletData.type,
        balance,
        initialBalance: balance,
        color: walletData.color || '#10b981'
      };
      appState.wallets.push(newWallet);
      showToast(`Akun "${name}" berhasil ditambahkan ✓`, 'success');
    }

    saveState();
    refreshAllViews();
    return true;
  }

  function deleteWallet(id) {
    if (appState.wallets.length <= 1) {
      showToast('Anda harus memiliki minimal 1 akun aktif!', 'error');
      return;
    }
    const idx = appState.wallets.findIndex(w => w.id === id);
    if (idx === -1) return;

    const wName = appState.wallets[idx].name;
    appState.wallets.splice(idx, 1);
    saveState();
    refreshAllViews();
    showToast(`Akun "${wName}" telah dihapus`, 'info');
  }

  // Copy budget from previous month
  function copyBudgetFromPreviousPeriod() {
    const prevPeriod = getShiftedPeriod(currentPeriod, -1);
    const prevBudget = appState.budgetsByPeriod && appState.budgetsByPeriod[prevPeriod];

    if (!prevBudget || (!prevBudget.global && Object.keys(prevBudget.categories || {}).length === 0)) {
      showToast(`Belum ada data anggaran pada bulan ${formatPeriodDisplay(prevPeriod)} untuk disalin!`, 'info');
      return;
    }

    const curBudget = getPeriodBudget(currentPeriod);
    curBudget.global = prevBudget.global || 0;
    curBudget.categories = JSON.parse(JSON.stringify(prevBudget.categories || {}));

    saveState();
    refreshAllViews();
    showToast(`Anggaran berhasil disalin dari bulan ${formatPeriodDisplay(prevPeriod)} ✓`, 'success');
  }

  // --- EXPORT & BACKUP ENGINE ---
  function exportToExcelCSV() {
    if (appState.transactions.length === 0) {
      showToast('Belum ada transaksi untuk diekspor!', 'error');
      return;
    }

    let csvContent = '\uFEFF';
    csvContent += 'ID Transaksi;Tanggal;Waktu;Tipe Mutasi;Kategori;Rekening Sumber;Rekening Tujuan / Pihak Terkait;Keterangan;Nominal (Rp);Biaya Admin (Rp)\r\n';

    appState.transactions.forEach(tx => {
      const wallet = appState.wallets.find(w => w.id === tx.walletId);
      const targetWallet = tx.targetWalletId ? appState.wallets.find(w => w.id === tx.targetWalletId) : null;
      const category = tx.categoryId ? appState.categories.find(c => c.id === tx.categoryId) : null;

      let typeLabel = tx.type;
      if (tx.type === 'expense') typeLabel = 'Pengeluaran';
      else if (tx.type === 'income') typeLabel = 'Pemasukan';
      else if (tx.type === 'transfer') typeLabel = 'Transfer Antar Rekening';
      else if (tx.type === 'receivable_lend') typeLabel = 'Piutang Diberikan';
      else if (tx.type === 'receivable_repay') typeLabel = 'Pelunasan Piutang';
      else if (tx.type === 'payable_borrow') typeLabel = 'Utang Diterima';
      else if (tx.type === 'payable_repay') typeLabel = 'Pembayaran Utang';

      const catName = category ? category.name : '-';
      const sourceName = wallet ? wallet.name : '-';
      const destName = targetWallet ? targetWallet.name : (tx.personName || '-');
      const noteClean = (tx.note || '').replace(/;/g, ',');

      csvContent += `${tx.id};${tx.date};${tx.time || ''};${typeLabel};${catName};${sourceName};${destName};"${noteClean}";${tx.amount};${tx.fee || 0}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinFlow_Mutasi_${getCurrentDateFormatted()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Berkas Excel / CSV berhasil diunduh! 📊', 'success');
  }

  function exportBackupJSON() {
    const dataStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinFlow_Backup_${getCurrentDateFormatted()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Cadangan JSON berhasil diunduh 💾', 'success');
  }

  function restoreBackupJSON(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.wallets) {
          appState = parsed;
          saveState();
          refreshAllViews();
          closeModal('modal-backup');
          showToast('Data berhasil dipulihkan secara utuh ✓', 'success');
        } else {
          showToast('Format berkas cadangan tidak valid!', 'error');
        }
      } catch (err) {
        showToast('Gagal memproses berkas cadangan JSON!', 'error');
      }
    };
    reader.readAsText(file);
  }

  // --- MODAL CONTROLLERS ---

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  let currentSelectedTxType = 'expense';
  let currentSelectedCategoryId = '';

  function openTransactionModal(type = 'expense') {
    currentSelectedTxType = type;

    document.querySelectorAll('#form-transaction .segmented-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.txType === type) btn.classList.add('active');
    });

    updateTxModalFields(type);

    document.getElementById('tx-amount-input').value = '';
    document.getElementById('tx-note-input').value = '';
    document.getElementById('tx-date-input').value = getCurrentDateFormatted();
    document.getElementById('debt-person-input').value = '';

    const walletSelect = document.getElementById('tx-source-wallet');
    const targetWalletSelect = document.getElementById('tx-target-wallet');
    walletSelect.innerHTML = appState.wallets.map(w => `<option value="${w.id}">${escapeHtml(w.name)} (${formatRupiah(w.balance)})</option>`).join('');
    targetWalletSelect.innerHTML = appState.wallets.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');

    renderCategoryPicker(type);
    openModal('modal-transaction');
    document.getElementById('tx-amount-input').focus();
  }

  function updateTxModalFields(type) {
    const debtSec = document.getElementById('debt-fields-section');
    const transferSec = document.getElementById('transfer-fields-section');
    const catSec = document.getElementById('tx-category-section');
    const walletLabel = document.getElementById('tx-wallet-label');

    if (type === 'debt') {
      debtSec.style.display = 'block';
      transferSec.style.display = 'none';
      catSec.style.display = 'none';
      const debtType = document.getElementById('debt-type-select').value;
      walletLabel.textContent = debtType === 'receivable' ? 'Uang Keluar dari Rekening Mana?' : 'Uang Masuk ke Rekening Mana?';
    } else if (type === 'transfer') {
      debtSec.style.display = 'none';
      transferSec.style.display = 'block';
      catSec.style.display = 'none';
      walletLabel.textContent = 'Rekening Sumber:';
    } else {
      debtSec.style.display = 'none';
      transferSec.style.display = 'none';
      catSec.style.display = 'block';
      walletLabel.textContent = type === 'expense' ? 'Sumber Rekening / Kas' : 'Tujuan Rekening / Kas';
      renderCategoryPicker(type);
    }
  }

  function renderCategoryPicker(type) {
    const grid = document.getElementById('category-picker-grid');
    if (!grid) return;

    const targetType = type === 'income' ? 'income' : 'expense';
    const categories = appState.categories.filter(c => c.type === targetType);

    if (categories.length > 0 && !categories.some(c => c.id === currentSelectedCategoryId)) {
      currentSelectedCategoryId = categories[0].id;
    }

    grid.innerHTML = categories.map(cat => `
      <div class="category-pick-item ${cat.id === currentSelectedCategoryId ? 'active' : ''}" data-cat-id="${cat.id}">
        <div class="category-pick-icon" style="background: rgba(255,255,255,0.06); font-size: 1.2rem;">
          ${cat.icon || '🏷️'}
        </div>
        <div class="category-pick-label">${escapeHtml(cat.name)}</div>
      </div>
    `).join('');

    updateCategoryRemainingHint();

    grid.querySelectorAll('.category-pick-item').forEach(item => {
      item.addEventListener('click', () => {
        grid.querySelectorAll('.category-pick-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentSelectedCategoryId = item.dataset.catId;
        updateCategoryRemainingHint();
      });
    });
  }

  function updateCategoryRemainingHint() {
    const hint = document.getElementById('tx-budget-remaining-hint');
    if (!hint || !currentSelectedCategoryId) return;

    const bConfig = getPeriodBudget(currentPeriod);
    const cat = appState.categories.find(c => c.id === currentSelectedCategoryId);
    const catLimit = (bConfig.categories && bConfig.categories[currentSelectedCategoryId]) || 0;

    if (catLimit > 0) {
      const stats = getPeriodStats(currentPeriod);
      const spent = stats.categoryTotals[currentSelectedCategoryId] || 0;
      const rem = Math.max(0, catLimit - spent);
      hint.textContent = `Sisa Anggaran ${cat ? cat.name : ''}: ${formatRupiah(rem)}`;
    } else {
      hint.textContent = '';
    }
  }

  function openAddCategoryModal() {
    document.getElementById('category-modal-title').textContent = 'Tambah Pos Kategori Baru';
    document.getElementById('category-edit-id').value = '';
    document.getElementById('cat-name-input').value = '';
    document.getElementById('cat-type-select').value = 'expense';
    document.getElementById('cat-icon-input').value = '🏷️';
    document.getElementById('cat-budget-input').value = '';
    openModal('modal-category');
  }

  function openEditCategoryModal(catId) {
    const cat = appState.categories.find(c => c.id === catId);
    if (!cat) return;

    const bConfig = getPeriodBudget(currentPeriod);
    const allocated = (bConfig.categories && bConfig.categories[cat.id]) !== undefined
      ? bConfig.categories[cat.id]
      : (cat.budget || 0);

    document.getElementById('category-modal-title').textContent = 'Edit Pos Kategori';
    document.getElementById('category-edit-id').value = cat.id;
    document.getElementById('cat-name-input').value = cat.name;
    document.getElementById('cat-type-select').value = cat.type;
    document.getElementById('cat-icon-input').value = cat.icon || '🏷️';
    document.getElementById('cat-budget-input').value = allocated || '';
    openModal('modal-category');
  }

  function openAddWalletModal() {
    document.getElementById('wallet-modal-title').textContent = 'Tambah Rekening Baru';
    document.getElementById('wallet-edit-id').value = '';
    document.getElementById('wallet-name-input').value = '';
    document.getElementById('wallet-type-select').value = 'bank';
    document.getElementById('wallet-balance-input').value = '';
    document.getElementById('btn-delete-wallet').style.display = 'none';
    openModal('modal-wallet');
  }

  function openEditWalletModal(walletId) {
    const wallet = appState.wallets.find(w => w.id === walletId);
    if (!wallet) return;

    document.getElementById('wallet-modal-title').textContent = 'Ubah Informasi Rekening';
    document.getElementById('wallet-edit-id').value = wallet.id;
    document.getElementById('wallet-name-input').value = wallet.name;
    document.getElementById('wallet-type-select').value = wallet.type;
    document.getElementById('wallet-balance-input').value = wallet.balance;
    document.getElementById('btn-delete-wallet').style.display = 'inline-flex';
    openModal('modal-wallet');
  }

  function openRepayDebtModal(debtId) {
    const debt = appState.debts.find(d => d.id === debtId);
    if (!debt) return;

    const isReceivable = (debt.debtType || 'receivable') === 'receivable';

    document.getElementById('repay-modal-title').textContent = isReceivable ? 'Penerimaan Pelunasan Piutang' : 'Pembayaran Pelunasan Utang';
    document.getElementById('repay-party-label').textContent = isReceivable ? 'Debitur (Pihak yang Melunasi):' : 'Kreditur (Pemberi Pinjaman):';
    document.getElementById('repay-debt-id').value = debt.id;
    document.getElementById('repay-person-name').textContent = debt.personName;
    document.getElementById('repay-amount-due').textContent = formatRupiah(debt.remainingAmount);
    document.getElementById('repay-amount-input').value = debt.remainingAmount;
    document.getElementById('repay-date-input').value = getCurrentDateFormatted();
    document.getElementById('repay-note-input').value = '';

    document.getElementById('repay-wallet-label').textContent = isReceivable ? 'Dana Masuk ke Rekening Mana?' : 'Dibayar dari Rekening Mana?';
    document.getElementById('repay-wallet-hint').textContent = isReceivable
      ? '✓ Saldo rekening terpilih akan otomatis bertambah.'
      : '✓ Saldo rekening terpilih akan otomatis berkurang.';

    const targetSelect = document.getElementById('repay-target-wallet');
    targetSelect.innerHTML = appState.wallets.map(w => `<option value="${w.id}">${escapeHtml(w.name)} (${formatRupiah(w.balance)})</option>`).join('');

    openModal('modal-repay-debt');
  }

  function openGlobalBudgetModal() {
    const bConfig = getPeriodBudget(currentPeriod);
    document.getElementById('budget-modal-period-title').textContent = formatPeriodDisplay(currentPeriod);
    document.getElementById('budget-global-input').value = bConfig.global || '';
    openModal('modal-budget');
  }

  // --- REFRESH ALL VIEWS ---
  function refreshAllViews() {
    renderDashboard();
    renderTransactionsTab();
    renderBudgetTab();
    renderWalletsTab();
    renderDebtTab();
    renderReportsTab();

    const walletFilterSelect = document.getElementById('tx-wallet-filter');
    if (walletFilterSelect) {
      const cur = walletFilterSelect.value;
      walletFilterSelect.innerHTML = '<option value="all">Semua Rekening/Dompet</option>' +
        appState.wallets.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
      walletFilterSelect.value = cur || 'all';
    }
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const targetView = document.getElementById(tabId);
    if (targetView) targetView.classList.add('active');

    const navBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (navBtn) navBtn.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabId === 'tab-dashboard') renderDashboard();
    else if (tabId === 'tab-transactions') renderTransactionsTab();
    else if (tabId === 'tab-budget') renderBudgetTab();
    else if (tabId === 'tab-wallets') renderWalletsTab();
    else if (tabId === 'tab-debt') renderDebtTab();
    else if (tabId === 'tab-reports') renderReportsTab();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // --- EVENT LISTENERS ---
  function initEventListeners() {
    // Bottom Nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        if (tabId) switchTab(tabId);
      });
    });

    // Floating Action Button (+)
    document.getElementById('fab-add-transaction').addEventListener('click', () => {
      openTransactionModal('expense');
    });

    // Quick Actions
    document.getElementById('qa-btn-expense').addEventListener('click', () => openTransactionModal('expense'));
    document.getElementById('qa-btn-income').addEventListener('click', () => openTransactionModal('income'));
    document.getElementById('qa-btn-transfer').addEventListener('click', () => openTransactionModal('transfer'));
    document.getElementById('qa-btn-debt').addEventListener('click', () => openTransactionModal('debt'));

    // Dashboard Links
    document.getElementById('link-manage-wallets').addEventListener('click', () => switchTab('tab-wallets'));
    document.getElementById('link-all-transactions').addEventListener('click', () => switchTab('tab-transactions'));
    document.getElementById('btn-goto-debt').addEventListener('click', () => switchTab('tab-debt'));

    // Eye toggle
    document.getElementById('btn-toggle-eye').addEventListener('click', () => {
      appState.settings.hideBalance = !appState.settings.hideBalance;
      saveState();
      renderDashboard();
      renderWalletsTab();
    });

    // Period Navigation (Dashboard & Budget Tabs)
    const handlePrevMonth = () => {
      currentPeriod = getShiftedPeriod(currentPeriod, -1);
      refreshAllViews();
    };
    const handleNextMonth = () => {
      currentPeriod = getShiftedPeriod(currentPeriod, 1);
      refreshAllViews();
    };

    document.getElementById('dash-prev-month').addEventListener('click', handlePrevMonth);
    document.getElementById('dash-next-month').addEventListener('click', handleNextMonth);
    document.getElementById('budget-prev-month').addEventListener('click', handlePrevMonth);
    document.getElementById('budget-next-month').addEventListener('click', handleNextMonth);

    // Segmented Type Buttons in Transaction Modal
    document.querySelectorAll('#form-transaction .segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#form-transaction .segmented-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.txType;
        currentSelectedTxType = type;
        updateTxModalFields(type);
      });
    });

    // Debt Type change listener
    document.getElementById('debt-type-select').addEventListener('change', () => {
      const dType = document.getElementById('debt-type-select').value;
      const label = document.getElementById('debt-person-label');
      const wLabel = document.getElementById('tx-wallet-label');
      if (dType === 'receivable') {
        label.textContent = 'Nama Debitur (Pihak yang Meminjam) *';
        wLabel.textContent = 'Uang Keluar dari Rekening Mana?';
      } else {
        label.textContent = 'Nama Kreditur (Pemberi Pinjaman) *';
        wLabel.textContent = 'Uang Masuk ke Rekening Mana?';
      }
    });

    // Quick Nominal Presets
    document.querySelectorAll('.preset-chip[data-add]').forEach(chip => {
      chip.addEventListener('click', () => {
        const addVal = parseInt(chip.dataset.add, 10);
        const amountInput = document.getElementById('tx-amount-input');
        const currentVal = parseInt(amountInput.value.replace(/\D/g, ''), 10) || 0;
        amountInput.value = (currentVal + addVal);
        updateCategoryRemainingHint();
      });
    });

    document.getElementById('btn-clear-amount').addEventListener('click', () => {
      document.getElementById('tx-amount-input').value = '';
    });

    // Transaction Form Submit
    document.getElementById('form-transaction').addEventListener('submit', (e) => {
      e.preventDefault();
      const rawAmt = document.getElementById('tx-amount-input').value.replace(/\D/g, '');
      const amount = parseInt(rawAmt, 10) || 0;
      const walletId = document.getElementById('tx-source-wallet').value;
      const targetWalletId = document.getElementById('tx-target-wallet').value;
      const note = document.getElementById('tx-note-input').value.trim();
      const date = document.getElementById('tx-date-input').value;
      const personName = document.getElementById('debt-person-input').value.trim();
      const dueDate = document.getElementById('debt-due-date-input').value;
      const adminFee = parseInt((document.getElementById('tx-admin-fee').value || '0').replace(/\D/g, ''), 10) || 0;
      const debtType = document.getElementById('debt-type-select').value;

      if (currentSelectedTxType === 'debt' && !personName) {
        showToast('Nama pihak terkait harus diisi!', 'error');
        return;
      }

      const success = addTransaction({
        type: currentSelectedTxType,
        debtType,
        amount,
        walletId,
        targetWalletId,
        categoryId: currentSelectedCategoryId,
        note,
        personName,
        dueDate,
        fee: adminFee,
        date
      });

      if (success) {
        closeModal('modal-transaction');
      }
    });

    // Transaction Filters
    document.getElementById('tx-search-input').addEventListener('input', renderTransactionsTab);
    document.getElementById('tx-wallet-filter').addEventListener('change', renderTransactionsTab);
    document.getElementById('tx-time-filter').addEventListener('change', renderTransactionsTab);
    document.querySelectorAll('#tx-type-filter-row .pill-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#tx-type-filter-row .pill-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTransactionsTab();
      });
    });

    // Category Management
    document.getElementById('btn-add-category-trigger').addEventListener('click', openAddCategoryModal);

    document.querySelectorAll('.emoji-pick').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('cat-icon-input').value = btn.dataset.emoji;
      });
    });

    document.getElementById('form-category').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('category-edit-id').value;
      const name = document.getElementById('cat-name-input').value;
      const type = document.getElementById('cat-type-select').value;
      const icon = document.getElementById('cat-icon-input').value;
      const rawBudget = document.getElementById('cat-budget-input').value.replace(/\D/g, '');
      const budget = parseInt(rawBudget, 10) || 0;

      const success = saveCategory({
        id: id || null,
        name,
        type,
        icon,
        budget
      });

      if (success) {
        closeModal('modal-category');
      }
    });

    // Budget Total Modal & Copy
    document.getElementById('btn-edit-global-budget').addEventListener('click', openGlobalBudgetModal);
    document.getElementById('btn-copy-prev-budget').addEventListener('click', copyBudgetFromPreviousPeriod);

    document.getElementById('form-budget-settings').addEventListener('submit', (e) => {
      e.preventDefault();
      const rawGlobal = document.getElementById('budget-global-input').value.replace(/\D/g, '');
      const globalAmt = parseInt(rawGlobal, 10) || 0;

      const bConfig = getPeriodBudget(currentPeriod);
      bConfig.global = globalAmt;

      saveState();
      refreshAllViews();
      closeModal('modal-budget');
      showToast(`Plafon anggaran bulan ${formatPeriodDisplay(currentPeriod)} berhasil disimpan ✓`, 'success');
    });

    // Wallets Trigger
    document.getElementById('btn-add-wallet-trigger').addEventListener('click', openAddWalletModal);
    document.getElementById('btn-quick-transfer').addEventListener('click', () => openTransactionModal('transfer'));

    let selectedWalletColor = '#10b981';
    document.querySelectorAll('.color-picker-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-picker-dot').forEach(d => d.style.borderColor = 'transparent');
        dot.style.borderColor = '#fff';
        selectedWalletColor = dot.dataset.color;
      });
    });

    document.getElementById('form-wallet').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('wallet-edit-id').value;
      const name = document.getElementById('wallet-name-input').value;
      const type = document.getElementById('wallet-type-select').value;
      const rawBalance = document.getElementById('wallet-balance-input').value.replace(/\D/g, '');
      const balance = parseInt(rawBalance, 10) || 0;

      const success = saveWallet({
        id: id || null,
        name,
        type,
        balance,
        color: selectedWalletColor
      });

      if (success) {
        closeModal('modal-wallet');
      }
    });

    document.getElementById('btn-delete-wallet').addEventListener('click', () => {
      const id = document.getElementById('wallet-edit-id').value;
      if (id && confirm('Hapus rekening ini dari daftar?')) {
        deleteWallet(id);
        closeModal('modal-wallet');
      }
    });

    // Utang & Piutang Dual Sub-tabs
    document.getElementById('btn-tab-receivable').addEventListener('click', () => {
      activeDebtSubtab = 'receivable';
      document.getElementById('btn-tab-receivable').className = 'dual-tab-btn active tab-receivable';
      document.getElementById('btn-tab-payable').className = 'dual-tab-btn tab-payable';
      renderDebtTab();
    });

    document.getElementById('btn-tab-payable').addEventListener('click', () => {
      activeDebtSubtab = 'payable';
      document.getElementById('btn-tab-payable').className = 'dual-tab-btn active tab-payable';
      document.getElementById('btn-tab-receivable').className = 'dual-tab-btn tab-receivable';
      renderDebtTab();
    });

    document.getElementById('debt-filter-unpaid').addEventListener('click', () => {
      activeDebtFilter = 'unpaid';
      document.getElementById('debt-filter-unpaid').classList.add('active');
      document.getElementById('debt-filter-paid').classList.remove('active');
      renderDebtTab();
    });

    document.getElementById('debt-filter-paid').addEventListener('click', () => {
      activeDebtFilter = 'paid';
      document.getElementById('debt-filter-paid').classList.add('active');
      document.getElementById('debt-filter-unpaid').classList.remove('active');
      renderDebtTab();
    });

    document.getElementById('btn-add-debt-trigger').addEventListener('click', () => {
      openTransactionModal('debt');
    });

    document.getElementById('form-repay-debt').addEventListener('submit', (e) => {
      e.preventDefault();
      const debtId = document.getElementById('repay-debt-id').value;
      const rawAmt = document.getElementById('repay-amount-input').value.replace(/\D/g, '');
      const amount = parseInt(rawAmt, 10) || 0;
      const targetWalletId = document.getElementById('repay-target-wallet').value;
      const date = document.getElementById('repay-date-input').value;
      const note = document.getElementById('repay-note-input').value.trim();

      const success = repayDebt(debtId, amount, targetWalletId, note, date);
      if (success) {
        closeModal('modal-repay-debt');
      }
    });

    // Top Header Buttons
    document.getElementById('btn-open-backup').addEventListener('click', () => openModal('modal-backup'));
    document.getElementById('btn-open-reports-tab').addEventListener('click', () => switchTab('tab-reports'));

    // Excel & Backup Actions
    document.getElementById('btn-download-csv').addEventListener('click', exportToExcelCSV);
    document.getElementById('btn-export-excel-tx').addEventListener('click', exportToExcelCSV);
    document.getElementById('btn-export-json').addEventListener('click', exportBackupJSON);
    document.getElementById('input-restore-json').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        restoreBackupJSON(e.target.files[0]);
      }
    });

    // Clean Wipe / Reset All
    document.getElementById('btn-reset-all').addEventListener('click', () => {
      if (confirm('PERINGATAN RESMI: Seluruh riwayat mutasi, alokasi anggaran, dan akun akan dihapus bersih. Aplikasi akan kembali ke kondisi kosong awal. Lanjutkan?')) {
        localStorage.removeItem(STORAGE_KEY);
        loadState();
        refreshAllViews();
        closeModal('modal-backup');
        showToast('Seluruh data berhasil dibersihkan', 'info');
      }
    });

    // Reports Month Change
    document.getElementById('reports-month-select').addEventListener('change', () => {
      renderReportsTab();
    });

    // Modal close handlers
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.id);
      });
    });

    // Offline / Online detection
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }

  function updateOnlineStatus() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
      if (!navigator.onLine) {
        banner.classList.add('show');
      } else {
        banner.classList.remove('show');
      }
    }
  }

  // --- SERVICE WORKER (PWA) ---
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => {
            console.log('FinFlow Service Worker aktif:', reg.scope);
          })
          .catch(err => {
            console.log('Service Worker registrasi lewati:', err);
          });
      });
    }
  }

  // --- INITIALIZATION ---
  function init() {
    loadState();
    initEventListeners();
    refreshAllViews();
    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
