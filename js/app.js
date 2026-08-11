// HRMS Pro - app.js
console.log("app.js v2.1 - whitelist import loaded");
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

function normalizeLocations(list) {
    const map = {
        "wahat": "Wahat Bahreya", "bahreya": "Wahat Bahreya", "ÙˆØ§Ø­Ø§Øª": "Wahat Bahreya", "Ø¨Ø­Ø±ÙŠØ©": "Wahat Bahreya", "ÙˆØ§Ø­Ø©": "Wahat Bahreya",
        "minya": "Minya", "Ù…Ù†ÙŠØ§": "Minya", "Ø§Ù„Ù…Ù†ÙŠØ§": "Minya",
        "khtara": "Khtara", "Ø®Ø·Ø§Ø±": "Khtara", "Ø§Ù„Ø®Ø·Ø§Ø±Ø©": "Khtara", "Ø®Ø·Ø§Ø±Ø©": "Khtara",
        "orabi": "Orabi", "Ø¹Ø±Ø§Ø¨": "Orabi", "Ø¹Ø±Ø§Ø¨ÙŠ": "Orabi", "Ø¹Ø±Ø¨Ù‰": "Orabi",
        "dokki": "H.O Dokki", "Ø¯Ù‚ÙŠ": "H.O Dokki", "Ø§Ù„Ø¯Ù‚ÙŠ": "H.O Dokki", "dokky": "H.O Dokki",
        "sadat": "Sadat", "Ø§Ù„Ø³Ø§Ø¯Ø§Øª": "Sadat",
        "october": "October", "Ø§ÙƒØªÙˆØ¨Ø±": "October", "Ø£ÙƒØªÙˆØ¨Ø±": "October",
        "helio": "Helioplies", "Ù‡Ù„ÙŠÙˆØ¨ÙˆÙ„ÙŠØ³": "Helioplies", "Ù‡Ù„ÙŠÙˆØ¨Ù„Ø³": "Helioplies",
        "shooting": "Shooting Club",
        "dokki store": "Dokki Store"
    };
    return list.map(e => {
        const l = (e.location || "").trim();
        if (!l) return e;
        const lower = l.toLowerCase();
        for (const [key, val] of Object.entries(map)) {
            if (lower.includes(key)) { e.location = val; break; }
        }
        return e;
    });
}

function fillDepartmentFilter() {
    const dept = document.getElementById("departmentFilter");
    if (!dept) return;
    const current = dept.value;
    const names = [...new Set(employees.map(e => (e.department || "").trim()).filter(Boolean))].sort();
    dept.innerHTML = '<option value="">All Departments</option>' + names.map(n => `<option>${n}</option>`).join("");
    dept.value = current;
}

function fillDepartmentSelects() {
    const names = [...new Set(employees.map(e => (e.department || "").trim()).filter(Boolean))].sort();
    ["empDepartment", "editEmpDepartment"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<option value="">Select</option>' + names.map(n => `<option>${n}</option>`).join("");
    });
}

async function toggleChartArrow() {
    document.querySelectorAll(".collapse-arrow").forEach(arrow => {
        const target = document.getElementById(arrow.closest("[data-bs-toggle='collapse']")?.getAttribute("data-bs-target")?.replace("#", ""));
        if (target) {
            arrow.className = "fa-solid fa-chevron-" + (target.classList.contains("show") ? "up" : "down") + " collapse-arrow";
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-bs-target]").forEach(header => {
        const targetId = header.getAttribute("data-bs-target").replace("#", "");
        const target = document.getElementById(targetId);
        if (!target || !header.querySelector(".collapse-arrow")) return;
        target.addEventListener("hide.bs.collapse", () => {
            const a = header.querySelector(".collapse-arrow");
            if (a) a.className = "fa-solid fa-chevron-down collapse-arrow";
        });
        target.addEventListener("show.bs.collapse", () => {
            const a = header.querySelector(".collapse-arrow");
            if (a) a.className = "fa-solid fa-chevron-up collapse-arrow";
        });
    });
});

