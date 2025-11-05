document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('logTable');
  const filterInput = document.getElementById('filterInput');
  let rows = Array.from(table.querySelectorAll('tbody tr'));
  let currentSort = { key: null, asc: true };

  function render(filteredRows) {
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    filteredRows.forEach(row => tbody.appendChild(row));
  }

  function sortBy(key) {
    const idx = {
      timestamp: 0,
      status: 1,
      username: 2,
      ip: 3,
      port: 4,
      method: 5
    }[key];

    const asc = currentSort.key === key ? !currentSort.asc : true;
    currentSort = { key, asc };

    rows.sort((a, b) => {
      const aText = a.children[idx].textContent;
      const bText = b.children[idx].textContent;
      return asc ? aText.localeCompare(bText) : bText.localeCompare(aText);
    });

    render(rows);
  }

  function filterRows() {
    const q = filterInput.value.toLowerCase();
    const filtered = rows.filter(row =>
      row.textContent.toLowerCase().includes(q)
    );
    render(filtered);
  }

  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => sortBy(th.dataset.key));
  });

  filterInput.addEventListener('input', filterRows);
});