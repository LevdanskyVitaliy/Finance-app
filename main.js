class Api {
  async #fetch(pathOrUrl, options) {
    const url =
      typeof pathOrUrl === "string" && pathOrUrl.startsWith("http")
        ? pathOrUrl
        : "http://localhost:3000" + pathOrUrl;
    const r = await fetch(url, options);

    if (!r.ok) {
      throw new Error(`HTTP is not caught: ${url}, error status ${r.status}`);
    }
    return await r.json();
  }

  async getTransactions(params) {
    const query =
      typeof params === "string"
        ? params
        : new URLSearchParams(params).toString();
    return this.#fetch(`/transactions?${query}`);
  }

  async deleteTransaction(id) {
    return Promise.all([
      this.#fetch(`/transactions/${id}`, { method: "DELETE" }),
    ]);
  }

  async updateTransaction(id, updates) {
    return this.#fetch(`/transactions/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
  }

  async getAllTransactions() {
    return this.#fetch("/transactions");
  }

  async getCategories() {
    return this.#fetch("/categories");
  }

  async createTransaction(data) {
    return this.#fetch("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createCategory(data) {
    return this.#fetch("/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
}

const api = new Api();

async function populateCategories() {
  cachedCategories = await api.getCategories();
  const filterCategory = document.getElementById("filterCategory");
  cachedCategories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.name;
    filterCategory.appendChild(option);
  });
}

// Convert category ID to category name for display
function categoryNameById(catId) {
  const cat = cachedCategories.find((c) => c.id == catId);
  return cat ? cat.name : catId;
}

function renderTable(transactions) {
  const tbody = document.querySelector("#transactions-table tbody");
  tbody.innerHTML = "";

  transactions.forEach((action) => {
    const rowHtml = `
      <tr class="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-700 ">
        <td class="border border-gray-300 px-2 py-2 text-center text-xs sm:text-sm md:text-base">${
          action.id
        }</td>
        <td class="border border-gray-300 px-2 py-2 text-center text-xs sm:text-sm md:text-base">${action.amount.toFixed(
          2
        )}</td>
        <td class="border border-gray-300 px-2 py-2 text-center text-xs sm:text-sm md:text-base">${new Date(
          action.date
        ).toLocaleDateString()}</td>
        <td class="border border-gray-300 px-2 py-2 text-center text-xs sm:text-sm md:text-base">${categoryNameById(
          action.category
        )}</td>
        <td class="border border-gray-300 px-2 py-2 text-center text-xs sm:text-sm md:text-base">${
          action.description
        }</td>
        <td class="border border-gray-300 px-2 py-2 text-center capitalize text-xs sm:text-sm md:text-base">${
          action.type
        }</td>
        <td class="border border-gray-300 px-2 py-2 text-center space-x-2 text-xs sm:text-sm md:text-base">
          <button data-id="${
            action.id
          }" class="edit-btn text-indigo-600 hover:underline focus:outline-none">Edit</button>
          <button data-id="${
            action.id
          }" class="delete-btn text-red-600 hover:underline focus:outline-none">Delete</button>
        </td>
      </tr>`;

    tbody.insertAdjacentHTML("afterbegin", rowHtml);
  });

  attachActionsHandler();
}

async function addTranactionToTable(transactionData) {
  try {
    const action = await api.createTransaction(transactionData);
    const tbody = document.querySelector("#transactions-table tbody");

    const newRowHtml = `
      <tr class="">
        <td class="border border-gray-300 px-4 py-2 text-center align-middle">${
          action.id
        }</td>
        <td class="border border-gray-300 px-4 py-2 text-center align-middle">${
          action.amount
        }</td>
        <td class="border border-gray-300 px-4 py-2 text-center align-middle">${new Date(
          action.date
        ).toLocaleDateString()}</td>
        <td class="border border-gray-300 px-4 py-2 text-center align-middle">${
          action.category
        }</td>
        <td class="border border-gray-300 px-4 py-2 text-center align-middle">${
          action.description
        }</td>
        <td class="border border-gray-300 px-4 py-2 text-center align-middle">${
          action.type
        }</td>
        <td class="border px-2 py-1 text-center space-x-2">
          <button data-id="${
            action.id
          }" class="edit-btn text-indigo-600 hover:underline">Edit</button>
          <button data-id="${
            action.id
          }" class="delete-btn text-red-600 hover:underline">Delete</button>
        </td>
      </tr>
    `;

    if (tbody) {
      tbody.insertAdjacentHTML("afterbegin", newRowHtml);

      attachActionsHandler();
    } else {
      console.error("Таблица не найдена");
    }
  } catch (error) {
    alert("Ошибка при создании транзакции: " + error.message);
  }
}

