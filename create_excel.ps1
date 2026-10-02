$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$wb = $excel.Workbooks.Add()

# ----------------- SHEET 1: DASHBOARD & RINGKASAN -----------------
$wsDash = $wb.Worksheets.Item(1)
$wsDash.Name = "Dashboard & Ringkasan"

# Header Title
$wsDash.Range("B2:K2").Merge()
$wsDash.Range("B2").Value2 = "FINFLOW - DASHBOARD KEUANGAN & BUDGETING"
$wsDash.Range("B2").Font.Size = 16
$wsDash.Range("B2").Font.Bold = $true
$wsDash.Range("B2").Font.Color = 0xFFFFFF
$wsDash.Range("B2:K2").Interior.Color = 0x160D09 # Dark slate
$wsDash.Range("B2:K2").HorizontalAlignment = -4108
$wsDash.Range("B2:K2").RowHeight = 35

# Subtitle
$wsDash.Range("B3:K3").Merge()
$wsDash.Range("B3").Value2 = "Pencatatan Keuangan Harian: Multi-Dompet, Budgeting Bulanan & Pelacak Talangan"
$wsDash.Range("B3").Font.Size = 10
$wsDash.Range("B3").Font.Italic = $true
$wsDash.Range("B3").Font.Color = 0x94A3B8
$wsDash.Range("B3:K3").Interior.Color = 0x1E293B
$wsDash.Range("B3:K3").HorizontalAlignment = -4108

# KPI Cards
# 1. Total Saldo (Dompet Induk)
$wsDash.Range("B5:C5").Merge()
$wsDash.Range("B5").Value2 = "TOTAL SALDO (DOMPET INDUK)"
$wsDash.Range("B5").Font.Size = 8
$wsDash.Range("B5").Font.Bold = $true
$wsDash.Range("B5").Font.Color = 0x34D399
$wsDash.Range("B5:C5").Interior.Color = 0x13253B

$wsDash.Range("B6:C6").Merge()
$wsDash.Range("B6").Formula = "=SUM(F11:F16)"
$wsDash.Range("B6").Font.Size = 15
$wsDash.Range("B6").Font.Bold = $true
$wsDash.Range("B6").NumberFormat = "Rp #,##0"
$wsDash.Range("B6:C6").Interior.Color = 0x13253B

# 2. Pemasukan
$wsDash.Range("D5:E5").Merge()
$wsDash.Range("D5").Value2 = "TOTAL PEMASUKAN"
$wsDash.Range("D5").Font.Size = 8
$wsDash.Range("D5").Font.Bold = $true
$wsDash.Range("D5").Font.Color = 0x10B981
$wsDash.Range("D5:E5").Interior.Color = 0x1B2E1F

$wsDash.Range("D6:E6").Merge()
$wsDash.Range("D6").Formula = "=SUMIF('Transaksi Harian'!D:D, ""Pemasukan"", 'Transaksi Harian'!H:H)"
$wsDash.Range("D6").Font.Size = 15
$wsDash.Range("D6").Font.Bold = $true
$wsDash.Range("D6").NumberFormat = "Rp #,##0"
$wsDash.Range("D6:E6").Interior.Color = 0x1B2E1F

# 3. Pengeluaran
$wsDash.Range("F5:G5").Merge()
$wsDash.Range("F5").Value2 = "TOTAL PENGELUARAN"
$wsDash.Range("F5").Font.Size = 8
$wsDash.Range("F5").Font.Bold = $true
$wsDash.Range("F5").Font.Color = 0x7185FB
$wsDash.Range("F5:G5").Interior.Color = 0x1A1B2E

$wsDash.Range("F6:G6").Merge()
$wsDash.Range("F6").Formula = "=SUMIF('Transaksi Harian'!D:D, ""Pengeluaran"", 'Transaksi Harian'!I:I)"
$wsDash.Range("F6").Font.Size = 15
$wsDash.Range("F6").Font.Bold = $true
$wsDash.Range("F6").NumberFormat = "Rp #,##0"
$wsDash.Range("F6:G6").Interior.Color = 0x1A1B2E

