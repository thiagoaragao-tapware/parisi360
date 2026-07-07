let PRODUCTS = [];
let currentProduct = null;
let backToStockItems = JSON.parse(localStorage.getItem('parisiBackToStock') || '[]');

const $ = (id) => document.getElementById(id);
const norm = (v) => String(v ?? '').trim().toUpperCase().replace(/[\s.\-_/]+/g, '');
const text = (v) => (v === undefined || v === null || String(v).trim() === '') ? '—' : String(v).trim();

async function init(){
  try{
    const response = await fetch('data.json', { cache: 'no-store' });
    PRODUCTS = await response.json();
    $('loadStatus').textContent = `${PRODUCTS.length.toLocaleString('en-AU')} products loaded`;
  }catch(err){
    $('loadStatus').textContent = 'Error loading data.json. Open it through GitHub Pages or Live Server.';
  }
  renderBackToStock();
}

function findProduct(query){
  const q = norm(query);
  if(!q) return null;
  return PRODUCTS.find(p => norm(p.product) === q) || PRODUCTS.find(p => norm(p.product).includes(q));
}

function getMatches(query){
  const q = norm(query);
  if(q.length < 2) return [];
  return PRODUCTS.filter(p => norm(p.product).includes(q) || norm(p.description).includes(q)).slice(0, 8);
}

function showSuggestions(query){
  const box = $('suggestions');
  const matches = getMatches(query);
  if(!matches.length){ box.hidden = true; box.innerHTML = ''; return; }
  box.innerHTML = matches.map(p => `
    <button class="suggestion" type="button" data-code="${escapeHtml(p.product)}">
      <strong>${escapeHtml(p.product)}</strong>
      <span>${escapeHtml(p.description || 'No description')} · ${escapeHtml(p.location || 'No location')}</span>
    </button>`).join('');
  box.hidden = false;
  box.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => showProduct(btn.dataset.code)));
}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0,0);
}

function showProduct(query){
  const product = findProduct(query);
  if(!product){
    $('loadStatus').textContent = 'Product not found. Please check the code.';
    $('loadStatus').style.color = '#cf6f63';
    return;
  }
  currentProduct = product;
  showScreen('result');
  $('suggestions').hidden = true;

  const available = Number(product.availableStock || product.stockLevel || 0);
  const isNoStock = available <= 0 || /not|no|out/i.test(product.status || '');
  $('stockBadge').textContent = isNoStock ? 'No Stock' : 'In Stock';
  $('stockBadge').classList.toggle('no-stock', isNoStock);
  $('resultCategory').textContent = text(product.category);
  $('resultCode').textContent = text(product.product);
  $('resultDescription').textContent = text(product.description);
  $('resultLocation').textContent = text(product.location);
  $('availableStock').textContent = text(product.availableStock);
  $('stockLevel').textContent = text(product.stockLevel);
  $('unallocatedStock').textContent = text(product.unallocatedStock);
  $('outstandingSO').textContent = text(product.outstandingSO);
  $('components').textContent = text(product.components);
  $('stockingStatus').textContent = text(product.status);
  $('resultSearchInput').value = '';
}

function goHome(){
  showScreen('home');
  setTimeout(() => $('searchInput').focus(), 50);
}

function openBackToStock(){
  renderBackToStock();
  showScreen('backStock');
  setTimeout(() => $('stockCodeInput').focus(), 50);
}

function addToBackToStock(code){
  const product = findProduct(code);
  const message = $('stockMessage');
  if(!product){
    message.textContent = 'Item not found. Please check the code.';
    message.className = 'stock-message error';
    return;
  }
  if(backToStockItems.some(item => norm(item.code) === norm(product.product))){
    message.textContent = 'This item is already on the list.';
    message.className = 'stock-message error';
    return;
  }
  backToStockItems.push({ code: text(product.product), location: text(product.location) });
  saveBackToStock();
  renderBackToStock();
  $('stockCodeInput').value = '';
  message.textContent = 'Item added.';
  message.className = 'stock-message ok';
}

function removeBackToStock(index){
  backToStockItems.splice(index, 1);
  saveBackToStock();
  renderBackToStock();
}

function saveBackToStock(){
  localStorage.setItem('parisiBackToStock', JSON.stringify(backToStockItems));
}

function renderBackToStock(){
  const body = $('stockTableBody');
  if(!backToStockItems.length){
    body.innerHTML = '<tr class="empty-row"><td colspan="3">No items added yet.</td></tr>';
  }else{
    body.innerHTML = backToStockItems.map((item, index) => `
      <tr>
        <td>${escapeHtml(item.code)}</td>
        <td>${escapeHtml(item.location)}</td>
        <td><button type="button" aria-label="Remove item" data-remove="${index}">×</button></td>
      </tr>`).join('');
    body.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => removeBackToStock(Number(btn.dataset.remove))));
  }
  $('copyStockList').textContent = `Copy Back to Stock List (${backToStockItems.length})`;
}

async function copyBackToStock(){
  const content = backToStockItems.map(i => `${i.code}\t${i.location}`).join('\n');
  if(!content) return;
  await navigator.clipboard.writeText(`Item Code\tLocation\n${content}`);
  $('stockMessage').textContent = 'Back to Stock list copied.';
  $('stockMessage').className = 'stock-message ok';
}

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

$('searchForm').addEventListener('submit', e => { e.preventDefault(); showProduct($('searchInput').value); });
$('resultSearchForm').addEventListener('submit', e => { e.preventDefault(); showProduct($('resultSearchInput').value); });
$('searchInput').addEventListener('input', e => showSuggestions(e.target.value));
$('backButton').addEventListener('click', goHome);
$('openBackToStock').addEventListener('click', openBackToStock);
$('closeBackToStock').addEventListener('click', goHome);
$('stockAddForm').addEventListener('submit', e => { e.preventDefault(); addToBackToStock($('stockCodeInput').value); });
$('addCurrentToStock').addEventListener('click', () => { if(currentProduct){ addToBackToStock(currentProduct.product); openBackToStock(); } });
$('copyStockList').addEventListener('click', copyBackToStock);
init();
