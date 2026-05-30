const TYPE_LABELS = { text:'text', number:'num', currency:'R$', date:'date', checkbox:'bool', email:'email', percent:'%', phone:'tel' };
const TYPE_ICONS = { text:'📝', number:'🔢', currency:'💰', date:'📅', checkbox:'☑️', email:'📧', percent:'📊', phone:'📞' };

let sheets = [{ name: 'Planilha 1', columns: [], rows: [], sortCol: null, sortDir: 1 }];
let activeSheet = 0;
let undoStack = [], redoStack = [];

let saveTimeout;
function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => { saveState(); }, 400); 
}

function evalMath(val) {
  if (typeof val === 'string' && val.startsWith('=')) {
    try {
      const mathExp = val.substring(1).replace(/[^0-9+\-*/.()]/g, '');
      if (!mathExp) return val;
      const result = new Function('return ' + mathExp)();
      return Number.isFinite(result) ? result : '#ERRO';
    } catch (e) { return '#ERRO'; }
  }
  return val; 
}

function persistData() {
  try { localStorage.setItem('gridforge_data', JSON.stringify({ sheets, activeSheet })); }
  catch (e) { console.warn("Não foi possível salvar no armazenamento local.", e); }
}

function loadPersistedData() {
  const saved = localStorage.getItem('gridforge_data');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.sheets && parsed.sheets.length > 0) {
        sheets = parsed.sheets;
        activeSheet = parsed.activeSheet || 0;
      }
    } catch(e) { console.error("Erro ao carregar dados locais", e); }
  }
}

loadPersistedData();
function s() { return sheets[activeSheet]; }

function formatPhone(v) {
  if (!v) return "";
  let cleaned = v.replace(/^\+55\s?/, "");
  let r = cleaned.replace(/\D/g,"");
  if (r.startsWith('55') && r.length === 13) r = r.slice(2);
  if (!r) return "";
  if (r.length > 11) r = r.slice(0, 11);
  if (r.length <= 2) return "+55 (" + r;
  if (r.length <= 6) return "+55 (" + r.slice(0,2) + ") " + r.slice(2);
  if (r.length <= 10) return "+55 (" + r.slice(0,2) + ") " + r.slice(2,6) + "-" + r.slice(6);
  return "+55 (" + r.slice(0,2) + ") " + r.slice(2,7) + "-" + r.slice(7);
}

function saveState() {
  undoStack.push(JSON.stringify(sheets));
  if (undoStack.length > 80) undoStack.shift();
  redoStack = [];
  updateUndoBtns();
  persistData();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(sheets));
  sheets = JSON.parse(undoStack.pop());
  renderAll(); updateUndoBtns();
  persistData();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(sheets));
  sheets = JSON.parse(redoStack.pop());
  renderAll(); updateUndoBtns();
  persistData();
}

function updateUndoBtns() {
  document.getElementById('undo-btn').disabled = !undoStack.length;
  document.getElementById('redo-btn').disabled = !redoStack.length;
}

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
});

function toast(msg, type='success') {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success:'✦', error:'✕', info:'◉' };
  el.innerHTML = `<span class="t-dot">${icons[type]||'✦'}</span> ${msg}`;
  wrap.appendChild(el);
  requestAnimationFrame(() => { el.classList.add('show'); });
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2800);
}

function openClearModal() { document.getElementById('clear-modal').classList.add('open'); }
function closeModal() { document.getElementById('clear-modal').classList.remove('open'); }
function confirmClear() {
  saveState(); s().rows = []; closeModal();
  renderTable(); updateStats(); toast('Linhas removidas.');
}

function addSheet() {
  saveState();
  sheets.push({ name: `Planilha ${sheets.length + 1}`, columns: [], rows: [], sortCol: null, sortDir: 1 });
  activeSheet = sheets.length - 1;
  persistData(); renderAll(); toast(`Aba "Planilha ${sheets.length}" criada!`, 'success');
}

function deleteSheet(i) {
  if (sheets.length === 1) { toast('Não é possível remover a única aba.', 'error'); return; }
  saveState(); sheets.splice(i, 1);
  if (activeSheet >= sheets.length) activeSheet = sheets.length - 1;
  renderAll();
}

function renameSheet(i) {
  const name = prompt('Nome da aba:', sheets[i].name);
  if (name && name.trim()) { saveState(); sheets[i].name = name.trim(); renderSheets(); }
}

