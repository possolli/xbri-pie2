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
      <td>US$ ${(Math.random() * 100).toFixed(2)}</td>
      <td>${Math.floor(Math.random() * 1000)}</td>
      <td>${Math.floor(Math.random() * 1000)}</td>
      <td>${(Math.random()).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  }
}

renderProductsTable();