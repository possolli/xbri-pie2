const API_URL = "http://localhost:8000";

async function get() {
  const response = await fetch(`/db.json`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  const data = await response.json();
  return data;
}

let products = [];

function init() {
  cart = loadCart();

  get().then(data => {
    products = data.products;
    setFiltersData(data.measures);
    renderProductsTable();
    computeInitial40HC();
    renderSupplierCart();
    updateGlobalTotals();
    infinitScroll();
  });
}

function setFiltersData(m) {
  const widths = m.widths;
  const heights = m.heights;
  const rims = m.rims;

  if(widths?.length) {
    const widthSelect = document.getElementById('width');
    widths.forEach(width => {
      const option = document.createElement('option');
      option.value = width;
      option.textContent = width;
      widthSelect.appendChild(option);
    });
  }

  if(heights?.length) {
    const heightSelect = document.getElementById('height');
    heights.forEach(height => {
      const option = document.createElement('option');
      option.value = height;
      option.textContent = height;
      heightSelect.appendChild(option);
    });
  }

  if(rims?.length) {
    const rimSelect = document.getElementById('rim');
    rims.forEach(rim => {
      const option = document.createElement('option');
      option.value = rim;
      option.textContent = rim;
      rimSelect.appendChild(option);
    });
  }
}

const limit = 20;
let page = 1;

function infinitScroll() {
  const table = document.querySelector('.scroll-table');
  table.addEventListener('scroll', () => {
    if (table.scrollTop + table.clientHeight >= (table.scrollHeight)) {
      page++;
      renderProductsTable();
    }
  })
}

let searchFilter = '';
function onFilterChange() {
  updateFilterIcons();

  const width = document.getElementById('width').value ?? '';
  const height = document.getElementById('height').value ?? '';
  const rim = document.getElementById('rim').value ?? '';
  searchFilter = width+height+rim;
  page = 1;
  renderProductsTable(searchFilter);
}

function onSearchChange() {
  updateFilterIcons();

  const width = document.getElementById('width').value ?? '';
  const height = document.getElementById('height').value ?? '';
  const rim = document.getElementById('rim').value ?? '';
  const category = document.getElementById('category').value ?? '';

  const searchText = document.getElementById('search-text').value
    .toLowerCase()
    .replace(/[^0-9a-z]/g, ''); // limpa caracteres especiais

  // sua lógica: concatenar tudo para filtrar pelo começo
  searchFilter = (width + height + rim + category + searchText).toLowerCase();

  page = 1;

  // renderiza com o novo filtro
  renderProductsTable();
}

function renderProductsTable() {
  const tbody = document.querySelector('.stock-table tbody');
  tbody.innerHTML = '';

  const filteredProducts = products.filter(product => {
    const name = product.name.replace(/[^0-9]/g, '').toLowerCase();
    return name.startsWith(searchFilter.toLowerCase());
  });

  filteredProducts.slice(0, limit*page).forEach((product) => {
    const tr = document.createElement('tr');
    tr.id = `product-${product.id}`;
    tr.innerHTML = `
      <td class="description">
        <div>
          <span>${product.name}</span>
          <span class="badge">${product.category}</span>
        </div>
      </td>
      <td class="t-right price">${formatCurrency(product.price)}</td>
      <td class="t-right stock" onclick="setQuantity(${product.id})">
        <span>${product.stock}<i class="bi bi-caret-right-fill"></i></span>
      </td>
      <td class="quantity">
        <div class="exceed-stock-icon">
          <i class="bi bi-exclamation-triangle"></i>
          <span class="exceed-stock-text">Limite de Estoque Excedido</span>
          <i class="bi bi-caret-right-fill"></i>
        </div>
        <input
          class="t-right"
          type="text"
          id="item-${product.id}"
          name="quantity"
          value="${getStoredQuantity(product.id)}"
          oninput="onChangeQuantity(${product.id}, 'item')"
        />
      </td>
      <td class="t-right total40hc">
        ${formatNumber(product.capacity_40hc)}
        <span class="capacity-icons">
          <i class="bi bi-caret-up-fill" onclick="setQuantity(${product.id}, ${product.capacity_40hc})"></i>
          <i class="bi bi-caret-down-fill" onclick="setQuantity(${product.id}, -${product.capacity_40hc})"></i>
        </span>
      </td>
      <td class="t-right total40hc"></td>
    `;
    tbody.appendChild(tr);

    const storedQuantity = Number((getStoredQuantity(product.id) || '').toString().replace(/[^0-9]/g, ''));
    isQuantityExceedingStock(product.id, storedQuantity);
  });

  setTimeout(computeInitial40HC, 0);
  updateFinalizeButtonState();
}

function renderSupplierCart() {
  const paymentCart = document.getElementById('payment-cart');
  if (!paymentCart) return;

  paymentCart.innerHTML = '';

  const groupedBySupplier = cart.reduce((acc, item) => {
    if (!acc[item.supplier]) {
      acc[item.supplier] = [];
    }
    acc[item.supplier].push(item);
    return acc;
  }, {});

  for (const supplier in groupedBySupplier) {
    const div = document.createElement('div');
    div.classList = 'payment-table'

    const tbody = document.createElement('tbody');
    tbody.innerHTML = '';

    groupedBySupplier[supplier].forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="description">
          <div>
            <span>${item.name}</span>
            <span class="badge">PCR</span>
          </div>
        </td>
        <td class="quantity">
          <input class="t-right" type="text" id="item-supplier-${item.id}" name="quantity" oninput="onChangeQuantity(${item.id}, 'item-supplier')" value="${item.quantity}">
        </td>
      `;
      tbody.appendChild(tr);
    });

    div.innerHTML = `
        <div id="supplier-info-${supplier}" class="supplier-info">
          <span class="nome">${supplier.toUpperCase()}</span>
          <div class="totalizers">
            <span class="total-quantity"></span>
            <span>
              <i class="bi bi-box-seam"></i>
              <span class="total-40hc"></span>
            </span>
          </div>
        </div>
        <div class="scroll-table">
          <table class="supplier-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              ${tbody.innerHTML}
          </table>
        </div>
    `;
    paymentCart.appendChild(div);
  }
}

function setQuantity(productId, delta = null) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const input = document.getElementById(`item-${productId}`);
  if (!input) return;

  const currentValue = Number(input.value.replace(/[^0-9.-]/g, "")) || 0;

  if (delta === null) {
    input.value = product.stock;
  } else {
    const newValue = currentValue + delta;
    input.value = formatNumber(newValue > product.stock ? product.stock : newValue);
  }

  onChangeQuantity(productId, 'item');
}

function onChangeQuantity(itemId, inputName) {
  let quantity = formatQuantity(itemId, inputName);
  if (inputName === 'item') {
    addProductToCart(itemId, quantity);
  } else if (inputName === 'item-supplier') {
    updateCartItemQuantity(itemId, quantity);
  }
  isQuantityExceedingStock(itemId, quantity);
  updateTotals(itemId, quantity);
}

function updateCartItemQuantity(itemId, quantity) {
  const product = products.find(p => p.id === itemId);
  if (!product) return;

  const cartItem = cart.find(c => c.id === itemId);
  if (!cartItem) return;

  cartItem.quantity = quantity;
  cartItem.total = cartItem.price * quantity;
  cartItem.total40hc = product.capacity_40hc ? quantity / product.capacity_40hc : 0;
  saveCart();
  updateGlobalTotals();

  const mainInput = document.getElementById(`item-${itemId}`);
  if (mainInput) {
    mainInput.value = formatNumber(quantity);
  }
}

function updateSupplierTotals() {
  const suppliers = {};

  cart.forEach(item => {
    if (!suppliers[item.supplier]) suppliers[item.supplier] = { totalQuantity: 0, total40hc: 0 };
    suppliers[item.supplier].totalQuantity += item.quantity;
    suppliers[item.supplier].total40hc += item.total40hc;
  });

  Object.keys(suppliers).forEach(supplier => {
    const supplierInfo = document.getElementById(`supplier-info-${supplier}`);
    if (supplierInfo) {
      const totalEl = supplierInfo.parentElement.querySelector('.totalizers span:first-child');
      if (totalEl) totalEl.textContent = suppliers[supplier].totalQuantity;
      const total40hcEl = supplierInfo.parentElement.querySelector('.totalizers .total-40hc');
      if (total40hcEl) total40hcEl.textContent = suppliers[supplier].total40hc ? formatNumber(suppliers[supplier].total40hc) : '';
    }
  });
}

function updateTotals(itemId, quantity) {
  const product = products.find(p => p.id === itemId);
  if (!product) return;
  const total40hcCell = document.querySelector(`tr td.quantity input#item-${itemId}`).parentElement.nextElementSibling.nextElementSibling;
  const total40hc = product.capacity_40hc ? quantity / product.capacity_40hc : 0;
  total40hcCell.textContent = formatNumber(total40hc);
  updateSupplierTotals();
  updateGlobalTotals();
}

function formatQuantity(itemId, inputName) {
  const item = document.getElementById(`${inputName}-${itemId}`);
  let value = item.value.replace(/[^0-9]/g, "") ?? '';

  if (inputName === 'item-supplier') {
    value = Number(value || 1);
  } else {
    value = Number(value || 0);
  }

  item.value = formatNumber(value);
  return value;
}

function formatNumber(value) {
  return value ? new Intl.NumberFormat('en-US').format(value) : '';
}

function formatCurrency(value, locale = 'en-US', currency = 'USD') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}

let cart = [];

function addProductToCart(itemId, quantity) {
  if(!quantity) {
    removeProduct(itemId);
    return;
  }

  const product = products.find(item => item.id == itemId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity = quantity;
    existingItem.total = existingItem.price * existingItem.quantity;
    existingItem.total40hc = product.capacity_40hc ? existingItem.quantity / product.capacity_40hc : 0;
    saveCart();
    updateGlobalTotals();
    renderSupplierCart();
    return;
  }

  const cartItem = {
    id: product.id,
    name: product.name,
    quantity: quantity,
    price: product.price,
    total: product.price * quantity,
    supplier: product.supplier,
    total40hc: product.capacity_40hc ? quantity / product.capacity_40hc : 0
  };

  cart.push(cartItem);
  saveCart();
  updateGlobalTotals();
  renderSupplierCart();
}

// funcao pra verificar se e maior que o stock
function isQuantityExceedingStock(productId, quantity) {
  const product = products.find(item => item.id == productId);
  if (!product) return;
  const tr = document.getElementById(`product-${productId}`);

  if (quantity > product.stock) {
    tr.classList.add('exceed-stock');
  } else {
    tr.classList.remove('exceed-stock');
  }

  updateFinalizeButtonState();
}

function removeProduct(productId) {
  cart = cart.filter(item => item.id != productId);
  saveCart();
  updateGlobalTotals();
  renderSupplierCart();
}

function updateProduct(productId, quantity) {
  const item = products.find(item => item.id == productId);
  if (item) {
    item.quantity = quantity;
  }

  const input = document.getElementById(`item-${productId}`);
  if (input) {
    input.value = quantity ? formatNumber(quantity) : '';
  }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
  const data = localStorage.getItem('cart');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function getStoredQuantity(productId) {
  const item = cart.find(c => c.id === productId);
  return item ? formatNumber(item.quantity) : '';
}

function updateGlobalTotals() {
  let totalItems = 0;
  let totalContainers = 0;

  cart.forEach(item => {
    totalItems += item.quantity;
    totalContainers += item.total40hc || 0;
  });

  const totalItemsEl = document.getElementById("total-items");
  const totalContainersEl = document.getElementById("total-containers");
  const progressBar = document.getElementById("containers-progress");

  if (totalItemsEl) {
    totalItemsEl.textContent = `${formatNumber(totalItems)} Itens`;
  }

  if (totalContainersEl) {
    totalContainersEl.textContent = formatNumber(totalContainers);
  }

  // progresso visual
  if (progressBar) {
    const percent = Math.min((totalContainers / 1) * 100, 100);
    progressBar.style.width = percent + "%";
  }

  // 🔥 atualizar total do botão "Finalizar Pedido"
  const totalPrice = cart.reduce((sum, item) => sum + item.total, 0);
  const totalPriceEl = document.getElementById("total-price");

  if (totalPriceEl) {
    totalPriceEl.textContent = formatCurrency(totalPrice)
      .replace('US$', '') // remover símbolo
      .trim();
  }
}

function computeInitial40HC() {
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;

    const input = document.getElementById(`item-${item.id}`);
    if (!input) return;

    const tr = input.closest("tr");
    if (!tr) return;

    const total40hcCell = tr.querySelector("td.total40hc:last-child");
    if (!total40hcCell) return;

    const total40hc = product.capacity_40hc ? item.quantity / product.capacity_40hc : 0;
    total40hcCell.textContent = formatNumber(total40hc);
  });
}

