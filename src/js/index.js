function renderProductsTable() {
  const tbody = document.querySelector('.stock-table tbody');
  tbody.innerHTML = '';

  for (let i = 1; i <= 100; i++) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="description">
        <div>
          <span>Pneu ${i}</span>
          <span class="badge">PCR</span>
        </div>
      </td>
      <td class="t-right price">US$ ${(Math.random() * 100).toFixed(2)}</td>
      <td class="quantity">
        <input class="t-right" type="text" id="item-${i}" name="quantity" oninput="onChangeQuantity(${i})">
      </td>
      <td class="t-right total40hc">${formatCurrency(Math.floor(Math.random() * 1000))}</td>
      <td class="t-right total40hc">${formatCurrency((Math.random()).toFixed(2))}</td>
    `;
    tbody.appendChild(tr);
  }
}

function renderSupplierCart() {
  const paymentCart = document.getElementById('payment-cart');
  if (!paymentCart) return;

  paymentCart.innerHTML = '';

  for (let i = 1; i <= 5; i++) {
    const div = document.createElement('div');
    div.classList = 'card payment-table'

    const tbody = document.createElement('tbody');
    tbody.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="description">
          <div>
            <span>Pneu ${i}</span>
            <span class="badge">PCR</span>
          </div>
        </td>
        <td class="quantity">
          <input class="t-right" type="text" id="item-${i}" name="quantity" oninput="onChangeQuantity(${i})">
        </td>
      `;
      tbody.appendChild(tr);
    }

    div.innerHTML = `
        <div class="supplier-info">
          <span class="nome">LL</span>
          <div>
            <span>2500</span>
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

function onChangeQuantity(i) {
  const item = document.getElementById(`item-${i}`);
  let value = item.value.replace(/[^0-9]/g, "") ?? 0;
  value = Number(value);
  item.value = formatNumber(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatCurrency(value, locale = 'en-US', currency = 'USD') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}

renderProductsTable();
renderSupplierCart()