# 4. Talangan Belum Lunas
$wsDash.Range("H5:I5").Merge()
$wsDash.Range("H5").Value2 = "TALANGAN BELUM KEMBALI"
$wsDash.Range("H5").Font.Size = 8
$wsDash.Range("H5").Font.Bold = $true
$wsDash.Range("H5").Font.Color = 0x24BFFA
$wsDash.Range("H5:I5").Interior.Color = 0x162A38

$wsDash.Range("H6:I6").Merge()
$wsDash.Range("H6").Formula = "=SUMIF('Talangan & Piutang'!F:F, ""Belum Lunas"", 'Talangan & Piutang'!E:E)"
$wsDash.Range("H6").Font.Size = 15
$wsDash.Range("H6").Font.Bold = $true
$wsDash.Range("H6").NumberFormat = "Rp #,##0"
$wsDash.Range("H6:I6").Interior.Color = 0x162A38

# Table 1: Multi-Dompet
$wsDash.Range("B9:F9").Merge()
$wsDash.Range("B9").Value2 = "RINCIAN SALDO PER DOMPET"
$wsDash.Range("B9").Font.Size = 11
$wsDash.Range("B9").Font.Bold = $true
$wsDash.Range("B9").Font.Color = 0xFFFFFF
$wsDash.Range("B9:F9").Interior.Color = 0x334155

$wsDash.Range("B10").Value2 = "No"
$wsDash.Range("C10").Value2 = "Nama Dompet"
$wsDash.Range("D10").Value2 = "Tipe Akun"
$wsDash.Range("E10").Value2 = "Saldo Awal"
$wsDash.Range("F10").Value2 = "Saldo Real-Time"
$wsDash.Range("B10:F10").Font.Bold = $true
$wsDash.Range("B10:F10").Interior.Color = 0xE2E8F0

$wallets = @(
    @("1", "BCA Utama", "Bank", 5000000),
    @("2", "Mandiri", "Bank", 1500000),
    @("3", "Dompet Tunai", "Cash / Tunai", 450000),
    @("4", "GoPay", "E-Wallet", 200000),
    @("5", "OVO / Dana", "E-Wallet", 150000),
    @("6", "Tabungan Bibit", "Investasi", 3000000)
)

$rowIdx = 11
foreach ($w in $wallets) {
    $wsDash.Cells.Item($rowIdx, 2).Value2 = $w[0]
    $wsDash.Cells.Item($rowIdx, 3).Value2 = $w[1]
    $wsDash.Cells.Item($rowIdx, 4).Value2 = $w[2]
    $wsDash.Cells.Item($rowIdx, 5).Value2 = [double]$w[3]
    $wsDash.Cells.Item($rowIdx, 6).Formula = "=E$rowIdx + SUMIFS('Transaksi Harian'!H:H, 'Transaksi Harian'!F:F, C$rowIdx) - SUMIFS('Transaksi Harian'!I:I, 'Transaksi Harian'!F:F, C$rowIdx) + SUMIFS('Transaksi Harian'!H:H, 'Transaksi Harian'!G:G, C$rowIdx)"
    $wsDash.Cells.Item($rowIdx, 5).NumberFormat = "Rp #,##0"
    $wsDash.Cells.Item($rowIdx, 6).NumberFormat = "Rp #,##0"
    $rowIdx++
}

$wsDash.Range("B17:E17").Merge()
$wsDash.Range("B17").Value2 = "TOTAL KEKAYAAN"
$wsDash.Range("B17").Font.Bold = $true
$wsDash.Range("F17").Formula = "=SUM(F11:F16)"
$wsDash.Range("F17").Font.Bold = $true
$wsDash.Range("F17").NumberFormat = "Rp #,##0"
$wsDash.Range("B17:F17").Interior.Color = 0xD1FAE5

# Table 2: Budgeting Bulanan
$wsDash.Range("H9:K9").Merge()
$wsDash.Range("H9").Value2 = "BUDGETING BULANAN"
$wsDash.Range("H9").Font.Size = 11
$wsDash.Range("H9").Font.Bold = $true
$wsDash.Range("H9").Font.Color = 0xFFFFFF
$wsDash.Range("H9:K9").Interior.Color = 0x334155