function updateFinalizeButtonState() {
  const hasExceeded = document.querySelector('.stock-table tr.exceed-stock') !== null;
  const finalizeBtn = document.querySelector('.finalize-purchase-btn');

  if (finalizeBtn) {
    finalizeBtn.disabled = hasExceeded;
    finalizeBtn.classList.toggle('disabled', hasExceeded);
  }
}

function clearFilter(id) {
  const el = document.getElementById(id);
  if (!el) return;

  if (el.tagName === "SELECT") {
    el.selectedIndex = 0;
    el.value = "";
  }

  updateFilterIcons();
  onFilterChange();
}

function updateFilterIcons() {
  const wrappers = document.querySelectorAll('.filter-wrapper');
  wrappers.forEach(w => {
    const input = w.querySelector('select, input');
    if (!input) return;
    if (input.value && input.value !== "") {
      w.classList.add('has-value');
    } else {
      w.classList.remove('has-value');
    }
  });
}

function enviarPedido() {
  if (cart.length === 0) {
    console.warn("Carrinho vazio. Nada para enviar.");
    return;
  }

  const pedido = cart.map(item => ({
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));

  console.log("📦 Pedido enviado:");
  console.log(JSON.stringify({
    cliente: "Magalu",
    itens: pedido
  }, null, 2));
}

init();
