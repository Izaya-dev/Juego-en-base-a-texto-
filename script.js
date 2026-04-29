// ==========================================
// INK FORGE - SISTEMA CONTABLE Y DE GESTIÓN
// ==========================================

// --- ESTADO GLOBAL ---
let db = {
    projects: [],
    inventory: [],
    journal: [],
    settings: {
        currency: '$',
        companyName: 'INK FORGE'
    }
};

let currentProjectId = null;

// Plan de Cuentas básico para imprenta
const chartOfAccounts = [
    { code: '101', name: 'Caja' },
    { code: '102', name: 'Bancos' },
    { code: '103', name: 'Clientes' },
    { code: '104', name: 'Inventario de Materiales' },
    { code: '105', name: 'Productos en Proceso' },
    { code: '201', name: 'Proveedores' },
    { code: '202', name: 'Cuentas por Pagar' },
    { code: '301', name: 'Capital Social' },
    { code: '401', name: 'Ventas' },
    { code: '501', name: 'Costo de Ventas' },
    { code: '502', name: 'Gastos de Producción' },
    { code: '503', name: 'Gastos Administrativos' },
    { code: '504', name: 'Mano de Obra' }
];

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateDashboard();
    renderInventory();
    renderProjects();
    renderJournal();
    
    // Set default date for journal entry
    document.getElementById('je-date').valueAsDate = new Date();
});

// ==========================================
// NAVEGACIÓN
// ==========================================