function attachActionsHandler() {
  const deleteButtons = Array.from(
    document.getElementsByClassName("delete-btn")
  );
  deleteButtons.forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.id;
      if (confirm(`Удалить операцию №${id}?`)) {
        await api.deleteTransaction(id);
        await main();
      }
    };
  });

  const editButtons = Array.from(document.getElementsByClassName("edit-btn"));
  editButtons.forEach((button) => {
    button.onclick = async () => {
      const dataId = button.dataset.id;
      const tr = button.closest("tr");
      if (!tr) {
        return;
      }
      tr.classList.toggle("expanded-row");
      const overlay = document.getElementById("bg-blur-overlay");
      overlay.style.display = "block";

      // Replace table cells with input fields for editing
      tr.innerHTML = `
        <td>${dataId}</td>
        <td><input type="number" step="0.01" value="${tr.children[1].textContent.trim()}" class="border rounded px-1 w-full"></td>
        <td><input type="date" value="${
          new Date(tr.children[2].textContent.trim())
            .toISOString()
            .split("T")[0]
        }" class="border rounded px-1 w-full"></td>
        <td><input type="text" value="${tr.children[3].textContent.trim()}" class="border rounded px-1 w-full"></td>
        <td><input type="text" value="${tr.children[4].textContent.trim()}" class="border rounded px-1 w-full"></td>
        <td>
          <select class="border rounded px-1 w-full">
            <option value="expense" ${
              tr.children[5].textContent.trim() === "expense" ? "selected" : ""
            }>Expense</option>
            <option value="income" ${
              tr.children[5].textContent.trim() === "income" ? "selected" : ""
            }>Income</option>
          </select>
        </td>
        <td class="mr-0 ml-auto gap-2 justify-between items-end">
          <button class="save-btn bg-green-600 text-white px-2 py-1  rounded">Save</button>
          <button class="cancel-btn bg-gray-400 text-black px-2 py-1 rounded ml-1">Cancel</button>
        </td>
      `;

      tr.querySelector(".save-btn").onclick = async () => {
        const inputs = tr.querySelectorAll("input, select");
        const updates = {
          amount: parseFloat(inputs[0].value),
          date: inputs[1].value,
          category: inputs[2].value,
          description: inputs[3].value,
          type: inputs[4].value,
        };

        try {
          await api.updateTransaction(dataId, updates);
          overlay.style.display = "none";
          await fetchAndRender();
        } catch (error) {
          alert("Failed to update transaction: " + error.message);
        }
      };

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          tr.querySelector(".cancel-btn").click();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          tr.querySelector(".save-btn").click();
        }
      });

      tr.querySelector(".cancel-btn").onclick = () => {
        tr.classList.toggle("expanded-row");
        overlay.style.display = "none";
        fetchAndRender();
      };
    };
  });
}

const operationAddBtn = document.getElementById("add-new-operation");

operationAddBtn.addEventListener("click", () => {
  const randomNumber = Math.round(Math.random()) + 1;
  const newTransactionData = {
    amount: 0.0,
    category: randomNumber,
    date: new Date().toISOString(),
    description: "New transaction via button",
    type: "expense",
  };

  api.createTransaction(newTransactionData).then(() => fetchAndRender());
});

let currentPage = 1;
const pageSize = 10;
let totalPages = 1;
let filters = { category: "", type: "" };

async function fetchAndRender() {
  const params = {
    _page: currentPage,
    _limit: pageSize,
  };

  if (filters.category) {
    params.category = filters.category;
  }

  if (filters.type) {
    params.type = filters.type;
  }

  try {
    const url = `http://localhost:3000/transactions?${new URLSearchParams(
      params
    )}`;
    const res = await fetch(url);
    const transactions = await res.json();
    const totalCount = Number(res.headers.get("X-Total-Count")) || 0;
    // const totalCount = transactions.totalCount;

    renderTable(transactions);

    console.log("number is - ", Number(res.headers.get("X-Total-Count")));
    console.log(totalCount);
    totalPages = Math.ceil(totalCount / pageSize);

    document.getElementById(
      "pageInfo"
    ).textContent = `Page ${currentPage} of ${totalPages}`;

    document.getElementById("prevPage").disabled = currentPage <= 1;
    document.getElementById("nextPage").disabled = currentPage >= totalPages;

    attachActionsHandler();
  } catch {
    console.error("Failed to fetch transactions:", error);
  }
}

document.getElementById("prevPage").onclick = () => {
  if (currentPage > 1) {
    currentPage--;
    fetchAndRender();
  }
};

document.getElementById("nextPage").onclick = () => {
  if (currentPage < totalPages) {
    currentPage++;
    fetchAndRender();
  }
};

document.getElementById("filterCategory").onchange = (e) => {
  filters.category = e.target.value;
  currentPage = 1;
  fetchAndRender();
};

document.getElementById("filterType").onchange = (e) => {
  filters.type = e.target.value;
  currentPage = 1;

  fetchAndRender();
};

document.getElementById("filterReset").onclick = () => {
  filters = { category: "", type: "" };
  currentPage = 1;
  console.log("filter is reset");
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterType").value = "";
  fetchAndRender();
};

const toggleBtn = document.getElementById("toggle");
const root = document.documentElement;
toggleBtn.textContent = root.classList.contains("dark")
  ? "Light mode"
  : "Dark mode";

toggleBtn.addEventListener("click", () => {
  root.classList.toggle("dark");
  if (root.classList.contains("dark")) {
    toggleBtn.textContent = "Light mode";
    toggleBtn.classList.add("text-black");
    toggleBtn.classList.remove("text-white");
  } else {
    toggleBtn.textContent = "Dark mode";
    toggleBtn.classList.remove("text-black");
    toggleBtn.classList.add("text-white");
  }
});

(async function init() {
  await populateCategories();
  await fetchAndRender();
})();