function switchSheet(i) { activeSheet = i; persistData(); renderAll(); }

function renderSheets() {
  const list = document.getElementById('sheet-list');
  list.innerHTML = '';
  sheets.forEach((sh, i) => {
    const el = document.createElement('div');
    el.className = 'sheet-item fadeIn' + (i === activeSheet ? ' active' : '');
    el.innerHTML = `
      <div class="sheet-dot"></div>
      <span class="sheet-name" ondblclick="renameSheet(${i})" title="Duplo clique para renomear">${sh.name}</span>
      <span class="badge">${sh.rows.length}</span>
      ${sheets.length > 1 ? `<span class="sheet-del" onclick="event.stopPropagation();deleteSheet(${i})">✕</span>` : ''}
    `;
    el.onclick = () => switchSheet(i);
    list.appendChild(el);
  });
}

function addColumn() {
  const name = document.getElementById('new-col-name').value.trim();
  const type = document.getElementById('new-col-type').value;
  if (!name) { toast('Digite o nome da coluna.', 'error'); return; }
  if (s().columns.find(c => c.name === name)) { toast('Já existe uma coluna com esse nome.', 'error'); return; }
  saveState();
  s().columns.push({ name, type });
  s().rows.forEach(r => r[name] = type === 'checkbox' ? false : '');
  document.getElementById('new-col-name').value = '';
  renderAll();
}

function removeColumn(name) {
  saveState();
  s().columns = s().columns.filter(c => c.name !== name);
  s().rows.forEach(r => delete r[name]);
  renderAll();
}

