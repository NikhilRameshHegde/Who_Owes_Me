window.onload = function () {
    loadDataFromLocalStorage();
};

function loadDataFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem('moneyData')) || [];

    const tableBody = document.querySelector("#moneyTable tbody");
    tableBody.innerHTML = "";

    const cardContainer = document.querySelector("#cardContainer");
    cardContainer.innerHTML = "";

    data.forEach((entry, index) => {
        // Add table row
        const newRow = tableBody.insertRow();
        newRow.innerHTML = `
            <td><span>${entry.name}</span><input type="text" value="${entry.name}"></td>
            <td><span>${entry.amount}</span><input type="number" value="${entry.amount}"></td>
            <td>
                <button onclick="toggleEdit(this, ${index})">Edit</button>
                <button onclick="deleteRow(this, ${index})">Remove</button>
            </td>
        `;

        // Add card
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-name"><span>${entry.name}</span><input type="text" value="${entry.name}"></div>
            <div class="card-amount"><span>₹${entry.amount}</span><input type="number" value="${entry.amount}"></div>
            <div class="card-actions">
                <button onclick="toggleEdit(this, ${index})">Edit</button>
                <button onclick="deleteRow(this, ${index})">Remove</button>
            </div>
        `;
        cardContainer.appendChild(card);
    });
}

function saveDataToLocalStorage(data) {
    localStorage.setItem('moneyData', JSON.stringify(data));
}

function addRow() {
    const name = document.getElementById('name').value.trim();
    const amount = document.getElementById('amount').value.trim();

    if (name === '' || amount === '') {
        alert('Please enter both name and amount.');
        return;
    }

    const data = JSON.parse(localStorage.getItem('moneyData')) || [];
    data.push({ name, amount });
    saveDataToLocalStorage(data);
    loadDataFromLocalStorage();
    document.getElementById('name').value = '';
    document.getElementById('amount').value = '';
}

function toggleEdit(button, index) {
    const data = JSON.parse(localStorage.getItem('moneyData')) || [];
    const container = button.closest('.card, tr');
    const spans = container.querySelectorAll("span");
    const inputs = container.querySelectorAll("input");

    if (button.textContent === "Edit") {
        spans.forEach(span => span.style.display = "none");
        inputs.forEach(input => input.style.display = "block");
        button.textContent = "Save";
    } else {
        const newName = inputs[0].value;
        const newAmount = inputs[1].value;

        data[index] = { name: newName, amount: newAmount };
        saveDataToLocalStorage(data);
        loadDataFromLocalStorage();
    }
}

function deleteRow(button, index) {
    if (confirm('Are you sure you want to remove this entry?')) {
        const data = JSON.parse(localStorage.getItem('moneyData')) || [];
        data.splice(index, 1);
        saveDataToLocalStorage(data);
        loadDataFromLocalStorage();
    }
}

function searchTable() {
    const query = document.getElementById('search').value.toLowerCase();
    const rows = document.querySelectorAll("#moneyTable tbody tr");
    const cards = document.querySelectorAll(".card");

    // Search in table view
    rows.forEach(row => {
        const name = row.querySelector("td span").textContent.toLowerCase();
        row.style.display = name.includes(query) ? "" : "none";
    });

    // Search in card view
    cards.forEach(card => {
        const name = card.querySelector(".card-name span").textContent.toLowerCase();
        card.style.display = name.includes(query) ? "" : "none";
    });
}

function exportCSV() {
    const data = JSON.parse(localStorage.getItem('moneyData')) || [];
    if (data.length === 0) {
        alert('No data to export!');
        return;
    }

    // Create CSV content
    const csvContent = ['Name,Amount'];
    data.forEach(row => {
        csvContent.push(`${row.name},${row.amount}`);
    });

    // Create and trigger download
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'who_owes_me.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Add new function to import data from CSV
function importCSV(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            // Parse CSV content
            const text = e.target.result;
            const lines = text.split('\n');

            // Skip header row and process data
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    const [name, amount] = line.split(',');
                    if (name && amount) {
                        data.push({
                            name: name.trim(),
                            amount: amount.trim()
                        });
                    }
                }
            }

            if (data.length === 0) {
                alert('No valid data found in CSV file');
                return;
            }

            // Confirm before overwriting existing data
            if (confirm('This will replace your existing data. Continue?')) {
                saveDataToLocalStorage(data);
                loadDataFromLocalStorage();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing CSV file. Please check the file format.');
            console.error(error);
        }
    };
    reader.readAsText(file);
    // Reset file input
    input.value = '';
}