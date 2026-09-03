// ============================================================================
// MOTION SPELL CHECKER — ExtendScript engine (CEP host)
// After Effects 2022+
//
// This file contains no UI. It is the ExtendScript "back end" that the CEP
// HTML panel (client/index.html + client/js/main.js) talks to through
// CSInterface.evalScript(). Every function the panel calls is prefixed
// "cs" and returns a JSON string.
// ============================================================================

var APP_NAME = "Motion Spell Checker";
var VERSION = "2.0";
var AUTHOR = "Amir Anderson";

// ==================== FALLBACK DICTIONARY ====================
// A compact built-in word list so the checker works even before any
// category files are dropped into /Dictionary/. Drop .txt word lists
// (one word per line, or "wrong -> right" correction lines) into a
// "Dictionary" folder next to this extension for full coverage.
var FALLBACK_DICTIONARY = [
    "a","about","above","across","action","active","add","after","again","against","ago","all","almost","alone","along","already",
    "also","although","always","among","an","and","angle","animate","animation","another","any","anyone","appear","are","area","around",
    "art","as","ask","at","audio","auto","available","back","background","bar","base","be","because","become","been","before",
    "begin","behind","below","best","better","between","beyond","big","black","blend","blue","body","both","bottom","box","brand",
    "break","bright","build","but","by","call","camera","can","cannot","capture","case","center","change","character","check","choose",
    "clean","clear","click","clip","clock","close","color","comment","comp","complete","composition","content","control","copy","corner",
    "could","create","current","curve","custom","dark","data","default","delete","depth","design","detail","develop","different","direct",
    "director","display","distance","do","does","done","down","draft","drag","draw","drive","drop","duration","during","each","easy",
    "edge","edit","editor","effect","either","element","else","empty","end","enter","error","even","every","example","expand","expression",
    "extend","eye","fade","fast","field","file","fill","film","filter","final","find","first","fit","fix","flow","focus",
    "folder","follow","font","for","form","format","forward","frame","free","from","front","full","function","gap","get","give",
    "glow","go","gradient","graph","graphic","green","grid","group","guide","hand","have","he","head","height","help","here",
    "hide","high","hold","home","how","icon","idea","if","image","import","in","include","index","info","input","inside",
    "instead","into","is","it","its","just","keep","key","keyframe","kind","know","label","large","last","later","layer",
    "lead","learn","left","less","let","level","light","like","line","link","list","load","local","lock","logo","long",
    "look","loop","low","made","main","make","map","mask","master","match","material","matte","max","may","me","media",
    "menu","merge","mesh","method","middle","min","mode","model","modify","more","most","motion","move","much","must","my",
    "name","native","near","need","new","next","no","node","none","normal","not","note","now","null","number","object",
    "of","off","offset","often","on","once","one","only","open","opacity","option","or","order","origin","other","our",
    "out","output","outside","over","own","pace","page","panel","parent","part","paste","path","pause","pen","people","perfect",
    "phase","pick","picture","piece","pixel","place","plan","play","playback","plugin","point","position","preset","preview","primary","process",
    "project","property","provide","public","put","quality","quick","random","range","rate","raw","reach","ready","real","record","red",
    "reduce","reference","render","reset","result","return","right","rotate","round","row","run","safe","same","sample","save","scale",
    "scene","screen","script","scroll","search","second","section","see","select","send","sense","separate","sequence","set","setting","shadow",
    "shape","share","she","short","should","show","side","simple","since","single","size","skip","slide","slow","small","smooth",
    "so","solid","some","sort","sound","source","space","speed","split","stack","standard","start","state","static","step","still",
    "stop","story","straight","strength","stretch","string","strong","style","such","support","system","tab","take","target","team","template",
    "text","than","that","the","their","them","then","there","these","they","thin","thing","think","this","those","three",
    "through","time","timeline","tint","title","to","together","too","tool","top","total","toward","track","trim","true","turn",
    "two","type","under","undo","up","update","upper","use","user","value","vector","version","very","video","view","viewer",
    "visible","warp","was","way","we","were","what","when","where","which","while","white","who","why","width","will",
    "window","with","within","without","word","work","workflow","world","would","wrap","write","yellow","yes","yet","you","your",
    "zoom"
];

// ==================== COMMON MISSPELLINGS (direct correction map) =========
var COMMON_CORRECTIONS = {
    "recieve": "receive", "recieved": "received", "receieve": "receive",
    "definately": "definitely", "definate": "definite", "definitley": "definitely",
    "occured": "occurred", "occuring": "occurring", "occurence": "occurrence",
    "seperate": "separate", "seperated": "separated", "seperately": "separately",
    "alot": "a lot", "alright": "all right", "thier": "their",
    "teh": "the", "adress": "address", "wich": "which",
    "beleive": "believe", "belive": "believe", "acheive": "achieve",
    "acheivement": "achievement", "begining": "beginning", "bussiness": "business",
    "calender": "calendar", "comming": "coming", "comittee": "committee",
    "dissapoint": "disappoint", "enviroment": "environment",
    "existance": "existence", "familar": "familiar", "finaly": "finally",
    "flourescent": "fluorescent", "foriegn": "foreign", "foward": "forward",
    "freind": "friend", "futher": "further", "gaurd": "guard",
    "goverment": "government", "grammer": "grammar", "happend": "happened",
    "harrass": "harass", "heirarchy": "hierarchy", "humerous": "humorous",
    "immediatly": "immediately", "independant": "independent", "intresting": "interesting",
    "knowlege": "knowledge", "liason": "liaison", "libary": "library",
    "lisence": "license", "maintainance": "maintenance", "neccessary": "necessary",
    "noticable": "noticeable", "occassion": "occasion", "occassionally": "occasionally",
    "paralel": "parallel", "particullarly": "particularly",
    "posession": "possession", "publically": "publicly",
    "refered": "referred", "relevent": "relevant", "remeber": "remember",
    "restaraunt": "restaurant", "schedual": "schedule",
    "sentance": "sentence", "succesful": "successful", "sucess": "success",
    "sucessful": "successful", "tommorow": "tomorrow",
    "tounge": "tongue", "truely": "truly", "untill": "until",
    "vacume": "vacuum", "vehical": "vehicle", "wether": "whether",
    "wierd": "weird", "withold": "withhold", "writeing": "writing",
    "embarassed": "embarrassed", "embarasing": "embarrassing",
    "missepelling": "misspelling", "proffesional": "professional"
};

