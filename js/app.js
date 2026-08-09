// HRMS Pro - app.js
let employees = [];

function saveToStorage() {
    localStorage.setItem("hrms_employees", JSON.stringify(employees));
}

function logActivity(type, text, icon) {
    const activities = JSON.parse(localStorage.getItem("hrms_activities") || "[]");
    activities.unshift({
        type,
        text,
        icon: icon || "fa-circle-check",
        date: new Date().toISOString().slice(0, 16).replace("T", " ")
    });
    localStorage.setItem("hrms_activities", JSON.stringify(activities.slice(0, 200)));
}

function syncStatuses() {
    employees.forEach(emp => {
        if (emp.resignationDate && emp.resignationDate.trim() !== "") {
            emp.status = "Inactive";
        }
    });
}

function calcAge(dob) {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
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
    const positionCode = document.getElementById("empPositionCode").value.trim();
    const jobTitle = document.getElementById("empJob").value.trim();
    const employeeType = document.getElementById("empType").value;
    const grade = document.getElementById("empGrade").value.trim();
    const unit = document.getElementById("empUnit").value.trim();
    const location = document.getElementById("empLocation").value.trim();
    const email = document.getElementById("empEmail").value.trim();
    const mobile = document.getElementById("empMobile").value.trim();
    const dob = document.getElementById("empDob").value;
    const age = calcAge(dob);
    const gender = document.getElementById("empGender").value;
    const directManager = document.getElementById("empDirectManager").value.trim();
    const headOfDepartment = document.getElementById("empHeadDept").value.trim();
    const education = document.getElementById("empEducation").value.trim();
    const resignationDate = document.getElementById("empResignationDate").value || "";
    const resignationReason = document.getElementById("empResignationReason") ? document.getElementById("empResignationReason").value : "";

    if (!code || !name || !department || !jobTitle || !location) {
        alert("Please fill all required fields");
        return;
    }

    if (employees.find(e => e.code === code)) {
        alert("Employee code already exists");
        return;
    }

    const status = document.getElementById("empStatus").value;
    const finalStatus = resignationDate ? "Inactive" : status;

    employees.push({
        code, name, department, section: section || department, positionCode, jobTitle,
        employeeType, grade, unit, location, status: finalStatus, hireDate: document.getElementById("empHireDate").value || new Date().toISOString().split("T")[0],
        resignationDate, resignationReason, email, mobile, dateOfBirth: dob, age, gender,
        directManager, headOfDepartment, education
    });

    saveToStorage();
    renderEmployees();
    updateDashboard();
    clearForm();
    logActivity("Employee Added", `Added employee <strong>${name}</strong> (${code})`, "fa-user-plus");

    const modal = bootstrap.Modal.getInstance(document.getElementById("addEmployeeModal"));
    if (modal) modal.hide();
}

