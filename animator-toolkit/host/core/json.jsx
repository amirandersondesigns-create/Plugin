// ============================================================================
// Animator Toolkit - JSON for ExtendScript
//
// ExtendScript (ES3) has no JSON object. This is a small, strict encoder and
// a recursive-descent parser. The parser never uses eval(), so a request
// from the panel can only ever become data, never code.
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {

AT.JSON = (function () {
    var ESC = { '"': '\\"', "\\": "\\\\", "\b": "\\b", "\f": "\\f", "\n": "\\n", "\r": "\\r", "\t": "\\t" };

    function quote(s) {
        var out = '"';
        for (var i = 0; i < s.length; i++) {
            var c = s.charAt(i);
            var code = s.charCodeAt(i);
            if (ESC[c]) {
                out += ESC[c];
            } else if (code < 0x20 || code === 0x2028 || code === 0x2029 || code > 0x7e) {
                // Escape everything outside printable ASCII so the result
                // survives evalScript's string round trip on every platform.
                var hex = code.toString(16);
                while (hex.length < 4) hex = "0" + hex;
                out += "\\u" + hex;
            } else {
                out += c;
            }
        }
        return out + '"';
    }

    function isArray(v) {
        return Object.prototype.toString.call(v) === "[object Array]";
    }

    function stringify(v) {
        if (v === null || v === undefined) return "null";
        var t = typeof v;
        if (t === "number") return isFinite(v) ? String(v) : "null";
        if (t === "boolean") return v ? "true" : "false";
        if (t === "string") return quote(v);
        if (t === "function") return "null";
        if (isArray(v)) {
            var parts = [];
            for (var i = 0; i < v.length; i++) parts.push(stringify(v[i]));
            return "[" + parts.join(",") + "]";
        }
        var props = [];
        for (var k in v) {
            if (!v.hasOwnProperty(k)) continue;
            if (v[k] === undefined || typeof v[k] === "function") continue;
            props.push(quote(k) + ":" + stringify(v[k]));
        }
        return "{" + props.join(",") + "}";
    }

    function parse(text) {
        var at = 0;
        var ch = " ";

        function fail(msg) {
            throw new Error("Invalid JSON: " + msg + " at " + at);
        }
        function next(expected) {
            if (expected && expected !== ch) fail("expected '" + expected + "'");
            ch = text.charAt(at);
            at += 1;
            return ch;
        }
        function white() {
            while (ch && ch <= " ") next();
        }
        function number() {
            var s = "";
            if (ch === "-") { s = "-"; next("-"); }
            while (ch >= "0" && ch <= "9") { s += ch; next(); }
            if (ch === ".") { s += "."; while (next() && ch >= "0" && ch <= "9") s += ch; }
            if (ch === "e" || ch === "E") {
                s += ch; next();
                if (ch === "-" || ch === "+") { s += ch; next(); }
                while (ch >= "0" && ch <= "9") { s += ch; next(); }
            }
            var n = +s;
            if (!isFinite(n)) fail("bad number");
            return n;
        }
        function string() {
            var s = "";
            if (ch !== '"') fail("expected string");
            while (next()) {
                if (ch === '"') { next(); return s; }
                if (ch === "\\") {
                    next();
                    if (ch === "u") {
                        var code = 0;
                        for (var i = 0; i < 4; i++) {
                            var h = parseInt(next(), 16);
                            if (isNaN(h)) fail("bad unicode escape");
                            code = code * 16 + h;
                        }
                        s += String.fromCharCode(code);
                    } else {
                        var map = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };
                        if (!map.hasOwnProperty(ch)) fail("bad escape");
                        s += map[ch];
                    }
                } else {
                    s += ch;
                }
            }
            fail("unterminated string");
        }
        function word() {
            if (ch === "t") { next("t"); next("r"); next("u"); next("e"); return true; }
            if (ch === "f") { next("f"); next("a"); next("l"); next("s"); next("e"); return false; }
            if (ch === "n") { next("n"); next("u"); next("l"); next("l"); return null; }
            fail("unexpected '" + ch + "'");
        }
        function array() {
            var arr = [];
            next("[");
            white();
            if (ch === "]") { next("]"); return arr; }
            while (ch) {
                arr.push(value());
                white();
                if (ch === "]") { next("]"); return arr; }
                next(",");
                white();
            }
            fail("unterminated array");
        }
        function object() {
            var obj = {};
            next("{");
            white();
            if (ch === "}") { next("}"); return obj; }
            while (ch) {
                var key = string();
                white();
                next(":");
                obj[key] = value();
                white();
                if (ch === "}") { next("}"); return obj; }
                next(",");
                white();
            }
            fail("unterminated object");
        }
        function value() {
            white();
            if (ch === "{") return object();
            if (ch === "[") return array();
            if (ch === '"') return string();
            if (ch === "-" || (ch >= "0" && ch <= "9")) return number();
            return word();
        }

        var result = value();
        white();
        if (ch) fail("trailing characters");
        return result;
    }

    return { stringify: stringify, parse: parse };
})();

}($["com.cnn.animatortoolkit"]));