// ==================== DICTIONARY CATEGORIES ====================
var DICT_CATEGORIES = [
    "World_Leaders", "Countries_and_Territories", "Continents_and_Regions", "Cities_and_Capitals",
    "Monuments_and_Landmarks", "Natural_Disasters", "War_and_Conflict_Terms", "Emergency_and_Rescue_Vehicles",
    "Military_and_Defense_Terms", "Financial_Terms_and_Stock_Market", "Economic_Institutions_and_Policies",
    "Medical_People_and_Healthcare_Terms", "Hospitals_and_Medical_Facilities", "Universities_and_Colleges",
    "Science_and_Technology", "Space_and_Astronomy", "Transportation_and_Aviation", "Government_and_Politics",
    "Law_and_Justice", "Crime_and_Security", "Sports_and_Athletics", "Environmental_and_Climate_Terms",
    "Energy_and_Industry", "Infrastructure_and_Architecture", "Business_and_Corporations", "Journalism_and_Media",
    "Pop_Culture_and_Media_no_slang", "Art_and_Literature_no_authors", "Music_and_Performing_Arts",
    "Fashion_and_Design", "Education_and_Learning", "Food_and_Agriculture", "Weather_and_Climate",
    "Technology_and_Computing", "Transportation_Systems", "Historical_Events_2000_2025",
    "Communications_and_Social_Media", "Space_Exploration", "Marine_and_Oceanography", "Aviation_and_Aerospace",
    "Legal_Systems_and_Courts", "International_Organizations", "Commonly_Misspelled_Words_A_Z",
    "Grammar_and_Pronouns", "General_Vocabulary", "Custom_Dictionary"
];

// ==================== GLOBAL STATE (persists across evalScript calls) =====
var dictionaryData = {
    words: {}, corrections: {}, loaded: {}, loadStatus: {},
    fallbackActive: false, dictionaryPath: null,
    customDictionaryLoaded: false, customDictionaryWordCount: 0,
    loadedAll: false, index: null, suggestCache: {},
    totalLoaded: 0, totalMissing: 0
};

var sessionState = {
    customWords: {}, ignoredWords: {}, persistentIgnore: {},
    errors: null, order: [], findings: [], seenSigs: {},
    scope: "active", selectedLayerIndexes: null, filter: "all",
    options: { ignoreAllCaps: true, skipNumbers: true, allowStemming: true },
    filters: { ignoreHidden: false, ignoreLocked: false, selectedOnly: false },
    stats: { comps: 0, layers: 0, text: 0, expr: 0, effect: 0, name: 0, marker: 0, words: 0, errors: 0 },
    scanning: false
};

// ==================== UTILITY ====================
function logMessage(msg) {
    try { if (typeof $.writeln === "function") { $.writeln("[Motion Spell Checker] " + msg); } } catch (e) {}
}

function trimString(str) { if (!str) return ""; return String(str).replace(/^\s+|\s+$/g, ""); }

function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function arrayIndexOf(arr, val) {
    if (!arr) return -1;
    for (var i = 0; i < arr.length; i++) { if (arr[i] === val) return i; }
    return -1;
}

function getScriptFolder() {
    try { var sf = new File($.fileName); return (sf && sf.parent) ? sf.parent.fsName : null; }
    catch (e) { return null; }
}

function ensureDir(path) {
    try { var f = new Folder(path); if (!f.exists) { f.create(); } } catch (e) {}
}

function getDictionaryPath() {
    if (dictionaryData.dictionaryPath) return dictionaryData.dictionaryPath;
    try {
        var scriptFolder = getScriptFolder();
        var sep = ($.os.indexOf("Win") >= 0) ? "\\" : "/";
        if (scriptFolder) {
            // host/ -> extension root -> Dictionary/
            var root = new Folder(scriptFolder).parent;
            if (root) {
                var dictFolder = new Folder(root.fsName + sep + "Dictionary");
                if (!dictFolder.exists) { try { dictFolder.create(); } catch (ce) {} }
                if (dictFolder.exists) {
                    dictionaryData.dictionaryPath = dictFolder.fsName + sep;
                    return dictionaryData.dictionaryPath;
                }
            }
        }
        if (Folder.myDocuments && Folder.myDocuments.exists) {
            var d2 = new Folder(Folder.myDocuments.fsName + sep + "MotionSpellChecker" + sep + "Dictionary");
            if (!d2.exists) { try { d2.create(); } catch (ce2) {} }
            if (d2.exists) { dictionaryData.dictionaryPath = d2.fsName + sep; return dictionaryData.dictionaryPath; }
        }
    } catch (e) { logMessage("Error determining dictionary path: " + e.toString()); }
    return null;
}