function renderColumns() {
  const list = document.getElementById('col-list');
  if (!s().columns.length) { list.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:6px 0;">Nenhuma coluna ainda.</div>'; return; }
  list.innerHTML = '';
  s().columns.forEach(col => {
    const el = document.createElement('div');
    el.className = 'col-item fadeIn';
    el.innerHTML = `
      <span style="font-size:13px;">${TYPE_ICONS[col.type]||'📝'}</span>
      <span class="col-name">${col.name}</span>
      <span class="col-type-pill">${TYPE_LABELS[col.type]}</span>
      <span class="col-del" onclick="removeColumn('${esc(col.name)}')">✕</span>
    `;
    list.appendChild(el);
  });
}

function esc(s) { return s.replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

function addRow() {
  saveState();
  const row = { _id: Date.now() + Math.random() };
  s().columns.forEach(c => { row[c.name] = c.type === 'checkbox' ? false : ''; });
  s().rows.push(row);
  renderTable(); updateStats();
  setTimeout(() => {
    const rows = document.querySelectorAll('#grid-tbody tr:not(.totals-row)');
    const last = rows[rows.length - 1];
    if (last) { const inp = last.querySelector('.cell-input'); if (inp) inp.focus(); }
  }, 50);
}

function addMultipleRows(n) {
  saveState();
  for (let i = 0; i < n; i++) {
    const row = { _id: Date.now() + Math.random() + i };
    s().columns.forEach(c => { row[c.name] = c.type === 'checkbox' ? false : ''; });
    s().rows.push(row);
  }
  renderTable(); updateStats(); toast(`${n} linhas adicionadas.`, 'info');
}

function removeRow(id) {
  saveState(); s().rows = s().rows.filter(r => r._id !== id);
  renderTable(); updateStats();
}

function updateCell(id, col, val, type) {
  const row = s().rows.find(r => r._id === id);
  if (!row) return;
  row[col] = (type === 'number' || type === 'currency' || type === 'percent') ? (val === '' ? '' : parseFloat(val) || val) : val;
  updateStats();
  renderTotals();
}

function sortBy(colName) {
  const sh = s();
  sh.sortDir = (sh.sortCol === colName) ? -sh.sortDir : 1;
  sh.sortCol = colName; persistData(); renderTable();
}

function getSortedRows() {
  const sh = s();
  if (!sh.sortCol) return [...sh.rows];
  return [...sh.rows].sort((a, b) => {
    let va = a[sh.sortCol], vb = b[sh.sortCol];
    if (va === '' || va == null) return 1; if (vb === '' || vb == null) return -1;
    const n = parseFloat(va), m = parseFloat(vb);
    return (!isNaN(n) && !isNaN(m)) ? (n - m) * sh.sortDir : String(va).localeCompare(String(vb)) * sh.sortDir;
  });
}

function renderTotals() {
  const tbody = document.getElementById('grid-tbody');
  if (!tbody) return;
  const oldTotals = tbody.querySelector('.totals-row');
  if (oldTotals) oldTotals.remove();
  const showTotals = document.getElementById('show-totals').checked;
  const visibleRows = document.querySelectorAll('#grid-tbody tr:not(.totals-row):not(.filtered-out)');
  if (!showTotals || visibleRows.length === 0) return;
  const cols = s().columns;
  const totals = {};
  cols.forEach(c => { if (['number','currency','percent'].includes(c.type)) totals[c.name] = 0; });
  visibleRows.forEach(tr => {
    const rowId = Number(tr.dataset.id); const rowData = s().rows.find(r => r._id === rowId);
    if (!rowData) return;
    cols.forEach(col => {
      if (totals[col.name] !== undefined) {
        const val = rowData[col.name]; if (val !== '' && !isNaN(+val)) totals[col.name] += +val;
      }
    });
  });
  if (Object.keys(totals).length === 0) return;
  const tr = document.createElement('tr'); tr.className = 'totals-row';
  let html = `<td class="totals-label">Σ</td>`;
  cols.forEach(col => {
    if (totals[col.name] !== undefined) {
      let fmt = '';
      if (col.type === 'currency') fmt = totals[col.name].toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
      else if (col.type === 'percent') fmt = totals[col.name].toFixed(1) + '%';
      else fmt = totals[col.name].toLocaleString('pt-BR');
      html += `<td>${fmt}</td>`;
    } else html += `<td></td>`;
  });
  html += `<td></td>`; tr.innerHTML = html; tbody.appendChild(tr);
}

function renderTable() {
  const cols = s().columns;
  const table = document.getElementById('grid-table');
  const empty = document.getElementById('empty-state');
  const tbody = document.getElementById('grid-tbody');
  if (tbody) tbody.innerHTML = '';
  if (!cols.length) { table.style.display = 'none'; empty.style.display = 'flex'; updateStats(); return; }
  table.style.display = ''; empty.style.display = 'none';
  const sh = s(); const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const thead = document.getElementById('grid-thead');
  let headHTML = `<tr>
    <th><div class="th-inner th-num" style="cursor:default;">#</div></th>
    ${cols.map((col, ci) => {
      const sorted = sh.sortCol === col.name; const arrow = sorted ? (sh.sortDir === 1 ? '↑' : '↓') : '↕';
      return `<th><div class="th-inner ${sorted?'sorted':''}" onclick="sortBy('${esc(col.name)}')">
        <span class="col-letter">${colLetters[ci]||''}</span><span class="th-name">${col.name}</span>
        <span class="th-type">${TYPE_LABELS[col.type]}</span><span class="sort-arrow">${arrow}</span>
      </div></th>`;
    }).join('')}
    <th><div class="th-inner th-del" style="cursor:default;"></div></th>
  </tr>`;
  thead.innerHTML = headHTML;
  const rows = getSortedRows();
  rows.forEach((row, idx) => {
    const tr = document.createElement('tr'); tr.dataset.id = row._id;
    let html = `<td class="row-num-cell">${idx + 1}</td>`;
    cols.forEach(col => {
      const safeVal = String(row[col.name] ?? '').replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      if (col.type === 'checkbox') html += `<td class="check-cell"><input type="checkbox" class="cell-input" ${safeVal === 'true' || safeVal === true ? 'checked' : ''} onchange="updateCell(${row._id},'${esc(col.name)}',this.checked,'checkbox');debouncedSave()"></td>`;
      else if (col.type === 'number') html += `<td><input type="text" class="cell-input" value="${safeVal}" placeholder="0" onchange="this.value = evalMath(this.value); updateCell(${row._id},'${esc(col.name)}',this.value,'number');debouncedSave()"></td>`;
      else if (col.type === 'currency') html += `<td><input type="text" class="cell-input" value="${safeVal}" placeholder="0,00" step="0.01" onchange="this.value = evalMath(this.value); updateCell(${row._id},'${esc(col.name)}',this.value,'currency');debouncedSave()"></td>`;
      else if (col.type === 'percent') html += `<td><input type="number" class="cell-input" value="${safeVal}" placeholder="0" min="0" max="100" step="0.1" onchange="updateCell(${row._id},'${esc(col.name)}',this.value,'percent');debouncedSave()"></td>`;
      else if (col.type === 'date') html += `<td><input type="date" class="cell-input" value="${safeVal}" onchange="updateCell(${row._id},'${esc(col.name)}',this.value,'date');debouncedSave()"></td>`;
      else if (col.type === 'email') html += `<td><input type="email" class="cell-input" value="${safeVal}" placeholder="email@exemplo.com" onchange="updateCell(${row._id},'${esc(col.name)}',this.value,'email');debouncedSave()"></td>`;
      else if (col.type === 'phone') html += `<td><input type="text" class="cell-input" value="${safeVal}" placeholder="+55 (00) 00000-0000" onchange="this.value=formatPhone(this.value); updateCell(${row._id},'${esc(col.name)}',this.value,'phone');debouncedSave()"></td>`;
      else html += `<td><input type="text" class="cell-input" value="${safeVal}" placeholder="—" onchange="this.value = evalMath(this.value); updateCell(${row._id},'${esc(col.name)}',this.value,'text');debouncedSave()"></td>`;
    });
    html += `<td class="row-del-cell"><button class="row-del-btn" onclick="removeRow(${row._id})" title="Remover linha">✕</button></td>`;
    tr.innerHTML = html; tbody.appendChild(tr);
  });
  filterRows();
}

function filterRows() {
  const q = document.getElementById('search').value.toLowerCase().trim();
  const rows = document.querySelectorAll('#grid-tbody tr:not(.totals-row)');
  let hidden = 0;
  rows.forEach(tr => {
    if (!q) { tr.classList.remove('filtered-out'); return; }
    const text = Array.from(tr.querySelectorAll('.cell-input')).map(i => i.type === 'checkbox' ? (i.checked ? 'sim yes true' : '') : i.value).join(' ').toLowerCase();
    const hide = !text.includes(q);
    tr.classList.toggle('filtered-out', hide); if (hide) hidden++;
  });
  const filterEl = document.getElementById('status-filter'); const filterText = document.getElementById('status-filter-text');
  if (q && hidden) { filterEl.style.display = 'flex'; filterText.textContent = `${hidden} linha(s) oculta(s) pelo filtro`; } 
  else { filterEl.style.display = 'none'; }
  updateStats(); renderTotals(); 
}

function updateStats() {
  const total = s().rows.length; const visible = document.querySelectorAll('#grid-tbody tr:not(.totals-row):not(.filtered-out)').length; const cols = s().columns.length;
  document.getElementById('stat-rows').textContent = total; document.getElementById('stat-cols').textContent = cols;
  document.getElementById('status-rows').textContent = visible === total ? `${total} linha${total !== 1 ? 's' : ''}` : `${visible}/${total} linhas`;
  document.getElementById('status-cols').textContent = `${cols} coluna${cols !== 1 ? 's' : ''}`;
  const numCols = s().columns.filter(c => ['number','currency','percent'].includes(c.type));
  const sumList = document.getElementById('sum-list');
  if (numCols.length && total) {
    sumList.innerHTML = '';
    numCols.forEach(col => {
      let sum = 0; s().rows.forEach(r => { if (!isNaN(+r[col.name]) && r[col.name] !== '') sum += +r[col.name]; });
      let fmt = col.type === 'currency' ? sum.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : col.type === 'percent' ? sum.toFixed(1) + '%' : sum.toLocaleString('pt-BR');
      const el = document.createElement('div'); el.className = 'sum-item fadeIn'; el.innerHTML = `<span class="sum-col">${TYPE_ICONS[col.type]} ${col.name}</span><span class="sum-val">${fmt}</span>`; sumList.appendChild(el);
    });
  } else { sumList.innerHTML = '<div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">sem colunas numéricas</div>'; }
}

function renderAll() { renderSheets(); renderColumns(); renderTable(); updateStats(); }

document.getElementById('import-file').addEventListener('change', function(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  if (file.name.toLowerCase().endsWith('.csv')) {
    reader.onload = ev => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      if (!lines.length) { toast('Arquivo CSV vazio.', 'error'); return; }
      saveState(); const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,'').trim());
      const ns = { name: file.name.replace(/\.csv$/i,'').slice(0,22), columns: headers.map(h => ({ name: h, type: 'text' })), rows: [], sortCol: null, sortDir: 1 };
      lines.slice(1).forEach((line, idx) => {
        const vals = line.split(',').map(v => v.replace(/^"|"$/g,'').trim()); const row = { _id: Date.now() + idx + Math.random() };
        headers.forEach((h, i) => { row[h] = vals[i] ?? ''; }); ns.rows.push(row);
      });
      sheets.push(ns); activeSheet = sheets.length - 1; persistData(); renderAll(); toast(`Importado: ${ns.rows.length} linhas`, 'info');
    }; reader.readAsText(file);
  } else {
    reader.onload = ev => {
      saveState(); const wb = XLSX.read(ev.target.result, { type: 'array' });
      wb.SheetNames.forEach(sname => {
        const ws = wb.Sheets[sname]; const data = XLSX.utils.sheet_to_json(ws, { header: 1 }); if (!data.length) return;
        const headers = data[0].map(h => String(h).trim());
        const ns = { name: sname.slice(0,22), columns: headers.map(h => ({ name: h, type: 'text' })), rows: [], sortCol: null, sortDir: 1 };
        data.slice(1).forEach((row, idx) => {
          const r = { _id: Date.now() + idx + Math.random() };
          headers.forEach((h, i) => { r[h] = row[i] !== undefined ? String(row[i]) : ''; }); ns.rows.push(r);
        });
        sheets.push(ns);
      });
      activeSheet = sheets.length - 1; persistData(); renderAll(); toast(`Excel importado: ${wb.SheetNames.length} aba(s)`, 'info');
    }; reader.readAsArrayBuffer(file);
  }
  this.value = '';
});