function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    document.getElementById(sectionId).classList.add('active');
    
    // Actualizar menú lateral
    document.querySelectorAll('nav ul li').forEach(li => {
        li.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Actualizar título
    const titles = {
        'dashboard': 'Panel General',
        'projects': 'Proyectos & Tandas',
        'inventory': 'Inventario',
        'accounting': 'Contabilidad',
        'reports': 'Reportes'
    };
    document.getElementById('page-title').textContent = titles[sectionId] || 'INK FORGE';
    
    // Refrescar datos según sección
    if (sectionId === 'dashboard') updateDashboard();
    if (sectionId === 'reports') renderReports();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// ==========================================
// MODALES
// ==========================================

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    
    // Si es modal de usar material, preparar select
    if (modalId === 'modalUseMaterial') {
        prepareMaterialSelect();
    }
    
    // Si es modal contable, preparar cuentas
    if (modalId === 'modalJournalEntry') {
        prepareAccountSelects();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Limpiar formularios
    const form = document.querySelector(`#${modalId} form`);
    if (form) form.reset();
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ==========================================
// GESTIÓN DE PROYECTOS / TANDAS
// ==========================================

function saveProject(e) {
    e.preventDefault();
    
    const project = {
        id: Date.now(),
        name: document.getElementById('proj-name').value,
        qty: parseInt(document.getElementById('proj-qty').value),
        description: document.getElementById('proj-desc').value,
        status: 'En Proceso',
        materials: [],
        expenses: [],
        created: new Date().toISOString()
    };
    
    db.projects.push(project);
    saveData();
    closeModal('modalProject');
    renderProjects();
    updateDashboard();
    
    alert('Proyecto creado exitosamente');
}

function renderProjects() {
    const container = document.getElementById('projects-list');
    container.innerHTML = '';
    
    db.projects.forEach(proj => {
        const totalCost = calculateProjectCost(proj.id);
        const unitCost = proj.qty > 0 ? totalCost / proj.qty : 0;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openProjectDetail(proj.id);
        card.style.cursor = 'pointer';
        
        card.innerHTML = `
            <h3><i class="fas fa-book"></i> ${proj.name}</h3>
            <p>${proj.qty} unidades</p>
            <small style="color: #7f8c8d">Costo Total: ${formatMoney(totalCost)}</small><br>
            <small style="color: #7f8c8d">Costo Unitario: ${formatMoney(unitCost)}</small><br>
            <span class="badge" style="margin-top: 10px; display:inline-block">${proj.status}</span>
        `;
        
        container.appendChild(card);
    });
}

function openProjectDetail(projectId) {
    currentProjectId = projectId;
    const project = db.projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    // Mostrar sección de detalle
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('project-detail').classList.add('active');
    
    // Llenar datos
    document.getElementById('pd-title').textContent = project.name;
    document.getElementById('pd-status').textContent = project.status;
    
    updateProjectStats(project);
    renderProjectMaterials(project);
    renderProjectExpenses(project);
}

function calculateProjectCost(projectId) {
    const project = db.projects.find(p => p.id === projectId);
    if (!project) return 0;
    
    const materialsCost = project.materials.reduce((sum, m) => sum + m.subtotal, 0);
    const expensesCost = project.expenses.reduce((sum, e) => sum + e.amount, 0);
    
    return materialsCost + expensesCost;
}

function updateProjectStats(project) {
    const materialsCost = project.materials.reduce((sum, m) => sum + m.subtotal, 0);
    const expensesCost = project.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCost = materialsCost + expensesCost;
    const unitCost = project.qty > 0 ? totalCost / project.qty : 0;
    
    document.getElementById('pd-cost-materials').textContent = formatMoney(materialsCost);
    document.getElementById('pd-cost-labor').textContent = formatMoney(expensesCost);
    document.getElementById('pd-cost-total').textContent = formatMoney(totalCost);
    document.getElementById('pd-cost-unit').textContent = formatMoney(unitCost);
}

function renderProjectMaterials(project) {
    const tbody = document.getElementById('pd-materials-table');
    tbody.innerHTML = '';
    
    project.materials.forEach(mat => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${mat.name}</td>
            <td>${mat.quantity} ${mat.unit}</td>
            <td>${formatMoney(mat.unitCost)}</td>
            <td>${formatMoney(mat.subtotal)}</td>
        `;
    });
}

function renderProjectExpenses(project) {
    const tbody = document.getElementById('pd-expenses-table');
    tbody.innerHTML = '';
    
    project.expenses.forEach(exp => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${exp.concept}</td>
            <td>${new Date(exp.date).toLocaleDateString()}</td>
            <td>${formatMoney(exp.amount)}</td>
        `;
    });
}

// ==========================================
// ASIGNAR MATERIAL A PROYECTO
// ==========================================

function prepareMaterialSelect() {
    const select = document.getElementById('use-mat-select');
    select.innerHTML = '<option value="">Seleccione...</option>';
    
    db.inventory.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} (Stock: ${item.qty} ${item.unit})`;
        select.appendChild(option);
    });
    
    select.onchange = () => {
        const itemId = select.value;
        const item = db.inventory.find(i => i.id == itemId);
        if (item) {
            document.getElementById('use-stock-info').textContent = 
                `Disponible: ${item.qty} ${item.unit} | Costo: ${formatMoney(item.cost)} por ${item.unit}`;
        }
    };
}

function assignMaterialToProject(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('use-mat-select').value;
    const quantity = parseFloat(document.getElementById('use-qty').value);
    const projectId = currentProjectId;
    
    const item = db.inventory.find(i => i.id == itemId);
    const project = db.projects.find(p => p.id === projectId);
    
    if (!item || !project) {
        alert('Error: Datos no encontrados');
        return;
    }
    
    if (quantity > item.qty) {
        alert(`Error: Stock insuficiente. Solo hay ${item.qty} ${item.unit} disponibles.`);
        return;
    }
    
    // Descontar del inventario
    item.qty -= quantity;
    
    // Agregar al proyecto
    project.materials.push({
        itemId: item.id,
        name: item.name,
        quantity: quantity,
        unit: item.unit,
        unitCost: item.cost,
        subtotal: quantity * item.cost,
        date: new Date().toISOString()
    });
    
    // Registrar asiento contable automático
    addAutoJournalEntry(
        'Uso de material en proyecto: ' + project.name,
        '502', // Gastos de Producción
        '104', // Inventario de Materiales
        quantity * item.cost
    );
    
    saveData();
    closeModal('modalUseMaterial');
    openProjectDetail(projectId);
    renderInventory();
    updateDashboard();
    
    alert('Material asignado correctamente');
}

// ==========================================
// GASTOS DE PROYECTO
// ==========================================

function addProjectExpense(e) {
    e.preventDefault();
    
    const concept = document.getElementById('exp-concept').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const projectId = currentProjectId;
    
    const project = db.projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    project.expenses.push({
        concept: concept,
        amount: amount,
        date: new Date().toISOString()
    });
    
    // Registrar asiento contable
    addAutoJournalEntry(
        'Gasto en proyecto: ' + project.name + ' - ' + concept,
        '502', // Gastos de Producción
        '101', // Caja (asumimos pago en efectivo)
        amount
    );
    
    saveData();
    closeModal('modalProjectExpense');
    openProjectDetail(projectId);
    updateDashboard();
    
    alert('Gasto registrado correctamente');
}

// ==========================================
// GESTIÓN DE INVENTARIO
// ==========================================

function saveInventoryItem(e) {
    e.preventDefault();
    
    const id = document.getElementById('inv-id').value;
    const item = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('inv-name').value,
        category: document.getElementById('inv-cat').value,
        qty: parseFloat(document.getElementById('inv-qty').value),
        unit: document.getElementById('inv-unit').value,
        cost: parseFloat(document.getElementById('inv-cost').value)
    };
    
    if (id) {
        // Editar existente
        const index = db.inventory.findIndex(i => i.id == id);
        db.inventory[index] = item;
    } else {
        // Nuevo item
        db.inventory.push(item);
    }
    
    saveData();
    closeModal('modalInventory');
    renderInventory();
    updateDashboard();
    
    alert('Item guardado correctamente');
}

function renderInventory() {
    const tbody = document.getElementById('inventory-table');
    tbody.innerHTML = '';
    
    db.inventory.forEach(item => {
        const row = tbody.insertRow();
        const totalValue = item.qty * item.cost;
        const isLowStock = item.qty < 10; // Alerta si stock menor a 10
        
        row.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td style="${isLowStock ? 'color: red; font-weight: bold;' : ''}">${item.qty}</td>
            <td>${item.unit}</td>
            <td>${formatMoney(item.cost)}</td>
            <td>${formatMoney(totalValue)}</td>
            <td>
                <button class="btn-small" onclick="editInventoryItem(${item.id})"><i class="fas fa-edit"></i></button>
            </td>
        `;
    });
}