// ==================== WORD TOKENIZER ====================
function splitIntoWords(text) {
    if (!text) return [];
    var s = String(text);
    s = s.replace(/[\u2018\u2019]/g, "'");
    s = s.replace(/[\u201C\u201D]/g, '"');
    s = s.replace(/[\u2013\u2014]/g, " ");
    s = s.replace(/[.,\/#!$%\^&\*;:{}=\_`~()<>?@\[\]\\+|"\-]/g, " ");
    var parts = s.split(/[\s\n\r\t]+/);
    var words = [];
    for (var i = 0; i < parts.length; i++) {
        var w = trimString(parts[i]).replace(/^['-]+|['-]+$/g, "");
        if (w.length > 0 && !/^\d+$/.test(w)) words.push(w);
    }
    return words;
}

function shouldSkipWord(word) {
    if (!word) return true;
    if (word.length === 1) return true;
    if (/\d/.test(word) && sessionState.options.skipNumbers) return true;
    if (sessionState.options.ignoreAllCaps &&
        word.length >= 2 && word === word.toUpperCase() && word !== word.toLowerCase()) {
        return true;
    }
    return false;
}

function stemWord(w) {
    var out = [];
    if (!w || w.length <= 4) return out;
    var n = w.length;
    function push(x) { if (x && x.length >= 2) out.push(x); }
    if (w.slice(-3) === "ies") push(w.slice(0, n - 3) + "y");
    if (w.slice(-2) === "es") push(w.slice(0, n - 2));
    if (w.slice(-1) === "s") push(w.slice(0, n - 1));
    if (w.slice(-3) === "ing" && n > 5) {
        var b = w.slice(0, n - 3);
        push(b); push(b + "e");
        if (b.length >= 2 && b.charAt(b.length - 1) === b.charAt(b.length - 2)) push(b.slice(0, -1));
    }
    if (w.slice(-3) === "ied" && n > 5) push(w.slice(0, n - 3) + "y");
    if (w.slice(-2) === "ed" && n > 5) {
        var b2 = w.slice(0, n - 2);
        push(b2); push(b2 + "e");
        if (b2.length >= 2 && b2.charAt(b2.length - 1) === b2.charAt(b2.length - 2)) push(b2.slice(0, -1));
    } else if (w.slice(-1) === "d" && n > 5) { push(w.slice(0, n - 1)); }
    if (w.slice(-3) === "est" && n > 5) push(w.slice(0, n - 3));
    if (w.slice(-2) === "er" && n > 5) push(w.slice(0, n - 2));
    if (w.slice(-2) === "ly" && n > 5) push(w.slice(0, n - 2));
    if (w.slice(-2) === "'s") push(w.slice(0, n - 2));
    if (w.slice(-2) === "s'") push(w.slice(0, n - 2));
    return out;
}

function isWordCorrect(word) {
    if (!word) return true;
    var lower = word.toLowerCase();
    if (sessionState.customWords[lower]) return true;
    if (sessionState.ignoredWords[lower]) return true;
    if (sessionState.persistentIgnore[lower]) return true;
    if (dictionaryData.words[lower] === true) return true;
    if (sessionState.options.allowStemming) {
        var stems = stemWord(lower);
        for (var i = 0; i < stems.length; i++) { if (dictionaryData.words[stems[i]] === true) return true; }
    }
    return false;
}

// ==================== DICTIONARY MANAGEMENT ====================
function initializeFallbackDictionary() {
    dictionaryData.fallbackActive = true;
    for (var i = 0; i < FALLBACK_DICTIONARY.length; i++) {
        dictionaryData.words[String(FALLBACK_DICTIONARY[i]).toLowerCase()] = true;
    }
    logMessage("Fallback dictionary loaded (" + FALLBACK_DICTIONARY.length + " words)");
    return FALLBACK_DICTIONARY.length;
}

function loadCorrections() {
    for (var k in COMMON_CORRECTIONS) {
        if (COMMON_CORRECTIONS.hasOwnProperty(k)) dictionaryData.corrections[k] = COMMON_CORRECTIONS[k];
    }
}

function loadCustomDictionaryFile() {
    var dictPath = getDictionaryPath();
    if (!dictPath) return { success: false, wordCount: 0 };
    var file = new File(dictPath + "customDictionary.txt");
    if (!file.exists) return { success: false, wordCount: 0, notFound: true };
    try {
        file.encoding = "UTF-8";
        if (!file.open("r")) return { success: false, wordCount: 0 };
        var wordCount = 0;
        while (!file.eof) {
            try {
                var line = trimString(file.readln());
                if (line.length === 0 || line.charAt(0) === "#") continue;
                var word = line.toLowerCase();
                if (word) { dictionaryData.words[word] = true; wordCount++; }
            } catch (le) {}
        }
        file.close();
        dictionaryData.customDictionaryLoaded = true;
        dictionaryData.customDictionaryWordCount = wordCount;
        return { success: true, wordCount: wordCount };
    } catch (e) {
        try { file.close(); } catch (ce) {}
        return { success: false, wordCount: 0 };
    }
}

function loadIgnoreFile() {
    var dictPath = getDictionaryPath();
    if (!dictPath) return;
    var file = new File(dictPath + "ignoredWords.txt");
    if (!file.exists) return;
    try {
        file.encoding = "UTF-8";
        if (!file.open("r")) return;
        while (!file.eof) {
            try {
                var line = trimString(file.readln());
                if (line.length === 0 || line.charAt(0) === "#") continue;
                sessionState.persistentIgnore[line.toLowerCase()] = true;
            } catch (le) {}
        }
        file.close();
    } catch (e) { try { file.close(); } catch (ce) {} }
}

function loadDictionaryFile(category) {
    if (dictionaryData.loaded[category]) return { success: true, cached: true };
    var dictPath = getDictionaryPath();
    if (!dictPath) { dictionaryData.loadStatus[category] = { status: "missing", message: "Dictionary folder not found" }; return { success: false, missing: true }; }
    var file = new File(dictPath + category + ".txt");
    if (!file.exists) { dictionaryData.loadStatus[category] = { status: "notfound", message: "File not found" }; return { success: false, missing: true }; }
    try {
        file.encoding = "UTF-8";
        if (!file.open("r")) { dictionaryData.loadStatus[category] = { status: "error", message: "Cannot open file" }; return { success: false }; }
        var wordCount = 0, correctionCount = 0;
        while (!file.eof) {
            try {
                var line = trimString(file.readln());
                if (line.length === 0 || line.charAt(0) === "#") continue;
                var arrowIndex = line.indexOf("\u2192");
                if (arrowIndex < 0) arrowIndex = line.indexOf("->");
                if (arrowIndex >= 0) {
                    var sep = line.indexOf("\u2192") >= 0 ? "\u2192" : "->";
                    var parts = line.split(sep);
                    if (parts.length === 2) {
                        var wrong = trimString(parts[0]).toLowerCase();
                        var correct = trimString(parts[1]).toLowerCase();
                        if (wrong && correct) { dictionaryData.corrections[wrong] = correct; correctionCount++; }
                    }
                } else {
                    var word = line.toLowerCase();
                    if (word) { dictionaryData.words[word] = true; wordCount++; }
                }
            } catch (le) {}
        }
        file.close();
        if (wordCount > 0 || correctionCount > 0) {
            dictionaryData.loaded[category] = true;
            dictionaryData.loadStatus[category] = { status: "loaded", message: wordCount + " words, " + correctionCount + " corrections" };
            return { success: true, words: wordCount, corrections: correctionCount };
        }
        dictionaryData.loadStatus[category] = { status: "empty", message: "Empty file" };
        return { success: false, empty: true };
    } catch (e) {
        try { file.close(); } catch (ce) {}
        dictionaryData.loadStatus[category] = { status: "error", message: e.toString() };
        return { success: false };
    }
}

function loadAllDictionaries() {
    var loaded = 0, missing = 0, failed = 0;
    for (var i = 0; i < DICT_CATEGORIES.length; i++) {
        var r = loadDictionaryFile(DICT_CATEGORIES[i]);
        if (r.success && !r.cached) loaded++;
        else if (r.missing) missing++;
        else if (!r.success) failed++;
    }
    return { loaded: loaded, missing: missing, failed: failed, total: DICT_CATEGORIES.length };
}

function buildWordIndex() {
    var idx = { prefix: {}, count: 0 };
    for (var w in dictionaryData.words) {
        if (!dictionaryData.words.hasOwnProperty(w)) continue;
        idx.count++;
        var key = w.length >= 2 ? w.slice(0, 2) : w.slice(0, 1);
        if (!idx.prefix[key]) idx.prefix[key] = [];
        idx.prefix[key].push(w);
    }
    dictionaryData.index = idx;
    return idx.count;
}

function ensureDictionariesLoaded() {
    if (dictionaryData.loadedAll) return;
    initializeFallbackDictionary();
    loadCorrections();
    loadCustomDictionaryFile();
    loadIgnoreFile();
    var res = loadAllDictionaries();
    buildWordIndex();
    dictionaryData.loadedAll = true;
    dictionaryData.totalLoaded = res.loaded;
    dictionaryData.totalMissing = res.missing;
    logMessage("Dictionaries ready: " + res.loaded + " categories loaded, " + res.missing + " missing");
}

function getSuggestionForWord(word) {
    if (!word) return null;
    return dictionaryData.corrections[word.toLowerCase()] || null;
}

// ==================== SUGGESTIONS ====================
function levenshtein(a, b) {
    if (!a || !b) return 999;
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 3) return 999;
    var m = [];
    for (var i = 0; i <= b.length; i++) m[i] = [i];
    for (var j = 0; j <= a.length; j++) m[0][j] = j;
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) m[i][j] = m[i - 1][j - 1];
            else m[i][j] = Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
        }
    }
    return m[b.length][a.length];
}

