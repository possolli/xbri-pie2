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
      <td class="t-right total40hc">${formatNumber(product.capacity_40hc)}</td>
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
    supplier.totalQuantity = groupedBySupplier[supplier].reduce((sum, item) => sum + item.quantity, 0);

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
        <div class="supplier-info">
          <span class="nome">LL</span>
          <div class="totalizers">
            <span>${supplier.totalQuantity}</span>
            <span><i class="bi bi-box-seam"></i> 2</span>
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

function onChangeQuantity(itemId, inputName) {
  let quantity = formatQuantity(itemId, inputName);
  if (inputName === 'item') {
    addProductToCart(itemId, quantity);
  } else if (inputName === 'item-supplier') {
    updateProduct(itemId, quantity);
  }
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
    renderSupplierCart();
    return;
  }

  const cartItem = {
    id: product.id,
    name: product.name,
    quantity: quantity,
    price: product.price,
    total: product.price * quantity,
    supplier: product.supplier
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
