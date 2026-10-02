/**
 * FinFlow (Dompetku) - Core Application Logic
 * Offline-first Personal Finance & Budgeting PWA
 */

(function () {
  'use strict';

  // --- STORAGE KEYS ---
  const STORAGE_KEY = 'finflow_data_v1';

  // --- DEFAULT CATEGORIES ---
  const DEFAULT_CATEGORIES = [
    { id: 'cat_food', name: 'Makanan & Minuman', type: 'expense', icon: '🍜', color: '#f59e0b' },
    { id: 'cat_transport', name: 'Transportasi', type: 'expense', icon: '🛵', color: '#06b6d4' },
    { id: 'cat_shopping', name: 'Belanja', type: 'expense', icon: '🛍️', color: '#ec4899' },
    { id: 'cat_bills', name: 'Tagihan & Utilitas', type: 'expense', icon: '⚡', color: '#eab308' },
    { id: 'cat_entertainment', name: 'Hiburan & Hobi', type: 'expense', icon: '🎬', color: '#a855f7' },
    { id: 'cat_health', name: 'Kesehatan & Medis', type: 'expense', icon: '💊', color: '#10b981' },
    { id: 'cat_other_exp', name: 'Lain-lain', type: 'expense', icon: '📦', color: '#64748b' },
    { id: 'cat_salary', name: 'Gaji & Honor', type: 'income', icon: '💼', color: '#10b981' },
    { id: 'cat_business', name: 'Bisnis & Penjualan', type: 'income', icon: '📈', color: '#3b82f6' },
    { id: 'cat_gift', name: 'Hadiah / Bonus', type: 'income', icon: '🎁', color: '#f43f5e' },
    { id: 'cat_other_inc', name: 'Pemasukan Lain', type: 'income', icon: '✨', color: '#8b5cf6' }
  ];

  // --- INITIAL SAMPLE DATA (Realistic Indonesian Context) ---
  const INITIAL_SAMPLE_STATE = {
    wallets: [
      { id: 'w_bca', name: 'BCA Utama', type: 'bank', balance: 5200000, initialBalance: 5200000, color: '#0284c7' },
      { id: 'w_cash', name: 'Dompet Tunai', type: 'cash', balance: 450000, initialBalance: 450000, color: '#10b981' },
      { id: 'w_gopay', name: 'GoPay', type: 'ewallet', balance: 175000, initialBalance: 175000, color: '#0d9488' },
      { id: 'w_bibit', name: 'Tabungan Bibit', type: 'savings', balance: 3500000, initialBalance: 3500000, color: '#8b5cf6' }
    ],
    categories: DEFAULT_CATEGORIES,
    transactions: [
      {
        id: 'tx_demo_1',
        type: 'income',
        amount: 7000000,
        walletId: 'w_bca',
        categoryId: 'cat_salary',
        note: 'Gaji Bulanan',
        date: getCurrentDateFormatted(),
        time: '09:00'
      },
      {
        id: 'tx_demo_2',
        type: 'expense',
        amount: 32000,
        walletId: 'w_cash',
        categoryId: 'cat_food',
        note: 'Nasi Padang Rendang + Es Teh',
        date: getCurrentDateFormatted(),
        time: '12:30'
      },
      {
        id: 'tx_demo_3',
        type: 'expense',
        amount: 25000,
        walletId: 'w_gopay',
        categoryId: 'cat_transport',
        note: 'Gojek ke Kantor',
        date: getCurrentDateFormatted(),
        time: '08:15'
      },
      {
        id: 'tx_demo_4',
        type: 'expense',
        amount: 350000,
        walletId: 'w_bca',
        categoryId: 'cat_shopping',
        note: 'Belanja Bulanan Supermarket',
        date: getCurrentDateFormatted(),
        time: '19:40'
      },
      {
        id: 'tx_demo_5',
        type: 'debt_lend',
        amount: 50000,
        walletId: 'w_bca',
        note: 'Talangan Makan Siang Budi',
        personName: 'Budi Santoso',
        debtId: 'debt_demo_1',
        date: getCurrentDateFormatted(),
        time: '13:00'
      }
    ],
    debts: [
      {
        id: 'debt_demo_1',
        personName: 'Budi Santoso',
        originalAmount: 50000,
        remainingAmount: 50000,
        walletId: 'w_bca',
        note: 'Talangan Makan Siang Mie Ayam + Minum',
        date: getCurrentDateFormatted(),
        dueDate: '',
        status: 'unpaid',
        repayments: []
      }
    ],
    budgets: {
      monthlyGlobal: 4000000,
      categoryBudgets: {
        cat_food: 1500000,
        cat_transport: 500000,
        cat_shopping: 800000,
        cat_bills: 600000,
        cat_entertainment: 350000
      }
    },
    settings: {
      hideBalance: false
    }
  };

  // --- STATE ---
  let appState = null;

  // --- UTILS ---
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

  // --- PERSISTENCE ---
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        appState = JSON.parse(saved);
        // Ensure structure backward compatibility
        if (!appState.budgets) appState.budgets = INITIAL_SAMPLE_STATE.budgets;
        if (!appState.debts) appState.debts = [];
        if (!appState.categories) appState.categories = DEFAULT_CATEGORIES;
        if (!appState.settings) appState.settings = { hideBalance: false };
      } else {
        appState = JSON.parse(JSON.stringify(INITIAL_SAMPLE_STATE));
        saveState();
      }
    } catch (e) {
      console.error('Failed to load state, fallback to sample', e);
      appState = JSON.parse(JSON.stringify(INITIAL_SAMPLE_STATE));
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
      showToast('Gagal menyimpan perubahan ke memori!', 'error');
    }
  }

  // --- TOAST SYSTEM ---
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

  // --- CALCULATION ENGINE ---
  function calculateTotalNetWorth() {
    return appState.wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  }

  function getMonthStats(targetYearMonth) {
    if (!targetYearMonth) {
      const now = new Date();
      targetYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    let income = 0;
    let expense = 0;
    const categoryTotals = {};

    appState.transactions.forEach(tx => {
      if (!tx.date || !tx.date.startsWith(targetYearMonth)) return;

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

    return { income, expense, categoryTotals, targetYearMonth };
  }

  function getUnpaidDebtsTotal() {
    return appState.debts
      .filter(d => d.status !== 'paid')
      .reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);
  }

  function getUnpaidDebtsCount() {
    return appState.debts.filter(d => d.status !== 'paid').length;
  }

  // --- RENDERERS ---

  // 1. Dashboard Render
  function renderDashboard() {
    const netWorth = calculateTotalNetWorth();
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const stats = getMonthStats(currentYearMonth);

    // Dompet Induk Card
    const masterElem = document.getElementById('master-net-worth');
    if (appState.settings.hideBalance) {
      masterElem.textContent = '••••••••';
    } else {
      masterElem.textContent = formatRupiah(netWorth).replace('Rp ', '');
    }

    document.getElementById('dash-month-income').textContent = formatRupiah(stats.income);
    document.getElementById('dash-month-expense').textContent = formatRupiah(stats.expense);

    // Header date display
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    document.getElementById('header-date-label').textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    document.getElementById('active-month-badge').textContent = `${monthNames[now.getMonth()]}`;

    // Monthly Budget Bar
    const globalBudget = appState.budgets.monthlyGlobal || 0;
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
      budgetBadge.textContent = 'Over Budget!';
    } else if (percentSpent > 75) {
      budgetBadge.className = 'badge badge-warning';
      budgetBadge.textContent = `${100 - percentSpent}% Tersisa`;
    } else {
      budgetBadge.className = 'badge badge-safe';
      budgetBadge.textContent = `${100 - percentSpent}% Tersisa`;
    }

    // Safe Daily Spending Calculation
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
    const safeDaily = globalBudget > 0 ? Math.max(0, Math.floor(remaining / daysLeft)) : 0;
    document.getElementById('budget-safe-daily-txt').textContent = `${formatRupiah(safeDaily)} / hari`;

    // Render Wallets Carousel
    renderWalletsCarousel();

    // Talangan Banner
    const unpaidTotal = getUnpaidDebtsTotal();
    const unpaidCount = getUnpaidDebtsCount();
    document.getElementById('dash-debt-total').textContent = formatRupiah(unpaidTotal);
    document.getElementById('dash-debt-count').textContent = `${unpaidCount} orang ngutang / ditalangi`;

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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <span style="font-size: 0.72rem; font-weight: 700;">+ Dompet</span>
      </div>
    `;

    container.innerHTML = html;

    // Attach click listeners
    container.querySelectorAll('.wallet-chip[data-id]').forEach(chip => {
      chip.addEventListener('click', () => {
        openEditWalletModal(chip.dataset.id);
      });
    });

    const addBtn = document.getElementById('dash-btn-add-wallet');
    if (addBtn) {
      addBtn.addEventListener('click', () => openAddWalletModal());
    }
  }

  function renderRecentTransactions() {
    const container = document.getElementById('dash-recent-transactions');
    if (!container) return;

    const recent = [...appState.transactions]
      .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))
      .slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">Belum ada transaksi</div>
          <div class="empty-desc">Klik tombol (+) di bawah untuk mencatat pengeluaran atau pemasukan pertama Anda!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = recent.map(tx => renderTransactionItemHtml(tx)).join('');
    attachTransactionItemEvents(container);
  }

  // Helper to render single transaction item HTML
  function renderTransactionItemHtml(tx) {
    const isExpense = tx.type === 'expense';
    const isIncome = tx.type === 'income';
    const isTransfer = tx.type === 'transfer';
    const isDebt = tx.type === 'debt_lend' || tx.type === 'debt_repay';

    let iconBox = '📦';
    let iconBg = 'rgba(255,255,255,0.06)';
    let title = tx.note || 'Transaksi';
    let subtitle = '';
    let amountSign = '-';
    let amountClass = 'text-expense';

    const wallet = appState.wallets.find(w => w.id === tx.walletId);
    const walletName = wallet ? wallet.name : 'Dompet';

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
      subtitle = `Transfer: ${walletName} &rarr; ${targetWallet ? targetWallet.name : 'Dompet'}`;
    } else if (isDebt) {
      iconBox = '🤝';
      iconBg = 'var(--color-debt-bg)';
      if (tx.type === 'debt_lend') {
        amountSign = '-';
        amountClass = 'text-debt';
        title = `Talangi: ${tx.personName || 'Teman'}`;
        subtitle = `${tx.note || 'Talangan'} • <span class="tx-wallet-badge">${walletName}</span>`;
      } else {
        amountSign = '+';
        amountClass = 'text-income';
        title = `Pelunasan: ${tx.personName || 'Teman'}`;
        subtitle = `Uang kembali masuk ke • <span class="tx-wallet-badge">${walletName}</span>`;
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

        if (confirm(`Hapus transaksi "${tx.note || 'Transaksi'}" sebesar ${formatRupiah(tx.amount)}?`)) {
          deleteTransaction(id);
        }
      });
    });
  }

  // 2. Full Transactions List Tab Render
  function renderTransactionsTab() {
    const listContainer = document.getElementById('transactions-full-list');
    const searchVal = document.getElementById('tx-search-input').value.toLowerCase().trim();
    const typeFilter = document.querySelector('#tx-type-filter-row .pill-filter.active').dataset.type;
    const walletFilter = document.getElementById('tx-wallet-filter').value;
    const timeFilter = document.getElementById('tx-time-filter').value;

    const now = new Date();
    const todayStr = getCurrentDateFormatted();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Filter transactions
    let filtered = appState.transactions.filter(tx => {
      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'debt') {
          if (tx.type !== 'debt_lend' && tx.type !== 'debt_repay') return false;
        } else if (tx.type !== typeFilter) {
          return false;
        }
      }

      // Wallet filter
      if (walletFilter !== 'all' && tx.walletId !== walletFilter && tx.targetWalletId !== walletFilter) {
        return false;
      }

      // Time filter
      if (timeFilter === 'today' && tx.date !== todayStr) return false;
      if (timeFilter === 'month' && !tx.date.startsWith(currentMonthStr)) return false;

      // Search filter
      if (searchVal) {
        const matchNote = (tx.note || '').toLowerCase().includes(searchVal);
        const matchPerson = (tx.personName || '').toLowerCase().includes(searchVal);
        const cat = appState.categories.find(c => c.id === tx.categoryId);
        const matchCat = cat ? cat.name.toLowerCase().includes(searchVal) : false;
        if (!matchNote && !matchPerson && !matchCat) return false;
      }

      return true;
    });

    // Sort descending
    filtered.sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">Tidak ada transaksi ditemukan</div>
          <div class="empty-desc">Coba sesuaikan kata kunci pencarian atau ganti filter kategori/dompet.</div>
        </div>
      `;
      return;
    }

    // Group by Date
    const grouped = {};
    filtered.forEach(tx => {
      const d = tx.date || 'Lainnya';
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(tx);
    });

    let html = '';
    for (const [dateStr, txs] of Object.entries(grouped)) {
      let dateLabel = formatShortDate(dateStr);
      if (dateStr === todayStr) dateLabel = 'Hari Ini - ' + dateLabel;

      const dayTotalExpense = txs.reduce((sum, t) => sum + (t.type === 'expense' ? Number(t.amount) : 0), 0);
      const dayTotalIncome = txs.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : 0), 0);

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

  // 3. Budget Tab Render
  function renderBudgetTab() {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const stats = getMonthStats(currentYearMonth);

    const globalLimit = appState.budgets.monthlyGlobal || 0;
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
      badgeElem.textContent = `Overbudget +${formatRupiah(spent - globalLimit)}`;
    } else {
      badgeElem.className = percentSpent > 75 ? 'badge badge-warning' : 'badge badge-safe';
      badgeElem.textContent = `Tersisa ${100 - percentSpent}%`;
    }

    // Days left calculator
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
    const safeDaily = globalLimit > 0 ? Math.max(0, Math.floor(remaining / daysLeft)) : 0;
    document.getElementById('budget-days-left-desc').textContent = `Sisa waktu: ${daysLeft} hari menuju akhir bulan (${daysInMonth} total hari).`;
    document.getElementById('budget-page-daily-safe').textContent = formatRupiah(safeDaily);

    // Category Budgets List
    const categoryListElem = document.getElementById('category-budgets-list');
    const expenseCategories = appState.categories.filter(c => c.type === 'expense');

    let catHtml = '';
    expenseCategories.forEach(cat => {
      const catLimit = (appState.budgets.categoryBudgets && appState.budgets.categoryBudgets[cat.id]) || 0;
      const catSpent = stats.categoryTotals[cat.id] || 0;
      const catPercent = catLimit > 0 ? Math.min(100, Math.round((catSpent / catLimit) * 100)) : 0;
      const catRemaining = Math.max(0, catLimit - catSpent);

      catHtml += `
        <div class="card" style="margin-bottom: 12px; padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.25rem;">${cat.icon}</span>
              <div>
                <strong style="font-size: 0.9rem;">${escapeHtml(cat.name)}</strong>
                <div style="font-size: 0.72rem; color: var(--text-muted);">
                  Limit: ${catLimit > 0 ? formatRupiah(catLimit) : 'Belum diatur'}
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="amount-display text-expense" style="font-size: 0.92rem; font-weight: 700;">
                ${formatRupiah(catSpent)}
              </div>
              <span style="font-size: 0.7rem; color: var(--text-subtle);">
                ${catLimit > 0 ? `Sisa: ${formatRupiah(catRemaining)}` : 'Terpakai'}
              </span>
            </div>
          </div>
          ${catLimit > 0 ? `
            <div class="progress-track" style="height: 6px; margin-bottom: 0;">
              <div class="progress-fill ${catPercent > 90 ? 'danger' : catPercent > 70 ? 'warning' : ''}" style="width: ${catPercent}%;"></div>
            </div>
          ` : ''}
        </div>
      `;
    });

    categoryListElem.innerHTML = catHtml;
  }

  // 4. Wallets Tab Render
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
              Edit / Hapus
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

  // 5. Debt / Talangan Tab Render
  let currentDebtFilter = 'unpaid';

  function renderDebtTab() {
    const unpaidTotal = getUnpaidDebtsTotal();
    const unpaidCount = getUnpaidDebtsCount();

    document.getElementById('debt-page-total').textContent = formatRupiah(unpaidTotal);
    document.getElementById('debt-page-badge').textContent = `${unpaidCount} Orang Belum Lunas`;

    const container = document.getElementById('debts-list-container');
    const filtered = appState.debts.filter(d => {
      if (currentDebtFilter === 'unpaid') return d.status !== 'paid';
      return d.status === 'paid';
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🤝</div>
          <div class="empty-title">Tidak ada talangan ${currentDebtFilter === 'unpaid' ? 'yang belum lunas' : 'pada riwayat'}</div>
          <div class="empty-desc">
            ${currentDebtFilter === 'unpaid'
              ? 'Hebat! Semua uang yang Anda pinjamkan/talangi sudah lunas kembali.'
              : 'Belum ada riwayat pelunasan selesai.'}
          </div>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(debt => {
      const isPaid = debt.status === 'paid';
      const wallet = appState.wallets.find(w => w.id === debt.walletId);
      const walletName = wallet ? wallet.name : 'Dompet';

      html += `
        <div class="debt-card">
          <div class="debt-card-header">
            <div class="debt-person">
              <span>👤 ${escapeHtml(debt.personName)}</span>
            </div>
            <span class="debt-status-tag ${isPaid ? 'debt-status-paid' : 'debt-status-unpaid'}">
              ${isPaid ? 'Lunas' : debt.status === 'partial' ? 'Cicil Sebagian' : 'Belum Lunas'}
            </span>
          </div>

          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
            ${escapeHtml(debt.note || 'Talangan sementara')}
          </div>

          <div class="debt-details-row">
            <div>
              <span style="font-size: 0.72rem; color: var(--text-subtle); display: block;">Sisa Belum Diganti:</span>
              <div class="debt-amount-big amount-display">${formatRupiah(debt.remainingAmount)}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.72rem; color: var(--text-subtle); display: block;">Uang Awal Keluar:</span>
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main);">${formatRupiah(debt.originalAmount)}</div>
              <span class="tx-wallet-badge" style="font-size: 0.65rem;">dari ${walletName}</span>
            </div>
          </div>

          <div class="debt-actions">
            ${!isPaid ? `
              <button class="btn btn-primary btn-repay-debt" data-id="${debt.id}" style="padding: 7px 14px; font-size: 0.8rem; flex: 1;">
                💰 Catat Pelunasan (Ganti Uang)
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
        if (confirm('Hapus catatan talangan ini?')) {
          deleteDebt(id);
        }
      });
    });
  }

  // 6. Reports & Charts Render (100% Offline Canvas Rendering)
  function renderReportsTab() {
    const monthSelect = document.getElementById('reports-month-select');

    // Populate month dropdown if empty
    if (monthSelect.children.length === 0) {
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = label;
        monthSelect.appendChild(opt);
      }
    }

    const selectedMonth = monthSelect.value;
    const stats = getMonthStats(selectedMonth);

    document.getElementById('reports-total-expense').textContent = formatRupiah(stats.expense);

    drawDonutChart(stats);
    drawCashflowBarChart(stats);
  }

  // Native HTML5 Canvas Donut Chart
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
      // Draw empty placeholder circle
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

    // Center text (Total)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Total Keluar', centerX, centerY - 10);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px Plus Jakarta Sans, sans-serif';
    ctx.fillText(formatRupiah(total), centerX, centerY + 10);

    // Legend
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

  // Native HTML5 Canvas Cash Flow Bar Chart
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

    // Draw Income Bar
    ctx.fillStyle = '#10b981';
    roundRect(ctx, xIncome, h - paddingBottom - incomeBarH, barWidth, incomeBarH, 8);
    ctx.fill();

    // Draw Expense Bar
    ctx.fillStyle = '#f43f5e';
    roundRect(ctx, xExpense, h - paddingBottom - expenseBarH, barWidth, expenseBarH, 8);
    ctx.fill();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';

    ctx.fillText('Pemasukan', w * 0.3, h - 14);
    ctx.fillText('Pengeluaran', w * 0.7, h - 14);

    // Values on top of bars
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
      showToast('Pilih dompet yang valid!', 'error');
      return false;
    }

    // Process depending on type
    if (txData.type === 'expense') {
      sourceWallet.balance -= amount;
    } else if (txData.type === 'income') {
      sourceWallet.balance += amount;
    } else if (txData.type === 'transfer') {
      const targetWallet = appState.wallets.find(w => w.id === txData.targetWalletId);
      if (!targetWallet) {
        showToast('Pilih dompet tujuan transfer!', 'error');
        return false;
      }
      if (sourceWallet.id === targetWallet.id) {
        showToast('Dompet asal dan tujuan tidak boleh sama!', 'error');
        return false;
      }
      const fee = Number(txData.fee) || 0;
      sourceWallet.balance -= (amount + fee);
      targetWallet.balance += amount;
    } else if (txData.type === 'debt') {
      // Talangan: uang keluar dari dompet kita untuk bayarin teman
      sourceWallet.balance -= amount;

      // Buat entitas Talangan (Debt)
      const debtId = generateId('debt');
      appState.debts.unshift({
        id: debtId,
        personName: txData.personName || 'Teman',
        originalAmount: amount,
        remainingAmount: amount,
        walletId: sourceWallet.id,
        note: txData.note || 'Talangan sementara',
        date: txData.date,
        dueDate: txData.dueDate || '',
        status: 'unpaid',
        repayments: []
      });

      txData.debtId = debtId;
      txData.type = 'debt_lend';
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
    showToast('Transaksi berhasil disimpan! ✓', 'success');
    return true;
  }

  function deleteTransaction(id) {
    const idx = appState.transactions.findIndex(t => t.id === id);
    if (idx === -1) return;

    const tx = appState.transactions[idx];
    const amount = Number(tx.amount) || 0;
    const sourceWallet = appState.wallets.find(w => w.id === tx.walletId);

    // Revert wallet balance
    if (sourceWallet) {
      if (tx.type === 'expense' || tx.type === 'debt_lend') {
        sourceWallet.balance += amount;
      } else if (tx.type === 'income' || tx.type === 'debt_repay') {
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
    showToast('Transaksi dihapus', 'info');
  }

  function repayDebt(debtId, amount, targetWalletId, note, date) {
    const debt = appState.debts.find(d => d.id === debtId);
    if (!debt) return false;

    const targetWallet = appState.wallets.find(w => w.id === targetWalletId);
    if (!targetWallet) {
      showToast('Pilih dompet tujuan pelunasan!', 'error');
      return false;
    }

    const repayAmt = Number(amount) || 0;
    if (repayAmt <= 0) {
      showToast('Nominal pelunasan tidak valid!', 'error');
      return false;
    }

    // Saldo dompet penerima otomatis bertambah!
    targetWallet.balance += repayAmt;

    // Catat repayment di debt
    debt.remainingAmount = Math.max(0, debt.remainingAmount - repayAmt);
    debt.status = debt.remainingAmount === 0 ? 'paid' : 'partial';
    debt.repayments.push({
      date: date || getCurrentDateFormatted(),
      amount: repayAmt,
      walletId: targetWalletId,
      note: note || ''
    });

    // Catat juga ke riwayat transaksi sebagai debt_repay
    const txId = generateId('tx');
    appState.transactions.unshift({
      id: txId,
      type: 'debt_repay',
      amount: repayAmt,
      walletId: targetWalletId,
      personName: debt.personName,
      debtId: debt.id,
      note: `Pelunasan talangan ${debt.personName}${note ? ': ' + note : ''}`,
      date: date || getCurrentDateFormatted(),
      time: getCurrentTimeFormatted()
    });

    saveState();
    refreshAllViews();
    showToast(`Pelunasan berhasil! Saldo ${targetWallet.name} bertambah ${formatRupiah(repayAmt)} ✓`, 'success');
    return true;
  }

  function deleteDebt(debtId) {
    const idx = appState.debts.findIndex(d => d.id === debtId);
    if (idx === -1) return;
    appState.debts.splice(idx, 1);
    saveState();
    refreshAllViews();
    showToast('Catatan talangan dihapus', 'info');
  }

  function saveWallet(walletData) {
    const name = walletData.name.trim();
    if (!name) {
      showToast('Nama dompet harus diisi!', 'error');
      return false;
    }

    const balance = Number(walletData.balance) || 0;

    if (walletData.id) {
      // Edit existing
      const w = appState.wallets.find(x => x.id === walletData.id);
      if (!w) return false;
      w.name = name;
      w.type = walletData.type;
      w.balance = balance;
      w.color = walletData.color;
      showToast(`Dompet "${name}" diperbarui ✓`, 'success');
    } else {
      // Add new
      const newWallet = {
        id: generateId('w'),
        name,
        type: walletData.type,
        balance,
        initialBalance: balance,
        color: walletData.color || '#10b981'
      };
      appState.wallets.push(newWallet);
      showToast(`Dompet "${name}" berhasil ditambahkan! ✓`, 'success');
    }

    saveState();
    refreshAllViews();
    return true;
  }

  function deleteWallet(id) {
    if (appState.wallets.length <= 1) {
      showToast('Anda harus memiliki minimal 1 dompet aktif!', 'error');
      return;
    }
    const idx = appState.wallets.findIndex(w => w.id === id);
    if (idx === -1) return;

    const wName = appState.wallets[idx].name;
    appState.wallets.splice(idx, 1);
    saveState();
    refreshAllViews();
    showToast(`Dompet "${wName}" telah dihapus`, 'info');
  }

  // --- EXPORT TO EXCEL / CSV ENGINE ---
  function exportToExcelCSV() {
    if (appState.transactions.length === 0) {
      showToast('Belum ada transaksi untuk diekspor!', 'error');
      return;
    }

    // CSV header with UTF-8 BOM so Excel opens it automatically with correct formatting
    let csvContent = '\uFEFF';
    csvContent += 'ID Transaksi;Tanggal;Waktu;Tipe;Kategori;Dompet Asal;Dompet Tujuan / Peminjam;Keterangan;Nominal (Rp);Biaya Admin (Rp)\r\n';

    appState.transactions.forEach(tx => {
      const wallet = appState.wallets.find(w => w.id === tx.walletId);
      const targetWallet = tx.targetWalletId ? appState.wallets.find(w => w.id === tx.targetWalletId) : null;
      const category = tx.categoryId ? appState.categories.find(c => c.id === tx.categoryId) : null;

      let typeLabel = tx.type;
      if (tx.type === 'expense') typeLabel = 'Pengeluaran';
      else if (tx.type === 'income') typeLabel = 'Pemasukan';
      else if (tx.type === 'transfer') typeLabel = 'Transfer Antar Dompet';
      else if (tx.type === 'debt_lend') typeLabel = 'Talangan Diberikan';
      else if (tx.type === 'debt_repay') typeLabel = 'Pelunasan Talangan';

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
    link.setAttribute('download', `FinFlow_Keuangan_${getCurrentDateFormatted()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('File Excel / CSV berhasil diunduh! 📊', 'success');
  }

  // --- BACKUP & RESTORE JSON ENGINE ---
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
    showToast('Cadangan JSON berhasil didownload! 💾', 'success');
  }

  function restoreBackupJSON(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.wallets && parsed.transactions) {
          appState = parsed;
          saveState();
          refreshAllViews();
          closeModal('modal-backup');
          showToast('Data berhasil dipulihkan secara utuh! ✓', 'success');
        } else {
          showToast('Format file backup tidak sesuai!', 'error');
        }
      } catch (err) {
        showToast('Gagal membaca file backup JSON!', 'error');
      }
    };
    reader.readAsText(file);
  }

  // --- MODAL CONTROLLERS & FORMS ---

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
  let currentSelectedCategoryId = 'cat_food';

  function openTransactionModal(type = 'expense') {
    currentSelectedTxType = type;

    // Reset segmented buttons
    document.querySelectorAll('#form-transaction .segmented-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.txType === type) btn.classList.add('active');
    });

    updateTxModalFields(type);

    document.getElementById('tx-amount-input').value = '';
    document.getElementById('tx-note-input').value = '';
    document.getElementById('tx-date-input').value = getCurrentDateFormatted();
    document.getElementById('debt-person-input').value = '';

    // Populate Wallets select
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
      walletLabel.textContent = 'Uang Keluar dari Dompet Mana?';
    } else if (type === 'transfer') {
      debtSec.style.display = 'none';
      transferSec.style.display = 'block';
      catSec.style.display = 'none';
      walletLabel.textContent = 'Dari Dompet Asal:';
    } else {
      debtSec.style.display = 'none';
      transferSec.style.display = 'none';
      catSec.style.display = 'block';
      walletLabel.textContent = type === 'expense' ? 'Pakai Dompet Mana?' : 'Masuk ke Dompet Mana?';
      renderCategoryPicker(type);
    }
  }

  function renderCategoryPicker(type) {
    const grid = document.getElementById('category-picker-grid');
    if (!grid) return;

    const categories = appState.categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));
    if (categories.length > 0 && !categories.some(c => c.id === currentSelectedCategoryId)) {
      currentSelectedCategoryId = categories[0].id;
    }

    grid.innerHTML = categories.map(cat => `
      <div class="category-pick-item ${cat.id === currentSelectedCategoryId ? 'active' : ''}" data-cat-id="${cat.id}">
        <div class="category-pick-icon" style="background: ${cat.color || 'var(--color-primary)'}22; color: ${cat.color || '#fff'};">
          ${cat.icon}
        </div>
        <div class="category-pick-label">${escapeHtml(cat.name)}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.category-pick-item').forEach(item => {
      item.addEventListener('click', () => {
        grid.querySelectorAll('.category-pick-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentSelectedCategoryId = item.dataset.catId;
      });
    });
  }

  function openAddWalletModal() {
    document.getElementById('wallet-modal-title').textContent = 'Tambah Dompet Baru';
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

    document.getElementById('wallet-modal-title').textContent = 'Edit Dompet';
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

    document.getElementById('repay-debt-id').value = debt.id;
    document.getElementById('repay-person-name').textContent = debt.personName;
    document.getElementById('repay-amount-due').textContent = formatRupiah(debt.remainingAmount);
    document.getElementById('repay-amount-input').value = debt.remainingAmount;
    document.getElementById('repay-date-input').value = getCurrentDateFormatted();
    document.getElementById('repay-note-input').value = '';

    // Populate target wallet options
    const targetSelect = document.getElementById('repay-target-wallet');
    targetSelect.innerHTML = appState.wallets.map(w => `<option value="${w.id}">${escapeHtml(w.name)} (${formatRupiah(w.balance)})</option>`).join('');

    openModal('modal-repay-debt');
  }

  function openBudgetSettingsModal() {
    document.getElementById('budget-global-input').value = appState.budgets.monthlyGlobal || 0;

    const container = document.getElementById('budget-category-inputs-list');
    const expenseCats = appState.categories.filter(c => c.type === 'expense');

    container.innerHTML = expenseCats.map(cat => {
      const val = (appState.budgets.categoryBudgets && appState.budgets.categoryBudgets[cat.id]) || '';
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; min-width: 140px;">
            <span>${cat.icon}</span>
            <span>${escapeHtml(cat.name)}</span>
          </div>
          <input type="text" class="form-input amount-display cat-budget-input" data-cat-id="${cat.id}" placeholder="0" inputmode="numeric" value="${val}" style="max-width: 150px; padding: 8px 10px; font-size: 0.85rem;" />
        </div>
      `;
    }).join('');

    openModal('modal-budget');
  }

  // --- REFRESH VIEWS ---
  function refreshAllViews() {
    renderDashboard();
    renderTransactionsTab();
    renderBudgetTab();
    renderWalletsTab();
    renderDebtTab();
    renderReportsTab();

    // Update wallet dropdown in transactions filter
    const walletFilterSelect = document.getElementById('tx-wallet-filter');
    if (walletFilterSelect) {
      const cur = walletFilterSelect.value;
      walletFilterSelect.innerHTML = '<option value="all">Semua Dompet</option>' +
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

    // Refresh specific tab
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

  // --- EVENT LISTENERS INITIALIZATION ---
  function initEventListeners() {
    // Bottom Nav Tabs
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        if (tabId) switchTab(tabId);
      });
    });

    // Floating Add Button (+)
    document.getElementById('fab-add-transaction').addEventListener('click', () => {
      openTransactionModal('expense');
    });

    // Quick Action Shortcuts on Dashboard
    document.getElementById('qa-btn-expense').addEventListener('click', () => openTransactionModal('expense'));
    document.getElementById('qa-btn-income').addEventListener('click', () => openTransactionModal('income'));
    document.getElementById('qa-btn-transfer').addEventListener('click', () => openTransactionModal('transfer'));
    document.getElementById('qa-btn-debt').addEventListener('click', () => openTransactionModal('debt'));

    // Dashboard Links
    document.getElementById('link-manage-wallets').addEventListener('click', () => switchTab('tab-wallets'));
    document.getElementById('link-all-transactions').addEventListener('click', () => switchTab('tab-transactions'));
    document.getElementById('btn-goto-debt').addEventListener('click', () => switchTab('tab-debt'));

    // Eye toggle for Net Worth
    document.getElementById('btn-toggle-eye').addEventListener('click', () => {
      appState.settings.hideBalance = !appState.settings.hideBalance;
      saveState();
      renderDashboard();
      renderWalletsTab();
    });

    // Segmented control in Transaction Modal
    document.querySelectorAll('#form-transaction .segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#form-transaction .segmented-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.txType;
        currentSelectedTxType = type;
        updateTxModalFields(type);
      });
    });

    // Quick Nominal Presets in Transaction Modal
    document.querySelectorAll('.preset-chip[data-add]').forEach(chip => {
      chip.addEventListener('click', () => {
        const addVal = parseInt(chip.dataset.add, 10);
        const amountInput = document.getElementById('tx-amount-input');
        const currentVal = parseInt(amountInput.value.replace(/\D/g, ''), 10) || 0;
        amountInput.value = (currentVal + addVal);
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

      if (currentSelectedTxType === 'debt' && !personName) {
        showToast('Masukkan nama orang/teman yang ditalangi!', 'error');
        return;
      }

      const success = addTransaction({
        type: currentSelectedTxType,
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

    // Wallet Trigger Buttons
    document.getElementById('btn-add-wallet-trigger').addEventListener('click', () => openAddWalletModal());
    document.getElementById('btn-quick-transfer').addEventListener('click', () => openTransactionModal('transfer'));

    // Wallet Color Picker
    let selectedWalletColor = '#10b981';
    document.querySelectorAll('.color-picker-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-picker-dot').forEach(d => d.style.borderColor = 'transparent');
        dot.style.borderColor = '#fff';
        selectedWalletColor = dot.dataset.color;
      });
    });

    // Wallet Form Submit
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

    // Delete Wallet
    document.getElementById('btn-delete-wallet').addEventListener('click', () => {
      const id = document.getElementById('wallet-edit-id').value;
      if (id && confirm('Yakin ingin menghapus dompet ini?')) {
        deleteWallet(id);
        closeModal('modal-wallet');
      }
    });

    // Debt Filters
    document.getElementById('debt-filter-unpaid').addEventListener('click', () => {
      currentDebtFilter = 'unpaid';
      document.getElementById('debt-filter-unpaid').classList.add('active');
      document.getElementById('debt-filter-paid').classList.remove('active');
      renderDebtTab();
    });

    document.getElementById('debt-filter-paid').addEventListener('click', () => {
      currentDebtFilter = 'paid';
      document.getElementById('debt-filter-paid').classList.add('active');
      document.getElementById('debt-filter-unpaid').classList.remove('active');
      renderDebtTab();
    });

    document.getElementById('btn-add-debt-trigger').addEventListener('click', () => {
      openTransactionModal('debt');
    });

    // Repay Debt Form Submit
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

    // Budget Edit Trigger
    document.getElementById('btn-edit-global-budget').addEventListener('click', () => {
      openBudgetSettingsModal();
    });

    // Budget Form Submit
    document.getElementById('form-budget-settings').addEventListener('submit', (e) => {
      e.preventDefault();
      const rawGlobal = document.getElementById('budget-global-input').value.replace(/\D/g, '');
      appState.budgets.monthlyGlobal = parseInt(rawGlobal, 10) || 0;

      if (!appState.budgets.categoryBudgets) appState.budgets.categoryBudgets = {};
      document.querySelectorAll('.cat-budget-input').forEach(input => {
        const catId = input.dataset.catId;
        const rawVal = input.value.replace(/\D/g, '');
        appState.budgets.categoryBudgets[catId] = parseInt(rawVal, 10) || 0;
      });

      saveState();
      refreshAllViews();
      closeModal('modal-budget');
      showToast('Batas anggaran bulanan berhasil diperbarui! ✓', 'success');
    });

    // Top Header Buttons
    document.getElementById('btn-open-backup').addEventListener('click', () => {
      openModal('modal-backup');
    });

    document.getElementById('btn-open-reports-tab').addEventListener('click', () => {
      switchTab('tab-reports');
    });

    // Excel Export Buttons
    document.getElementById('btn-download-csv').addEventListener('click', exportToExcelCSV);
    document.getElementById('btn-export-excel-tx').addEventListener('click', exportToExcelCSV);

    // Backup & Restore
    document.getElementById('btn-export-json').addEventListener('click', exportBackupJSON);
    document.getElementById('input-restore-json').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        restoreBackupJSON(e.target.files[0]);
      }
    });

    // Sample data load & reset
    document.getElementById('btn-load-sample').addEventListener('click', () => {
      if (confirm('Muat data contoh? Data yang ada sekarang akan ditimpa dengan data simulasi yang lengkap.')) {
        appState = JSON.parse(JSON.stringify(INITIAL_SAMPLE_STATE));
        saveState();
        refreshAllViews();
        closeModal('modal-backup');
        showToast('Data simulasi berhasil dimuat! 🎉', 'success');
      }
    });

    document.getElementById('btn-reset-all').addEventListener('click', () => {
      if (confirm('PERINGATAN: Semua data catatan keuangan, dompet, dan talangan akan dihapus permanen! Lanjutkan?')) {
        localStorage.removeItem(STORAGE_KEY);
        loadState();
        refreshAllViews();
        closeModal('modal-backup');
        showToast('Semua data berhasil direset bersih', 'info');
      }
    });

    // Reports Month Change
    document.getElementById('reports-month-select').addEventListener('change', () => {
      renderReportsTab();
    });

    // Modal close buttons (data-close)
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(btn.dataset.close);
      });
    });

    // Close modal on background overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal.id);
        }
      });
    });

    // Offline / Online Detection
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }

  function updateOnlineStatus() {
    const banner = document.getElementById('offline-banner');
    if (!navigator.onLine) {
      banner.classList.add('show');
    } else {
      banner.classList.remove('show');
    }
  }

  // --- SERVICE WORKER REGISTRATION (PWA) ---
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then(reg => {
            console.log('FinFlow Service Worker registered successfully', reg.scope);
          })
          .catch(err => {
            console.log('Service Worker registration skipped or failed:', err);
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

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