function collectCandidateKeys(lower) {
    var keys = [], seen = {};
    function push(k) { if (k && !seen[k]) { seen[k] = true; keys.push(k); } }
    push(lower.slice(0, 2));
    push(lower.slice(0, 1));
    if (lower.length >= 2) push(lower.charAt(1) + lower.charAt(0));
    return keys;
}

function generateSuggestions(word, max) {
    max = max || 6;
    if (!word) return [];
    var lower = word.toLowerCase();
    if (dictionaryData.suggestCache[lower]) return dictionaryData.suggestCache[lower].slice(0, max);
    var out = [];
    var direct = getSuggestionForWord(word);
    if (direct && arrayIndexOf(out, direct) < 0) out.push(direct);
    var idx = dictionaryData.index;
    var candidates = [], seen = {};
    if (idx) {
        var keys = collectCandidateKeys(lower);
        for (var ki = 0; ki < keys.length; ki++) {
            var bucket = idx.prefix[keys[ki]];
            if (!bucket) continue;
            for (var bi = 0; bi < bucket.length; bi++) {
                var dictWord = bucket[bi];
                if (seen[dictWord]) continue;
                seen[dictWord] = true;
                if (Math.abs(dictWord.length - lower.length) > 3) continue;
                var dist = levenshtein(lower, dictWord);
                if (dist <= 3) candidates.push({ word: dictWord, distance: dist });
            }
        }
    }
    candidates.sort(function (a, b) { if (a.distance !== b.distance) return a.distance - b.distance; return a.word < b.word ? -1 : (a.word > b.word ? 1 : 0); });
    for (var i = 0; i < candidates.length && out.length < max; i++) {
        if (arrayIndexOf(out, candidates[i].word) < 0) out.push(candidates[i].word);
    }
    dictionaryData.suggestCache[lower] = out;
    return out.slice(0, max);
}

// ==================== SCANNER ====================
function addFinding(f, findings, seen) {
    var sig = f.sourceType + "|" + f.compId + "|" +
        (f.layerIndex === null || f.layerIndex === undefined ? "" : f.layerIndex) + "|" +
        (f.propertyPath || "") + "|" + (f.text || "");
    if (seen[sig]) {
        var existing = seen[sig];
        if (f.keyIndexes) {
            for (var i = 0; i < f.keyIndexes.length; i++) {
                if (arrayIndexOf(existing.keyIndexes, f.keyIndexes[i]) < 0) existing.keyIndexes.push(f.keyIndexes[i]);
            }
        }
        return;
    }
    if (!f.keyIndexes) f.keyIndexes = [];
    f._sig = sig;
    seen[sig] = f;
    findings.push(f);
}

function extractStringLiterals(expr) {
    var out = [];
    if (!expr) return out;
    var re = /["']([^"'\\]*(\\.[^"'\\]*)*)["']/g;
    var m;
    while ((m = re.exec(expr)) !== null) {
        var token = m[0];
        var quote = token.charAt(0);
        var inner = token.slice(1, -1);
        inner = inner.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, " ").replace(/\\t/g, " ").replace(/\\r/g, " ");
        if (inner.length > 0) out.push({ value: inner, quote: quote });
    }
    return out;
}