function getFilename() { return (document.getElementById('filename').value.trim() || 'planilha'); }

function exportCSV() {
  const cols = s().columns; if (!cols.length) { toast('Adicione colunas primeiro.', 'error'); return; }
  const header = cols.map(c => `"${c.name}"`).join(',');
  const body = s().rows.map(row => cols.map(col => `"${String(row[col.name]??'').replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadBlob(new Blob([header + '\n' + body], {type:'text/csv;charset=utf-8;'}), getFilename() + '.csv'); toast('CSV exportado!');
}

function exportXLSX() {
  const cols = s().columns; if (!cols.length) { toast('Adicione colunas primeiro.', 'error'); return; }
  const wb = XLSX.utils.book_new();
  sheets.forEach(sh => {
    const wsData = [];
    const headerRow = sh.columns.map(c => {
      return { v: c.name, t: 's', s: { font: { bold: true, color: { rgb: "000000" }, name: "Outfit", sz: 12 }, fill: { fgColor: { rgb: "FACC15" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "B45309" } }, bottom: { style: "medium", color: { rgb: "B45309" } }, left: { style: "thin", color: { rgb: "EAB308" } }, right: { style: "thin", color: { rgb: "EAB308" } } } } };
    });
    wsData.push(headerRow);
    sh.rows.forEach((row, rowIndex) => {
      const rowData = sh.columns.map(c => {
        let val = row[c.name] ?? ''; let type = 's'; let z = null;
        if (c.type === 'number' && val !== '') { type = 'n'; val = Number(val); }
        if (c.type === 'currency' && val !== '') { type = 'n'; val = Number(val); z = '"R$ "#,##0.00'; }
        if (c.type === 'percent' && val !== '') { type = 'n'; val = Number(val) / 100; z = '0.0%'; }
        if (c.type === 'checkbox') { val = val ? 'Sim' : 'Não'; }
        const bgColor = (rowIndex % 2 === 0) ? "F8FAFC" : "FFFFFF";
        return { v: val, t: type, z: z, s: { font: { name: "Outfit", sz: 11, color: { rgb: "334155" } }, fill: { fgColor: { rgb: bgColor } }, alignment: { horizontal: (type === 'n' ? "right" : "left"), vertical: "center" }, border: { bottom: { style: "thin", color: { rgb: "E2E8F0" } }, left: { style: "thin", color: { rgb: "E2E8F0" } }, right: { style: "thin", color: { rgb: "E2E8F0" } } } } };
      });
      wsData.push(rowData);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wscols = sh.columns.map(c => { let maxLen = c.name.length; sh.rows.forEach(r => { let valStr = String(r[c.name] || ''); if (valStr.length > maxLen) maxLen = valStr.length; }); return { wch: Math.min(Math.max(maxLen + 3, 12), 40) }; });
    ws['!cols'] = wscols; XLSX.utils.book_append_sheet(wb, ws, sh.name);
  });
  XLSX.writeFile(wb, getFilename() + '.xlsx'); toast('Excel exportado com sucesso!');
}

function exportPDF() {
  if (sheets.length === 1) { executePDFExport([0]); return; }
  const list = document.getElementById('pdf-sheet-list');
  list.innerHTML = ''; // ISSO PREVINE O LOOP INFINITO DE REPETIR AS ABAS
  sheets.forEach((sh, i) => {
    const isChecked = i === activeSheet ? 'checked' : '';
    list.innerHTML += `
      <label style="display:flex; align-items:center; gap:10px; cursor:pointer; color:var(--text-primary); font-size:14px; font-weight:500; padding:4px 0;">
        <input type="checkbox" class="pdf-sheet-cb" value="${i}" ${isChecked} style="width:18px; height:18px; margin:0; cursor:pointer; accent-color:var(--accent);">
        ${sh.name} <span style="color:var(--text-muted); font-size:12px; font-weight:400;">(${sh.rows.length} linhas)</span>
      </label>
    `;
  });
  document.getElementById('pdf-modal').classList.add('open');
}

function closePdfModal() { document.getElementById('pdf-modal').classList.remove('open'); }

function confirmPdfExport() {
  const checkboxes = document.querySelectorAll('.pdf-sheet-cb:checked');
  const selectedIndices = Array.from(checkboxes).map(cb => Number(cb.value));
  if (selectedIndices.length === 0) { toast('Selecione pelo menos uma aba para exportar.', 'error'); return; }
  closePdfModal(); executePDFExport(selectedIndices);
}

function executePDFExport(sheetIndices) {
  const fn = getFilename(); let bodyContent = '';
  sheetIndices.forEach((idx, i) => {
    const sh = sheets[idx]; const cols = sh.columns; const rows = sh.rows;
    if (cols.length === 0) return;
    if (i > 0) bodyContent += `<div style="page-break-before: always;"></div>`;
    bodyContent += `
      <div class="header">
        <div class="logo">Grid<span>Forge</span></div>
        <div class="meta">${fn} — ${sh.name}<br>${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <table>
        <thead><tr>${cols.map(c=>`<th>${c.name}<br><small style="opacity:.6;font-weight:400;">${TYPE_LABELS[c.type]}</small></th>`).join('')}</tr></thead>
        <tbody>
        ${rows.map(row=>`<tr>${cols.map(col=>{
          let v = row[col.name]??'';
          if (col.type==='checkbox') v = v?'✓':'☐';
          if (col.type==='currency'&&v!=='') v=parseFloat(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
          if (col.type==='percent'&&v!=='') v=v+'%';
          return `<td>${v}</td>`;
        }).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `;
  });
  if (!bodyContent) { toast('As abas selecionadas não possuem colunas.', 'error'); return; }
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${fn}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=Outfit:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; font-size: 11px; background: #fff; color: #111; padding: 32px; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #facc15; }
    .logo { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; }
    .logo span { color: #eab308; }
    .meta { margin-left: auto; text-align: right; font-size: 10px; color: #666; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #fefce8; color: #854d0e; padding: 7px 10px; text-align: left; border: 1px solid #fef08a; font-weight: 600; }
    td { padding: 6px 10px; border: 1px solid #e5e7eb; vertical-align: middle; }
    tr:nth-child(even) td { background: #fafafa; }
    @media print { body { padding: 10px; } button { display:none; } }
  </style></head><body>${bodyContent}<script>window.onload=()=>window.print();<\/script></body></html>`;
  const url = URL.createObjectURL(new Blob([html],{type:'text/html'})); window.open(url,'_blank'); toast('Abrindo para impressão/PDF…', 'info');
}

function downloadBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); }

document.addEventListener('keydown', (e) => {
  const active = document.activeElement; if (!active || !active.classList.contains('cell-input')) return;
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    const currentTd = active.closest('td'); const currentRow = active.closest('tr'); if (!currentTd || !currentRow) return;
    const tds = Array.from(currentRow.children); const colIndex = tds.indexOf(currentTd);
    let targetRow = e.key === 'ArrowUp' ? currentRow.previousElementSibling : currentRow.nextElementSibling;
    while (targetRow && (targetRow.classList.contains('totals-row') || targetRow.classList.contains('filtered-out'))) {
       targetRow = e.key === 'ArrowUp' ? targetRow.previousElementSibling : targetRow.nextElementSibling;
    }
    if (targetRow) {
      const targetInput = targetRow.children[colIndex].querySelector('.cell-input');
      if (targetInput) { e.preventDefault(); targetInput.focus(); if (targetInput.type === 'text' || targetInput.type === 'number') targetInput.select(); }
    }
  }
});

renderAll();