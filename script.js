let PRODUCTS = [];
const $ = (id) => document.getElementById(id);
const norm = (v) => String(v ?? '').trim().toUpperCase().replace(/\s+/g, '');
const text = (v) => (v === undefined || v === null || String(v).trim() === '') ? '—' : String(v).trim();

async function init(){
  try{
    const response = await fetch('data.json', { cache: 'no-store' });
    PRODUCTS = await response.json();
    $('loadStatus').textContent = `${PRODUCTS.length.toLocaleString('en-AU')} produtos carregados`;
  }catch(err){
    $('loadStatus').textContent = 'Erro ao carregar data.json. Abra pelo GitHub Pages ou Live Server.';
  }
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
      <span>${escapeHtml(p.description || 'Sem descrição')} · ${escapeHtml(p.location || 'Sem location')}</span>
    </button>`).join('');
  box.hidden = false;
  box.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => showProduct(btn.dataset.code)));
}

function showProduct(query){
  const product = findProduct(query);
  if(!product){
    $('loadStatus').textContent = 'Produto não encontrado. Verifique o código.';
    $('loadStatus').style.color = '#c96d63';
    return;
  }
  $('home').classList.remove('active');
  $('result').classList.add('active');
  $('suggestions').hidden = true;

  const available = Number(product.availableStock || product.stockLevel || 0);
  const isNoStock = available <= 0 || /not|no|out/i.test(product.status || '');
  $('stockBadge').textContent = isNoStock ? 'No Stock' : 'Stock';
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
  window.scrollTo(0,0);
}

function goHome(){
  $('result').classList.remove('active');
  $('home').classList.add('active');
  $('searchInput').focus();
}

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

$('searchForm').addEventListener('submit', e => { e.preventDefault(); showProduct($('searchInput').value); });
$('resultSearchForm').addEventListener('submit', e => { e.preventDefault(); showProduct($('resultSearchInput').value); });
$('searchInput').addEventListener('input', e => showSuggestions(e.target.value));
$('backButton').addEventListener('click', goHome);
init();