$wsDash.Range("H10").Value2 = "Kategori Budget"
$wsDash.Range("I10").Value2 = "Limit Anggaran"
$wsDash.Range("J10").Value2 = "Terpakai"
$wsDash.Range("K10").Value2 = "Sisa Anggaran"
$wsDash.Range("H10:K10").Font.Bold = $true
$wsDash.Range("H10:K10").Interior.Color = 0xE2E8F0

$budgets = @(
    @("Makanan & Minuman", 1500000),
    @("Transportasi", 500000),
    @("Belanja Bulanan", 800000),
    @("Tagihan & Utilitas", 600000),
    @("Hiburan & Hobi", 350000)
)

$bRow = 11
foreach ($b in $budgets) {
    $wsDash.Cells.Item($bRow, 8).Value2 = $b[0]
    $wsDash.Cells.Item($bRow, 9).Value2 = [double]$b[1]
    $wsDash.Cells.Item($bRow, 10).Formula = "=SUMIFS('Transaksi Harian'!I:I, 'Transaksi Harian'!E:E, H$bRow)"
    $wsDash.Cells.Item($bRow, 11).Formula = "=I$bRow - J$bRow"
    $wsDash.Cells.Item($bRow, 9).NumberFormat = "Rp #,##0"
    $wsDash.Cells.Item($bRow, 10).NumberFormat = "Rp #,##0"
    $wsDash.Cells.Item($bRow, 11).NumberFormat = "Rp #,##0"
    $bRow++
}

$wsDash.Range("H16").Value2 = "TOTAL BUDGET"
$wsDash.Range("H16").Font.Bold = $true
$wsDash.Range("I16").Formula = "=SUM(I11:I15)"
$wsDash.Range("J16").Formula = "=SUM(J11:J15)"
$wsDash.Range("K16").Formula = "=SUM(K11:K15)"
$wsDash.Range("H16:K16").Font.Bold = $true
$wsDash.Range("I16:K16").NumberFormat = "Rp #,##0"
$wsDash.Range("H16:K16").Interior.Color = 0xFEF3C7

# Batas Aman Harian
$wsDash.Range("H18:J18").Merge()
$wsDash.Range("H18").Value2 = "Sisa Hari Bulan Ini:"
$wsDash.Range("H18").Font.Bold = $true
$wsDash.Range("K18").Value2 = 28
$wsDash.Range("K18").Font.Bold = $true

$wsDash.Range("H19:J19").Merge()
$wsDash.Range("H19").Value2 = "BATAS AMAN BELANJA HARIAN:"
$wsDash.Range("H19").Font.Bold = $true
$wsDash.Range("H19").Font.Color = 0x059669
$wsDash.Range("K19").Formula = "=MAX(0, K16 / K18)"
$wsDash.Range("K19").Font.Bold = $true
$wsDash.Range("K19").Font.Size = 12
$wsDash.Range("K19").Font.Color = 0x059669
$wsDash.Range("K19").NumberFormat = "Rp #,##0"
$wsDash.Range("H19:K19").Interior.Color = 0xD1FAE5

# ----------------- SHEET 2: TRANSAKSI HARIAN -----------------
$wsTx = $wb.Worksheets.Add()
$wsTx.Name = "Transaksi Harian"

$headersTx = @("ID Transaksi", "Tanggal", "Waktu", "Tipe", "Kategori", "Dompet Asal", "Dompet Tujuan / Peminjam", "Pemasukan (Rp)", "Pengeluaran (Rp)", "Catatan / Keterangan")
for ($c = 0; $c -lt $headersTx.Length; $c++) {
    $wsTx.Cells.Item(1, $c + 1).Value2 = $headersTx[$c]
}
$wsTx.Range("A1:J1").Interior.Color = 0x1E293B
$wsTx.Range("A1:J1").Font.Color = 0xFFFFFF
$wsTx.Range("A1:J1").Font.Bold = $true
$wsTx.Range("A1:J1").RowHeight = 24

