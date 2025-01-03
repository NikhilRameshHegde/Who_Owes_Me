window.onload = function () {
    loadDataFromLocalStorage();
    setupBackupReminder();
};

function loadDataFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem('moneyData')) || [];

    const tableBody = document.querySelector("#moneyTable tbody");
    tableBody.innerHTML = "";

    const cardContainer = document.querySelector("#cardContainer");
    cardContainer.innerHTML = "";

    data.forEach((entry, index) => {
        const createdDate = new Date(entry.createdOn || entry.date);
        const updatedDate = new Date(entry.date);
        const dateTimeFormat = (date) => {
            // Manually format date as DD/MM/YYYY
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            // Manually format time as HH:MM AM/PM
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // Convert 0 to 12
            const time = `${hours}:${minutes} ${ampm}`;
            
            return `${day}/${month}/${year}<br>${time}`;
        };

        // Add table row with correct column order and matching input fields
        const newRow = tableBody.insertRow();
        newRow.setAttribute('data-category', entry.category || '');
        newRow.innerHTML = `
            <td><span>${entry.name}</span><input type="text" value="${entry.name}"></td>
            <td><span>${entry.amount}</span><input type="number" value="${entry.amount}"></td>
            <td><span>${entry.category || '-'}</span><input type="text" value="${entry.category || ''}" list="categories"></td>
            <td><span>${dateTimeFormat(createdDate)}</span></td>
            <td><span>${dateTimeFormat(updatedDate)}</span></td>
            <td>
                <button onclick="toggleEdit(this, ${index})">Edit</button>
                <button onclick="deleteRow(this, ${index})">Remove</button>
            </td>
        `;

        // Add card with correct order
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-category', entry.category || '');
        card.innerHTML = `
            <div class="card-name"><span>${entry.name}</span><input type="text" value="${entry.name}"></div>
            <div class="card-amount"><span>₹${entry.amount}</span><input type="number" value="${entry.amount}"></div>
            <div class="card-category">Category: <span>${entry.category || '-'}</span><input type="text" value="${entry.category || ''}" list="categories"></div>
            <div class="card-date">Created: <span>${dateTimeFormat(createdDate)}</span></div>
            <div class="card-date">Updated: <span>${dateTimeFormat(updatedDate)}</span></div>
            <div class="card-actions">
                <button onclick="toggleEdit(this, ${index})">Edit</button>
                <button onclick="deleteRow(this, ${index})">Remove</button>
            </div>
        `;
        cardContainer.appendChild(card);
    });

    updateSummary(data);
    loadCategories();
}

function saveDataToLocalStorage(data) {
    localStorage.setItem('moneyData', JSON.stringify(data));
}

function addRow() {
    const name = document.getElementById('name').value.trim();
    const amount = document.getElementById('amount').value.trim();
    const category = document.getElementById('category').value.trim();

    if (name === '' || amount === '') {
        alert('Please enter both name and amount.');
        return;
    }

    const currentDate = new Date().toISOString();
    const data = JSON.parse(localStorage.getItem('moneyData')) || [];
    data.push({
        name,
        amount,
        category,
        createdOn: currentDate,
        date: currentDate
    });
    saveDataToLocalStorage(data);
    loadDataFromLocalStorage();
    document.getElementById('name').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('category').value = '';
}