function scanTextDocumentProperty(prop, comp, layer, findings, seen, path) {
    var entries = [];
    try { var v = prop.value; if (v && typeof v.text === "string" && v.text.length > 0) entries.push({ key: null, text: v.text }); } catch (e) {}
    if (prop.numKeys > 0) {
        for (var k = 1; k <= prop.numKeys; k++) {
            try { var kv = prop.keyValue(k); if (kv && typeof kv.text === "string" && kv.text.length > 0) entries.push({ key: k, text: kv.text }); } catch (e) {}
        }
    }
    var byText = {}, textOrder = [];
    for (var i = 0; i < entries.length; i++) {
        var t = entries[i].text;
        if (!byText[t]) { byText[t] = []; textOrder.push(t); }
        if (entries[i].key !== null) byText[t].push(entries[i].key);
    }
    for (var ti = 0; ti < textOrder.length; ti++) {
        var txt = textOrder[ti];
        addFinding({ sourceType: "text", comp: comp, compName: comp.name, compId: comp.id, layer: layer, layerIndex: layer.index, layerName: layer.name, property: prop, propertyPath: path, propKind: "text", text: txt, keyIndexes: byText[txt] }, findings, seen);
    }
}

function scanStringProperty(prop, comp, layer, findings, seen, path) {
    var entries = [];
    try { var v = prop.value; if (typeof v === "string" && v.length > 0) entries.push({ key: null, text: v }); } catch (e) {}
    if (prop.numKeys > 0) {
        for (var k = 1; k <= prop.numKeys; k++) {
            try { var kv = prop.keyValue(k); if (typeof kv === "string" && kv.length > 0) entries.push({ key: k, text: kv }); } catch (e) {}
        }
    }
    var byText = {}, textOrder = [];
    for (var i = 0; i < entries.length; i++) {
        var t = entries[i].text;
        if (!byText[t]) { byText[t] = []; textOrder.push(t); }
        if (entries[i].key !== null) byText[t].push(entries[i].key);
    }
    for (var ti = 0; ti < textOrder.length; ti++) {
        var txt = textOrder[ti];
        addFinding({ sourceType: "effect", comp: comp, compName: comp.name, compId: comp.id, layer: layer, layerIndex: layer.index, layerName: layer.name, property: prop, propertyPath: path, propKind: "string", text: txt, keyIndexes: byText[txt] }, findings, seen);
    }
}

function scanMarkerProperty(prop, comp, layer, findings, seen) {
    if (!prop || prop.numKeys <= 0) return;
    var byText = {}, textOrder = [];
    for (var k = 1; k <= prop.numKeys; k++) {
        try {
            var mk = prop.keyValue(k);
            if (mk && mk.comment && mk.comment.length > 0) {
                if (!byText[mk.comment]) { byText[mk.comment] = []; textOrder.push(mk.comment); }
                byText[mk.comment].push(k);
            }
        } catch (e) {}
    }
    for (var ti = 0; ti < textOrder.length; ti++) {
        var txt = textOrder[ti];
        addFinding({ sourceType: "marker", comp: comp, compName: comp.name, compId: comp.id, layer: layer, layerIndex: layer ? layer.index : null, layerName: layer ? layer.name : "", property: prop, propertyPath: layer ? "Layer Markers" : "Comp Markers", propKind: "marker", text: txt, keyIndexes: byText[txt] }, findings, seen);
    }
}

function scanProp(prop, comp, layer, findings, seen, path) {
    if (!prop) return;
    var mn;
    try { mn = prop.matchName; } catch (e) { mn = ""; }
    if (prop.expressionEnabled && prop.expression) {
        var lits = extractStringLiterals(prop.expression);
        for (var li = 0; li < lits.length; li++) {
            addFinding({ sourceType: "expression", comp: comp, compName: comp.name, compId: comp.id, layer: layer, layerIndex: layer.index, layerName: layer.name, property: prop, propertyPath: path + " (expression)", propKind: "expression", text: lits[li].value, quote: lits[li].quote, keyIndexes: [] }, findings, seen);
        }
    }
    var isGroup = (prop.numProperties !== undefined && prop.numProperties > 0);
    if (isGroup) {
        for (var i = 1; i <= prop.numProperties; i++) {
            var child;
            try { child = prop.property(i); } catch (e) { continue; }
            if (!child) continue;
            var childName;
            try { childName = child.name || child.matchName; } catch (e) { childName = ""; }
            scanProp(child, comp, layer, findings, seen, path + "/" + childName);
        }
        return;
    }
    try {
        if (mn === "ADBE Text Document") { scanTextDocumentProperty(prop, comp, layer, findings, seen, path); return; }
        if (mn === "ADBE Marker") return;
        var v = prop.value;
        if (typeof v === "string" && v.length > 0) scanStringProperty(prop, comp, layer, findings, seen, path);
    } catch (e) {}
}

function layerPassesFilters(layer, filters) {
    try {
        if (filters.ignoreHidden && layer.enabled === false) return false;
    } catch (e) {}
    try {
        if (filters.ignoreLocked && layer.locked === true) return false;
    } catch (e) {}
    try {
        if (filters.selectedOnly && layer.selected !== true) return false;
    } catch (e) {}
    return true;
}

function scanLayer(layer, comp, findings, seen, stats) {
    if (!layer) return;
    stats.layers++;
    addFinding({ sourceType: "layerName", comp: comp, compName: comp.name, compId: comp.id, layer: layer, layerIndex: layer.index, layerName: layer.name, property: null, propertyPath: "Layer Name", propKind: "layerName", text: layer.name, keyIndexes: [] }, findings, seen);
    try { var mp = layer.property("ADBE Marker"); if (mp) scanMarkerProperty(mp, comp, layer, findings, seen); } catch (e) {}
    scanProp(layer, comp, layer, findings, seen, "");
}

function scanComp(comp, findings, seen, stats, filters) {
    if (!comp || !(comp instanceof CompItem)) return;
    stats.comps++;
    addFinding({ sourceType: "compName", comp: comp, compName: comp.name, compId: comp.id, layer: null, layerIndex: null, layerName: "", property: null, propertyPath: "Comp Name", propKind: "compName", text: comp.name, keyIndexes: [] }, findings, seen);
    try { var cmp = comp.markerProperty; if (cmp) scanMarkerProperty(cmp, comp, null, findings, seen); } catch (e) {}
    var scopeFilter = (sessionState.scope === "selected") ? sessionState.selectedLayerIndexes : null;
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer;
        try { layer = comp.layer(i); } catch (e) { continue; }
        if (scopeFilter && !scopeFilter[layer.index]) continue;
        if (!layerPassesFilters(layer, filters)) continue;
        scanLayer(layer, comp, findings, seen, stats);
    }
}

