(function () {
    var KEY = "hrms_employees";
    try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return;
        var list = JSON.parse(raw);
        if (!Array.isArray(list)) return;
        var changed = false;
        list.forEach(function (e) {
            if (!e || typeof e !== "object") return;
            ["hireDate", "dateOfBirth", "resignationDate"].forEach(function (f) {
                var v = e[f];
                if (!v) return;
                var num = Number(v);
                if (!isNaN(num) && num > 20000 && num < 60000) {
                    var d = new Date(Math.round((num - 25569) * 86400 * 1000));
                    if (!isNaN(d.getTime())) { e[f] = d.toISOString().slice(0, 10); changed = true; }
                }
            });
        });
        if (changed) localStorage.setItem(KEY, JSON.stringify(list));
    } catch (err) {
        console.warn("migrate.js:", err);
    }
})();