function clearForm() {
    ["empCode", "empName", "empJob", "empLocation", "empSection", "empPositionCode",
     "empGrade", "empUnit", "empEmail", "empMobile", "empDob", "empDirectManager",
     "empHeadDept", "empEducation", "empType", "empHireDate", "empResignationDate"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    const dept = document.getElementById("empDepartment");
    if (dept) dept.selectedIndex = 0;
    const gender = document.getElementById("empGender");
    if (gender) gender.selectedIndex = 0;
    const empType = document.getElementById("empType");
    if (empType) empType.selectedIndex = 0;
    const status = document.getElementById("empStatus");
    if (status) status.selectedIndex = 0;
    const resReason = document.getElementById("empResignationReason");
    if (resReason) resReason.selectedIndex = 0;
}

function viewEmployee(code) {
    const emp = employees.find(e => e.code === code);
    if (!emp) return;

    const modal = new bootstrap.Modal(document.getElementById("viewEmployeeModal"));
    const age = calcAge(emp.dateOfBirth);

    document.getElementById("viewModalBody").innerHTML = `
        <div class="text-center mb-3">
            <div class="emp-avatar" style="width:64px;height:64px;font-size:22px;margin:0 auto;">${getInitials(emp.name)}</div>
            <h4 class="mt-2 mb-0">${emp.name}</h4>
            <small class="text-muted">${emp.jobTitle} | ${emp.department}</small>
        </div>
        <table class="table table-borderless mb-0">
            <tr><td class="text-muted" style="width:40%">Code</td><td><strong>${emp.code}</strong></td></tr>
            <tr><td class="text-muted">Department</td><td>${emp.department}</td></tr>
            <tr><td class="text-muted">Section</td><td>${emp.section || "-"}</td></tr>
            <tr><td class="text-muted">Position Code</td><td>${emp.positionCode || "-"}</td></tr>
            <tr><td class="text-muted">Job Title</td><td>${emp.jobTitle}</td></tr>
            <tr><td class="text-muted">Type</td><td>${emp.employeeType || "-"}</td></tr>
            <tr><td class="text-muted">Grade</td><td>${emp.grade}</td></tr>
            <tr><td class="text-muted">Unit</td><td>${emp.unit || "-"}</td></tr>
            <tr><td class="text-muted">Location</td><td>${emp.location}</td></tr>
            <tr><td class="text-muted">Status</td><td>${getStatusBadge(emp.status)}</td></tr>
            <tr><td class="text-muted">Hire Date</td><td>${emp.hireDate}</td></tr>
            <tr><td class="text-muted">Resignation Date</td><td>${emp.resignationDate || "-"}</td></tr>
            <tr><td class="text-muted">Resignation Reason</td><td>${emp.resignationReason || "-"}</td></tr>
            <tr><td class="text-muted">Email</td><td>${emp.email || "-"}</td></tr>
            <tr><td class="text-muted">Mobile</td><td>${emp.mobile || "-"}</td></tr>
            <tr><td class="text-muted">Date of Birth</td><td>${emp.dateOfBirth || "-"}</td></tr>
            <tr><td class="text-muted">Age</td><td>${age}</td></tr>
            <tr><td class="text-muted">Gender</td><td>${emp.gender}</td></tr>
            <tr><td class="text-muted">Direct Manager</td><td>${emp.directManager || "-"}</td></tr>
            <tr><td class="text-muted">Head of Department</td><td>${emp.headOfDepartment || "-"}</td></tr>
            <tr><td class="text-muted">Education</td><td>${emp.education || "-"}</td></tr>
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
    document.getElementById("editEmpType").value = emp.employeeType || "White Collar";
    document.getElementById("editEmpLocation").value = emp.location;
    document.getElementById("editEmpGender").value = emp.gender;
    document.getElementById("editEmpPositionCode").value = emp.positionCode || "";
    document.getElementById("editEmpGrade").value = emp.grade;
    document.getElementById("editEmpUnit").value = emp.unit || "";
    document.getElementById("editEmpEmail").value = emp.email || "";
    document.getElementById("editEmpMobile").value = emp.mobile || "";
    document.getElementById("editEmpDob").value = emp.dateOfBirth || "";
    document.getElementById("editEmpDirectManager").value = emp.directManager || "";
    document.getElementById("editEmpHeadDept").value = emp.headOfDepartment || "";
    document.getElementById("editEmpEducation").value = emp.education || "";
    document.getElementById("editEmpResignationDate").value = emp.resignationDate || "";
    if (document.getElementById("editEmpResignationReason")) {
        document.getElementById("editEmpResignationReason").value = emp.resignationReason || "";
    }
    document.getElementById("editEmpSection").value = emp.section || "";
    document.getElementById("editEmpHireDate").value = emp.hireDate || "";
    document.getElementById("editEmpStatus").value = emp.status || "Active";

    new bootstrap.Modal(document.getElementById("editEmployeeModal")).show();
}

function saveEdit() {
    const code = document.getElementById("editEmpCode").value;
    const emp = employees.find(e => e.code === code);
    if (!emp) return;

    emp.name = document.getElementById("editEmpName").value.trim();
    emp.department = document.getElementById("editEmpDepartment").value;
    emp.jobTitle = document.getElementById("editEmpJob").value.trim();
    emp.employeeType = document.getElementById("editEmpType").value;
    emp.location = document.getElementById("editEmpLocation").value.trim();
    emp.gender = document.getElementById("editEmpGender").value;
    emp.positionCode = document.getElementById("editEmpPositionCode").value.trim();
    emp.grade = document.getElementById("editEmpGrade").value.trim();
    emp.unit = document.getElementById("editEmpUnit").value.trim();
    emp.email = document.getElementById("editEmpEmail").value.trim();
    emp.mobile = document.getElementById("editEmpMobile").value.trim();
    emp.dateOfBirth = document.getElementById("editEmpDob").value;
    emp.age = calcAge(emp.dateOfBirth);
    emp.directManager = document.getElementById("editEmpDirectManager").value.trim();
    emp.headOfDepartment = document.getElementById("editEmpHeadDept").value.trim();
    emp.education = document.getElementById("editEmpEducation").value.trim();
    emp.resignationDate = document.getElementById("editEmpResignationDate").value || "";
    emp.resignationReason = document.getElementById("editEmpResignationReason") ? document.getElementById("editEmpResignationReason").value : "";
    emp.section = document.getElementById("editEmpSection").value.trim() || emp.department;
    emp.hireDate = document.getElementById("editEmpHireDate").value || emp.hireDate;

    if (emp.resignationDate && emp.resignationDate.trim() !== "") {
        emp.status = "Inactive";
    } else {
        emp.status = document.getElementById("editEmpStatus").value;
    }

    saveToStorage();
    syncStatuses();
    renderEmployees();
    updateDashboard();
    logActivity("Employee Updated", `Updated employee <strong>${emp.name}</strong> (${emp.code})`, "fa-user-pen");

    const modal = bootstrap.Modal.getInstance(document.getElementById("editEmployeeModal"));
    if (modal) modal.hide();
}

function deleteEmployee(code) {
    const emp = employees.find(e => e.code === code);
    if (!confirm("Are you sure you want to delete this employee?")) return;
    employees = employees.filter(e => e.code !== code);
    saveToStorage();
    renderEmployees();
    updateDashboard();
    if (emp) logActivity("Employee Deleted", `Deleted employee <strong>${emp.name}</strong> (${code})`, "fa-user-xmark");
}

function exportToCSV() {
    if (!employees.length) { alert("No data to export"); return; }
    const headers = ["Status","Code","Name","Hiring Date","Resignation Date","Resignation Reason","Position Code","Position","Type","Grade","Department","Section","Unit","Location","Email","Mobile","Date of Birth","Gender","Direct Manager","Head of Department","Education"];
    const rows = employees.map(e => [
        e.status, e.code, e.name, e.hireDate, e.resignationDate, e.resignationReason || "",
        e.positionCode, e.jobTitle, e.employeeType, e.grade, e.department, e.section,
        e.unit, e.location, e.email, e.mobile, e.dateOfBirth,
        e.gender, e.directManager, e.headOfDepartment, e.education
    ]);
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
    "code": "code", "employee code": "code", "emp code": "code", "empcode": "code", "id": "code", "رقم": "code", "كود": "code", "employee code ": "code",
    "name": "name", "employee name": "name", "emp name": "name", "full name": "name", "الاسم": "name", "اسم": "name", "emp name ": "name",
    "department": "department", "dept": "department", "القسم": "department", "الادارة": "department", "department ": "department",
    "section": "section", "الشعبة": "section", "section ": "section",
    "position code": "positionCode", "positioncode": "positionCode", "كود المنصب": "positionCode",
    "jobtitle": "jobTitle", "job title": "jobTitle", "position": "jobTitle", "title": "jobTitle", "المنصب": "jobTitle", "المسمى": "jobTitle", "job title ": "jobTitle",
    "type": "employeeType", "employee type": "employeeType", "employeetype": "employeeType", "النوع": "employeeType", "نوع الموظف": "employeeType", "employee type ": "employeeType",
    "grade": "grade", "level": "grade", "المستوى": "grade", "الدرجة": "grade", "grade ": "grade",
    "unit": "unit", "الوحدة": "unit", "unit ": "unit",
    "location": "location", "office": "location", "branch": "location", "الموقع": "location", "الفرع": "location", "location ": "location",
    "email": "email", "البريد": "email", "ايميل": "email", "email ": "email",
    "mobile": "mobile", "phone": "mobile", "الموبايل": "mobile", "التليفون": "mobile", "جوال": "mobile", "mobile ": "mobile",
    "date of birth": "dateOfBirth", "dateofbirth": "dateOfBirth", "dob": "dateOfBirth", "تاريخ الميلاد": "dateOfBirth", "birth date": "dateOfBirth",
    "gender": "gender", "sex": "gender", "الجنس": "gender", "gender ": "gender",
    "direct manager": "directManager", "directmanager": "directManager", "manager": "directManager", "supervisor": "directManager", "المدير المباشر": "directManager", "direct manager ": "directManager",
    "head of department": "headOfDepartment", "headofdepartment": "headOfDepartment", "head dept": "headOfDepartment", "مدير القسم": "headOfDepartment", "head of department ": "headOfDepartment",
    "education": "education", "المؤهل": "education", "المؤهل": "education", "education ": "education",
    "status": "status", "الحالة": "status", "status ": "status",
    "hiredate": "hireDate", "hire date": "hireDate", "start date": "hireDate", "تاريخ التعيين": "hireDate", "hiring date": "hireDate", "hire date ": "hireDate", "hiring date ": "hireDate",
    "resignation date": "resignationDate", "resignationdate": "resignationDate", "تاريخ المغادرة": "resignationDate", "تاريخ الاستقالة": "resignationDate", "resignation date ": "resignationDate",
    "resignation reason": "resignationReason", "resignationreason": "resignationReason", "سبب الاستقالة": "resignationReason", "سبب المغادرة": "resignationReason", "resignation reason ": "resignationReason"
};

const defaultValues = {
    code: "", name: "", department: "", section: "", positionCode: "", jobTitle: "",
    employeeType: "White Collar", grade: "G5", unit: "", location: "", status: "Active", hireDate: "",
    resignationDate: "", resignationReason: "", email: "", mobile: "", dateOfBirth: "", gender: "Male",
    directManager: "", headOfDepartment: "", education: "Bachelor's"
};

const validLocations = ["H.O Dokki","Wahat Bahreya","Minya","Khtara","Orabi","Sadat","October","Dokki Store","Helioplies","Shooting Club"];

function handleExcelFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
        alert("Error: Excel library not loaded. Please refresh the page and try again.");
        return;
    }

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
            alert("Found " + (jsonData.length - 1) + " data rows.\n\nExcel Headers:\n" + headers.map((h,i) => (i+1) + ". " + h).join("\n"));

            const mappedHeaders = headers.map(h => {
                const key = String(h).trim().toLowerCase().replace(/[\s_]+/g, " ");
                return columnMap[key] || key;
            });

            // Debug: show mapped headers
            console.log("Excel Headers:", headers);
            console.log("Mapped Headers:", mappedHeaders);

            pendingImport = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                const emp = { ...defaultValues };
                mappedHeaders.forEach((field, idx) => {
                    if (row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim() !== "") {
                        emp[field] = String(row[idx]).trim();
                    }
                });

                emp.code = String(emp.code).trim();
                emp.name = String(emp.name).trim();

                if (!emp.code || !emp.name) continue;

                if (emp.location) {
                    const match = validLocations.find(l => l.toLowerCase() === String(emp.location).toLowerCase().trim());
                    if (match) emp.location = match;
                }

                emp.age = calcAge(emp.dateOfBirth);

                pendingImport.push(emp);
            }

            if (pendingImport.length === 0) {
                alert("No valid employees found.\n\nExcel Headers found:\n" + headers.join(", ") + "\n\nMapped to:\n" + mappedHeaders.join(", ") + "\n\nMake sure 'Code' and 'Name' columns exist.");
                return;
            }

            document.getElementById("importCount").textContent = pendingImport.length;
            document.getElementById("previewHead").innerHTML = "<tr><th>Code</th><th>Name</th><th>Department</th><th>Position</th><th>Location</th><th>Status</th></tr>";
            document.getElementById("previewBody").innerHTML = pendingImport.slice(0, 20).map(e => `
                <tr><td>${e.code}</td><td>${e.name}</td><td>${e.department || "-"}</td><td>${e.jobTitle || "-"}</td><td>${e.location || "-"}</td><td>${e.status}</td></tr>
            `).join("") + (pendingImport.length > 20 ? `<tr><td colspan="6" class="text-center text-muted">...and ${pendingImport.length - 20} more</td></tr>` : "");

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

    if (!confirm(`This will replace ALL current employees (${employees.length}) with ${pendingImport.length} employees from the Excel file. Continue?`)) return;

    employees = [...pendingImport];
    saveToStorage();

    logActivity("Excel Import", `Imported <strong>${employees.length}</strong> employees from Excel`, "fa-file-import");
    alert(`Import complete! ${employees.length} employees saved.\nPage will now refresh.`);
    location.reload();
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