function getSelectedLayerIndexes(comp) {
    var map = {};
    try { var sel = comp.selectedLayers; if (sel) { for (var i = 0; i < sel.length; i++) map[sel[i].index] = true; } } catch (e) {}
    return map;
}

function collectCompsForScope() {
    var comps = [], seen = {};
    function add(c) { if (c && (c instanceof CompItem) && !seen[c.id]) { seen[c.id] = true; comps.push(c); } }
    if (!app.project) return comps;
    var active = app.project.activeItem;
    if (sessionState.scope === "selected") {
        if (active instanceof CompItem) { add(active); sessionState.selectedLayerIndexes = getSelectedLayerIndexes(active); }
    } else if (sessionState.scope === "project") {
        for (var i = 1; i <= app.project.numItems; i++) { try { add(app.project.item(i)); } catch (e) {} }
    } else {
        if (active instanceof CompItem) {
            var queue = [active];
            while (queue.length > 0) {
                var c = queue.shift();
                add(c);
                for (var li = 1; li <= c.numLayers; li++) {
                    try { var lyr = c.layer(li); if (lyr.source && (lyr.source instanceof CompItem)) queue.push(lyr.source); } catch (e) {}
                }
            }
        }
    }
    return comps;
}

// ==================== ANALYSIS ====================
function analyzeFindings(findings) {
    var errors = {}, order = [], totalWords = 0;
    var stats = { text: 0, expr: 0, effect: 0, name: 0, marker: 0 };
    for (var f = 0; f < findings.length; f++) {
        var finding = findings[f];
        if (finding.sourceType === "text") stats.text++;
        else if (finding.sourceType === "expression") stats.expr++;
        else if (finding.sourceType === "effect") stats.effect++;
        else if (finding.sourceType === "layerName" || finding.sourceType === "compName") stats.name++;
        else if (finding.sourceType === "marker") stats.marker++;
        var words = splitIntoWords(finding.text);
        for (var w = 0; w < words.length; w++) {
            var word = words[w];
            totalWords++;
            if (shouldSkipWord(word)) continue;
            if (isWordCorrect(word)) continue;
            var lower = word.toLowerCase();
            if (!errors[lower]) { errors[lower] = { word: word, lower: lower, count: 0, locations: [], seenLocs: {} }; order.push(lower); }
            var err = errors[lower];
            var locSig = finding._sig;
            if (!err.seenLocs[locSig]) { err.seenLocs[locSig] = true; err.locations.push({ finding: finding, label: buildLocationLabel(finding) }); err.count++; }
        }
    }
    return { errors: errors, order: order, totalWords: totalWords, stats: stats };
}

function buildLocationLabel(finding) {
    var src;
    if (finding.sourceType === "text") src = "Text";
    else if (finding.sourceType === "expression") src = "Expression";
    else if (finding.sourceType === "effect") src = "Effect";
    else if (finding.sourceType === "marker") src = "Marker";
    else if (finding.sourceType === "layerName") src = "Layer name";
    else if (finding.sourceType === "compName") src = "Comp name";
    else src = finding.sourceType;
    var compPart = "Comp \"" + finding.compName + "\"";
    if (finding.layer) return compPart + " \u00B7 Layer " + finding.layerIndex + " \"" + finding.layerName + "\" (" + src + ")";
    return compPart + " (" + src + ")";
}

// ==================== CORRECTIONS ====================
function matchCase(src, tgt) {
    if (!src || !tgt) return tgt;
    if (src === src.toUpperCase() && src !== src.toLowerCase()) return tgt.toUpperCase();
    if (src.charAt(0) === src.charAt(0).toUpperCase()) return tgt.charAt(0).toUpperCase() + tgt.slice(1);
    return tgt;
}

function replaceWordInString(str, oldWord, newWord) {
    if (!str || !oldWord) return str;
    var re = new RegExp("\\b" + escapeRegExp(oldWord) + "\\b", "gi");
    var result = "", last = 0, m;
    while ((m = re.exec(str)) !== null) {
        result += str.slice(last, m.index);
        result += matchCase(m[0], newWord);
        last = m.index + m[0].length;
        if (m.index === re.lastIndex) re.lastIndex++;
    }
    result += str.slice(last);
    return result;
}

function replaceInTextDocument(finding, oldWord, newWord) {
    var prop = finding.property, count = 0;
    if (finding.keyIndexes && finding.keyIndexes.length > 0) {
        for (var i = 0; i < finding.keyIndexes.length; i++) {
            var k = finding.keyIndexes[i];
            if (k > prop.numKeys) continue;
            try {
                var doc = prop.keyValue(k);
                if (!doc) continue;
                var newText = replaceWordInString(doc.text, oldWord, newWord);
                if (newText !== doc.text) { doc.text = newText; prop.setValueAtKey(k, doc); count++; }
            } catch (e) {}
        }
    } else {
        try {
            var doc2 = prop.value;
            if (doc2) { var newText2 = replaceWordInString(doc2.text, oldWord, newWord); if (newText2 !== doc2.text) { doc2.text = newText2; prop.setValue(doc2); count++; } }
        } catch (e) {}
    }
    return { success: count > 0, count: count };
}

function replaceInStringProp(finding, oldWord, newWord) {
    var prop = finding.property, count = 0;
    if (finding.keyIndexes && finding.keyIndexes.length > 0) {
        for (var i = 0; i < finding.keyIndexes.length; i++) {
            var k = finding.keyIndexes[i];
            if (k > prop.numKeys) continue;
            try {
                var kv = prop.keyValue(k);
                if (typeof kv !== "string") continue;
                var newVal = replaceWordInString(kv, oldWord, newWord);
                if (newVal !== kv) { prop.setValueAtKey(k, newVal); count++; }
            } catch (e) {}
        }
    } else {
        try {
            var v = prop.value;
            if (typeof v === "string") { var newVal2 = replaceWordInString(v, oldWord, newWord); if (newVal2 !== v) { prop.setValue(newVal2); count++; } }
        } catch (e) {}
    }
    return { success: count > 0, count: count };
}

