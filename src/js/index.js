const API_URL = "http://localhost:8000";

async function get() {
  const response = await fetch(`/db.json`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  // if (!response.ok) {
  //   throw new Error("HTTP Error: " + response.status);
  // }

  const data = await response.json();
  return data.products;
}

let products = [];

function init() {
  get().then(data => {
    products = data;
    console.log(products);
    renderProductsTable();
  });
}

function renderProductsTable() {
  const tbody = document.querySelector('.stock-table tbody');
  tbody.innerHTML = '';

  products.forEach((product) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="description">
        <div>
          <span>${product.name}</span>
          <span class="badge">${product.category}</span>
        </div>
      </td>
      <td class="t-right price">${formatCurrency(product.price)}</td>
      <td class="t-right stock" onclick="setAllStock(${product.id})">
        <span>${product.stock}<i class="bi bi-caret-right-fill"></i></span>
      </td>
      <td class="quantity">
        <input
          class="t-right"
          type="text"
          id="item-${product.id}"
          name="quantity"
          oninput="onChangeQuantity(${product.id}, 'item')"
        >
      </td>
      <td class="t-right total40hc">${formatNumber(product.capacity_40hc)}</td>
      <td class="t-right total40hc"></td>
    `;
    tbody.appendChild(tr);
  });
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

function setAllStock(productId) {
  const product = products.find(p => p.id === productId)

  if(!product) return

  const input = document.getElementById(`item-${productId}`)
  if(input) {
    input.value = product.stock
  }

  onChangeQuantity(productId, 'item')
}

function onChangeQuantity(itemId, inputName) {
  let quantity = formatQuantity(itemId, inputName);
  if (inputName === 'item') {
    addProductToCart(itemId, quantity);
  } else if (inputName === 'item-supplier') {
    updateCartItemQuantity(itemId, quantity);
  }
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
  renderSupplierCart();
}

function removeProduct(productId) {
  cart = cart.filter(item => item.id != productId);
  renderSupplierCart();
}

function updateProduct(productId, quantity) {
  const item = products.find(item => item.id == productId);
  if (item) {
    item.quantity = quantity;
  }

  const input = document.getElementById(`item-${productId}`);
  console.log(input);
  if (input) {
    input.value = quantity ? formatNumber(quantity) : '';
  }
}

init();