function migrateDates(list) {
    ["hireDate", "dateOfBirth", "resignationDate"].forEach(f => {
        list.forEach(e => {
            if (!e[f]) return;
            const num = Number(e[f]);
            if (!isNaN(num) && num > 20000 && num < 60000) {
                const d = new Date(Math.round((num - 25569) * 86400 * 1000));
                e[f] = d.toISOString().slice(0, 10);
            }
        });
    });
    return list;
}

async function loadEmployees() {
    const saved = localStorage.getItem("hrms_employees");
    if (saved) {
        employees = JSON.parse(saved);
        employees = migrateDates(employees);
        employees = normalizeLocations(employees);
        saveToStorage();
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
    fillDepartmentFilter();
    fillDepartmentSelects();
    updateDashboard();
    renderEmployees();
    renderCharts();
}

function parseDate(value) {
    if (!value) return null;
    const str = String(value).trim();
    const num = Number(str);
    if (!isNaN(num) && num > 20000 && num < 60000) {
        return new Date(Math.round((num - 25569) * 86400 * 1000));
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return null;
    return d;
}

function calcYears(dateStr, from) {
    if (!dateStr) return 0;
    const d = parseDate(dateStr);
    if (!d) return 0;
    const now = from ? parseDate(from) || new Date() : new Date();
    return Math.floor((now - d) / (1000 * 60 * 60 * 24 * 365.25));
}

function countBy(list, keyFn) {
    const map = {};
    list.forEach(e => {
        const k = keyFn(e);
        if (k) map[k] = (map[k] || 0) + 1;
    });
    return map;
}

function renderBarChart(elId, dataObj, color, showPct, keepOrder) {
    const el = document.getElementById(elId);
    if (!el) return;
    let entries = Object.entries(dataObj);
    if (!keepOrder) entries.sort((a, b) => b[1] - a[1]);
    if (!entries.length) { el.innerHTML = '<div class="text-center text-muted py-4">No data</div>'; return; }
    const max = Math.max(...entries.map(x => x[1]), 1);
    const total = entries.reduce((a, [, v]) => a + v, 0);
    el.innerHTML = entries.map(([k, v]) => {
        const pct = showPct ? ((v / total) * 100).toFixed(1) + "%" : "";
        return `
        <div class="bar-row">
            <span class="bar-label">${k}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(v / max) * 100}%;background:${color || '#198754'}"></div></div>
            <span class="bar-value">${v}</span>
            ${pct ? `<span class="bar-pct" style="background:${color || '#198754'}">${pct}</span>` : ""}
        </div>`;
    }).join("");
}

function renderCharts(list) {
    if (!document.getElementById("deptChartBody")) return;
    const data = list || employees;

    // Department
    renderBarChart("deptChartBody", countBy(data, e => e.department), "#198754", true);

    // Job Title
    renderBarChart("jobChartBody", countBy(data, e => e.jobTitle), "#0d6efd", true);

    // Location
    renderBarChart("chartLoc", countBy(data, e => e.location), "#fd7e14", true);

    // Years of Service (tenure)
    const tenureBuckets = {
        "Up to 3 months": 0, "3-6 months": 0, "6 months - 1 year": 0, "1-2 years": 0,
        "2-3 years": 0, "3-4 years": 0, "4-5 years": 0, "5-10 years": 0,
        "10-15 years": 0, "15-20 years": 0, "20+ years": 0
    };
    data.forEach(e => {
        const h = parseDate(e.hireDate);
        if (!h) return;
        const months = (Date.now() - h.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        if (months < 3) tenureBuckets["Up to 3 months"]++;
        else if (months < 6) tenureBuckets["3-6 months"]++;
        else if (months < 12) tenureBuckets["6 months - 1 year"]++;
        else if (months < 24) tenureBuckets["1-2 years"]++;
        else if (months < 36) tenureBuckets["2-3 years"]++;
        else if (months < 48) tenureBuckets["3-4 years"]++;
        else if (months < 60) tenureBuckets["4-5 years"]++;
        else if (months < 120) tenureBuckets["5-10 years"]++;
        else if (months < 180) tenureBuckets["10-15 years"]++;
        else if (months < 240) tenureBuckets["15-20 years"]++;
        else tenureBuckets["20+ years"]++;
    });
    renderBarChart("tenureChartBody", tenureBuckets, "#6f42c1", true, true);

    // Age distribution
    const ageBuckets = {
        "< 22": 0, "22-25": 0, "26-30": 0, "31-35": 0, "36-40": 0, "41-45": 0,
        "46-50": 0, "51-55": 0, "56-59": 0, "60+": 0
    };
    data.forEach(e => {
        const a = calcAge(e.dateOfBirth);
        if (a === 0) return;
        if (a < 22) ageBuckets["< 22"]++;
        else if (a < 26) ageBuckets["22-25"]++;
        else if (a < 31) ageBuckets["26-30"]++;
        else if (a < 36) ageBuckets["31-35"]++;
        else if (a < 41) ageBuckets["36-40"]++;
        else if (a < 46) ageBuckets["41-45"]++;
        else if (a < 51) ageBuckets["46-50"]++;
        else if (a < 56) ageBuckets["51-55"]++;
        else if (a < 60) ageBuckets["56-59"]++;
        else ageBuckets["60+"]++;
    });
    renderBarChart("ageChartBody", ageBuckets, "#dc3545", true, true);

    // Governorate
    renderBarChart("govChartBody", countBy(data, e => e.governorate), "#0dcaf0", true);

    // Transport Allowance by Governorate
    renderAllowanceChart(data);

    renderBreakdown(data);
}

function getMonthNum(dateStr) {
    if (!dateStr) return -1;
    const d = new Date(dateStr);
    if (isNaN(d)) return -1;
    return d.getMonth();
}

function renderBreakdown(list) {
    const el = document.getElementById("breakdownBoxes");
    if (!el) return;
    const data = list || employees;

    const colors = ["#198754", "#0d6efd", "#fd7e14", "#6f42c1", "#dc3545", "#0dcaf0", "#20c997", "#e83e8c"];
    const countBy = {};
    data.forEach(e => {
        const loc = e.location;
        if (!loc) return;
        const key = ["Khtara", "Orabi"].includes(loc) ? "Khtara & Orabi" : loc;
        countBy[key] = (countBy[key] || 0) + 1;
    });
    const total = data.length || 1;
    const pctOf = v => ((v / total) * 100).toFixed(1) + "%";
    const entries = Object.entries(countBy).sort((a, b) => b[1] - a[1]);
    if (!entries.length) { el.innerHTML = '<div class="text-center text-muted py-4">No data</div>'; return; }
    el.innerHTML = `<div class="row g-3">
        ${entries.map(([loc, v], i) => `
        <div class="col"><div class="breakdown-box"><h6>${loc}</h6><div class="num" style="color:${colors[i % colors.length]}">${v}</div><div class="job-mini">Employee(s)</div><span class="pct-circle" style="background:${colors[i % colors.length]}">${pctOf(v)}</span></div></div>`).join("")}
    </div>`;
}

function renderAllowanceChart(list) {
    const el = document.getElementById("allowanceChartBody");
    if (!el) return;
    const data = list || employees;
    const fmt = n => Math.round(n).toLocaleString("en-US");
    const byGov = {};
    data.forEach(e => {
        const g = e.governorate;
        if (!g) return;
        if (!byGov[g]) byGov[g] = { count: 0, allowance: 0 };
        byGov[g].count++;
        const v = parseFloat(e.transAllowance) || 0;
        if (v > byGov[g].allowance) byGov[g].allowance = v;
    });
    const rows = Object.entries(byGov).map(([g, o]) => ({
        g, count: o.count, allowance: o.allowance, total: o.allowance * o.count
    })).sort((a, b) => b.total - a.total);
    const grandTotal = rows.reduce((a, r) => a + r.total, 0);
    if (!rows.length) { el.innerHTML = '<div class="text-center text-muted py-4">No data</div>'; return; }
    el.innerHTML = `
        <table class="table table-sm table-bordered align-middle mb-2" style="font-size:13px">
            <thead class="table-light">
                <tr><th>Governorate</th><th>Allowance</th><th>Employees</th><th class="text-end">Total Allowance</th></tr>
            </thead>
            <tbody>
                ${rows.map(r => `
                <tr>
                    <td>${r.g}</td>
                    <td>${r.allowance ? fmt(r.allowance) : "-"}</td>
                    <td>${r.count}</td>
                    <td class="text-end">${fmt(r.total)}</td>
                </tr>`).join("")}
            </tbody>
        </table>
        <div class="d-flex justify-content-between align-items-center fw-bold" style="border-top:2px solid #dee2e6; padding-top:8px">
            <span>Grand Total Transport Allowance</span>
            <span style="color:#0dcaf0">${fmt(grandTotal)} EGP</span>
        </div>`;
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

function updateDashboard(list) {
    const data = list || employees;
    setValue("totalEmployees", data.length);
    setValue("whiteCollar", data.filter(e => e.employeeType === "White Collar").length);
    setValue("blueCollar", data.filter(e => e.employeeType === "Blue Collar").length);
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function prettyLabel(key) {
    return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
              .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
              .replace(/[_\s]+/g, " ")
              .replace(/\b\w/g, c => c.toUpperCase());
}

function getTableColumns() {
    const preferred = [
        { key: "status", label: "Status" },
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "nameAr", label: "Arabic Name" },
        { key: "hireDate", label: "Hiring Date" },
        { key: "resignationDate", label: "Resignation Date" },
        { key: "resignationReason", label: "Resignation Reason" },
        { key: "positionCode", label: "Position Code" },
        { key: "jobTitle", label: "Job Title" },
        { key: "jobTitleAr", label: "Job Title Arabic" },
        { key: "employeeType", label: "Type" },
        { key: "grade", label: "Grade" },
        { key: "department", label: "Department" },
        { key: "departmentAr", label: "Department Arabic" },
        { key: "section", label: "Section" },
        { key: "sectionAr", label: "Section Arabic" },
        { key: "unit", label: "Unit" },
        { key: "location", label: "Location" },
        { key: "locationAr", label: "Location Arabic" },
        { key: "governorate", label: "Governorate" },
        { key: "transAllowance", label: "Trans. Allowance" },
        { key: "email", label: "Email" },
        { key: "mobile", label: "Mobile" },
        { key: "dateOfBirth", label: "Date of Birth" },
        { key: "gender", label: "Gender" },
        { key: "directManager", label: "Direct Manager" },
        { key: "headOfDepartment", label: "Head of Department" },
        { key: "education", label: "Education" },
        { key: "sector", label: "Sector" },
        { key: "sectorAr", label: "Sector Arabic" },
        { key: "company", label: "Company" },
        { key: "oldPosition", label: "Old Position" },
        { key: "cat", label: "Category" }
    ];
    const present = new Set();
    employees.forEach(e => Object.keys(e).forEach(k => present.add(k)));
    const hasAny = k => employees.some(e => {
        const v = e[k];
        return v !== undefined && v !== null && String(v).trim() !== "";
    });
    const cols = preferred.filter(c => present.has(c.key) && hasAny(c.key));
    const extra = [...present].filter(k => !preferred.some(c => c.key === k) && hasAny(k))
                              .map(k => ({ key: k, label: prettyLabel(k) }));
    return cols.concat(extra);
}

function formatCell(key, emp) {
    const v = emp[key];
    const s = (v === undefined || v === null) ? "" : String(v);
    if (!s.trim()) return "-";
    switch (key) {
        case "status": return getStatusBadge(emp.status);
        case "code": return `<strong>${emp.code}</strong>`;
        case "name": return `<div class="d-flex align-items-center gap-2"><div class="emp-avatar">${getInitials(emp.name)}</div><div class="fw-semibold">${emp.name}</div></div>`;
        default: return s;
    }
}

function renderEmployees(list) {
    const data = list || employees;
    const tbody = document.getElementById("employeesTable");
    const thead = document.getElementById("employeesHead");
    if (!tbody) return;

    const cols = getTableColumns();
    if (thead) thead.innerHTML = `<tr>${cols.map(c => `<th>${c.label}</th>`).join("")}<th width="150">Actions</th></tr>`;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${cols.length + 1}" class="text-center text-muted py-4">
            <i class="fa-solid fa-users-slash fa-2x mb-2 d-block"></i>No employees found</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(emp => `
        <tr>
            ${cols.map(c => `<td>${formatCell(c.key, emp)}</td>`).join("")}
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
    applyFilters();
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
    if (loc) {
        filtered = filtered.filter(e => {
            const el = (e.location || "").toLowerCase();
            if (loc === "Khtara & Orabi") {
                return el.includes("khtara") || el.includes("orabi") || el.includes("Ø®Ø·Ø§Ø±") || el.includes("Ø¹Ø±Ø§Ø¨");
            }
            if (loc === "Wahat Bahreya") {
                return el.includes("wahat") || el.includes("bahreya") || el.includes("Ø§Ù„ÙˆØ§Ø­Ø§Øª") || el.includes("Ø¨Ø­Ø±ÙŠØ©") || el.includes("ÙˆØ§Ø­Ø§Øª");
            }
            if (loc === "Minya") {
                return el.includes("minya") || el.includes("Ù…Ù†ÙŠØ§") || el.includes("Ø§Ù„Ù…Ù†ÙŠØ§");
            }
            return el === loc.toLowerCase();
        });
    }
    const keyword = document.getElementById("searchEmployee")?.value.toLowerCase() || "";
    if (keyword) {
        filtered = filtered.filter(emp =>
            (emp.name || "").toLowerCase().includes(keyword) ||
            (emp.department || "").toLowerCase().includes(keyword) ||
            (emp.jobTitle || "").toLowerCase().includes(keyword) ||
            (emp.location || "").toLowerCase().includes(keyword) ||
            (emp.code || "").includes(keyword) ||
            (emp.section || "").toLowerCase().includes(keyword) ||
            (emp.employeeType || "").toLowerCase().includes(keyword) ||
            (emp.grade || "").toLowerCase().includes(keyword) ||
            (emp.directManager || "").toLowerCase().includes(keyword) ||
            (emp.headOfDepartment || "").toLowerCase().includes(keyword) ||
            (emp.education || "").toLowerCase().includes(keyword) ||
            (emp.gender || "").toLowerCase().includes(keyword) ||
            (emp.status || "").toLowerCase().includes(keyword)
        );
    }
    updateDashboard(filtered);
    renderCharts(filtered);
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
    renderCharts();
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
    renderCharts();
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
    renderCharts();
    if (emp) logActivity("Employee Deleted", `Deleted employee <strong>${emp.name}</strong> (${code})`, "fa-user-xmark");
}

function exportToCSV() {
    if (!employees.length) { alert("No data to export"); return; }
    const headers = ["Status","Code","Name","Hiring Date","Resignation Date","Resignation Reason","Position Code","Position","Type","Grade","Department","Section","Unit","Location","Governorate","Transport Allowance","Email","Mobile","Date of Birth","Gender","Direct Manager","Head of Department","Education"];
    const rows = employees.map(e => [
        e.status, e.code, e.name, e.hireDate, e.resignationDate, e.resignationReason || "",
        e.positionCode, e.jobTitle, e.employeeType, e.grade, e.department, e.section,
        e.unit, e.location, e.governorate, e.transAllowance, e.email, e.mobile, e.dateOfBirth,
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
    "code": "code", "employee code": "code", "emp code": "code", "empcode": "code", "id": "code", "Ø±Ù‚Ù…": "code", "ÙƒÙˆØ¯": "code", "employee code ": "code",
    "name": "name", "employee name": "name", "emp name": "name", "full name": "name", "Ø§Ù„Ø§Ø³Ù…": "name", "Ø§Ø³Ù…": "name", "emp name ": "name",
    "department": "department", "dept": "department", "Ø§Ù„Ù‚Ø³Ù…": "department", "Ø§Ù„Ø§Ø¯Ø§Ø±Ø©": "department", "department ": "department",
    "section": "section", "Ø§Ù„Ø´Ø¹Ø¨Ø©": "section", "section ": "section",
    "position code": "positionCode", "positioncode": "positionCode", "ÙƒÙˆØ¯ Ø§Ù„Ù…Ù†ØµØ¨": "positionCode",
    "jobtitle": "jobTitle", "job title": "jobTitle", "position": "jobTitle", "title": "jobTitle", "Ø§Ù„Ù…Ù†ØµØ¨": "jobTitle", "Ø§Ù„Ù…Ø³Ù…Ù‰": "jobTitle", "job title ": "jobTitle",
    "type": "employeeType", "employee type": "employeeType", "employeetype": "employeeType", "Ø§Ù„Ù†ÙˆØ¹": "employeeType", "Ù†ÙˆØ¹ Ø§Ù„Ù…ÙˆØ¸Ù": "employeeType", "employee type ": "employeeType",
    "grade": "grade", "level": "grade", "Ø§Ù„Ù…Ø³ØªÙˆÙ‰": "grade", "Ø§Ù„Ø¯Ø±Ø¬Ø©": "grade", "grade ": "grade",
    "unit": "unit", "Ø§Ù„ÙˆØ­Ø¯Ø©": "unit", "unit ": "unit",
    "location": "location", "office": "location", "branch": "location", "Ø§Ù„Ù…ÙˆÙ‚Ø¹": "location", "Ø§Ù„ÙØ±Ø¹": "location", "location ": "location",
    "governorate": "governorate", "governrate": "governorate", "Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©": "governorate", "Ù…Ø­Ø§ÙØ¸Ø©": "governorate", "governorate ": "governorate",
    "trans allowance": "transAllowance", "trans. allowance": "transAllowance", "transport allowance": "transAllowance", "transportation allowance": "transAllowance", "allowance": "transAllowance", "Ø¨Ø¯Ù„ Ø§Ù†ØªÙ‚Ø§Ù„": "transAllowance", "Ø¨Ø¯Ù„ Ø§Ù„Ù†Ù‚Ù„": "transAllowance", "trans allowance ": "transAllowance",
    "email": "email", "Ø§Ù„Ø¨Ø±ÙŠØ¯": "email", "Ø§ÙŠÙ…ÙŠÙ„": "email", "email ": "email",
    "mobile": "mobile", "phone": "mobile", "Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„": "mobile", "Ø§Ù„ØªÙ„ÙŠÙÙˆÙ†": "mobile", "Ø¬ÙˆØ§Ù„": "mobile", "mobile ": "mobile",
    "date of birth": "dateOfBirth", "dateofbirth": "dateOfBirth", "dob": "dateOfBirth", "ØªØ§Ø±ÙŠØ® Ø§Ù„Ù…ÙŠÙ„Ø§Ø¯": "dateOfBirth", "birth date": "dateOfBirth",
    "gender": "gender", "sex": "gender", "Ø§Ù„Ø¬Ù†Ø³": "gender", "gender ": "gender",
    "direct manager": "directManager", "directmanager": "directManager", "manager": "directManager", "supervisor": "directManager", "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±": "directManager", "direct manager ": "directManager",
    "head of department": "headOfDepartment", "headofdepartment": "headOfDepartment", "head dept": "headOfDepartment", "Ù…Ø¯ÙŠØ± Ø§Ù„Ù‚Ø³Ù…": "headOfDepartment", "head of department ": "headOfDepartment",
    "education": "education", "Ø§Ù„Ù…Ø¤Ù‡Ù„": "education", "Ø§Ù„Ù…Ø¤Ù‡Ù„": "education", "education ": "education",
    "status": "status", "Ø§Ù„Ø­Ø§Ù„Ø©": "status", "status ": "status",
    "hiredate": "hireDate", "hire date": "hireDate", "start date": "hireDate", "ØªØ§Ø±ÙŠØ® Ø§Ù„ØªØ¹ÙŠÙŠÙ†": "hireDate", "hiring date": "hireDate", "hire date ": "hireDate", "hiring date ": "hireDate",
    "resignation date": "resignationDate", "resignationdate": "resignationDate", "ØªØ§Ø±ÙŠØ® Ø§Ù„Ù…ØºØ§Ø¯Ø±Ø©": "resignationDate", "ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªÙ‚Ø§Ù„Ø©": "resignationDate", "resignation date ": "resignationDate",
    "resignation reason": "resignationReason", "resignationreason": "resignationReason", "Ø³Ø¨Ø¨ Ø§Ù„Ø§Ø³ØªÙ‚Ø§Ù„Ø©": "resignationReason", "Ø³Ø¨Ø¨ Ø§Ù„Ù…ØºØ§Ø¯Ø±Ø©": "resignationReason", "resignation reason ": "resignationReason",
    "sr.": "sr", "sr": "sr", "#": "sr", "no": "sr", "no.": "sr", "Ø§Ù„Ø±Ù‚Ù…": "sr", "Ù…": "sr",
    "satus": "status", "statuse": "status", "employee status": "status",
    "arabic name": "nameAr", "arabic name ": "nameAr", "name arabic": "nameAr", "Ø§Ù„Ø§Ø³Ù… Ø§Ù„Ø¹Ø±Ø¨ÙŠ": "nameAr",
    "company": "company", "Ø§Ù„Ø´Ø±ÙƒØ©": "company",
    "old position": "oldPosition", "oldposition": "oldPosition",
    "cat": "cat", "category": "cat", "ØªØµÙ†ÙŠÙ": "cat", "ÙØ¦Ø©": "cat",
    "position e": "jobTitle", "position english": "jobTitle", "positionen": "jobTitle", "position e ": "jobTitle",
    "position a": "jobTitleAr", "position arabic": "jobTitleAr", "positionar": "jobTitleAr", "position a ": "jobTitleAr",
    "sector e": "sector", "sector english": "sector", "sectore": "sector", "sector e ": "sector",
    "sector a": "sectorAr", "sector arabic": "sectorAr", "sectorar": "sectorAr", "sector a ": "sectorAr",
    "department e": "department", "department english": "department", "departmenten": "department", "department e ": "department",
    "department a": "departmentAr", "department arabic": "departmentAr", "departmentar": "departmentAr", "department a ": "departmentAr",
    "section e": "section", "section english": "section", "sectionen": "section", "section e ": "section",
    "section a": "sectionAr", "section arabic": "sectionAr", "sectionar": "sectionAr", "section a ": "sectionAr",
    "location e": "location", "location english": "location", "locationen": "location", "location e ": "location",
    "location a": "locationAr", "location arabic": "locationAr", "locationar": "locationAr", "location a ": "locationAr"
};

const defaultValues = {
    code: "", name: "", department: "", section: "", positionCode: "", jobTitle: "",
    employeeType: "White Collar", grade: "G5", unit: "", location: "", status: "Active", hireDate: "",
    resignationDate: "", resignationReason: "", email: "", mobile: "", dateOfBirth: "", gender: "Male",
    directManager: "", headOfDepartment: "", education: "Bachelor's", governorate: "", transAllowance: ""
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

            console.log("Sheet Name:", sheetName);


            if (jsonData.length < 2) {
                alert("File is empty or has no data rows");
                return;
            }

            const headers = jsonData[0];
            console.log("Excel Headers:", headers);

            const mappedHeaders = headers.map(h => {
                const key = String(h).trim().toLowerCase().replace(/[\s_]+/g, " ");
                let mapped = columnMap[key] || key;
                if (mapped === key && /allow|trans|transport/.test(key)) mapped = "transAllowance";
                return mapped;
            });
            console.log("Mapped Headers:", mappedHeaders);

            pendingImport = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                const raw = {};
                mappedHeaders.forEach((field, idx) => {
                    if (row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim() !== "") {
                        raw[field] = String(row[idx]).trim();
                    }
                });

                const emp = { ...defaultValues };

                // Whitelist: copy only known fields (drops attendance columns like 6/21, governorate, etc.)
                Object.keys(defaultValues).forEach(k => {
                    if (raw[k] !== undefined) emp[k] = raw[k];
                });

                // Arabic fallbacks if English column is empty
                if (!emp.name && raw.nameAr) emp.name = raw.nameAr;
                if (!emp.department && raw.departmentAr) emp.department = raw.departmentAr;
                if (!emp.section && raw.sectionAr) emp.section = raw.sectionAr;
                if (!emp.jobTitle && raw.jobTitleAr) emp.jobTitle = raw.jobTitleAr;
                if (!emp.location && raw.locationAr) emp.location = raw.locationAr;

                // Convert Excel serial dates (e.g. 41604) and text dates ("Monday, March 6, 1995") to yyyy-mm-dd
                ["hireDate", "dateOfBirth", "resignationDate"].forEach(f => {
                    if (emp[f]) {
                        const num = Number(emp[f]);
                        if (!isNaN(num) && num > 20000 && num < 60000) {
                            const d = new Date(Math.round((num - 25569) * 86400 * 1000));
                            emp[f] = d.toISOString().slice(0, 10);
                        } else if (/[a-zA-Z]/.test(emp[f])) {
                            const d = new Date(emp[f]);
                            if (!isNaN(d.getTime())) {
                                emp[f] = d.toISOString().slice(0, 10);
                            }
                        }
                    }
                });

                // Convert cat W/B to White/Blue Collar
                if (raw.cat) {
                    const c = raw.cat.toLowerCase();
                    if (c === "w") emp.employeeType = "White Collar";
                    else if (c === "b") emp.employeeType = "Blue Collar";
                }

                emp.code = String(emp.code).trim();
                emp.name = String(emp.name).trim();

                if (!emp.code || !emp.name) continue;

                if (emp.location) {
                    const match = validLocations.find(l => l.toLowerCase() === String(emp.location).toLowerCase().trim());
                    if (match) emp.location = match;
                    else {
                        const l = String(emp.location).toLowerCase();
                        if (l.includes("wahat") || l.includes("bahreya") || l.includes("ÙˆØ§Ø­Ø§Øª") || l.includes("Ø¨Ø­Ø±ÙŠØ©")) emp.location = "Wahat Bahreya";
                        else if (l.includes("minya") || l.includes("Ù…Ù†ÙŠØ§") || l.includes("Ø§Ù„Ù…Ù†ÙŠØ§")) emp.location = "Minya";
                        else if (l.includes("khtara") || l.includes("Ø®Ø·Ø§Ø±")) emp.location = "Khtara";
                        else if (l.includes("orabi") || l.includes("Ø¹Ø±Ø§Ø¨")) emp.location = "Orabi";
                        else if (l.includes("dokki") || l.includes("Ø¯Ù‚ÙŠ") || l.includes("Ø§Ù„Ø¯Ù‚ÙŠ")) emp.location = "H.O Dokki";
                        else if (l.includes("sadat") || l.includes("Ø§Ù„Ø³Ø§Ø¯Ø§Øª")) emp.location = "Sadat";
                        else if (l.includes("october") || l.includes("Ø§ÙƒØªÙˆØ¨Ø±") || l.includes("Ø£ÙƒØªÙˆØ¨Ø±")) emp.location = "October";
                    }
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
    fillDepartmentFilter();
    fillDepartmentSelects();

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