function replaceInMarker(finding, oldWord, newWord) {
    var prop = finding.property, count = 0;
    if (finding.keyIndexes && finding.keyIndexes.length > 0) {
        for (var i = 0; i < finding.keyIndexes.length; i++) {
            var k = finding.keyIndexes[i];
            if (k > prop.numKeys) continue;
            try {
                var mk = prop.keyValue(k);
                if (!mk) continue;
                var newComment = replaceWordInString(mk.comment, oldWord, newWord);
                if (newComment !== mk.comment) {
                    var newMk = new MarkerValue(newComment);
                    try { newMk.duration = mk.duration; } catch (e) {}
                    try { newMk.label = mk.label; } catch (e) {}
                    prop.setValueAtKey(k, newMk);
                    count++;
                }
            } catch (e) {}
        }
    }
    return { success: count > 0, count: count };
}

function replaceInExpression(finding, oldWord, newWord) {
    var prop = finding.property;
    try {
        var expr = prop.expression;
        if (!expr) return { success: false, count: 0 };
        var literal = finding.text;
        var quote = finding.quote || '"';
        var newLiteral = replaceWordInString(literal, oldWord, newWord);
        if (newLiteral === literal) return { success: false, count: 0 };
        var oldToken = quote + literal + quote;
        var newToken = quote + newLiteral + quote;
        var newExpr = expr.split(oldToken).join(newToken);
        if (newExpr !== expr) { prop.expression = newExpr; return { success: true, count: 1 }; }
        return { success: false, count: 0 };
    } catch (e) { return { success: false, count: 0 }; }
}

function applyCorrection(finding, oldWord, newWord) {
    try {
        if (finding.propKind === "text") return replaceInTextDocument(finding, oldWord, newWord);
        if (finding.propKind === "string") return replaceInStringProp(finding, oldWord, newWord);
        if (finding.propKind === "marker") return replaceInMarker(finding, oldWord, newWord);
        if (finding.propKind === "expression") return replaceInExpression(finding, oldWord, newWord);
        if (finding.propKind === "layerName") {
            var nn = replaceWordInString(finding.layer.name, oldWord, newWord);
            if (nn !== finding.layer.name) { finding.layer.name = nn; return { success: true, count: 1 }; }
            return { success: false, count: 0 };
        }
        if (finding.propKind === "compName") {
            var nc = replaceWordInString(finding.comp.name, oldWord, newWord);
            if (nc !== finding.comp.name) { finding.comp.name = nc; return { success: true, count: 1 }; }
            return { success: false, count: 0 };
        }
    } catch (e) { return { success: false, count: 0, error: e.toString() }; }
    return { success: false, count: 0 };
}

// ==================== NAVIGATION ====================
function navigateToLocation(loc) {
    try {
        var finding = loc.finding;
        var comp = finding.comp;
        if (!comp) return false;
        comp.openInViewer();
        if (finding.layer) {
            try {
                var idx = finding.layer.index;
                if (idx >= 1 && idx <= comp.numLayers) {
                    comp.selectedLayers = [comp.layer(idx)];
                    if (finding.property && finding.propKind !== "layerName" && finding.propKind !== "compName") {
                        try { finding.property.selected = true; } catch (e) {}
                    }
                    return true;
                }
            } catch (e) {}
        }
        return true;
    } catch (e) { return false; }
}

function persistCustomWord(word) {
    var dictPath = getDictionaryPath();
    if (!dictPath) return false;
    try {
        ensureDir(dictPath);
        var file = new File(dictPath + "customDictionary.txt");
        file.encoding = "UTF-8";
        file.open(file.exists ? "a" : "w");
        file.writeln(word.toLowerCase());
        file.close();
        return true;
    } catch (e) { return false; }
}

function persistIgnoredWord(word) {
    var dictPath = getDictionaryPath();
    if (!dictPath) return false;
    try {
        ensureDir(dictPath);
        var file = new File(dictPath + "ignoredWords.txt");
        file.encoding = "UTF-8";
        file.open(file.exists ? "a" : "w");
        file.writeln(word.toLowerCase());
        file.close();
        return true;
    } catch (e) { return false; }
}

// ==================== DICTIONARY VERIFY ====================
function readDictionaryFileForTest(dictPath, cat) {
    var info = { name: cat, status: "missing", words: 0, corrections: 0, note: "" };
    if (!dictPath) return info;
    var file = new File(dictPath + cat + ".txt");
    if (!file.exists) return info;
    try {
        file.encoding = "UTF-8";
        if (!file.open("r")) { info.status = "error"; info.note = "Could not open file"; return info; }
        var wordCount = 0, correctionCount = 0, badLines = 0;
        while (!file.eof) {
            var line = trimString(file.readln());
            if (line.length === 0 || line.charAt(0) === "#") continue;
            var arrow = line.indexOf("\u2192");
            if (arrow < 0) arrow = line.indexOf("->");
            if (arrow >= 0) {
                var sep = line.indexOf("\u2192") >= 0 ? "\u2192" : "->";
                var parts = line.split(sep);
                if (parts.length === 2 && trimString(parts[0]) && trimString(parts[1])) correctionCount++; else badLines++;
            } else {
                if (/^[^\s]+$/.test(line)) wordCount++; else badLines++;
            }
        }
        file.close();
        if (wordCount > 0 || correctionCount > 0) {
            info.status = "loaded"; info.words = wordCount; info.corrections = correctionCount;
            if (badLines > 0) info.note = badLines + " line(s) skipped";
        } else { info.status = "empty"; }
    } catch (e) { info.status = "error"; info.note = e.toString(); }
    return info;
}

