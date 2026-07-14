// HRMS Pro - app.js
let employees = [];

function saveToStorage() {
    localStorage.setItem("hrms_employees", JSON.stringify(employees));
}

function syncStatuses() {
    employees.forEach(emp => {
        if (emp.exitDate && emp.exitDate.trim() !== "") {
            emp.status = "Inactive";
        }
    });
}

async function loadEmployees() {
    const saved = localStorage.getItem("hrms_employees");
    if (saved) {
        employees = JSON.parse(saved);
    } else {
        try {
            const response = await fetch("../data/employees.json");
            employees = await response.json();
        } catch {
            try {
                const response = await fetch("data/employees.json");
                employees = await response.json();
            } catch {
                employees = [];
            }
        }
        saveToStorage();
    }
    syncStatuses();
    updateDashboard();
    renderEmployees();
}

function resetData() {
    if (!confirm("This will reset all data to original. Are you sure?")) return;
    localStorage.removeItem("hrms_employees");
    location.reload();
}

function getInitials(name) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

function getStatusBadge(status) {
    const map = { "Active": "success", "On Leave": "warning", "Inactive": "danger", "Probation": "info" };
    return `<span class="badge bg-${map[status] || 'secondary'}">${status}</span>`;
}

function updateDashboard() {
    setValue("totalEmployees", employees.length);
    setValue("activeEmployees", employees.filter(e => e.status === "Active").length);
    setValue("maleEmployees", employees.filter(e => e.gender === "Male").length);
    setValue("femaleEmployees", employees.filter(e => e.gender === "Female").length);

    const departments = [...new Set(employees.map(e => e.department))];
    setValue("totalDepartments", departments.length);

    const sections = [...new Set(employees.map(e => e.section).filter(Boolean))];
    setValue("totalSections", sections.length);

    const onLeave = employees.filter(e => e.status === "On Leave").length;
    setValue("onLeaveEmployees", onLeave);

    const inactive = employees.filter(e => e.status === "Inactive").length;
    setValue("inactiveEmployees", inactive);
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function renderEmployees(list) {
    const data = list || employees;
    const tbody = document.getElementById("employeesTable");
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">
            <i class="fa-solid fa-users-slash fa-2x mb-2 d-block"></i>No employees found</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(emp => `
        <tr>
            <td><strong>${emp.code}</strong></td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="emp-avatar">${getInitials(emp.name)}</div>
                    <div>
                        <div class="fw-semibold">${emp.name}</div>
                        <small class="text-muted">${emp.jobTitle}</small>
                    </div>
                </div>
            </td>
            <td>${emp.department}</td>
            <td>${emp.jobTitle}</td>
            <td>${emp.manager}</td>
            <td>${emp.location}</td>
            <td>${getStatusBadge(emp.status)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewEmployee('${emp.code}')" title="View"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline-warning" onclick="editEmployee('${emp.code}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${emp.code}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join("");
}

function searchEmployees() {
    const keyword = document.getElementById("searchEmployee").value.toLowerCase();
    const filtered = employees.filter(emp =>
        emp.name.toLowerCase().includes(keyword) ||
        emp.department.toLowerCase().includes(keyword) ||
        emp.jobTitle.toLowerCase().includes(keyword) ||
        emp.location.toLowerCase().includes(keyword) ||
        emp.code.includes(keyword)
    );
    renderEmployees(filtered);
}

function filterDepartment() {
    applyFilters();
}

function filterLocation() {
    applyFilters();
}

function applyFilters() {
    const dept = document.getElementById("departmentFilter")?.value || "";
    const loc = document.getElementById("locationFilter")?.value || "";
    let filtered = employees;
    if (dept) filtered = filtered.filter(e => e.department === dept);
    if (loc) filtered = filtered.filter(e => e.location === loc);
    renderEmployees(filtered);
}

function addEmployee() {
    const code = document.getElementById("empCode").value.trim();
    const name = document.getElementById("empName").value.trim();
    const department = document.getElementById("empDepartment").value;
    const section = document.getElementById("empSection").value.trim();
    const jobTitle = document.getElementById("empJob").value.trim();
    const location = document.getElementById("empLocation").value.trim();
    const gender = document.getElementById("empGender").value;
    const empType = document.getElementById("empType").value;

    if (!code || !name || !department || !jobTitle || !location) {
        alert("Please fill all required fields");
        return;
    }

    if (employees.find(e => e.code === code)) {
        alert("Employee code already exists");
        return;
    }

    employees.push({
        code, name, department, section: section || department, jobTitle,
        manager: "-", location, status: "Active",
        hireDate: new Date().toISOString().split("T")[0],
        age: 0, gender, employeeType: empType,
        grade: "G5", performance2023: 0, performance2024: 0, performance2025: 0,
        promotionDate: "", pip: false, retirementDate: "", exitDate: "", exitReason: ""
    });

    saveToStorage();
    renderEmployees();
    updateDashboard();
    clearForm();

    const modal = bootstrap.Modal.getInstance(document.getElementById("addEmployeeModal"));
    if (modal) modal.hide();
}

function clearForm() {
    ["empCode", "empName", "empJob", "empLocation", "empSection"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    const dept = document.getElementById("empDepartment");
    if (dept) dept.selectedIndex = 0;
    const gender = document.getElementById("empGender");
    if (gender) gender.selectedIndex = 0;
    const type = document.getElementById("empType");
    if (type) type.selectedIndex = 0;
}

function viewEmployee(code) {
    const emp = employees.find(e => e.code === code);
    if (!emp) return;

    const modal = new bootstrap.Modal(document.getElementById("viewEmployeeModal"));
    const activeCount = employees.filter(e => e.status === "Active").length;
    const inactiveCount = employees.filter(e => e.status === "Inactive").length;

    document.getElementById("viewModalBody").innerHTML = `
        <div class="text-center mb-3">
            <div class="emp-avatar" style="width:64px;height:64px;font-size:22px;margin:0 auto;">${getInitials(emp.name)}</div>
            <h4 class="mt-2 mb-0">${emp.name}</h4>
            <small class="text-muted">${emp.jobTitle} | ${emp.department}</small>
        </div>
        <div class="d-flex justify-content-center gap-3 mb-3">
            <span class="badge bg-success">Active: ${activeCount}</span>
            <span class="badge bg-danger">Inactive: ${inactiveCount}</span>
            <span class="badge bg-secondary">Total: ${employees.length}</span>
        </div>
        <table class="table table-borderless mb-0">
            <tr><td class="text-muted" style="width:40%">Code</td><td><strong>${emp.code}</strong></td></tr>
            <tr><td class="text-muted">Department</td><td>${emp.department}</td></tr>
            <tr><td class="text-muted">Section</td><td>${emp.section || "-"}</td></tr>
            <tr><td class="text-muted">Location</td><td>${emp.location}</td></tr>
            <tr><td class="text-muted">Manager</td><td>${emp.manager}</td></tr>
            <tr><td class="text-muted">Grade</td><td>${emp.grade}</td></tr>
            <tr><td class="text-muted">Type</td><td>${emp.employeeType}</td></tr>
            <tr><td class="text-muted">Gender</td><td>${emp.gender}</td></tr>
            <tr><td class="text-muted">Age</td><td>${emp.age}</td></tr>
            <tr><td class="text-muted">Status</td><td>${getStatusBadge(emp.status)}</td></tr>
            <tr><td class="text-muted">Hire Date</td><td>${emp.hireDate}</td></tr>
            <tr><td class="text-muted">Performance 2025</td><td>${emp.performance2025 ? emp.performance2025 + "/5" : "N/A"}</td></tr>
            <tr><td class="text-muted">PIP</td><td>${emp.pip ? '<span class="badge bg-danger">Yes</span>' : '<span class="badge bg-success">No</span>'}</td></tr>
            ${emp.exitDate ? `<tr><td class="text-muted">Exit Date</td><td>${emp.exitDate}</td></tr>
            <tr><td class="text-muted">Exit Reason</td><td>${emp.exitReason}</td></tr>` : ""}
        </table>`;
    modal.show();
}

function editEmployee(code) {
    const emp = employees.find(e => e.code === code);
    if (!emp) return;

    document.getElementById("editEmpCode").value = emp.code;
    document.getElementById("editEmpName").value = emp.name;
    document.getElementById("editEmpDepartment").value = emp.department;
    document.getElementById("editEmpJob").value = emp.jobTitle;
    document.getElementById("editEmpLocation").value = emp.location;
    document.getElementById("editEmpGender").value = emp.gender;
    document.getElementById("editEmpGrade").value = emp.grade;
    document.getElementById("editEmpType").value = emp.employeeType;
    document.getElementById("editEmpExitDate").value = emp.exitDate || "";
    document.getElementById("editEmpExitReason").value = emp.exitReason || "";

    new bootstrap.Modal(document.getElementById("editEmployeeModal")).show();
}

function saveEdit() {
    const code = document.getElementById("editEmpCode").value;
    const emp = employees.find(e => e.code === code);
    if (!emp) return;

    emp.name = document.getElementById("editEmpName").value.trim();
    emp.department = document.getElementById("editEmpDepartment").value;
    emp.jobTitle = document.getElementById("editEmpJob").value.trim();
    emp.location = document.getElementById("editEmpLocation").value.trim();
    emp.gender = document.getElementById("editEmpGender").value;
    emp.grade = document.getElementById("editEmpGrade").value;
    emp.employeeType = document.getElementById("editEmpType").value;
    emp.exitDate = document.getElementById("editEmpExitDate").value || "";
    emp.exitReason = document.getElementById("editEmpExitReason").value.trim();

    if (emp.exitDate && emp.exitDate.trim() !== "") {
        emp.status = "Inactive";
    } else {
        emp.status = "Active";
    }

    saveToStorage();
    syncStatuses();
    renderEmployees();
    updateDashboard();

    const modal = bootstrap.Modal.getInstance(document.getElementById("editEmployeeModal"));
    if (modal) modal.hide();
}

function deleteEmployee(code) {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    employees = employees.filter(e => e.code !== code);
    saveToStorage();
    renderEmployees();
    updateDashboard();
}

function exportToCSV() {
    if (!employees.length) { alert("No data to export"); return; }
    const headers = ["Code", "Name", "Department", "Section", "Job Title", "Manager", "Location", "Grade", "Type", "Status", "Gender", "Age", "Hire Date", "Performance 2025"];
    const rows = employees.map(e => [e.code, e.name, e.department, e.section, e.jobTitle, e.manager, e.location, e.grade, e.employeeType, e.status, e.gender, e.age, e.hireDate, e.performance2025]);
    let csv = headers.join(",") + "\n";
    rows.forEach(row => { csv += row.map(v => `"${v}"`).join(",") + "\n"; });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "employees.csv"; a.click();
    URL.revokeObjectURL(url);
}

// Excel Import
let pendingImport = [];

const columnMap = {
    "code": "code", "employee code": "code", "emp code": "code", "empcode": "code", "id": "code", "رقم": "code", "كود": "code",
    "name": "name", "employee name": "name", "emp name": "name", "full name": "name", "الاسم": "name", "اسم": "name",
    "department": "department", "dept": "department", "القسم": "department", "الادارة": "department",
    "section": "section", "الشعبة": "section",
    "jobtitle": "jobTitle", "job title": "jobTitle", "position": "jobTitle", "title": "jobTitle", "المنصب": "jobTitle", "المسمى": "jobTitle",
    "manager": "manager", "supervisor": "manager", "المدير": "manager",
    "location": "location", "office": "location", "branch": "location", "الموقع": "location", "الفرع": "location",
    "gender": "gender", "sex": "gender", "الجنس": "gender",
    "status": "status", "الحالة": "status",
    "grade": "grade", "level": "grade", "المستوى": "grade", "الدرجة": "grade",
    "employeetype": "employeeType", "employee type": "employeeType", "type": "employeeType", "نوع الموظف": "employeeType", "النوع": "employeeType",
    "hiredate": "hireDate", "hire date": "hireDate", "start date": "hireDate", "تاريخ التعيين": "hireDate",
    "age": "age", "العمر": "age",
    "performance2025": "performance2025", "performance 2025": "performance2025", "perf 2025": "performance2025", "التقييم 2025": "performance2025",
    "performance2024": "performance2024", "performance 2024": "performance2024", "التقييم 2024": "performance2024",
    "performance2023": "performance2023", "performance 2023": "performance2023", "التقييم 2023": "performance2023",
    "pip": "pip",
    "promotiondate": "promotionDate", "promotion date": "promotionDate", "تاريخ الترقية": "promotionDate",
    "retirementdate": "retirementDate", "retirement date": "retirementDate", "تاريخ التقاعد": "retirementDate",
    "exitdate": "exitDate", "exit date": "exitDate", "تاريخ المغادرة": "exitDate",
    "exitreason": "exitReason", "exit reason": "exitReason", "سبب المغادرة": "exitReason"
};

const defaultValues = {
    code: "", name: "", department: "", section: "", jobTitle: "", manager: "-",
    location: "", status: "Active", hireDate: "", age: 0, gender: "Male",
    employeeType: "White Collar", grade: "G5", performance2023: 0, performance2024: 0,
    performance2025: 0, promotionDate: "", pip: false, retirementDate: "", exitDate: "", exitReason: ""
};

const validLocations = ["H.O Dokki","Wahat Bahreya","Minya","Khtara","Orabi","Sadat","October","Dokki Store","Helioplies","Shooting Club"];

function handleExcelFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (jsonData.length < 2) {
                alert("File is empty or has no data rows");
                return;
            }

            const headers = jsonData[0];
            const mappedHeaders = headers.map(h => {
                const key = String(h).trim().toLowerCase().replace(/[\s_]+/g, " ");
                return columnMap[key] || key;
            });

            pendingImport = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0 || !row[0]) continue;

                const emp = { ...defaultValues };
                mappedHeaders.forEach((field, idx) => {
                    if (row[idx] !== undefined && row[idx] !== null && row[idx] !== "") {
                        emp[field] = row[idx];
                    }
                });

                emp.code = String(emp.code).trim();
                emp.name = String(emp.name).trim();

                if (!emp.code || !emp.name) continue;

                if (emp.location) {
                    const match = validLocations.find(l => l.toLowerCase() === String(emp.location).toLowerCase().trim());
                    if (match) emp.location = match;
                }

                if (typeof emp.age === "string") emp.age = parseInt(emp.age) || 0;
                if (typeof emp.performance2023 === "string") emp.performance2023 = parseInt(emp.performance2023) || 0;
                if (typeof emp.performance2024 === "string") emp.performance2024 = parseInt(emp.performance2024) || 0;
                if (typeof emp.performance2025 === "string") emp.performance2025 = parseInt(emp.performance2025) || 0;
                if (typeof emp.pip === "string") emp.pip = emp.pip.toLowerCase() === "true" || emp.pip === "1" || emp.pip === "yes";

                pendingImport.push(emp);
            }

            if (pendingImport.length === 0) {
                alert("No valid employees found. Make sure your Excel has 'Code' and 'Name' columns.");
                return;
            }

            document.getElementById("importCount").textContent = pendingImport.length;
            document.getElementById("previewHead").innerHTML = "<tr><th>Code</th><th>Name</th><th>Department</th><th>Location</th><th>Status</th></tr>";
            document.getElementById("previewBody").innerHTML = pendingImport.slice(0, 20).map(e => `
                <tr><td>${e.code}</td><td>${e.name}</td><td>${e.department || "-"}</td><td>${e.location || "-"}</td><td>${e.status}</td></tr>
            `).join("") + (pendingImport.length > 20 ? `<tr><td colspan="5" class="text-center text-muted">...and ${pendingImport.length - 20} more</td></tr>` : "");

            document.getElementById("importPreview").style.display = "block";
            document.getElementById("confirmImportBtn").disabled = false;
        } catch (err) {
            alert("Error reading file: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function confirmImport() {
    if (!pendingImport.length) return;

    let imported = 0;
    let skipped = 0;

    pendingImport.forEach(emp => {
        const exists = employees.find(e => e.code === emp.code);
        if (exists) {
            skipped++;
        } else {
            employees.push(emp);
            imported++;
        }
    });

    saveToStorage();
    syncStatuses();
    renderEmployees();
    updateDashboard();

    const modal = bootstrap.Modal.getInstance(document.getElementById("importModal"));
    if (modal) modal.hide();

    document.getElementById("excelFile").value = "";
    document.getElementById("importPreview").style.display = "none";
    document.getElementById("confirmImportBtn").disabled = true;
    pendingImport = [];

    alert(`Import complete!\n${imported} employees added\n${skipped} skipped (duplicate codes)`);
}

function resetData() {
    if (!confirm("This will reset all data to original. Are you sure?")) return;
    localStorage.removeItem("hrms_employees");
    location.reload();
}

// Init
document.addEventListener("DOMContentLoaded", () => {
    loadEmployees();

    const search = document.getElementById("searchEmployee");
    if (search) search.addEventListener("keyup", searchEmployees);

    const dept = document.getElementById("departmentFilter");
    if (dept) dept.addEventListener("change", filterDepartment);

    const loc = document.getElementById("locationFilter");
    if (loc) loc.addEventListener("change", filterLocation);

    const excelInput = document.getElementById("excelFile");
    if (excelInput) excelInput.addEventListener("change", handleExcelFile);
});