function editInventoryItem(id) {
    const item = db.inventory.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById('inv-id').value = item.id;
    document.getElementById('inv-name').value = item.name;
    document.getElementById('inv-cat').value = item.category;
    document.getElementById('inv-qty').value = item.qty;
    document.getElementById('inv-unit').value = item.unit;
    document.getElementById('inv-cost').value = item.cost;
    
    openModal('modalInventory');
}

// ==========================================
// CONTABILIDAD
// ==========================================

function prepareAccountSelects() {
    const debitSelect = document.getElementById('je-debit-acc');
    const creditSelect = document.getElementById('je-credit-acc');
    
    debitSelect.innerHTML = '';
    creditSelect.innerHTML = '';
    
    chartOfAccounts.forEach(acc => {
        const option1 = document.createElement('option');
        option1.value = acc.code;
        option1.textContent = `${acc.code} - ${acc.name}`;
        debitSelect.appendChild(option1.cloneNode(true));
        creditSelect.appendChild(option1);
    });
}

function addJournalEntry(e) {
    e.preventDefault();
    
    const entry = {
        id: Date.now(),
        date: document.getElementById('je-date').value,
        description: document.getElementById('je-desc').value,
        debitAcc: document.getElementById('je-debit-acc').value,
        creditAcc: document.getElementById('je-credit-acc').value,
        amount: parseFloat(document.getElementById('je-amount').value)
    };
    
    // Validar partida doble
    if (entry.debitAcc === entry.creditAcc) {
        alert('Error: Las cuentas de debe y haber deben ser diferentes');
        return;
    }
    
    db.journal.push(entry);
    saveData();
    closeModal('modalJournalEntry');
    renderJournal();
    updateDashboard();
    
    alert('Asiento registrado correctamente');
}

function addAutoJournalEntry(description, debitCode, creditCode, amount) {
    const entry = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        description: description,
        debitAcc: debitCode,
        creditAcc: creditCode,
        amount: amount,
        auto: true
    };
    
    db.journal.push(entry);
}

function renderJournal() {
    const tbody = document.getElementById('journal-table');
    tbody.innerHTML = '';
    
    // Ordenar por fecha descendente
    const sorted = [...db.journal].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sorted.forEach(entry => {
        const row = tbody.insertRow();
        const debitAccName = chartOfAccounts.find(a => a.code === entry.debitAcc)?.name || entry.debitAcc;
        const creditAccName = chartOfAccounts.find(a => a.code === entry.creditAcc)?.name || entry.creditAcc;
        
        row.innerHTML = `
            <td>${new Date(entry.date).toLocaleDateString()}</td>
            <td><strong>${debitAccName}</strong> / ${creditAccName}</td>
            <td>${entry.description} ${entry.auto ? '<small style="color:#aaa">(Auto)</small>' : ''}</td>
            <td style="color: green">${formatMoney(entry.amount)}</td>
            <td style="color: red">${formatMoney(entry.amount)}</td>
        `;
    });
}

// ==========================================
// REPORTES
// ==========================================