function verifyDictionaries() {
    ensureDictionariesLoaded();
    var dictPath = getDictionaryPath();
    var results = [];
    var loaded = 0, missing = 0, empty = 0, error = 0, fileWords = 0, fileCorrections = 0;
    for (var i = 0; i < DICT_CATEGORIES.length; i++) {
        var info = readDictionaryFileForTest(dictPath, DICT_CATEGORIES[i]);
        results.push(info);
        if (info.status === "loaded") { loaded++; fileWords += info.words; fileCorrections += info.corrections; }
        else if (info.status === "missing") missing++;
        else if (info.status === "empty") empty++;
        else error++;
    }
    return {
        dictionaryPath: dictPath || "(not found)",
        categories: results,
        loaded: loaded, missing: missing, empty: empty, error: error,
        fileWords: fileWords, fileCorrections: fileCorrections,
        fallbackWords: FALLBACK_DICTIONARY.length,
        customWords: dictionaryData.customDictionaryWordCount
    };
}

// ============================================================================
// CEP-FACING API — every function below is called from client/js/main.js via
// CSInterface.evalScript() and returns a JSON string.
// ============================================================================

function csGetInfo() {
    return JSON.stringify({ ok: true, appName: APP_NAME, version: VERSION, author: AUTHOR, hasProject: !!app.project });
}

function runScan(p) {
    if (!app.project) return { ok: false, error: "No project open." };
    sessionState.scope = p.scope || "active";
    sessionState.options.ignoreAllCaps = !!p.ignoreAllCaps;
    sessionState.options.skipNumbers = !!p.skipNumbers;
    sessionState.options.allowStemming = !!p.smartMatching;
    sessionState.filter = p.filter || "all";
    sessionState.filters.ignoreHidden = !!p.ignoreHidden;
    sessionState.filters.ignoreLocked = !!p.ignoreLocked;
    sessionState.filters.selectedOnly = !!p.selectedOnly;

    ensureDictionariesLoaded();

    sessionState.findings = [];
    sessionState.seenSigs = {};
    sessionState.stats = { comps: 0, layers: 0, text: 0, expr: 0, effect: 0, name: 0, marker: 0, words: 0, errors: 0 };

    var comps = collectCompsForScope();
    for (var i = 0; i < comps.length; i++) {
        scanComp(comps[i], sessionState.findings, sessionState.seenSigs, sessionState.stats, sessionState.filters);
    }

    var analysis = analyzeFindings(sessionState.findings);
    sessionState.errors = analysis.errors;
    sessionState.order = analysis.order;
    sessionState.stats.text = analysis.stats.text;
    sessionState.stats.expr = analysis.stats.expr;
    sessionState.stats.effect = analysis.stats.effect;
    sessionState.stats.name = analysis.stats.name;
    sessionState.stats.marker = analysis.stats.marker;
    sessionState.stats.words = analysis.totalWords;
    sessionState.stats.errors = analysis.order.length;

    var words = [];
    for (var wi = 0; wi < sessionState.order.length; wi++) {
        var lower = sessionState.order[wi];
        var err = sessionState.errors[lower];
        if (!err) continue;
        var locs = [];
        for (var li = 0; li < err.locations.length; li++) {
            locs.push({ label: err.locations[li].label, sourceType: err.locations[li].finding.sourceType });
        }
        words.push({ lower: lower, word: err.word, count: err.count, locations: locs, suggestions: generateSuggestions(err.word, 6) });
    }

    var usingFallbackOnly = dictionaryData.totalMissing > 0 && dictionaryData.totalLoaded === 0;

    return {
        ok: true,
        scope: sessionState.scope,
        stats: sessionState.stats,
        compsScanned: comps.length,
        words: words,
        usingFallbackOnly: usingFallbackOnly,
        fallbackWordCount: FALLBACK_DICTIONARY.length
    };
}

function csScan(paramsJSON) {
    try { var p = JSON.parse(paramsJSON); return JSON.stringify(runScan(p)); }
    catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csReplace(paramsJSON) {
    try {
        var p = JSON.parse(paramsJSON);
        var err = sessionState.errors ? sessionState.errors[p.lower] : null;
        if (!err) return JSON.stringify({ ok: false, error: "Word not found in current scan." });
        var newWord = p.newWord;
        var replaced = 0, failed = 0;
        app.beginUndoGroup("Motion Spell Checker: Replace \"" + err.word + "\"");
        for (var i = 0; i < err.locations.length; i++) {
            var r = applyCorrection(err.locations[i].finding, err.word, newWord);
            if (r.success) replaced += r.count; else failed++;
        }
        app.endUndoGroup();
        return JSON.stringify({ ok: replaced > 0, replaced: replaced, failed: failed, word: err.word, newWord: newWord });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csIgnore(paramsJSON) {
    try {
        var p = JSON.parse(paramsJSON);
        sessionState.ignoredWords[p.lower] = true;
        persistIgnoredWord(p.lower);
        return JSON.stringify({ ok: true, lower: p.lower });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csAddToDictionary(paramsJSON) {
    try {
        var p = JSON.parse(paramsJSON);
        sessionState.customWords[p.lower] = true;
        dictionaryData.words[p.lower] = true;
        persistCustomWord(p.lower);
        return JSON.stringify({ ok: true, lower: p.lower });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csReveal(paramsJSON) {
    try {
        var p = JSON.parse(paramsJSON);
        var err = sessionState.errors ? sessionState.errors[p.lower] : null;
        if (!err || !err.locations[p.index]) return JSON.stringify({ ok: false, error: "Location not found." });
        var ok = navigateToLocation(err.locations[p.index]);
        return JSON.stringify({ ok: ok });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csUndo() {
    try {
        var id = app.findMenuCommandId("Undo");
        if (id) app.executeCommand(id);
        return JSON.stringify({ ok: true });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csVerifyDictionaries() {
    try { return JSON.stringify({ ok: true, result: verifyDictionaries() }); }
    catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csRevealDictionaryFolder() {
    try {
        var p = getDictionaryPath();
        if (p) { var f = new Folder(p); f.execute(); return JSON.stringify({ ok: true, path: p }); }
        return JSON.stringify({ ok: false, error: "Dictionary folder not available." });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}