function toggleEdit(button, index) {
    const data = JSON.parse(localStorage.getItem('moneyData')) || [];
    const container = button.closest('.card, tr');
    const spans = container.querySelectorAll("span");
    const inputs = container.querySelectorAll("input:not(.adjust-amount)");
    const actionCell = button.parentElement;

    if (button.textContent === "Edit") {
        // Switch to edit mode
        spans.forEach(span => span.style.display = "none");
        inputs.forEach(input => {
            input.style.display = "block";
            input.disabled = false;
        });

        // Remove existing amount controls if any
        const existingControls = container.querySelector('.amount-controls');
        if (existingControls) {
            existingControls.remove();
        }

        // Add amount adjustment controls
        const amountInput = container.querySelector('input[type="number"]:not(.adjust-amount)');
        if (amountInput) {
            const amountControls = document.createElement('div');
            amountControls.className = 'amount-controls';
            amountControls.innerHTML = `
                <input type="number" class="adjust-amount" placeholder="Enter adjustment amount" step="0.01" style="display: block;">
                <button class="amount-btn" onclick="adjustAmount(this, 1)">Add</button>
                <button class="amount-btn" onclick="adjustAmount(this, -1)">Subtract</button>
            `;
            amountInput.parentNode.appendChild(amountControls);

            // Ensure the adjustment input is visible and enabled
            const adjustInput = amountControls.querySelector('.adjust-amount');
            adjustInput.style.display = 'block';
            adjustInput.disabled = false;
        }

        // Change buttons
        button.textContent = "Save";
        const removeButton = actionCell.querySelector('button[onclick*="deleteRow"]');
        removeButton.textContent = "Cancel";
        removeButton.onclick = () => {
            loadDataFromLocalStorage();
        };
    } else {
        // Save changes
        const newName = inputs[0].value;
        const newAmount = inputs[1].value;
        const categoryInput = container.querySelector('input[list="categories"]');
        const newCategory = categoryInput ? categoryInput.value.trim() : '';

        if (!newName || !newAmount) {
            alert('Name and amount are required!');
            return;
        }

        // Preserve the existing creation date and update other fields
        const existingEntry = data[index];
        data[index] = {
            name: newName,
            amount: newAmount,
            category: newCategory,
            date: new Date().toISOString(),
            createdOn: existingEntry.createdOn || existingEntry.date
        };

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
    const nameQuery = document.getElementById('search').value.toLowerCase();
    const categoryQuery = document.getElementById('categoryFilter').value.toLowerCase();
    const rows = document.querySelectorAll("#moneyTable tbody tr");
    const cards = document.querySelectorAll(".card");

    // Search in table view
    rows.forEach(row => {
        const name = row.querySelector("td span").textContent.toLowerCase();
        const category = row.getAttribute('data-category').toLowerCase();

        const matchesName = name.includes(nameQuery);
        const matchesCategory = category.includes(categoryQuery);

        // Show row if it matches both name AND category filters (when both are present)
        // Or if it matches the present filter when only one is being used
        const shouldShow = (nameQuery === '' || matchesName) &&
            (categoryQuery === '' || matchesCategory);

        row.style.display = shouldShow ? "" : "none";
    });

    // Search in card view
    cards.forEach(card => {
        const name = card.querySelector(".card-name span").textContent.toLowerCase();
        const category = card.getAttribute('data-category').toLowerCase();

        const matchesName = name.includes(nameQuery);
        const matchesCategory = category.includes(categoryQuery);

        const shouldShow = (nameQuery === '' || matchesName) &&
            (categoryQuery === '' || matchesCategory);

        card.style.display = shouldShow ? "" : "none";
    });
}

function exportCSV() {
    const data = JSON.parse(localStorage.getItem('moneyData')) || [];
    if (data.length === 0) {
        alert('No data to export!');
        return;
    }

    // Create CSV content with timestamps and category
    const csvContent = ['Name,Amount,Category,Created On,Last Updated'];
    data.forEach(row => {
        const createdDate = new Date(row.createdOn || row.date);
        const updatedDate = new Date(row.date);
        csvContent.push(`${row.name},${row.amount},${row.category || ''},${createdDate.toISOString()},${updatedDate.toISOString()}`);
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

function importCSV(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            // Parse CSV content
            const text = e.target.result;
            const lines = text.split('\n');

            // Get headers
            const headers = lines[0].toLowerCase().split(',');
            const hasTimestamps = headers.includes('created on') && headers.includes('last updated');
            const hasCategory = headers.includes('category');

            // Skip header row and process data
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    if (hasTimestamps && hasCategory) {
                        // Parse CSV with timestamps and category
                        const [name, amount, category, createdOn, date] = line.split(',');
                        if (name && amount) {
                            data.push({
                                name: name.trim(),
                                amount: amount.trim(),
                                category: category.trim(),
                                createdOn: createdOn.trim(),
                                date: date.trim()
                            });
                        }
                    } else if (hasTimestamps) {
                        // Parse CSV with timestamps but no category
                        const [name, amount, createdOn, date] = line.split(',');
                        if (name && amount) {
                            data.push({
                                name: name.trim(),
                                amount: amount.trim(),
                                category: '',
                                createdOn: createdOn.trim(),
                                date: date.trim()
                            });
                        }
                    } else {
                        // Handle old format CSV (backwards compatibility)
                        const [name, amount] = line.split(',');
                        if (name && amount) {
                            const currentDate = new Date().toISOString();
                            data.push({
                                name: name.trim(),
                                amount: amount.trim(),
                                category: '',
                                createdOn: currentDate,
                                date: currentDate
                            });
                        }
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

let sortOrders = {
    'name': true,  // true for ascending, false for descending
    'amount': true
};

function sortData(column) {
    const data = JSON.parse(localStorage.getItem('moneyData')) || [];

    data.sort((a, b) => {
        if (column === 'name') {
            return sortOrders.name
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        } else if (column === 'amount') {
            return sortOrders.amount
                ? Number(a.amount) - Number(b.amount)
                : Number(b.amount) - Number(a.amount);
        }
    });

    // Toggle sort order for the clicked column
    sortOrders[column] = !sortOrders[column];

    // Update arrow indicators in the table headers
    const nameHeader = document.querySelector('th[onclick="sortData(\'name\')"]');
    const amountHeader = document.querySelector('th[onclick="sortData(\'amount\')"]');

    nameHeader.textContent = `Name ${sortOrders.name ? '↑' : '↓'}`;
    amountHeader.textContent = `Amount Owed (Rs) ${sortOrders.amount ? '↑' : '↓'}`;

    saveDataToLocalStorage(data);
    loadDataFromLocalStorage();
}

function setupBackupReminder() {
    const REMINDER_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

    setInterval(() => {
        const lastBackup = localStorage.getItem('lastBackupDate');
        if (!lastBackup || Date.now() - new Date(lastBackup).getTime() > REMINDER_INTERVAL) {
            if (confirm('It\'s been a while since your last backup. Would you like to export your data now?')) {
                exportCSV();
                localStorage.setItem('lastBackupDate', new Date().toISOString());
            }
        }
    }, REMINDER_INTERVAL);
}

function updateSummary(data) {
    // Calculate total amount (ensure we're using valid numbers)
    const totalAmount = data.reduce((sum, entry) => {
        const amount = parseFloat(entry.amount) || 0;  // Convert to number, use 0 if invalid
        return sum + amount;
    }, 0);

    // Format the total amount: only show decimals if they exist
    const formattedTotal = totalAmount % 1 === 0 ?
        totalAmount.toString() :
        totalAmount.toFixed(2);

    // Update the display
    document.getElementById('totalAmount').textContent = formattedTotal;
    document.getElementById('entryCount').textContent = data.length;

    // Log for debugging
    console.log('Total Amount:', formattedTotal, 'Entry Count:', data.length);
}

function adjustAmount(button, operation) {
    // Find the main amount input and adjustment input
    const container = button.closest('.amount-controls');
    const amountInput = container.parentNode.querySelector('input[type="number"]:not(.adjust-amount)');
    const adjustInput = container.querySelector('.adjust-amount');

    // Validate the adjustment input
    const adjustValue = parseFloat(adjustInput.value);
    if (isNaN(adjustValue) || adjustValue <= 0) {
        alert('Please enter a valid positive amount');
        adjustInput.value = '';
        return;
    }

    // Calculate new amount
    let currentAmount = parseFloat(amountInput.value) || 0;
    const newAmount = currentAmount + (operation * adjustValue);

    // Ensure amount doesn't go below 0
    if (newAmount < 0) {
        alert('Amount cannot be negative');
        adjustInput.value = '';
        return;
    }

    // Update the amount input with formatted value
    amountInput.value = newAmount % 1 === 0 ?
        newAmount.toString() :
        newAmount.toFixed(2);

    // Clear the adjustment input
    adjustInput.value = '';
}

function filterByCategory() {
    const filterValue = document.getElementById('categoryFilter').value.toLowerCase();
    const rows = document.querySelectorAll("#moneyTable tbody tr");
    const cards = document.querySelectorAll(".card");

    // Filter table rows in desktop view
    rows.forEach(row => {
        const category = row.getAttribute('data-category').toLowerCase();
        row.style.display = (filterValue === '' || category.includes(filterValue)) ? "" : "none";
    });

    // Filter cards in mobile view
    cards.forEach(card => {
        const category = card.getAttribute('data-category').toLowerCase();
        card.style.display = (filterValue === '' || category.includes(filterValue)) ? "" : "none";
    });
}

function loadCategories() {
    const data = JSON.parse(localStorage.getItem('moneyData')) || [];
    const categories = new Set();

    // Collect all unique categories
    data.forEach(entry => {
        if (entry.category) {
            categories.add(entry.category);
        }
    });

    // Update datalist with unique categories
    const datalist = document.getElementById('categories');
    datalist.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        datalist.appendChild(option);
    });
}

function clearAllEntries() {
    // Check if there are any entries to clear
    const data = JSON.parse(localStorage.getItem('moneyData')) || [];
    if (data.length === 0) {
        alert('No entries to clear!');
        return;
    }

    // Add touchstart event handling
    try {
        // Ask for confirmation before clearing
        if (confirm('Are you sure you want to clear all entries? This cannot be undone!')) {
            // Clear the data
            localStorage.setItem('moneyData', JSON.stringify([]));
            loadDataFromLocalStorage();
            alert('All entries have been cleared.');
        }
    } catch (error) {
        console.error('Error clearing entries:', error);
        alert('Error clearing entries. Please try again.');
    }
}