function renderReports() {
    const tbody = document.getElementById('report-projects-table');
    tbody.innerHTML = '';
    
    db.projects.forEach(proj => {
        const totalCost = calculateProjectCost(proj.id);
        const unitCost = proj.qty > 0 ? totalCost / proj.qty : 0;
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${proj.name}</strong></td>
            <td>${proj.qty}</td>
            <td>${formatMoney(totalCost)}</td>
            <td>${formatMoney(unitCost)}</td>
            <td><span class="badge">${proj.status}</span></td>
        `;
    });
}

// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {
    // Proyectos activos
    const activeProjects = db.projects.filter(p => p.status === 'En Proceso').length;
    document.getElementById('dash-active-projects').textContent = activeProjects;
    
    // Stock crítico
    const lowStock = db.inventory.filter(i => i.qty < 10).length;
    document.getElementById('dash-low-stock').textContent = lowStock;
    
    // Gastos del mes (suma de asientos de gastos)
    const currentMonth = new Date().getMonth();
    const monthExpenses = db.journal
        .filter(j => {
            const jDate = new Date(j.date);
            return jDate.getMonth() === currentMonth && 
                   (j.debitAcc.startsWith('5') || j.creditAcc.startsWith('5'));
        })
        .reduce((sum, j) => sum + j.amount, 0);
    document.getElementById('dash-expenses').textContent = formatMoney(monthExpenses);
    
    // Caja (simplificado: suma de movimientos de caja)
    const cashBalance = db.journal
        .filter(j => j.debitAcc === '101' || j.creditAcc === '101')
        .reduce((sum, j) => {
            return j.debitAcc === '101' ? sum + j.amount : sum - j.amount;
        }, 0);
    document.getElementById('dash-cash').textContent = formatMoney(cashBalance);
    
    // Actividad reciente
    const recentTable = document.getElementById('dash-recent-table');
    recentTable.innerHTML = '';
    
    const recent = [...db.journal].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    recent.forEach(entry => {
        const row = recentTable.insertRow();
        row.innerHTML = `
            <td>${new Date(entry.date).toLocaleDateString()}</td>
            <td>${entry.description}</td>
            <td>${entry.auto ? '<span style="color:#aaa">Automático</span>' : 'Manual'}</td>
            <td>${formatMoney(entry.amount)}</td>
        `;
    });
}

// ==========================================
// UTILIDADES
// ==========================================

function formatMoney(amount) {
    return db.settings.currency + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&.');
}

// ==========================================
// PERSISTENCIA DE DATOS (LOCALSTORAGE)
// ==========================================

function saveData() {
    localStorage.setItem('inkForgeDB', JSON.stringify(db));
}

function loadData() {
    const saved = localStorage.getItem('inkForgeDB');
    if (saved) {
        db = JSON.parse(saved);
    } else {
        // Datos de ejemplo iniciales
        seedInitialData();
    }
}

function seedInitialData() {
    // Inventario inicial de ejemplo
    db.inventory = [
        { id: 1, name: 'Papel Bond 75g', category: 'Papel', qty: 100, unit: 'Resmas', cost: 45.00 },
        { id: 2, name: 'Tinta Negra', category: 'Tinta', qty: 15, unit: 'Litros', cost: 120.00 },
        { id: 3, name: 'Cartón Gris', category: 'Cartón', qty: 50, unit: 'Pliegos', cost: 8.50 },
        { id: 4, name: 'Hilo de Coser', category: 'Insumos', qty: 20, unit: 'Rollos', cost: 12.00 }
    ];
    
    // Proyecto de ejemplo
    db.projects = [
        {
            id: 1,
            name: 'Libro "Historias del Valle"',
            qty: 500,
            description: 'Primera tanda de libros de narrativa',
            status: 'En Proceso',
            materials: [
                { itemId: 1, name: 'Papel Bond 75g', quantity: 20, unit: 'Resmas', unitCost: 45, subtotal: 900, date: new Date().toISOString() }
            ],
            expenses: [
                { concept: 'Transporte de materiales', amount: 50, date: new Date().toISOString() }
            ],
            created: new Date().toISOString()
        }
    ];
    
    saveData();
}

function exportData() {
    const dataStr = JSON.stringify(db);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `inkforge_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            db = JSON.parse(e.target.result);
            saveData();
            location.reload();
        } catch (err) {
            alert('Error al importar archivo. Verifique que sea un backup válido.');
        }
    };
    reader.readAsText(file);
}