$txData = @(
    @("TX-001", "2026-10-01", "09:00", "Pemasukan", "Gaji & Honor", "BCA Utama", "-", 7000000, 0, "Gaji Bulanan Masuk"),
    @("TX-002", "2026-10-01", "12:30", "Pengeluaran", "Makanan & Minuman", "Dompet Tunai", "-", 0, 32000, "Nasi Padang Rendang + Es Teh"),
    @("TX-003", "2026-10-01", "08:15", "Pengeluaran", "Transportasi", "GoPay", "-", 0, 25000, "Gojek Berangkat ke Kantor"),
    @("TX-004", "2026-10-01", "19:40", "Pengeluaran", "Belanja Bulanan", "BCA Utama", "-", 0, 350000, "Belanja Kebutuhan Supermarket"),
    @("TX-005", "2026-10-02", "11:00", "Transfer", "-", "BCA Utama", "Dompet Tunai", 0, 200000, "Tarik Tunai ATM untuk pegangan cash"),
    @("TX-006", "2026-10-02", "13:00", "Talangan", "-", "BCA Utama", "Budi Santoso", 0, 50000, "Talangan Bayarin Mie Ayam Budi")
)

$tRow = 2
foreach ($row in $txData) {
    for ($col = 0; $col -lt $row.Length; $col++) {
        $val = $row[$col]
        if ($col -eq 7 -or $col -eq 8) {
            $wsTx.Cells.Item($tRow, $col + 1).Value2 = [double]$val
            $wsTx.Cells.Item($tRow, $col + 1).NumberFormat = "Rp #,##0"
        } else {
            $wsTx.Cells.Item($tRow, $col + 1).Value2 = [string]$val
        }
    }
    $tRow++
}

# ----------------- SHEET 3: TALANGAN & PIUTANG -----------------
$wsDebt = $wb.Worksheets.Add()
$wsDebt.Name = "Talangan & Piutang"

$headersDebt = @("ID Talangan", "Tanggal Pinjam", "Nama Peminjam / Teman", "Keterangan", "Nominal Talangan", "Status", "Tanggal Dilunasi", "Uang Masuk ke Dompet")
for ($c = 0; $c -lt $headersDebt.Length; $c++) {
    $wsDebt.Cells.Item(1, $c + 1).Value2 = $headersDebt[$c]
}
$wsDebt.Range("A1:H1").Interior.Color = 0xD97706
$wsDebt.Range("A1:H1").Font.Color = 0xFFFFFF
$wsDebt.Range("A1:H1").Font.Bold = $true
$wsDebt.Range("A1:H1").RowHeight = 24

$debtData = @(
    @("TB-001", "2026-10-02", "Budi Santoso", "Bayarin makan siang mie ayam kantor", 50000, "Belum Lunas", "-", "-"),
    @("TB-002", "2026-09-25", "Rian Wijaya", "Beli bensin bareng", 35000, "Lunas", "2026-09-26", "GoPay")
)

$dRow = 2
foreach ($row in $debtData) {
    for ($col = 0; $col -lt $row.Length; $col++) {
        $val = $row[$col]
        if ($col -eq 4) {
            $wsDebt.Cells.Item($dRow, $col + 1).Value2 = [double]$val
            $wsDebt.Cells.Item($dRow, $col + 1).NumberFormat = "Rp #,##0"
        } else {
            $wsDebt.Cells.Item($dRow, $col + 1).Value2 = [string]$val
        }
    }
    $dRow++
}

# Auto-fit columns
$wsDash.Columns.AutoFit()
$wsTx.Columns.AutoFit()
$wsDebt.Columns.AutoFit()

# Activate dashboard
$wsDash.Activate()

# Save workbook
$outPath = "C:\Users\MyBook Hype AMD\.gemini\antigravity-ide\scratch\finflow-pwa\Dashboard_Keuangan_Pribadi.xlsx"
$wb.SaveAs($outPath)
$wb.Close()
$excel.Quit()

Write-Output "Excel workbook successfully created: $outPath"
