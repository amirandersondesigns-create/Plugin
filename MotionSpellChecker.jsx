// ============================================================================
// MOTION SPELL CHECKER — standalone ExtendScript panel
// After Effects 2022+
//
// A single-file, high-level .jsx plugin. No CEP, no manifest, no signing,
// no debug mode. Install by copying this file into:
//   Scripts/ScriptUI Panels/   (dockable panel under Window > Motion Spell Checker)
// or run it once via File > Scripts > Run Script File... for a floating dialog.
//
// Optional: drop category word-list .txt files (one word per line, or
// "wrong -> right" correction lines) into a "Dictionary" folder placed
// next to this script for coverage beyond the built-in ~8,100-word list.
// ============================================================================

(function MotionSpellChecker(thisObj) {
    "use strict";


var APP_NAME = "Motion Spell Checker";
var VERSION = "2.2";
var AUTHOR = "Amir Anderson";
var HIGHLIGHT_LAYER_NAME = "MSC Highlights";

// ==================== FALLBACK DICTIONARY ====================
// Built-in word list so the checker works even before any category files
// are dropped into /Dictionary/ (~8,100 general English + common tech/web/
// business/place-name words). Drop .txt word lists (one word per line, or
// "wrong -> right" correction lines) into a "Dictionary" folder next to
// this extension for full domain-specific coverage on top of this.
var FALLBACK_DICTIONARY = [
    "a", "aa", "aaa", "aaron", "ab", "abc", "abilities", "ability", "able", "aboriginal",
    "abortion", "about", "above", "abroad", "abs", "absence", "absent", "absolute", "absolutely", "abstract",
    "abstracts", "abuse", "ac", "academic", "academy", "acc", "accept", "acceptable", "acceptance", "accepted",
    "access", "accessed", "accessibility", "accessible", "accessing", "accessories", "accessory", "accident", "accidents", "accommodation",
    "accommodations", "accompanied", "accomplished", "accordance", "according", "accordingly", "account", "accountability", "accounting", "accounts",
    "accredited", "accuracy", "accurate", "accused", "ace", "acer", "achieve", "achieved", "achievement", "achieving",
    "acid", "acids", "acoustic", "acquire", "acquired", "acquisition", "acres", "acrobat", "across", "act",
    "acting", "action", "actions", "activation", "active", "actively", "activities", "activity", "actor", "actors",
    "acts", "actual", "actually", "acute", "ad", "adam", "adams", "adapter", "adapters", "add",
    "added", "addiction", "adding", "addition", "additional", "additionally", "additions", "address", "addressed", "addresses",
    "addressing", "adds", "adelaide", "adequate", "adidas", "adjacent", "adjust", "adjustable", "adjusted",
    "adjustment", "admin", "administered", "administration", "administrative", "administrator", "administrators", "admission", "admissions", "admit",
    "admitted", "adobe", "adopt", "adopted", "adoption", "ads", "adult", "adults", "advance", "advanced",
    "advances", "advantage", "advantages", "adventure", "adventures", "adverse", "advertise", "advertisement", "advertisements", "advertiser",
    "advertisers", "advertising", "advice", "advise", "advised", "advisor", "advisory", "advocacy", "advocate", "ae",
    "af", "affairs", "affect", "affected", "affecting", "affects", "affiliate", "affiliated", "affiliates", "afford",
    "affordable", "afghanistan", "afraid", "africa", "african", "after", "afternoon", "ag", "again", "against",
    "age", "aged", "agencies", "agency", "agenda", "agent", "agents", "ages", "aggregate", "aggressive",
    "aging", "ago", "agree", "agreed", "agreement", "agreements", "agrees", "agricultural", "agriculture", "ah",
    "ahead", "ai", "aid", "aids", "aim", "aimed", "aims", "air", "aircraft", "airfare",
    "airline", "airlines", "airport", "airports", "aj", "ak", "aka", "al", "alabama", "alan",
    "alarm", "alaska", "albany", "albert", "alberta", "album", "albums", "albuquerque", "alcohol", "alert",
    "alerts", "alex", "alexander", "alfred", "algorithm", "algorithms", "ali", "alias", "alice", "alien",
    "alignment", "alive", "all", "alleged", "allen", "alliance", "allied", "allocated", "allocation", "allow",
    "allowed", "allowing", "allows", "almost", "alone", "along", "alpha", "alphabetical", "alpine", "already",
    "also", "alt", "alter", "alternate", "alternative", "alternatives", "although", "aluminum", "alumni", "always",
    "am", "amanda", "amateur", "amazing", "amazon", "amber", "amd", "amend", "amended", "amendment",
    "amendments", "amenities", "america", "american", "americans", "americas", "amino", "among", "amongst", "amount",
    "amounts", "amp", "ampland", "amsterdam", "amy", "an", "analog", "analyses", "analysis", "analyst",
    "analysts", "analytical", "analyze", "anatomy", "anchor", "anchors", "ancient", "and", "andale", "anderson",
    "andrea", "andreas", "andrew", "andy", "angel", "angeles", "angels", "anger", "angle", "angry",
    "animal", "animals", "animate", "animated", "animatic", "animatics", "animation", "animator", "animators", "anime",
    "ann", "anna", "anne", "annex", "anniversary", "annotation", "announce", "announced", "announcement", "announcements",
    "announces", "annual", "annually", "anonymous", "another", "answer", "answered", "answers", "antenna", "anthony",
    "anti", "anticipated", "antique", "antiques", "antivirus", "antonio", "anxiety", "any", "anybody", "anymore",
    "anyone", "anything", "anytime", "anyway", "anywhere", "aol", "ap", "apache", "apart", "apartment",
    "apartments", "aperture", "api", "app", "apparel", "apparent", "apparently", "appeal", "appeals", "appear",
    "appearance", "appeared", "appearing", "appears", "appendix", "apple", "appliance", "appliances", "applicable", "applicant",
    "applicants", "application", "applications", "applied", "applies", "apply", "applying", "appointed", "appointment", "appraisal",
    "appreciate", "appreciated", "appreciation", "approach", "approaches", "appropriate", "approval", "approve", "approved", "approx",
    "approximately", "apps", "apr", "april", "ar", "arab", "arabia", "arabic", "arc", "arcade",
    "arch", "architect", "architectural", "architecture", "archive", "archived", "archives", "arctic", "are", "area",
    "areas", "arena", "arg", "argentina", "argue", "argument", "arguments", "arise", "arising", "arizona",
    "arkansas", "arlington", "arm", "armed", "arms", "army", "arnold", "around", "arrange", "arranged",
    "arrangement", "arrangements", "array", "arrest", "arrested", "arrival", "arrive", "arrived", "arrow", "art",
    "arthritis", "arthur", "article", "articles", "artificial", "artist", "artistic", "artists", "arts", "artwork",
    "as", "ascii", "ash", "ashley", "asia", "asian", "aside", "asin", "ask", "asked",
    "asking", "asks", "asp", "aspect", "aspects", "ass", "assault", "assembly", "assess", "assessed",
    "assessment", "assessments", "asset", "assets", "assigned", "assignment", "assignments", "assist", "assistance", "assistant",
    "assisted", "associate", "associated", "associates", "association", "associations", "assume", "assumed", "assumes", "assuming",
    "assumption", "assumptions", "assurance", "assure", "asthma", "astronomy", "at", "athens", "athletes", "athletic",
    "athletics", "ati", "atlanta", "atlantic", "atlas", "atm", "atmosphere", "atom", "atomic", "attach",
    "attached", "attachment", "attachments", "attack", "attacks", "attempt", "attempted", "attempts", "attend", "attendance",
    "attended", "attending", "attention", "attitude", "attitudes", "attorney", "attorneys", "attract", "attraction", "attractions",
    "attractive", "attribute", "attributes", "au", "auckland", "auction", "auctions", "aud", "audi", "audience",
    "audio", "audit", "aug", "august", "aus", "austin", "australia", "australian", "austria", "authentic",
    "authentication", "author", "authorities", "authority", "authorization", "authorized", "authors", "auto", "automated", "automatic",
    "automatically", "automation", "automobile", "automotive", "autoplay", "autos", "autumn", "av", "availability", "available",
    "avatar", "ave", "avenue", "average", "avg", "avi", "aviation", "avoid", "award", "awarded",
    "awards", "aware", "awareness", "away", "awesome", "axis", "aye", "az", "b", "ba",
    "babe", "babes", "babies", "baby", "bachelor", "back", "backed", "background", "backgrounds", "backup",
    "bacteria", "bad", "bag", "bags", "bahamas", "bailey", "baker", "balance", "balanced", "bali",
    "ball", "balls", "baltimore", "ban", "band", "bands", "bandwidth", "bang", "bangkok", "bangladesh",
    "bank", "banking", "bankruptcy", "banks", "banner", "baptist", "bar", "barbados", "barbara", "barcelona",
    "bare", "bargain", "bargains", "barnes", "barrier", "barriers", "barry", "bars", "base", "baseball",
    "based", "baseline", "bases", "basic", "basically", "basics", "basin", "basis", "basket", "basketball",
    "baskets", "bass", "bat", "batch", "bath", "bathroom", "bathrooms", "batteries", "battery", "battle",
    "battlefield", "bay", "bb", "bbc", "bbw", "bc", "be", "beach", "beaches", "beads",
    "beam", "bean", "beans", "bear", "bearing", "bears", "beast", "beastiality", "beat", "beatles",
    "beautiful", "beauty", "beaver", "became", "because", "become", "becomes", "becoming", "bed", "bedding",
    "bedroom", "bedrooms", "beds", "bee", "beef", "been", "beer", "before", "began", "begin",
    "beginning", "begins", "begun", "behalf", "behavior", "behavioral", "behaviour", "behind", "beijing", "being",
    "belarus", "belgium", "belief", "beliefs", "believe", "believed", "believes", "belize", "bell", "belly",
    "belong", "below", "belt", "ben", "bench", "bend", "beneath", "beneficial", "benefit", "benefits",
    "benjamin", "bennett", "benz", "berkeley", "berlin", "bermuda", "bernard", "berry", "besides", "best",
    "bestsellers", "bet", "beta", "better", "betting", "between", "beverage", "beverly", "beyond", "bezier",
    "bi", "bias", "bible", "bibliography", "bicycle", "bid", "bidder", "bidding", "bids", "big",
    "bigger", "biggest", "bike", "bikes", "bikini", "bill", "billing", "billion", "bills", "billy",
    "bin", "binary", "binding", "bingo", "bio", "biography", "biol", "biological", "biology", "bios",
    "biotechnology", "bird", "birds", "birmingham", "birth", "birthday", "bishop", "bit", "bitrate", "bits",
    "biz", "bizarre", "bizrate", "bk", "black", "blackjack", "blade", "blair", "blame", "blank",
    "blast", "blend", "blending", "blind", "block", "blocks", "blog", "blogger", "bloggers", "blogging",
    "blogs", "blonde", "blood", "blow", "blue", "blues", "bluetooth", "blvd", "bmw", "board",
    "boards", "boat", "boats", "bob", "bobby", "bodies", "body", "bold", "bolivia", "bomb",
    "bond", "bonds", "bone", "bones", "bonus", "book", "booking", "bookings", "bookmark", "bookmarks",
    "books", "bookstore", "boolean", "boom", "boost", "boot", "booth", "boots", "booty", "border",
    "borders", "born", "bosnia", "boss", "boston", "both", "botswana", "bottle", "bottles", "bottom",
    "bought", "boulevard", "bound", "boundaries", "boundary", "bow", "bowl", "bowling", "box", "boxes",
    "boxing", "boy", "boys", "bp", "br", "bra", "bracelet", "brad", "bradley", "brain",
    "brake", "branch", "branches", "brand", "branding", "brands", "brass", "brazil", "brazilian", "bread",
    "break", "breakdown", "breakfast", "breaking", "breaks", "breast", "breasts", "breath", "breed", "breeding",
    "breeds", "brian", "brick", "bridal", "bride", "bridge", "bridges", "brief", "bright", "brighton",
    "brilliant", "bring", "bringing", "brings", "brisbane", "bristol", "britain", "britannica", "british", "britney",
    "broad", "broadband", "broadcast", "broadcasting", "broadway", "brochure", "broke", "broken", "broker", "brokers",
    "broll", "bronze", "brooklyn", "brooks", "brother", "brothers", "brought", "brown", "browse", "browser",
    "browsers", "browsing", "bruce", "brunette", "brunswick", "brush", "brussels", "bryan", "bs", "bt",
    "bubble", "buddy", "budget", "buf", "buffalo", "buffer", "bug", "bugs", "build", "builder",
    "builders", "building", "buildings", "built", "bulgaria", "bulgarian", "bulk", "bull", "bullet", "bulletin",
    "bumper", "bumpers", "bunch", "bundle", "burden", "bureau", "buried", "burn", "burning", "burns",
    "burton", "bus", "bush", "business", "businesses", "busty", "busy", "but", "butler", "butt",
    "butter", "butterfly", "button", "buttons", "butts", "buy", "buyer", "buyers", "buying", "buzz",
    "by", "byte", "bytes", "c", "ca", "cab", "cabin", "cabinet", "cable", "cables",
    "cache", "cached", "cad", "cafe", "cake", "cal", "calcium", "calculate", "calculated", "calculation",
    "calculations", "calculator", "calculators", "calendar", "calendars", "calgary", "california", "call", "called", "calling",
    "calls", "calm", "cam", "cambodia", "cambridge", "camcorder", "camcorders", "came", "camel", "camera",
    "cameras", "cameron", "camp", "campaign", "campaigns", "campbell", "camping", "camps", "campus", "cams",
    "can", "canada", "canadian", "canal", "cancel", "cancellation", "cancer", "candidate", "candidates", "candle",
    "candles", "candy", "cannot", "canon", "cant", "canvas", "canyon", "cap", "capabilities", "capability",
    "capable", "capacity", "cape", "capital", "capitol", "caps", "captain", "caption", "captioning", "captions",
    "capture", "captured", "car", "carbon", "card", "cards", "care", "career", "careers", "careful",
    "carefully", "carey", "cargo", "caribbean", "caring", "carl", "carlos", "carol", "carolina", "carpet",
    "carried", "carrier", "carriers", "carry", "carrying", "cars", "cart", "carter", "cartoon", "cartoons",
    "cartridge", "cartridges", "case", "cases", "cash", "cashiers", "casino", "casinos", "cassette", "cast",
    "casting", "castle", "casual", "cat", "catalog", "catalogue", "catch", "categories", "category", "catering",
    "catherine", "catholic", "cats", "cattle", "caught", "cause", "caused", "causes", "causing", "cave",
    "cb", "cbs", "cc", "cd", "cds", "ce", "cedar", "ceiling", "celebrate", "celebration",
    "celebrities", "celebrity", "cell", "cells", "cellular", "celtic", "cemetery", "census", "cent", "center",
    "centers", "central", "centre", "centres", "cents", "century", "ceo", "ceramic", "ceremony", "certain",
    "certainly", "certificate", "certificates", "certification", "certified", "cet", "cf", "cfr", "cg", "cgi",
    "ch", "chad", "chain", "chains", "chair", "chairman", "chairs", "challenge", "challenges", "challenging",
    "chamber", "champion", "champions", "championship", "championships", "chance", "chances", "change", "changed", "changes",
    "changing", "channel", "channels", "chaos", "chapel", "chapter", "chapters", "char", "character", "characteristics",
    "characters", "charge", "charged", "charger", "charges", "charity", "charles", "charleston", "charlie", "charlotte",
    "charm", "chart", "charter", "charts", "chase", "chat", "cheap", "cheaper", "cheapest", "cheat",
    "cheats", "check", "checked", "checking", "checkout", "checks", "cheers", "cheese", "chef", "chem",
    "chemical", "chemicals", "chemistry", "cherry", "chess", "chest", "chester", "chevrolet", "chi", "chicago",
    "chick", "chicken", "chicks", "chief", "child", "childhood", "children", "childrens", "chile", "china",
    "chinese", "chip", "chips", "chocolate", "choice", "choices", "cholesterol", "choose", "choosing", "chose",
    "chosen", "chris", "christ", "christian", "christianity", "christians", "christina", "christmas", "christopher", "chroma",
    "chrome", "chronic", "chronicles", "chrysler", "chuck", "church", "churches", "chyron", "chyrons", "ci",
    "cia", "ciao", "cincinnati", "cinema", "circle", "circuit", "circular", "circulation", "circumstances", "cisco",
    "citation", "citations", "cite", "cited", "cities", "citizen", "citizens", "city", "citysearch", "civic",
    "civil", "cl", "claim", "claimed", "claims", "clarity", "clark", "class", "classes", "classic",
    "classical", "classics", "classification", "classified", "classifieds", "classroom", "clause", "clay", "clean", "cleaner",
    "cleaners", "cleaning", "clear", "clearance", "clearly", "clerk", "cleveland", "click", "clicking", "client",
    "clients", "climate", "climbing", "clinic", "clinical", "clinics", "clinton", "clip", "clips", "clock",
    "clocks", "clone", "close", "closed", "closely", "closer", "closing", "closure", "cloth", "clothes",
    "clothing", "cloud", "clouds", "cloudy", "club", "clubs", "cluster", "cm", "cms", "cn",
    "cnet", "cnn", "co", "coach", "coaches", "coaching", "coal", "coalition", "coast", "coastal",
    "coat", "cod", "code", "codec", "codecs", "codes", "coding", "coffee", "cognitive", "coin",
    "coins", "col", "cold", "coldopen", "coldopens", "cole", "colin", "collaboration", "collaborative", "collapse",
    "collar", "colleagues", "collect", "collectables", "collected", "collectibles", "collecting", "collection", "collections", "collective",
    "collector", "college", "colleges", "collins", "colombia", "colonial", "color", "colorado", "colored", "colors",
    "colorspace", "colorspaces", "colour", "colours", "columbia", "columbus", "column", "columnists", "columns", "com",
    "combat", "combination", "combine", "combined", "combo", "come", "comedy", "comes", "comfort", "comfortable",
    "comic", "comics", "coming", "comm", "command", "commander", "commands", "comment", "commentary", "comments",
    "commerce", "commercial", "commission", "commissioner", "commit", "commitment", "committed", "committee", "committees", "common",
    "commonly", "commons", "commonwealth", "communicate", "communication", "communications", "communities", "community", "comp", "compact",
    "companies", "companion", "company", "compaq", "comparable", "comparative", "compare", "compared", "comparing", "comparison",
    "comparisons", "compatibility", "compatible", "compensation", "compete", "competition", "competitions", "competitive", "competitors", "compilation",
    "compile", "compiled", "compiler", "complaint", "complaints", "complete", "completed", "completely", "completing", "completion",
    "complex", "complexity", "compliance", "compliant", "complicated", "complications", "comply", "component", "components", "composed",
    "composer", "composite", "composited", "compositing", "composition", "compound", "compounds", "comprehensive", "compressed", "compression",
    "comps", "computer", "computers", "computing", "con", "concentration", "concentrations", "concept", "concepts", "concern",
    "concerned", "concerning", "concerns", "concert", "concerts", "concluded", "conclusion", "conclusions", "concrete", "condition",
    "conditioning", "conditions", "conduct", "conducted", "conducting", "conference", "conferences", "confidence", "confident", "confidential",
    "config", "configuration", "configure", "configured", "confirm", "confirmation", "confirmed", "conflict", "conflicts", "conform",
    "conforming", "confused", "confusion", "congo", "congress", "congressional", "conjunction", "connect", "connected", "connecticut",
    "connecting", "connection", "connections", "connectivity", "connector", "connectors", "cons", "consciousness", "consensus", "consent",
    "consequences", "conservation", "conservative", "consider", "considerable", "consideration", "considerations", "considered", "considering", "consistent",
    "consistently", "consisting", "consists", "console", "consolidated", "consolidation", "consortium", "const", "constant", "constantly",
    "constitute", "constitutes", "constitution", "constitutional", "constraints", "construct", "constructed", "construction", "consult", "consultant",
    "consultants", "consultation", "consulting", "consumer", "consumers", "consumption", "contact", "contacts", "contain", "contained",
    "container", "containers", "containing", "contains", "contemporary", "content", "contents", "contest", "contests", "context",
    "continental", "continue", "continued", "continues", "continuing", "continuous", "contract", "contracting", "contractor", "contractors",
    "contracts", "contrary", "contrast", "contribute", "contributed", "contributing", "contribution", "contributions", "contributors", "control",
    "controlled", "controller", "controlling", "controls", "convenience", "convenient", "convention", "conventional", "conversation", "conversion",
    "convert", "converted", "converter", "cook", "cookbook", "cookie", "cookies", "cooking", "cool", "cooler",
    "cooling", "cooper", "cooperation", "cooperative", "coordinate", "coordination", "coordinator", "copied", "copies", "copper",
    "copy", "copying", "copyright", "copyrighted", "copyrights", "coral", "cord", "cordless", "core", "corn",
    "corner", "corp", "corporate", "corporation", "corporations", "corps", "correct", "correction", "corrections", "correctly",
    "correlation", "correspondence", "correspondent", "correspondents", "corresponding", "corruption", "cosmetic", "cosmetics", "cost", "costa",
    "costs", "costume", "costumes", "cottage", "cotton", "could", "council", "counsel", "counseling", "count",
    "counter", "counters", "counties", "counting", "countries", "country", "counts", "county", "couple", "couples",
    "coupon", "coupons", "courier", "course", "courses", "court", "courtesy", "courts", "cover", "coverage",
    "covered", "covering", "covers", "cow", "cox", "cp", "cpu", "cr", "crack", "craft",
    "crafts", "craig", "crap", "crash", "crazy", "cream", "create", "created", "creates", "creating",
    "creation", "creative", "creativity", "creator", "credit", "credits", "creek", "crew", "cricket", "crime",
    "crimes", "criminal", "crisis", "criteria", "critical", "criticism", "critics", "crm", "croatia", "crop",
    "crops", "cross", "crossfade", "crossfades", "crossing", "crowd", "crown", "crucial", "cruise", "cruises",
    "cruz", "cry", "crystal", "cs", "css", "cst", "ct", "cu", "cuba", "cube",
    "cuisine", "cultural", "culture", "cultures", "cup", "cups", "cure", "curious", "currency", "current",
    "currently", "curriculum", "curve", "custody", "custom", "customer", "customers", "customize", "customized", "customs",
    "cut", "cute", "cuts", "cutting", "cv", "cvs", "cyber", "cycle", "cycles", "cycling",
    "cyprus", "czech", "d", "da", "dad", "daddy", "dailies", "daily", "dairy", "dakota",
    "dale", "dallas", "dam", "damage", "damaged", "damages", "damn", "dan", "dance", "dancing",
    "danger", "dangerous", "daniel", "danish", "danny", "dark", "darkness", "darwin", "das", "data",
    "database", "databases", "date", "dated", "dates", "dating", "daughter", "dave", "david", "davidson",
    "davis", "dawn", "day", "days", "dayton", "db", "dc", "dd", "ddr", "de",
    "dead", "deadline", "deal", "dealer", "dealers", "dealing", "deals", "dealtime", "dean", "dear",
    "death", "deaths", "debate", "debian", "debt", "debug", "debut", "dec", "decade", "decades",
    "december", "decent", "decide", "decided", "decision", "decisions", "deck", "declaration", "declared", "decline",
    "decor", "decorating", "decorative", "decrease", "decreased", "dedicated", "deemed", "deep", "deeply", "deer",
    "def", "default", "defects", "defence", "defend", "defendant", "defense", "define", "defined", "defines",
    "defining", "definitely", "definition", "definitions", "degree", "degrees", "del", "delaware", "delay", "delayed",
    "delays", "delete", "deleted", "delhi", "delicious", "deliver", "deliverables", "delivered", "delivering", "delivers",
    "delivery", "dell", "delta", "deluxe", "demand", "demands", "demo", "democracy", "democratic", "democrats",
    "demonstrate", "demonstrated", "demonstration", "den", "denied", "denmark", "dennis", "density", "dental", "denver",
    "deny", "department", "departments", "departure", "depend", "dependent", "depending", "depends", "deployment", "deposit",
    "deposits", "depot", "depression", "depth", "deputy", "der", "derived", "des", "describe", "described",
    "describes", "describing", "description", "descriptions", "desert", "design", "designated", "designed", "designer", "designers",
    "designing", "designs", "desire", "desired", "desk", "desktop", "desktops", "desperate", "despite", "destination",
    "destinations", "destroy", "destroyed", "destruction", "detail", "detailed", "details", "detect", "detected", "detection",
    "detector", "determination", "determine", "determined", "determines", "determining", "detroit", "deutsch", "dev", "devel",
    "develop", "developed", "developer", "developers", "developing", "development", "developmental", "developments", "deviant", "device",
    "devices", "devil", "devoted", "di", "diabetes", "diagnosis", "diagnostic", "diagram", "dial", "dialog",
    "dialogue", "diameter", "diamond", "diamonds", "diane", "diary", "dictionary", "did", "didn't", "die",
    "died", "diego", "dies", "diesel", "diet", "diff", "differ", "difference", "differences", "different",
    "differential", "difficult", "difficulties", "difficulty", "dig", "digest", "digital", "dimension", "dimensional", "dimensions",
    "dining", "dinner", "diploma", "dir", "direct", "directed", "direction", "directions", "directive", "directly",
    "director", "directories", "directors", "directory", "dirt", "dirty", "dis", "disabilities", "disability", "disable",
    "disabled", "disagree", "disaster", "disc", "discharge", "discipline", "disclaimer", "disclaimers", "disclosure", "disco",
    "discount", "discounted", "discounts", "discover", "discovered", "discovery", "discretion", "discrimination", "discs", "discuss",
    "discussed", "discusses", "discussion", "discussions", "disease", "diseases", "dish", "dishes", "disk", "disney",
    "disorder", "disorders", "dispatched", "display", "displayed", "displaying", "displays", "disposal", "dispute", "dissolve",
    "dissolves", "dist", "distance", "distinct", "distinguished", "distribute", "distributed", "distribution", "distributions", "distributor",
    "distributors", "district", "districts", "disturbed", "div", "dive", "diverse", "diversity", "divided", "divine",
    "diving", "division", "divisions", "divorce", "diy", "dj", "dl", "dm", "dna", "dns",
    "do", "doc", "dockable", "docs", "doctor", "doctors", "document", "documentary", "documentation", "documented",
    "documents", "dod", "dodge", "doe", "does", "doesn't", "dog", "dogs", "doing", "doll",
    "dollar", "dollars", "dolls", "dolly", "domain", "domains", "domestic", "dominant", "dominican", "don",
    "don't", "donald", "donate", "donation", "donations", "done", "donna", "donor", "dont", "door",
    "doors", "dos", "dose", "dot", "double", "doubt", "doug", "douglas", "down", "download",
    "downloadable", "downloaded", "downloading", "downloads", "downtown", "dozen", "dp", "dpi", "dr", "draft",
    "drag", "dragon", "drama", "dramatic", "draw", "drawing", "drawings", "drawn", "dream", "dreams",
    "dress", "dresses", "drew", "drill", "drink", "drinking", "drinks", "drive", "driven", "driver",
    "drivers", "drives", "driving", "drop", "dropped", "drops", "drug", "drugs", "drum", "drums",
    "drunk", "dry", "ds", "dsl", "dt", "du", "dual", "dublin", "duck", "due",
    "duke", "duncan", "durable", "duration", "durham", "during", "dust", "dutch", "duties", "duty",
    "dv", "dvd", "dvds", "dx", "dying", "dynamic", "dynamics", "e", "ea", "each",
    "eagle", "eagles", "ear", "earl", "earlier", "early", "earn", "earned", "earnings", "earrings",
    "ears", "earth", "ease", "easier", "easily", "east", "easter", "eastern", "easy", "eat",
    "eating", "ebay", "ebony", "ebook", "ebooks", "ec", "echo", "eclipse", "eco", "ecological",
    "ecology", "ecommerce", "economic", "economics", "economy", "ecuador", "ed", "eddie", "edge", "edges",
    "edinburgh", "edit", "edited", "editing", "edition", "editions", "editor", "editorial", "editors", "edt",
    "education", "educational", "educators", "edward", "edwards", "ee", "ef", "effect", "effective", "effectively",
    "effectiveness", "effects", "efficiency", "efficient", "effort", "efforts", "eg", "egg", "eggs", "egypt",
    "eight", "either", "el", "elder", "elderly", "elected", "election", "elections", "electric", "electrical",
    "electricity", "electron", "electronic", "electronics", "elegant", "element", "elementary", "elements", "eligibility", "eligible",
    "eliminate", "elite", "elizabeth", "ellen", "ellis", "else", "elsewhere", "elvis", "em", "email",
    "emails", "embassy", "embedded", "emergency", "emerging", "emily", "eminem", "emirates", "emission", "emissions",
    "emotional", "emotions", "emphasis", "empire", "employed", "employee", "employees", "employer", "employers", "employment",
    "empty", "en", "enable", "enabled", "enables", "enabling", "encoding", "encounter", "encourage", "encouraged",
    "encouraging", "encryption", "encyclopedia", "end", "ended", "endif", "ending", "ends", "enemy", "energy",
    "enforcement", "eng", "engage", "engaged", "engagement", "engine", "engineer", "engineering", "engineers", "engines",
    "england", "english", "enhance", "enhanced", "enhancement", "enjoy", "enjoyed", "enlarge", "enlargement", "enough",
    "enquiries", "enquiry", "enrolled", "enrollment", "ensure", "ensuring", "ent", "enter", "entered", "entering",
    "enterprise", "enterprises", "entertainment", "entire", "entirely", "entities", "entitled", "entity", "entrance", "entries",
    "entry", "envelope", "environment", "environmental", "environments", "ep", "epa", "epinions", "episode", "episodes",
    "epson", "eq", "equal", "equality", "equally", "equation", "equations", "equipment", "equipped", "equity",
    "equivalent", "er", "era", "eric", "ericsson", "error", "errors", "es", "escape", "escort",
    "escorts", "especially", "espn", "essay", "essays", "essence", "essential", "essentially", "essentials", "essex",
    "est", "establish", "established", "establishing", "establishment", "estate", "estimate", "estimated", "estimates", "estonia",
    "et", "etc", "eternal", "ethernet", "ethical", "ethics", "ethiopia", "ethnic", "eu", "eugene",
    "eur", "euro", "europe", "european", "evaluate", "evaluated", "evaluating", "evaluation", "evans", "eve",
    "even", "evening", "event", "events", "eventually", "ever", "every", "everybody", "everyday", "everyone",
    "everything", "everywhere", "evidence", "evil", "evolution", "ex", "exact", "exactly", "exam", "examination",
    "examine", "examined", "example", "examples", "exams", "exceed", "excel", "excellence", "excellent", "except",
    "exception", "exceptional", "exceptions", "excerpt", "excess", "exchange", "exchanges", "excited", "exciting", "exclude",
    "excluded", "excluding", "exclusive", "exclusively", "execute", "executed", "execution", "executive", "executives", "exempt",
    "exercise", "exercises", "exhaust", "exhibit", "exhibition", "exhibitions", "exhibits", "exist", "existence", "existing",
    "exists", "exit", "exotic", "exp", "expand", "expanded", "expanding", "expansion", "expansys", "expect",
    "expectations", "expected", "expenditure", "expenditures", "expense", "expenses", "expensive", "experience", "experienced", "experiences",
    "experiment", "experimental", "experiments", "expert", "expertise", "experts", "explain", "explained", "explains", "explanation",
    "explicit", "exploration", "explore", "explorer", "exploring", "expo", "export", "exporting", "exports", "exposed",
    "exposure", "express", "expressed", "expression", "expressions", "ext", "extend", "extended", "extends", "extension",
    "extensions", "extensive", "extent", "exterior", "external", "extra", "extract", "extraordinary", "extras", "extreme",
    "extremely", "eye", "eyed", "eyes", "f", "fa", "fabric", "fabulous", "face", "faced",
    "faces", "facial", "facilitate", "facilities", "facility", "facing", "fact", "factor", "factors", "factory",
    "facts", "faculty", "fade", "fail", "failed", "fails", "failure", "fair", "fairly", "faith",
    "fake", "fall", "fallen", "falling", "falls", "false", "fame", "familiar", "families", "family",
    "famous", "fan", "fancy", "fans", "fantastic", "fantasy", "faq", "faqs", "far", "farm",
    "farmer", "farmers", "farming", "farms", "fashion", "fast", "faster", "fastest", "fat", "fate",
    "father", "fault", "favor", "favorite", "favorites", "favourite", "favourites", "fax", "fc", "fda",
    "fe", "fear", "feature", "featured", "features", "featuring", "feb", "february", "fed", "federal",
    "federation", "fee", "feed", "feedback", "feeding", "feeds", "feel", "feeling", "feelings", "feels",
    "fees", "feet", "fell", "fellow", "fellowship", "felt", "female", "females", "ferry", "festival",
    "festivals", "fever", "few", "fewer", "ff", "fg", "fi", "fiber", "fiction", "field",
    "fields", "fifth", "fifty", "fig", "fight", "fighting", "figure", "figures", "fiji", "file",
    "filed", "filename", "files", "filing", "fill", "filled", "filling", "film", "filmgrain", "films",
    "filter", "filtering", "filters", "final", "finally", "finance", "financial", "financing", "find", "finder",
    "finding", "findings", "finds", "fine", "finest", "finger", "fingering", "fingers", "finish", "finished",
    "finishing", "finite", "finland", "fire", "fired", "firefox", "firewall", "firm", "firms", "first",
    "fiscal", "fish", "fisher", "fisheries", "fishing", "fist", "fisting", "fit", "fitness", "fits",
    "fitted", "fitting", "five", "fix", "fixed", "fixes", "fixtures", "fl", "flag", "flags",
    "flame", "flash", "flashing", "flat", "fleet", "flexibility", "flexible", "flickr", "flight", "flights",
    "flip", "float", "floating", "flood", "floor", "flooring", "floors", "floral", "florence", "florida",
    "florist", "florists", "flow", "flower", "flowers", "flows", "floyd", "flu", "fluid", "fly",
    "flying", "fm", "foam", "focus", "focused", "focuses", "focusing", "fold", "folder", "folders",
    "folding", "folk", "folks", "follow", "followed", "following", "follows", "font", "fonts", "food",
    "foods", "fool", "foot", "footage", "football", "footwear", "for", "force", "forced", "forces",
    "ford", "forecast", "forecasts", "foreign", "forest", "forestry", "forests", "forever", "forget", "forgot",
    "forgotten", "fork", "form", "formal", "format", "formation", "formats", "formed", "former", "formerly",
    "forming", "forms", "formula", "fort", "forth", "fortune", "forty", "forum", "forums", "forward",
    "foster", "foto", "fotos", "found", "foundation", "foundations", "founded", "founder", "four", "fourth",
    "fox", "fr", "fraction", "fragrance", "frame", "framed", "framerate", "frames", "framework", "framing",
    "france", "franchise", "francis", "francisco", "frank", "franklin", "fraud", "fred", "frederick", "free",
    "freebsd", "freedom", "freeware", "freight", "french", "frequency", "frequent", "frequently", "fresh", "fri",
    "friday", "friend", "friendly", "friends", "friendship", "frog", "from", "front", "frozen", "fruit",
    "fruits", "fs", "ft", "ftp", "fuel", "fujitsu", "full", "fully", "fun", "function",
    "functional", "functionality", "functions", "fund", "fundamental", "funded", "funding", "funds", "funeral", "funny",
    "furnished", "furnishings", "furniture", "further", "furthermore", "fusion", "future", "futures", "fw", "fwd",
    "fx", "fy", "g", "ga", "gadgets", "gain", "gained", "gains", "galaxy", "galleries",
    "gallery", "gambling", "game", "gamecube", "games", "gamespot", "gaming", "gamma", "gang", "gap",
    "garage", "garden", "gardening", "gardens", "gary", "gas", "gate", "gates", "gateway", "gather",
    "gathered", "gathering", "gauge", "gave", "gay", "gb", "gbp", "gc", "gcc", "gdp",
    "ge", "gear", "geek", "gel", "gen", "gender", "gene", "genealogy", "general", "generally",
    "generate", "generated", "generating", "generation", "generations", "generator", "generic", "genes", "genesis", "genetic",
    "genetics", "geneva", "genome", "genre", "genres", "genuine", "geo", "geographic", "geographical", "geography",
    "geometry", "george", "georgia", "german", "germany", "get", "gets", "getting", "ghana", "ghost",
    "ghz", "gi", "giant", "gibson", "gif", "gift", "gifts", "girl", "girls", "gis",
    "give", "given", "gives", "giving", "glad", "glance", "glasgow", "glass", "glasses", "glen",
    "glenn", "global", "globe", "glory", "glossary", "gloves", "glow", "glyph", "glyphs", "gm",
    "gmbh", "gmt", "gnome", "gnu", "go", "goal", "goals", "god", "gods", "goes",
    "going", "gold", "golden", "golf", "gone", "gonna", "good", "goods", "google", "gordon",
    "gorgeous", "gospel", "got", "goto", "gotten", "gourmet", "governance", "governing", "government", "governmental",
    "governments", "governor", "gp", "gpl", "gps", "gr", "grab", "grace", "grade", "grades",
    "gradient", "gradients", "graduate", "graduates", "graduation", "graham", "grain", "grammar", "grand", "grant",
    "granted", "grants", "graph", "graphic", "graphics", "gras", "grass", "gratis", "gravity", "gray",
    "great", "greater", "greatest", "greatly", "greece", "greek", "green", "greeting", "greg", "gregory",
    "grew", "grey", "grid", "grids", "grill", "grip", "grocery", "gross", "ground", "grounds",
    "group", "groups", "grove", "grow", "growing", "grown", "growth", "gs", "gsm", "gt",
    "guam", "guarantee", "guaranteed", "guard", "guardian", "guatemala", "guess", "guest", "guestbook", "guests",
    "gui", "guidance", "guide", "guided", "guidelines", "guides", "guild", "guilty", "guinea", "guitar",
    "guitars", "gulf", "gun", "guns", "guy", "guys", "gym", "h", "ha", "habitat",
    "hacker", "had", "hair", "hairy", "haiti", "half", "hall", "halloween", "hamilton", "hammer",
    "hampshire", "hampton", "hand", "handbook", "handed", "handheld", "handle", "handled", "handles", "handling",
    "handoff", "handoffs", "hands", "handy", "hang", "hanging", "happen", "happened", "happening", "happens",
    "happiness", "happy", "harbor", "harbour", "hard", "hardcover", "harder", "hardly", "hardware", "harm",
    "harmony", "harris", "harrison", "harry", "hart", "harvard", "harvest", "harvey", "has", "hat",
    "hate", "hats", "have", "haven", "having", "hawaii", "hazard", "hazardous", "hb", "hd",
    "hdtv", "he", "head", "headed", "header", "headers", "heading", "headlines", "headphones", "headquarters",
    "heads", "headset", "healing", "health", "healthcare", "healthy", "hear", "heard", "hearing", "heart",
    "hearts", "heat", "heather", "heating", "heaven", "heavily", "heavy", "hebrew", "height", "heights",
    "held", "helen", "hell", "hello", "help", "helped", "helpful", "helping", "helps", "hence",
    "henderson", "henry", "her", "herald", "herbal", "herbs", "here", "hereby", "herein", "heritage",
    "hero", "heroes", "herself", "hewlett", "hey", "hi", "hidden", "hide", "hierarchy", "high",
    "higher", "highest", "highlight", "highlights", "highly", "highs", "highway", "hiking", "hill", "hills",
    "hilton", "him", "himself", "hints", "hip", "hire", "hiring", "his", "hispanic", "hist",
    "historic", "historical", "history", "hit", "hits", "hiv", "ho", "hobbies", "hobby", "hockey",
    "hold", "holdem", "holder", "holders", "holding", "holdings", "holds", "hole", "holes", "holiday",
    "holidays", "holland", "hollywood", "holmes", "holy", "home", "homeland", "homepage", "homes", "homework",
    "hon", "honda", "honest", "honey", "hong", "honolulu", "honor", "honors", "hood", "hook",
    "hop", "hope", "hopefully", "hopes", "hoping", "horizon", "horizontal", "hormone", "horn", "horny",
    "horror", "horse", "horses", "hospital", "hospitality", "hospitals", "host", "hosted", "hosting", "hosts",
    "hot", "hotel", "hotels", "hotmail", "hottest", "hour", "hourly", "hours", "house", "household",
    "households", "houses", "housewares", "housing", "houston", "how", "howard", "however", "hp", "hr",
    "href", "hrs", "hs", "ht", "html", "http", "hub", "hudson", "huge", "hughes",
    "human", "humanities", "humanity", "humans", "humidity", "humor", "hundred", "hundreds", "hung", "hungarian",
    "hungary", "hunt", "hunter", "hunting", "hurricane", "hurt", "husband", "hwy", "hybrid", "hydrogen",
    "hz", "i", "ia", "ian", "ibm", "ic", "ice", "iceland", "icon", "icons",
    "icq", "ict", "id", "idaho", "ide", "idea", "ideal", "ideas", "identical", "identification",
    "identified", "identifier", "identify", "identifying", "identity", "ie", "ieee", "if", "ignore", "ignored",
    "ii", "iii", "il", "ill", "illegal", "illinois", "illness", "illustrated", "illustration", "illustrations",
    "im", "image", "images", "imagination", "imagine", "imaging", "img", "immediate", "immediately", "immigration",
    "immune", "impact", "impacts", "imperial", "implement", "implementation", "implemented", "implementing", "implications", "implied",
    "implies", "import", "importance", "important", "imported", "imports", "imposed", "impossible", "impression", "impressive",
    "improve", "improved", "improvement", "improvements", "improving", "in", "inappropriate", "inc", "incentive", "incentives",
    "inch", "inches", "incident", "include", "included", "includes", "including", "inclusion", "inclusive", "income",
    "incoming", "incorporate", "incorporated", "incorrect", "increase", "increased", "increases", "increasing", "increasingly", "incredible",
    "indeed", "independence", "independent", "independently", "index", "indexed", "india", "indian", "indiana", "indianapolis",
    "indians", "indicate", "indicated", "indicates", "indicating", "indicator", "indicators", "indie", "indigenous", "indirect",
    "individual", "individually", "individuals", "indonesia", "indoor", "induced", "industrial", "industries", "industry", "infant",
    "infected", "infection", "infections", "inflation", "influence", "info", "inform", "informal", "information", "informational",
    "informed", "infrared", "infrastructure", "ing", "ingest", "ingredients", "initial", "initially", "initiated", "initiative",
    "initiatives", "injection", "injured", "injuries", "injury", "ink", "inkjet", "inline", "inn", "inner",
    "innocent", "innovation", "innovative", "inns", "input", "inputs", "inquiries", "inquiry", "ins", "insert",
    "inside", "insider", "insight", "insights", "inspection", "inspector", "inspiration", "inspired", "install", "installation",
    "installed", "installing", "instance", "instances", "instant", "instantly", "instead", "institute", "institution", "institutional",
    "institutions", "instruction", "instructional", "instructions", "instructor", "instrument", "instruments", "insurance", "int", "intake",
    "integer", "integral", "integrate", "integrated", "integration", "integrity", "intel", "intellectual", "intelligence", "intelligent",
    "intended", "intense", "intensity", "intensive", "intent", "intention", "inter", "interact", "interaction", "interactions",
    "interactive", "interest", "interested", "interesting", "interests", "interface", "interfaces", "interim", "interior", "interlaced",
    "intermediate", "internal", "international", "internet", "interpretation", "interracial", "interval", "intervention", "interview", "interviews",
    "into", "intro", "introduce", "introduced", "introducing", "introduction", "invalid", "invasion", "invention", "inventory",
    "invest", "investigate", "investigation", "investigations", "investing", "investment", "investments", "investor", "investors", "invitation",
    "invite", "invited", "invoice", "involve", "involved", "involvement", "involves", "involving", "ion", "iowa",
    "ip", "ipaq", "ipod", "ir", "iran", "iraq", "iraqi", "irc", "ireland", "irish",
    "iron", "is", "isbn", "islam", "islamic", "island", "islands", "isle", "iso", "isolated",
    "isp", "israel", "israeli", "issue", "issued", "issues", "ist", "it", "italian", "italy",
    "item", "items", "iterate", "iteration", "its", "itself", "itunes", "iv", "ivory", "ix",
    "j", "ja", "jack", "jacket", "jackets", "jackson", "jacksonville", "jacob", "jail", "jam",
    "jamaica", "james", "jamie", "jan", "jane", "janet", "january", "japan", "japanese", "jason",
    "java", "javascript", "jay", "jazz", "jc", "jd", "je", "jean", "jeans", "jeep",
    "jeff", "jefferson", "jeffrey", "jelsoft", "jennifer", "jeremy", "jerry", "jersey", "jerusalem", "jessica",
    "jesus", "jet", "jewellery", "jewelry", "jewish", "jews", "jim", "jimmy", "jm", "jo",
    "joan", "job", "jobs", "joe", "joel", "john", "johnny", "johnson", "join", "joined",
    "joining", "joint", "joke", "jokes", "jon", "jonathan", "jones", "jordan", "jose", "joseph",
    "josh", "journal", "journalism", "journalists", "journals", "journey", "joy", "jp", "jpeg", "jpg",
    "jr", "juan", "judge", "judges", "judgment", "judicial", "judy", "juice", "jul", "julia",
    "julie", "july", "jump", "jumpcut", "jumpcuts", "jun", "junction", "june", "jungle", "junior",
    "jurisdiction", "jury", "just", "justice", "justin", "juvenile", "jvc", "k", "kansas", "karaoke",
    "karen", "karl", "kate", "katie", "katrina", "kay", "kb", "kde", "keep", "keeping",
    "keeps", "keith", "kelkoo", "kelly", "ken", "kennedy", "kenneth", "kent", "kentucky", "kenya",
    "kept", "kernel", "kerning", "kerry", "kevin", "key", "keyboard", "keyboards", "keyed", "keyer",
    "keyframe", "keyframed", "keyframes", "keying", "keys", "keyword", "keywords", "kg", "kick", "kid",
    "kidney", "kids", "kijiji", "kill", "killed", "killer", "killing", "kim", "kind", "kinds",
    "kinetic", "king", "kingdom", "kings", "kingston", "kiss", "kissing", "kit", "kitchen", "kits",
    "klein", "km", "knee", "knew", "knife", "knight", "knives", "know", "knowing", "knowledge",
    "known", "knows", "kodak", "kong", "korea", "korean", "ks", "kuwait", "ky", "l",
    "la", "lab", "label", "labels", "labor", "laboratories", "laboratory", "labour", "labs", "lace",
    "lack", "ladies", "lady", "laid", "lake", "lakes", "lambda", "lamp", "lamps", "lan",
    "lancaster", "land", "landing", "lands", "landscape", "lane", "lang", "language", "languages", "lanka",
    "laptop", "laptops", "large", "largely", "larger", "largest", "larry", "las", "laser", "last",
    "lat", "late", "later", "latest", "latex", "latin", "latina", "latinas", "latino", "latitude",
    "latter", "latvia", "laugh", "launch", "launched", "launches", "laundry", "laura", "lauren", "law",
    "lawn", "lawrence", "laws", "lawyer", "lawyers", "lay", "layer", "layers", "layout", "layouts",
    "lb", "lbs", "lc", "lcd", "ld", "le", "lead", "leader", "leaders", "leadership",
    "leading", "leads", "leaf", "league", "learn", "learned", "learning", "lease", "leasing", "least",
    "leather", "leave", "leaves", "leaving", "lebanon", "lecture", "lectures", "led", "lee", "leeds",
    "left", "leg", "legacy", "legal", "legend", "legends", "legislation", "legislative", "legislature", "legs",
    "leisure", "lemon", "lenders", "lending", "length", "lens", "lenses", "leo", "leonard", "les",
    "lesbian", "lesbians", "less", "lesson", "lessons", "let", "lets", "letter", "letterbox", "letters",
    "letting", "level", "levels", "lewis", "lexmark", "lg", "li", "liabilities", "liability", "liable",
    "lib", "liberal", "liberty", "libraries", "library", "licence", "license", "licensed", "licenses", "licensing",
    "lie", "lies", "life", "lifestyle", "lifetime", "lift", "ligature", "ligatures", "light", "lighting",
    "lightning", "lights", "lightweight", "like", "liked", "likely", "likes", "lil", "limit", "limitation",
    "limitations", "limited", "limits", "limousines", "lincoln", "linda", "line", "linear", "lines", "lingerie",
    "link", "linked", "linking", "links", "linux", "lion", "lip", "lips", "liquid", "lisa",
    "list", "listed", "listen", "listening", "listing", "listings", "lists", "lite", "literacy", "literally",
    "literary", "literature", "lithuania", "litigation", "little", "live", "livecam", "lived", "liver", "liverpool",
    "lives", "livesex", "living", "ll", "llc", "lloyd", "ln", "lo", "load", "loaded",
    "loading", "loads", "loan", "loans", "loc", "local", "locale", "locally", "locate", "located",
    "location", "locations", "locator", "lock", "locked", "lodge", "lodging", "log", "logged", "logging",
    "logic", "logical", "login", "logistics", "logo", "logos", "logotype", "logotypes", "logs", "lol",
    "london", "lonely", "long", "longer", "look", "looked", "looking", "looks", "lookup", "loop",
    "looping", "loose", "lopez", "lord", "los", "lose", "losing", "loss", "losses", "lost",
    "lot", "lots", "lottery", "lotus", "loud", "louis", "louisiana", "louisville", "lounge", "love",
    "loved", "lovely", "lover", "lovers", "loves", "loving", "low", "lower", "lowercase", "lowerthird",
    "lowerthirds", "lowest", "lp", "ls", "lt", "ltd", "luck", "lucky", "luggage", "luke",
    "luminance", "lunch", "lung", "luxembourg", "luxury", "lycos", "lying", "lynn", "lyrics", "m",
    "ma", "mac", "machine", "machinery", "machines", "macintosh", "macro", "macromedia", "mad", "made",
    "madison", "madonna", "madrid", "mag", "magazine", "magazines", "magic", "magnetic", "mail", "mailed",
    "mailing", "main", "maine", "mainland", "mainly", "mainstream", "maintain", "maintained", "maintaining", "maintenance",
    "major", "majority", "make", "maker", "makers", "makes", "making", "malaysia", "male", "males",
    "mall", "malta", "man", "manage", "managed", "management", "manager", "managers", "managing", "manchester",
    "mandatory", "manga", "manhattan", "manitoba", "manner", "manor", "manual", "manuals", "manufacture", "manufactured",
    "manufacturer", "manufacturers", "manufacturing", "many", "map", "maple", "mapping", "maps", "mar", "marc",
    "march", "margaret", "margin", "margins", "maria", "marie", "marina", "marine", "mario", "maritime",
    "mark", "marked", "marker", "market", "marketing", "marketplace", "markets", "marks", "marriage", "married",
    "marriott", "mars", "marshall", "mart", "martha", "martial", "martin", "mary", "maryland", "mask",
    "mason", "mass", "massachusetts", "massage", "massive", "master", "mastercard", "masters", "masturbating", "mat",
    "match", "matches", "matching", "mate", "material", "materials", "maternity", "math", "mathematical", "mathematics",
    "matrix", "matt", "matte", "matter", "matters", "mattes", "matthew", "mature", "max", "maximum",
    "may", "maybe", "mayor", "mazda", "mb", "mba", "mc", "mcdonald", "md", "me",
    "meal", "meals", "mean", "meaning", "means", "meant", "meanwhile", "measure", "measured", "measurement",
    "measurements", "measures", "measuring", "meat", "mechanical", "mechanics", "mechanism", "mechanisms", "med", "medal",
    "media", "median", "medicaid", "medical", "medicare", "medication", "medications", "medicine", "medieval", "medium",
    "medline", "meet", "meeting", "meetings", "meets", "meetup", "mega", "melbourne", "melissa", "mem",
    "member", "members", "membership", "membrane", "memorabilia", "memorial", "memories", "memory", "memphis", "men",
    "mens", "ment", "mental", "mention", "mentioned", "menu", "menus", "mercedes", "merchandise", "merchant",
    "merchants", "mercury", "mere", "merely", "merge", "mesh", "message", "messages", "messaging", "messenger",
    "met", "meta", "metabolism", "metal", "metals", "meter", "meters", "method", "methodology", "methods",
    "metric", "metro", "metropolitan", "mexican", "mexico", "mf", "mg", "mhz", "mi", "miami",
    "mice", "michael", "michelle", "michigan", "micro", "microsoft", "microwave", "mid", "middle", "midi",
    "midlands", "midnight", "midwest", "might", "mighty", "migration", "mike", "mile", "miles", "milfhunter",
    "milfs", "military", "milk", "mill", "millennium", "miller", "million", "millions", "mills", "milton",
    "milwaukee", "min", "mind", "minds", "mine", "mineral", "minerals", "mini", "minimal", "minimize",
    "minimum", "mining", "minister", "ministers", "ministry", "minneapolis", "minnesota", "minolta", "minor", "minority",
    "mins", "mint", "minus", "minute", "minutes", "mirror", "mirrors", "misc", "miscellaneous", "miss",
    "missed", "missing", "mission", "missions", "mississippi", "missouri", "mistake", "mistakes", "mistress", "mit",
    "mitchell", "mitsubishi", "mix", "mixed", "mixing", "mixture", "ml", "mlb", "mls", "mm",
    "mn", "mo", "mobile", "mobiles", "mobility", "mocap", "mod", "mode", "model", "modeling",
    "models", "modem", "moderate", "moderator", "modern", "modes", "modification", "modifications", "modified", "modify",
    "module", "modules", "moisture", "molecular", "mom", "moment", "moments", "moms", "mon", "monaco",
    "monday", "monetary", "money", "monica", "monitor", "monitoring", "monitors", "monkey", "mono", "monroe",
    "monster", "montage", "montana", "montgomery", "month", "monthly", "months", "montreal", "mood", "moon",
    "moore", "moral", "more", "moreover", "morgan", "morning", "morocco", "morph", "morphing", "morris",
    "mortality", "mortgage", "mortgages", "moscow", "most", "mostly", "motel", "motels", "mother", "mothers",
    "motion", "motiongraphics", "motivation", "motor", "motorcycle", "motorola", "motors", "mount", "mountain", "mountains",
    "mounted", "mounting", "mouse", "mouth", "move", "moved", "movement", "movements", "moves", "movie",
    "movies", "moving", "mozambique", "mozilla", "mp", "mpeg", "mph", "mr", "mrs", "ms",
    "msg", "msgid", "msgstr", "msn", "mt", "much", "multi", "multimedia", "multiple", "municipal",
    "murder", "murphy", "murray", "muscle", "museum", "museums", "music", "musical", "musicians", "muslim",
    "must", "mutual", "mw", "mx", "my", "myers", "myself", "myspace", "mysql", "mystery",
    "n", "na", "nail", "naked", "nam", "name", "named", "names", "namibia", "nancy",
    "nano", "narration", "narrator", "narrow", "nasa", "nascar", "nasdaq", "nashville", "nasty", "nat",
    "nation", "national", "nations", "nationwide", "native", "natural", "naturally", "naturals", "nature", "nav",
    "naval", "navigate", "navigation", "navy", "nb", "nba", "nc", "ncaa", "nd", "ne",
    "near", "nearby", "nearest", "nearly", "nebraska", "nec", "necessarily", "necessary", "neck", "necklace",
    "need", "needed", "needs", "negative", "negotiations", "neighborhood", "neighbors", "neil", "neither", "nelson",
    "neo", "nepal", "nervous", "net", "netherlands", "netscape", "network", "networking", "networks", "neutral",
    "nevada", "never", "nevertheless", "new", "newbie", "newcastle", "newer", "newest", "newly", "newport",
    "news", "newsletter", "newsletters", "newspaper", "newspapers", "newsroom", "newsrooms", "newton", "next", "nfl",
    "ng", "nh", "nhl", "nhs", "ni", "nice", "nicholas", "nick", "nickname", "nicole",
    "nigeria", "night", "nights", "nike", "nikon", "nine", "nintendo", "nipple", "nipples", "nissan",
    "nj", "nl", "nm", "nn", "no", "noble", "nobody", "node", "nodes", "noise",
    "nokia", "non", "none", "nonprofit", "noon", "nor", "norfolk", "normal", "normally", "norman",
    "north", "northeast", "northern", "northwest", "norton", "norway", "norwegian", "nose", "not", "note",
    "notebook", "notebooks", "noted", "notes", "nothing", "notice", "noticed", "notices", "notification", "notifications",
    "notified", "notify", "notion", "nov", "nova", "novel", "novels", "november", "now", "np",
    "nr", "ns", "nsw", "nt", "nu", "nuclear", "nude", "nuke", "null", "number",
    "numbers", "numerical", "numerous", "nurse", "nursery", "nurses", "nursing", "nutrition", "nuts", "nutten",
    "nv", "nw", "ny", "nyc", "nylon", "nz", "o", "oak", "oakland", "oasis",
    "obituaries", "object", "objective", "objectives", "objects", "obligation", "obligations", "observation", "observations", "observe",
    "observed", "observer", "obtain", "obtained", "obtaining", "obvious", "obviously", "oc", "occasion", "occasionally",
    "occasions", "occupation", "occupational", "occupied", "occur", "occurred", "occurs", "ocean", "oclc", "oct",
    "october", "odd", "odds", "oe", "oem", "of", "off", "offense", "offensive", "offer",
    "offered", "offering", "offerings", "offers", "office", "officer", "officers", "offices", "official", "officially",
    "officials", "offline", "offset", "offshore", "often", "oh", "ohio", "oil", "oils", "ok",
    "okay", "oklahoma", "old", "older", "oldest", "olive", "oliver", "olympic", "olympics", "olympus",
    "om", "omaha", "omega", "on", "once", "one", "ones", "ongoing", "online", "only",
    "ons", "ontario", "onto", "oo", "ooo", "oops", "op", "opacity", "open", "opened",
    "opener", "openers", "opening", "opens", "opera", "operate", "operated", "operates", "operating", "operation",
    "operational", "operations", "operator", "operators", "opinion", "opinions", "opportunities", "opportunity", "opposed", "opposite",
    "opposition", "opt", "optical", "optics", "optimal", "optimization", "option", "optional", "options", "or",
    "oracle", "oral", "orange", "orchestra", "order", "ordered", "ordering", "orders", "ordinance", "ordinary",
    "oregon", "org", "organ", "organic", "organisation", "organisations", "organization", "organizational", "organizations", "organize",
    "organized", "orgy", "oriental", "orientation", "oriented", "origin", "original", "originally", "orlando", "orleans",
    "os", "oscar", "ot", "other", "others", "otherwise", "ottawa", "ou", "ought", "our",
    "ours", "ourselves", "out", "outcome", "outcomes", "outdoor", "outdoors", "outer", "outlet", "outline",
    "outlook", "output", "outreach", "outside", "outsourcing", "outstanding", "oval", "oven", "over", "overall",
    "overcome", "overhead", "overnight", "overseas", "overview", "own", "owned", "owner", "owners", "ownership",
    "oxford", "oxygen", "oz", "p", "pa", "pace", "pacific", "pack", "package", "packages",
    "packaging", "packard", "packed", "packet", "packets", "packing", "packs", "pad", "pads", "page",
    "pages", "paid", "pain", "paint", "painted", "painting", "paintings", "pair", "pairs", "pakistan",
    "pal", "palace", "palestinian", "palm", "pan", "panama", "panasonic", "panel", "panels", "panties",
    "pantone", "pants", "pantyhose", "paper", "paperback", "paperbacks", "papers", "par", "para", "parade",
    "paradise", "paragraph", "parallel", "parameter", "parameters", "parent", "parenting", "parents", "paris", "parish",
    "park", "parker", "parking", "parks", "parliament", "part", "partial", "partially", "participant", "participants",
    "participate", "participating", "participation", "particle", "particles", "particular", "particularly", "parties", "partly", "partner",
    "partners", "partnership", "partnerships", "parts", "party", "pass", "passage", "passed", "passenger", "passengers",
    "passes", "passing", "passion", "passport", "password", "past", "paste", "pat", "patch", "patches",
    "patent", "patents", "path", "pathology", "paths", "patient", "patients", "patio", "patricia", "patrick",
    "pattern", "patterns", "paul", "pause", "pay", "payable", "payday", "paying", "payment", "payments",
    "paypal", "payroll", "pays", "pb", "pc", "pci", "pcs", "pd", "pda", "pdas",
    "pdf", "pdt", "pe", "peace", "peak", "pearl", "pee", "peeing", "peer", "pen",
    "penalties", "penalty", "pendant", "pending", "penn", "pennsylvania", "penny", "pension", "pentium", "people",
    "peoples", "pepper", "per", "percent", "percentage", "perception", "perfect", "perfectly", "perform", "performance",
    "performances", "performed", "performing", "perfume", "perhaps", "period", "periodic", "periodically", "periods", "peripherals",
    "perl", "permalink", "permanent", "permission", "permissions", "permit", "permits", "permitted", "perry", "person",
    "personal", "personality", "personalized", "personally", "personals", "personnel", "persons", "perspective", "perspectives", "perth",
    "peru", "pet", "pete", "peter", "petersburg", "petition", "petroleum", "pets", "pg", "ph",
    "pharmaceutical", "pharmaceuticals", "pharmacies", "pharmacology", "pharmacy", "phase", "phd", "phi", "phil", "philadelphia",
    "philip", "philippines", "philips", "phillips", "philosophy", "phoenix", "phone", "phones", "photo", "photograph",
    "photographer", "photographers", "photographic", "photographs", "photography", "photos", "photoshop", "php", "phpbb", "phrase",
    "phys", "physical", "physician", "physicians", "physics", "physiology", "pi", "piano", "pic", "pichunter",
    "pick", "picked", "picks", "pickup", "pics", "picture", "pictures", "pie", "piece", "pieces",
    "pierre", "pig", "pill", "pillarbox", "pills", "pilot", "pin", "pine", "pink", "pins",
    "pioneer", "pipe", "pipeline", "pipelines", "piss", "pissing", "pit", "pitch", "pittsburgh", "pixel",
    "pixels", "pizza", "pl", "place", "placed", "placement", "places", "placing", "plain", "plains",
    "plan", "plane", "planet", "planned", "planner", "planning", "plans", "plant", "plants", "plasma",
    "plastic", "plate", "plates", "platform", "platforms", "platinum", "play", "playback", "playboy", "played",
    "player", "players", "playing", "playlist", "plays", "playstation", "plaza", "plc", "pleasant", "please",
    "pleased", "pleasure", "plenty", "plot", "plug", "plugin", "plugins", "plumbing", "plus", "plymouth",
    "pm", "pmc", "pmid", "po", "pocket", "podcast", "poem", "poems", "poetry", "point",
    "pointed", "pointer", "points", "poker", "poland", "polar", "pole", "police", "policies", "policy",
    "polish", "political", "politics", "poll", "polls", "pollution", "polo", "poly", "polyphonic", "pond",
    "pool", "poor", "pop", "pope", "popular", "popularity", "population", "populations", "por", "porcelain",
    "port", "portable", "portal", "porter", "portfolio", "portion", "portions", "portland", "portrait", "ports",
    "portugal", "portuguese", "pos", "position", "positions", "positive", "possession", "possibilities", "possibility", "possible",
    "possibly", "post", "postage", "postal", "posted", "poster", "posters", "posting", "postposted", "posts",
    "pot", "potential", "potentially", "potter", "pottery", "pound", "pounds", "pour", "poverty", "powder",
    "powell", "power", "powered", "powerful", "powerpoint", "powers", "pp", "ppc", "pr", "practical",
    "practice", "practices", "practitioners", "prague", "prairie", "praise", "pray", "prayer", "pre", "precious",
    "precise", "precision", "precomp", "precomposition", "precompositions", "precomps", "predicted", "prediction", "prefer", "preference",
    "preferences", "preferred", "pregnancy", "pregnant", "preliminary", "premier", "premises", "premium", "prep", "preparation",
    "prepare", "prepared", "preparing", "prescribed", "prescription", "presence", "present", "presentation", "presentations", "presented",
    "presents", "preservation", "preserve", "preset", "president", "presidential", "press", "pressure", "pretty", "prev",
    "prevent", "preventing", "prevention", "preview", "previews", "previous", "previously", "price", "priced", "prices",
    "pricing", "pride", "priest", "primarily", "primary", "prime", "prince", "princess", "princeton", "principal",
    "principle", "principles", "print", "printable", "printed", "printer", "printers", "printing", "prints", "prior",
    "priorities", "priority", "prison", "privacy", "private", "prize", "prizes", "pro", "probability", "probably",
    "probe", "problem", "problems", "proc", "procedure", "procedures", "proceed", "proceeding", "proceedings", "proceeds",
    "process", "processed", "processes", "processing", "processor", "processors", "procurement", "produce", "produced", "producer",
    "producers", "produces", "producing", "product", "production", "productions", "productive", "productivity", "products", "profession",
    "professional", "professionals", "professor", "profile", "profiles", "profit", "profits", "program", "programme", "programmes",
    "programming", "programs", "progress", "progressive", "prohibited", "project", "projected", "projection", "projector", "projectors",
    "projects", "promise", "promised", "promo", "promos", "promote", "promoting", "promotion", "promotional", "promotions",
    "prompt", "prompter", "proof", "proper", "properly", "properties", "property", "proportion", "proposal", "proposals",
    "proposed", "proprietary", "prores", "pros", "prospect", "prospective", "prospects", "prostores", "prot", "protect",
    "protected", "protecting", "protection", "protective", "protein", "proteins", "protest", "protocol", "protocols", "proud",
    "prove", "proved", "proven", "provide", "provided", "providence", "provider", "providers", "provides", "providing",
    "province", "provincial", "provision", "provisions", "proxies", "proxy", "ps", "psp", "pst", "psychological",
    "psychology", "pt", "pts", "pty", "pub", "public", "publication", "publications", "publicly", "publish",
    "published", "publisher", "publishers", "publishing", "pubmed", "puerto", "pull", "pulled", "pulse", "pump",
    "pumps", "punishment", "punk", "pupils", "puppet", "puppeting", "purchase", "purchased", "purchases", "purchasing",
    "pure", "purple", "purpose", "purposes", "pursuant", "pursue", "push", "put", "puts", "putting",
    "puzzle", "puzzles", "python", "q", "qty", "qualifications", "qualified", "qualify", "quality", "quantities",
    "quantity", "quantum", "quarter", "quarterly", "quarters", "que", "quebec", "queen", "queensland", "queries",
    "query", "quest", "question", "questions", "queue", "quick", "quickly", "quiet", "quit", "quite",
    "quiz", "quotations", "quote", "quoted", "quotes", "r", "ra", "rabbit", "race", "races",
    "rachel", "racial", "racing", "rack", "rackfocus", "racks", "radar", "radiation", "radical", "radio",
    "radius", "raid", "rail", "railroad", "railway", "rain", "rainbow", "raise", "raised", "raising",
    "raleigh", "rally", "ralph", "ram", "ran", "ranch", "random", "randy", "range", "ranges",
    "ranging", "rank", "ranked", "ranking", "rankings", "ranks", "rap", "rapid", "rapidly", "rapids",
    "rare", "rarely", "raster", "rat", "rate", "rated", "rates", "rather", "rating", "ratings",
    "ratio", "rats", "raw", "ray", "raymond", "rc", "rd", "re", "reach", "reached",
    "reaching", "reaction", "reactions", "read", "reader", "readers", "reading", "readings", "reads", "ready",
    "real", "realistic", "reality", "realize", "realized", "really", "realty", "rear", "reason", "reasonable",
    "reasonably", "reasons", "rebate", "rebecca", "rec", "recall", "receipt", "receive", "received", "receiver",
    "receives", "receiving", "recent", "recently", "reception", "receptor", "recipe", "recipes", "recipient", "recipients",
    "recognition", "recognize", "recognized", "recommend", "recommendation", "recommendations", "recommended", "recommends", "reconstruction", "record",
    "recorded", "recorder", "recording", "recordings", "records", "recover", "recovery", "recreation", "recreational", "recruiting",
    "recruitment", "recycling", "red", "redeem", "reduce", "reduced", "reduces", "reducing", "reduction", "reed",
    "ref", "refer", "reference", "references", "referral", "referred", "referring", "refers", "refinance", "refine",
    "reflect", "reflected", "reflection", "reflects", "reform", "refund", "refuse", "refused", "reg", "regard",
    "regarding", "regardless", "regards", "regime", "region", "regional", "regions", "register", "registered", "registrar",
    "registration", "registry", "regular", "regularly", "regulated", "regulation", "regulations", "regulatory", "rehabilitation", "rejected",
    "relate", "related", "relating", "relation", "relations", "relationship", "relationships", "relative", "relatively", "relax",
    "relay", "release", "released", "releases", "relevance", "relevant", "reliability", "reliable", "relief", "religion",
    "religious", "reload", "relocation", "rely", "remain", "remained", "remaining", "remains", "remarkable", "remarks",
    "remember", "remembered", "reminder", "remix", "remote", "removal", "remove", "removed", "removing", "renaissance",
    "render", "renderer", "renewal", "reno", "rent", "rental", "rentals", "rep", "repair", "repairs",
    "repeat", "repeated", "replace", "replaced", "replacement", "replica", "replied", "replies", "reply", "report",
    "reported", "reporter", "reporters", "reporting", "reports", "repository", "represent", "representation", "representative", "representatives",
    "represented", "representing", "represents", "reprints", "reproduced", "reproduction", "republic", "republican", "republicans", "reputation",
    "request", "requested", "requests", "require", "required", "requirement", "requirements", "requires", "requiring", "res",
    "rescue", "research", "researchers", "reseller", "reservation", "reservations", "reserve", "reserved", "reserves", "reset",
    "residence", "resident", "residential", "residents", "resistance", "resistant", "resolution", "resolutions", "resolve", "resolved",
    "resort", "resorts", "resource", "resources", "respect", "respective", "respectively", "respiratory", "respond", "responded",
    "respondent", "respondents", "response", "responses", "responsibilities", "responsibility", "responsible", "rest", "restaurant", "restaurants",
    "restoration", "restore", "restricted", "restriction", "restrictions", "result", "resulted", "resulting", "results", "resume",
    "retail", "retailer", "retailers", "retain", "retention", "retired", "retirement", "retrieved", "retro", "return",
    "returned", "returning", "returns", "reunion", "reuters", "rev", "reveal", "revealed", "revenue", "revenues",
    "reverse", "review", "reviewed", "reviewer", "reviews", "revised", "revision", "revisions", "revolution", "reward",
    "rewards", "rf", "rfc", "rh", "rhode", "ri", "ribbon", "rica", "rice", "rich",
    "richard", "richmond", "rick", "rico", "rid", "ride", "rider", "ridge", "riding", "rigged",
    "rigging", "right", "rights", "rim", "ring", "rings", "ringtone", "ringtones", "rio", "rip",
    "ripe", "rise", "rising", "risk", "risks", "river", "rivers", "riverside", "rm", "rn",
    "rna", "road", "roads", "rob", "robert", "roberts", "robin", "robinson", "robot", "robust",
    "rochester", "rock", "rocket", "rocks", "rocky", "rod", "roger", "rogers", "role", "roles",
    "roll", "roller", "rolling", "rolls", "rom", "roman", "romance", "romania", "romantic", "rome",
    "ron", "ronald", "roof", "room", "rooms", "root", "roots", "rose", "roses", "ross",
    "roster", "rotate", "rotation", "rotoscope", "rotoscoped", "rotoscoping", "rough", "roulette", "round", "route",
    "router", "routers", "routes", "routine", "routing", "rover", "row", "rows", "roy", "royal",
    "royalty", "rpg", "rpm", "rr", "rrp", "rs", "rss", "rt", "rubber", "ruby",
    "rugby", "rugs", "rule", "rules", "ruling", "run", "rundown", "rundowns", "runner", "running",
    "runs", "rural", "rush", "russell", "russia", "russian", "ruth", "rv", "rw", "rx",
    "ryan", "s", "sa", "sacramento", "sacred", "sad", "saddam", "safari", "safe", "safely",
    "safety", "sage", "said", "sailing", "saint", "salad", "salary", "sale", "salem", "sales",
    "salmon", "salon", "salt", "salvador", "sam", "same", "samoa", "sample", "samples", "sampling",
    "samsung", "samuel", "san", "sand", "sandra", "sandy", "sansserif", "santa", "sap", "sara",
    "sarah", "saskatchewan", "sat", "satellite", "satisfaction", "satisfied", "satisfy", "saturation", "saturday", "sauce",
    "saudi", "save", "saved", "saver", "saving", "savings", "saw", "say", "saying", "says",
    "sb", "sc", "scale", "scales", "scan", "scanner", "scanners", "scanning", "scenario", "scene",
    "scenes", "schedule", "scheduled", "schedules", "scheduling", "scheme", "schemes", "scholars", "scholarship", "scholarships",
    "school", "schools", "sci", "science", "sciences", "scientific", "scientist", "scientists", "scope", "score",
    "scored", "scores", "scoring", "scotia", "scotland", "scott", "scottish", "scratch", "screen", "screening",
    "screens", "screenshot", "screenshots", "screw", "script", "scripting", "scripts", "scroll", "scrub", "scrubbing",
    "scsi", "sculpture", "sd", "se", "sea", "seafood", "seal", "sealed", "seamless", "sean",
    "search", "searched", "searches", "searching", "season", "seasonal", "seasons", "seat", "seating", "seats",
    "seattle", "sec", "second", "secondary", "seconds", "secret", "secretary", "secrets", "section", "sections",
    "sector", "sectors", "secure", "secured", "securities", "security", "see", "seed", "seeds", "seeing",
    "seek", "seeker", "seeking", "seeks", "seem", "seemed", "seems", "seen", "sees", "segment",
    "segments", "select", "selected", "selecting", "selection", "selections", "self", "sell", "seller", "sellers",
    "selling", "sells", "semester", "semi", "semiconductor", "seminar", "seminars", "senate", "senator", "send",
    "sender", "sending", "sends", "senior", "seniors", "sense", "sensitive", "sensitivity", "sensor", "sensors",
    "sent", "sentence", "seo", "sep", "separate", "separated", "separately", "separation", "sept", "september",
    "sequence", "sequences", "ser", "serial", "series", "serious", "seriously", "serve", "served", "server",
    "servers", "serves", "service", "services", "serving", "session", "sessions", "set", "sets", "setting",
    "settings", "settle", "settled", "settlement", "setup", "seven", "seventh", "several", "severe", "sex",
    "sexual", "sexy", "sf", "sg", "sh", "shadow", "shakespeare", "shall", "shanghai", "shape",
    "shaped", "shapes", "share", "shared", "shareholders", "shares", "shareware", "sharing", "sharon", "sharp",
    "sharpen", "shaved", "shaw", "she", "sheep", "sheet", "sheets", "sheffield", "shelf", "shell",
    "shelter", "shemale", "shield", "shift", "ship", "shipment", "shipped", "shipping", "ships", "shirt",
    "shirts", "shock", "shoe", "shoes", "shoot", "shooting", "shop", "shopper", "shoppers", "shopping",
    "shops", "shopzilla", "shore", "short", "shortly", "shorts", "shot", "shots", "should", "shoulder",
    "show", "showcase", "showed", "shower", "showers", "showing", "shown", "showopen", "shows", "showtimes",
    "shut", "shutter", "shuttle", "si", "sick", "side", "sides", "siemens", "sierra", "sight",
    "sigma", "sign", "signal", "signals", "signature", "signed", "significance", "significant", "significantly", "signing",
    "signs", "signup", "silence", "silent", "silicon", "silk", "silver", "sim", "similar", "similarly",
    "simon", "simple", "simply", "simpson", "sims", "simulation", "simulcast", "simultaneously", "sin", "since",
    "sing", "singapore", "singer", "singing", "single", "singles", "sink", "sir", "sister", "sisters",
    "sit", "site", "sitemap", "sites", "sitting", "situated", "situation", "situations", "six", "sixth",
    "size", "sized", "sizes", "sk", "ski", "skiing", "skill", "skilled", "skills", "skin",
    "skins", "skip", "skirt", "sku", "sky", "skype", "sl", "slate", "slates", "slave",
    "sleep", "sleeping", "sleeve", "slide", "slideshow", "slight", "slightly", "slim", "slip", "slot",
    "slots", "slovakia", "slovenia", "slow", "slowly", "sm", "small", "smaller", "smart", "smile",
    "smith", "smoke", "smoking", "smooth", "sms", "snake", "snap", "snapshot", "snow", "so",
    "soap", "soccer", "social", "societies", "society", "sociology", "socket", "socks", "sodium", "soft",
    "software", "soil", "sol", "solar", "solaris", "sold", "soldier", "soldiers", "sole", "solely",
    "solid", "solo", "solomon", "solution", "solutions", "solve", "solving", "some", "somebody",
    "somehow", "someone", "something", "sometimes", "somewhat", "somewhere", "son", "song", "songs", "sonic",
    "sons", "sony", "soon", "soonest", "sophisticated", "sorry", "sort", "sorted", "sots", "sought",
    "soul", "sound", "soundbite", "soundbites", "sounds", "soundtrack", "soup", "source", "sources", "south",
    "southeast", "southern", "southwest", "soviet", "sox", "sp", "spa", "space", "spaces", "spain",
    "spam", "span", "spanish", "spanking", "spare", "spatial", "speak", "speaker", "speakers", "speaking",
    "speaks", "spears", "spec", "special", "specialist", "specialists", "specialized", "specials", "specialty", "species",
    "specific", "specifically", "specification", "specifications", "specifics", "specified", "specify", "specs", "spectacular", "spectrum",
    "speech", "speed", "spell", "spelling", "spencer", "spend", "spending", "spent", "spice", "spider",
    "spin", "spirit", "spirits", "spiritual", "spirituality", "splice", "splices", "spline", "splines", "split",
    "spoke", "spoken", "sponsor", "sponsored", "sponsors", "sponsorship", "sport", "sporting", "sports", "spot",
    "spotlight", "spots", "spouse", "spray", "spread", "spring", "springfield", "springs", "sprint", "spy",
    "spyware", "sq", "sql", "squad", "square", "squirting", "sr", "src", "sri", "ss",
    "ssl", "st", "stability", "stable", "stack", "stadium", "staff", "staffing", "stage", "stages",
    "stainless", "stamp", "stamps", "stand", "standard", "standards", "standing", "stands", "stanford", "stanley",
    "star", "starring", "stars", "starsmerchant", "start", "started", "starter", "starting", "starts", "startup",
    "stat", "state", "stated", "statement", "statements", "states", "statewide", "static", "station", "stations",
    "statistical", "statistics", "stats", "status", "statute", "statutes", "statutory", "stay", "stayed", "staying",
    "std", "ste", "steady", "steam", "steel", "steering", "stem", "step", "stephen", "steps",
    "stereo", "sterling", "steve", "steven", "stevens", "stewart", "stick", "stickers", "still", "stock",
    "stockings", "stocks", "stolen", "stomach", "stone", "stones", "stood", "stop", "stopped", "stops",
    "storage", "store", "stored", "stores", "stories", "storm", "story", "straight", "strain", "strange",
    "strap", "strategic", "strategies", "strategy", "stream", "streaming", "streams", "street", "streets", "strength",
    "strengthen", "strengths", "stress", "stretch", "strict", "strictly", "strike", "string", "strings", "strip",
    "stroke", "strong", "stronger", "strongly", "struck", "struct", "structural", "structure", "structured", "structures",
    "struggle", "stuart", "stuck", "stud", "student", "students", "studied", "studies", "studio", "studios",
    "study", "studying", "stuff", "stunning", "stupid", "style", "styles", "stylish", "stylus", "su",
    "sub", "subcommittee", "subject", "subjects", "sublime", "sublimedirectory", "submission", "submissions", "submit", "submitted",
    "submitting", "subscribe", "subscriber", "subscribers", "subscription", "subscriptions", "subsection", "subsequent", "subsequently", "subsidiary",
    "substance", "substances", "substantial", "substantially", "substitute", "subtitle", "subtitles", "succeed", "success", "successful",
    "successfully", "such", "suck", "sucking", "sucks", "sudan", "suddenly", "sue", "suffer", "suffered",
    "suffering", "sufficient", "sugar", "suggest", "suggested", "suggestion", "suggestions", "suggests", "suicide", "suit",
    "suitable", "suite", "suites", "suits", "sullivan", "sum", "summary", "summer", "summit", "sun",
    "sunday", "sunglasses", "sunny", "sunset", "sunshine", "super", "superb", "superior", "supers", "supervision",
    "supervisor", "supplement", "supplements", "supplied", "supplier", "suppliers", "supplies", "supply", "support", "supported",
    "supporters", "supporting", "supports", "suppose", "supposed", "supreme", "sur", "sure", "surely", "surf",
    "surface", "surfaces", "surfing", "surgery", "surgical", "surplus", "surprise", "surprised", "surrounding", "surveillance",
    "survey", "surveys", "survival", "survive", "susan", "suse", "suspect", "suspended", "suspension", "sussex",
    "sustainable", "suzuki", "sw", "swap", "swatch", "swatches", "sweden", "swedish", "sweet", "swim",
    "swimming", "swing", "swingers", "swiss", "switch", "switches", "switching", "switzerland", "sword", "sydney",
    "symantec", "symbol", "symbols", "symposium", "symptoms", "syndicate", "syndicated", "syndication", "syndrome", "synopsis",
    "syntax", "synthesis", "synthetic", "syria", "sys", "system", "systems", "t", "ta", "tab",
    "table", "tables", "tablet", "tablets", "tabs", "tag", "tagged", "tags", "tail", "taiwan",
    "take", "taken", "takes", "taking", "tale", "talent", "tales", "talk", "talked", "talking",
    "talks", "tall", "tampa", "tan", "tank", "tanks", "tanzania", "tap", "tape", "tapes",
    "target", "targeted", "targets", "task", "tasks", "taste", "taught", "tax", "taxation", "taxes",
    "taxi", "taylor", "tc", "tcp", "td", "te", "tea", "teach", "teacher", "teachers",
    "teaching", "team", "teams", "tears", "tease", "teaser", "teasers", "tech", "technical", "technician",
    "technique", "techniques", "techno", "technological", "technologies", "technology", "ted", "tee", "teen", "teenage",
    "teens", "teeth", "tel", "telecom", "telecommunications", "telephone", "teleprompter", "television", "tell", "telling",
    "tells", "temp", "temperature", "temperatures", "template", "templates", "temple", "temporary", "ten", "tend",
    "tender", "tennessee", "tennis", "tension", "term", "terminal", "termination", "terms", "terrace", "terrible",
    "territories", "territory", "terror", "terrorism", "terrorist", "terrorists", "terry", "test", "testament", "tested",
    "testimonials", "testimony", "testing", "tests", "tex", "texas", "text", "textbooks", "texts", "tft",
    "tgp", "th", "thai", "thailand", "than", "thank", "thanks", "that", "thats", "the",
    "theater", "theaters", "theatre", "thee", "theft", "thehun", "their", "them", "theme", "themes",
    "themselves", "then", "theorem", "theoretical", "theories", "theory", "therapeutic", "therapy", "there", "thereby",
    "therefore", "thereof", "thermal", "thesaurus", "these", "thesis", "they", "thick", "thin", "thing",
    "things", "think", "thinking", "thinks", "third", "thirty", "this", "thomas", "thompson", "thomson",
    "thong", "thongs", "those", "thou", "though", "thought", "thoughts", "thousand", "thousands", "thread",
    "threaded", "threads", "threat", "threatened", "threats", "three", "threesome", "threshold", "throat", "through",
    "throughout", "throw", "throws", "thru", "thu", "thumb", "thumbnail", "thumbnails", "thumbs", "thumbzilla",
    "thursday", "thus", "thy", "ti", "ticker", "ticket", "tickets", "tie", "tied", "tier",
    "ties", "tiffany", "tiger", "tight", "tile", "till", "tilt", "tim", "timber", "time",
    "timeline", "timelines", "timely", "timer", "times", "timing", "timothy", "tin", "tint", "tiny",
    "tion", "tip", "tips", "tire", "tired", "tires", "tissue", "tit", "titans", "title",
    "titlecase", "titles", "tits", "titten", "tm", "tn", "to", "tobacco", "today", "todd",
    "toe", "together", "toilet", "tokyo", "told", "tolerance", "toll", "tom", "tommy", "tomorrow",
    "ton", "tone", "toner", "tones", "tongue", "tonight", "tons", "tony", "too", "took",
    "tool", "toolbar", "toolbox", "tools", "top", "topic", "topics", "topless", "tops", "toronto",
    "torture", "toshiba", "toss", "total", "totally", "totals", "touch", "tough", "tour", "tourism",
    "tourist", "tournament", "tournaments", "tours", "toward", "towards", "tower", "towers", "town", "towns",
    "township", "toxic", "toy", "toyota", "toys", "tp", "tr", "trace", "track", "trackback",
    "tracked", "tracker", "tracking", "tracks", "trade", "trademark", "trademarks", "trades", "trading", "tradition",
    "traditional", "traditions", "traffic", "trail", "trailer", "trailers", "trails", "train", "trained", "trainer",
    "training", "trains", "trance", "tranny", "trans", "transaction", "transactions", "transcode", "transcoding", "transcript",
    "transcription", "transexual", "transexuales", "transfer", "transferred", "transfers", "transform", "transformation", "transit", "transition",
    "transitions", "translate", "translated", "translation", "transmission", "transmitted", "transparent", "transport", "transportation", "trap",
    "trash", "travel", "traveler", "travelers", "traveling", "travesti", "tray", "treasure", "treasurer", "treasury",
    "treat", "treated", "treatment", "treatments", "treaty", "tree", "trees", "trek", "trembl", "trend",
    "trends", "treo", "tri", "trial", "trials", "triangle", "tribal", "tribe", "tribune", "tribute",
    "trick", "tricks", "tried", "tries", "trigger", "trim", "trinidad", "trinity", "trio", "trip",
    "tripadvisor", "triple", "trips", "trivia", "troops", "tropical", "trouble", "troy", "truck", "trucks",
    "true", "truly", "trunk", "trust", "trusted", "trustees", "truth", "try", "trying", "ts",
    "tt", "tu", "tub", "tube", "tubes", "tucson", "tue", "tuesday", "tuition", "tumor",
    "tune", "tuning", "tunnel", "turbo", "turkey", "turkish", "turn", "turned", "turner", "turning",
    "turns", "tutorial", "tutorials", "tv", "tvs", "twelve", "twenty", "twice", "twiki", "twin",
    "twinks", "twins", "twist", "two", "tx", "tyler", "type", "typeface", "typefaces", "types",
    "typical", "typically", "typographic", "u", "uc", "uganda", "ugly", "uk", "ukraine", "ultimate",
    "ultimately", "ultra", "um", "un", "unable", "unavailable", "uncertainty", "uncle", "und", "undefined",
    "under", "undergraduate", "underground", "underlying", "understand", "understanding", "understood", "undertaken", "underwear", "undo",
    "une", "unemployment", "unfortunately", "unified", "uniform", "union", "unions", "uniprotkb", "unique", "unit",
    "united", "units", "unity", "univ", "universal", "universe", "universities", "university", "unix", "unknown",
    "unless", "unlike", "unlikely", "unlimited", "unsigned", "unsubscribe", "until", "untitled", "unto", "unusual",
    "up", "upcoming", "update", "updated", "updates", "updating", "upgrade", "upgrades", "upload", "uploaded",
    "upon", "upper", "uppercase", "ups", "upskirt", "upskirts", "ur", "urban", "url", "uruguay",
    "urw", "us", "usa", "usage", "usb", "usc", "usd", "use", "used", "useful",
    "user", "username", "users", "uses", "using", "usr", "usual", "usually", "ut", "utah",
    "utc", "utilities", "utility", "utils", "uv", "v", "va", "vacation", "vacations", "vaccine",
    "vacuum", "val", "valentine", "valid", "validation", "valley", "valuable", "value", "values",
    "valve", "van", "vancouver", "var", "variable", "variables", "variation", "variations", "variety", "various",
    "vary", "vast", "vat", "vb", "vbulletin", "ve", "vector", "vectors", "vegas", "vegetable",
    "vegetables", "vehicle", "vehicles", "velocity", "vendor", "vendors", "venezuela", "venice", "venture", "venue",
    "venues", "ver", "verification", "verified", "verify", "verizon", "vermont", "verse", "version", "versions",
    "versus", "vertical", "very", "verzeichnis", "vessel", "vessels", "veteran", "veterans", "veterinary", "vhs",
    "vi", "via", "vibrator", "vibrators", "vic", "vice", "victim", "victims", "victor", "victoria",
    "victorian", "victory", "vid", "video", "videos", "vienna", "vietnam", "view", "viewed", "viewer",
    "viewing", "viewpicture", "views", "vignette", "vignettes", "vii", "villa", "village", "villas", "vincent",
    "vintage", "vinyl", "violation", "violations", "violence", "violent", "virgin", "virginia", "virtual", "virtually",
    "virus", "viruses", "visa", "visibility", "visible", "vision", "visit", "visited", "visiting", "visitor",
    "visitors", "visits", "vista", "visual", "vital", "vitamin", "vitamins", "vocal", "vocational", "voice",
    "voiceover", "voiceovers", "voices", "void", "voip", "vol", "volkswagen", "volleyball", "volt", "voltage",
    "volume", "volumes", "voluntary", "volunteer", "volunteers", "volvo", "von", "vote", "voted", "voters",
    "votes", "voting", "vp", "vs", "vt", "vulnerability", "vulnerable", "w", "wa", "wage",
    "wages", "wait", "waiting", "wake", "wal", "wales", "walk", "walked", "walker", "walking",
    "walks", "wall", "wallace", "wallpaper", "wallpapers", "walls", "walter", "wanna", "want", "wanted",
    "wanting", "wants", "war", "ward", "warehouse", "warm", "warner", "warning", "warnings", "warp",
    "warrant", "warranties", "warranty", "warren", "warrior", "wars", "was", "wash", "washing", "washington",
    "waste", "watch", "watched", "watches", "watching", "water", "waters", "watson", "watt", "watts",
    "wave", "waves", "way", "wayne", "ways", "we", "weak", "wealth", "weapon", "weapons",
    "wear", "wearing", "weather", "web", "webcam", "weblog", "webmaster", "webshots", "website", "websites",
    "webster", "wed", "wedding", "weddings", "wednesday", "week", "weekend", "weekends", "weekly", "weeks",
    "weight", "weird", "welcome", "welfare", "well", "wellington", "wellness", "wells", "welsh", "went",
    "were", "west", "western", "wet", "what", "whatever", "wheat", "wheel", "wheels", "when",
    "whenever", "where", "whereas", "whether", "which", "while", "whilst", "white", "whitebalance", "whitespace",
    "who", "whole", "wholesale", "whom", "whose", "why", "wi", "wichita", "wide", "widely",
    "wider", "widescreen", "width", "wife", "wifi", "wiki", "wikipedia", "wild", "wilderness", "wildlife",
    "will", "william", "williams", "willing", "wilson", "win", "wind", "window", "windows", "winds",
    "windsor", "wine", "wines", "wing", "wings", "winner", "winners", "winning", "wins", "winter",
    "wipe", "wipes", "wire", "wired", "wireless", "wisconsin", "wisdom", "wise", "wish", "wishes",
    "wishlist", "with", "withdrawal", "within", "without", "witness", "witnesses", "wizard", "wolf", "woman",
    "women", "womens", "won", "wonder", "wonderful", "wondering", "wood", "wooden", "woods", "wool",
    "word", "wordmark", "wordmarks", "wordpress", "words", "work", "worked", "worker", "workers", "workflow",
    "workflows", "workforce", "working", "workplace", "works", "workshop", "workshops", "world", "worlds", "worldsex",
    "worldwide", "worn", "worry", "worse", "worship", "worst", "worth", "would", "wow", "wp",
    "wrap", "wrestling", "wright", "write", "writer", "writers", "writes", "writing", "written", "wrong",
    "wrote", "ws", "wv", "www", "wy", "wyoming", "x", "xbox", "xheight", "xhtml",
    "xi", "xl", "xml", "xp", "xx", "y", "ya", "yahoo", "yamaha", "yard",
    "yards", "ye", "yeah", "year", "years", "yellow", "yes", "yesterday", "yet", "yield",
    "yn", "yo", "yoga", "york", "yorkshire", "you", "young", "younger", "your", "yours",
    "yourself", "youth", "yr", "yu", "z", "za", "zambia", "zdnet", "zealand", "zen",
    "zero", "zimbabwe", "zip", "zone", "zones", "zoning", "zoo", "zoom", "zope", "zum",
    "zus"
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
    filters: { ignoreHidden: false, ignoreLocked: false, selectedOnly: false, forceHighlightVisibility: false, disableGlobalHighlights: false },
    stats: { comps: 0, layers: 0, text: 0, expr: 0, effect: 0, name: 0, marker: 0, words: 0, errors: 0 },
    scanning: false,
    highlightsVisible: false,
    highlightedCompIds: {}
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
            // Dictionary/ sits right next to this .jsx file.
            var dictFolder = new Folder(scriptFolder + sep + "Dictionary");
            if (!dictFolder.exists) { try { dictFolder.create(); } catch (ce) {} }
            if (dictFolder.exists) {
                dictionaryData.dictionaryPath = dictFolder.fsName + sep;
                return dictionaryData.dictionaryPath;
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
    } else if (sessionState.scope === "selectedComps") {
        try {
            var projSel = app.project.selection;
            if (projSel) { for (var si = 0; si < projSel.length; si++) { if (projSel[si] instanceof CompItem) add(projSel[si]); } }
        } catch (e) {}
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

// ==================== VIEWER HIGHLIGHTING ====================
// Draws a red outline box around every layer that contains a spelling error,
// directly in the Composition viewer, using a non-rendering guide shape
// layer named HIGHLIGHT_LAYER_NAME (one per comp). This mirrors the on-canvas
// highlight feature of reference spellcheckers: it never touches the layers
// themselves, is excluded from render (guideLayer), and is fully cleared by
// the Clear button (doClearHighlights) or the next scan.
//
// The box is an axis-aligned bounding rectangle computed by walking the
// layer's parent chain and applying each ancestor's 2D transform (position,
// anchor point, scale, rotation) to the layer's sourceRectAtTime() corners.
// 3D tilt/z-position is intentionally ignored — this is a visual aid, not a
// precise render-space projection.

function affineTransformPoint(pt, anchor, position, scale, rotationDeg) {
    var rad = (rotationDeg || 0) * Math.PI / 180;
    var dx = (pt[0] - anchor[0]) * ((scale[0] || 100) / 100);
    var dy = (pt[1] - anchor[1]) * ((scale[1] || 100) / 100);
    var rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    var ry = dx * Math.sin(rad) + dy * Math.cos(rad);
    return [rx + position[0], ry + position[1]];
}

function valueAtTimeSafe(prop, t, fallback) {
    try { if (prop && prop.valueAtTime) return prop.valueAtTime(t, false); } catch (e) {}
    return fallback;
}

function getLayerCornersInComp(layer, t) {
    var rect;
    try { rect = layer.sourceRectAtTime(t, false); } catch (e) { return null; }
    if (!rect) return null;
    var corners = [
        [rect.left, rect.top],
        [rect.left + rect.width, rect.top],
        [rect.left + rect.width, rect.top + rect.height],
        [rect.left, rect.top + rect.height]
    ];
    var cur = layer, hops = 0;
    while (cur && hops < 12) {
        hops++;
        var anchor = valueAtTimeSafe(cur.anchorPoint, t, [0, 0]);
        var position = valueAtTimeSafe(cur.position, t, [0, 0]);
        var scale = valueAtTimeSafe(cur.scale, t, [100, 100]);
        var rotation = valueAtTimeSafe(cur.rotation, t, 0);
        for (var i = 0; i < corners.length; i++) {
            corners[i] = affineTransformPoint(corners[i], anchor, position, scale, rotation);
        }
        var parent = null;
        try { parent = cur.parent; } catch (e) { parent = null; }
        cur = parent;
    }
    return corners;
}

function boundingBoxFromCorners(corners, pad) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < corners.length; i++) {
        var p = corners[i];
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
    }
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    return [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]];
}

function findLayerByName(comp, name) {
    for (var i = 1; i <= comp.numLayers; i++) {
        var l;
        try { l = comp.layer(i); } catch (e) { continue; }
        if (l.name === name) return l;
    }
    return null;
}

function ensureHighlightLayer(comp) {
    var existing = findLayerByName(comp, HIGHLIGHT_LAYER_NAME);
    if (existing) { try { removeAllShapeGroups(existing); return existing; } catch (e) { try { existing.remove(); } catch (re) {} } }
    var shapeLayer = comp.layers.addShape();
    shapeLayer.name = HIGHLIGHT_LAYER_NAME;
    try { shapeLayer.guideLayer = true; } catch (e) {}
    try { shapeLayer.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0]); } catch (e) {}
    try { shapeLayer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]); } catch (e) {}
    return shapeLayer;
}

function removeAllShapeGroups(shapeLayer) {
    var contents = shapeLayer.property("ADBE Root Vectors Group");
    if (!contents) return;
    for (var i = contents.numProperties; i >= 1; i--) {
        try { contents.property(i).remove(); } catch (e) {}
    }
}

function addHighlightRect(shapeLayer, corners, colorRGB, label) {
    try {
        var contents = shapeLayer.property("ADBE Root Vectors Group");
        var group = contents.addProperty("ADBE Vector Group");
        group.name = label || "Highlight";
        var groupContents = group.property("ADBE Vectors Group");
        var pathProp = groupContents.addProperty("ADBE Vector Shape - Group");
        var shape = new Shape();
        shape.vertices = corners;
        shape.inTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
        shape.outTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
        shape.closed = true;
        pathProp.property("ADBE Vector Shape").setValue(shape);
        var strokeProp = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        strokeProp.property("ADBE Vector Stroke Color").setValue(colorRGB);
        strokeProp.property("ADBE Vector Stroke Width").setValue(2);
        return true;
    } catch (e) { return false; }
}

function collectErroredLayersByComp() {
    var byComp = {};
    if (!sessionState.errors) return byComp;
    for (var lower in sessionState.errors) {
        if (!sessionState.errors.hasOwnProperty(lower)) continue;
        var err = sessionState.errors[lower];
        for (var i = 0; i < err.locations.length; i++) {
            var f = err.locations[i].finding;
            if (!f.layer || !f.comp) continue;
            var cid = f.comp.id;
            if (!byComp[cid]) byComp[cid] = { comp: f.comp, layers: {} };
            byComp[cid].layers[f.layerIndex] = f.layer;
        }
    }
    return byComp;
}

function clearHighlightsInComp(comp) {
    var existing;
    while ((existing = findLayerByName(comp, HIGHLIGHT_LAYER_NAME))) {
        try { existing.remove(); } catch (e) { break; }
    }
}

function clearAllHighlights() {
    if (!app.project) return;
    for (var i = 1; i <= app.project.numItems; i++) {
        var item;
        try { item = app.project.item(i); } catch (e) { continue; }
        if (item instanceof CompItem) { try { clearHighlightsInComp(item); } catch (e2) {} }
    }
    sessionState.highlightedCompIds = {};
}

function generateHighlights(forceVisibility) {
    clearAllHighlights();
    if (!app.project) return 0;
    var byComp = collectErroredLayersByComp();
    var count = 0;
    for (var cid in byComp) {
        if (!byComp.hasOwnProperty(cid)) continue;
        var entry = byComp[cid];
        var comp = entry.comp;
        try {
            var shapeLayer = ensureHighlightLayer(comp);
            var t = comp.time;
            for (var li in entry.layers) {
                if (!entry.layers.hasOwnProperty(li)) continue;
                var layer = entry.layers[li];
                try {
                    if (forceVisibility) { try { layer.enabled = true; } catch (e0) {} }
                    else { try { if (layer.enabled === false) continue; } catch (e1) {} }
                    var corners = getLayerCornersInComp(layer, t);
                    if (!corners) continue;
                    var box = boundingBoxFromCorners(corners, 6);
                    if (addHighlightRect(shapeLayer, box, [1, 0.28, 0.28], layer.name)) count++;
                } catch (e3) {}
            }
            sessionState.highlightedCompIds[cid] = true;
        } catch (e4) {}
    }
    sessionState.highlightsVisible = true;
    return count;
}

function toggleHighlightVisibility() {
    if (!app.project) return sessionState.highlightsVisible;
    var newState = !sessionState.highlightsVisible;
    for (var i = 1; i <= app.project.numItems; i++) {
        var item;
        try { item = app.project.item(i); } catch (e) { continue; }
        if (!(item instanceof CompItem)) continue;
        var l = findLayerByName(item, HIGHLIGHT_LAYER_NAME);
        if (l) { try { l.enabled = newState; } catch (e2) {} }
    }
    sessionState.highlightsVisible = newState;
    return newState;
}

// ============================================================================
// IN-PROCESS API — plain functions calling straight into the engine above.
// No CEP, no evalScript, no JSON serialization: this script and the engine
// run in the same ExtendScript context, so the ScriptUI panel below calls
// these directly and gets real objects back.
// ============================================================================

function doGetInfo() {
    return { appName: APP_NAME, version: VERSION, author: AUTHOR, hasProject: !!app.project };
}

function doReplace(lower, newWord) {
    var err = sessionState.errors ? sessionState.errors[lower] : null;
    if (!err) return { ok: false, error: "Word not found in current scan." };
    var replaced = 0, failed = 0;
    app.beginUndoGroup("Motion Spell Checker: Replace \"" + err.word + "\"");
    for (var i = 0; i < err.locations.length; i++) {
        var r = applyCorrection(err.locations[i].finding, err.word, newWord);
        if (r.success) replaced += r.count; else failed++;
    }
    app.endUndoGroup();
    return { ok: replaced > 0, replaced: replaced, failed: failed, word: err.word, newWord: newWord };
}

function doIgnore(lower) {
    sessionState.ignoredWords[lower] = true;
    persistIgnoredWord(lower);
    return { ok: true, lower: lower };
}

function doAddToDictionary(lower) {
    sessionState.customWords[lower] = true;
    dictionaryData.words[lower] = true;
    persistCustomWord(lower);
    return { ok: true, lower: lower };
}

function doReveal(lower, index) {
    var err = sessionState.errors ? sessionState.errors[lower] : null;
    if (!err || !err.locations[index]) return { ok: false, error: "Location not found." };
    return { ok: navigateToLocation(err.locations[index]) };
}

function doUndo() {
    try {
        var id = app.findMenuCommandId("Undo");
        if (id) app.executeCommand(id);
        return { ok: true };
    } catch (e) { return { ok: false, error: e.toString() }; }
}

function doClearHighlights() {
    app.beginUndoGroup("Motion Spell Checker: Clear Highlights");
    clearAllHighlights();
    sessionState.highlightsVisible = false;
    app.endUndoGroup();
    return { ok: true };
}

// ============================================================================
// UI CONSTRUCTION
// ============================================================================

function buildUI(thisObj) {
    var pal = (thisObj instanceof Panel) ? thisObj :
        new Window("palette", "Motion Spell Checker", undefined, { resizeable: true });

    pal.orientation = "column";
    pal.alignChildren = ["fill", "top"];
    pal.margins = 10;
    pal.spacing = 6;

    if (pal instanceof Window) {
        pal.preferredSize = [460, 760];
        pal.minimumSize = [380, 520];
    }

    // ---------------- Header ----------------
    var header = pal.add("group");
    header.orientation = "row";
    header.alignment = ["fill", "top"];
    var title = header.add("statictext", undefined, APP_NAME);
    try { title.graphics.font = ScriptUI.newFont("dialog", "bold", 13); } catch (e) {}
    var byline = header.add("statictext", undefined, "by " + AUTHOR + " · v" + VERSION);
    try { byline.graphics.font = ScriptUI.newFont("dialog", "italic", 9); } catch (e) {}
    header.add("statictext", undefined, "").alignment = ["fill", "top"];
    var btnVerifyDict = header.add("button", undefined, "Verify Dictionary");
    btnVerifyDict.preferredSize = [-1, 22];
    var btnHelp = header.add("button", undefined, "?");
    btnHelp.preferredSize = [24, 22];

    // ---------------- Toolbar ----------------
    var toolbarFields = pal.add("group");
    toolbarFields.orientation = "row";
    toolbarFields.alignChildren = ["fill", "center"];
    toolbarFields.spacing = 8;

    var scopeGroup = toolbarFields.add("group");
    scopeGroup.orientation = "row";
    scopeGroup.alignment = ["fill", "center"];
    scopeGroup.add("statictext", undefined, "Scope");
    var ddlScope = scopeGroup.add("dropdownlist", undefined, ["Active Comp", "Entire Project", "Selected Layers", "Selected Comps"]);
    ddlScope.selection = 0;
    ddlScope.alignment = ["fill", "center"];

    var filterGroup = toolbarFields.add("group");
    filterGroup.orientation = "row";
    filterGroup.alignment = ["fill", "center"];
    filterGroup.add("statictext", undefined, "Filter");
    var ddlFilter = filterGroup.add("dropdownlist", undefined, ["All", "Text", "Expressions", "Effects", "Markers", "Names"]);
    ddlFilter.selection = 0;
    ddlFilter.alignment = ["fill", "center"];
    var FILTER_VALUES = ["all", "text", "expression", "effect", "marker", "name"];
    var SCOPE_VALUES = ["active", "project", "selected", "selectedComps"];

    var toolbarActions = pal.add("group");
    toolbarActions.orientation = "row";
    toolbarActions.spacing = 6;
    var btnSettings = toolbarActions.add("button", undefined, "Settings…");
    toolbarActions.add("statictext", undefined, "").alignment = ["fill", "top"];
    var btnClear = toolbarActions.add("button", undefined, "Clear");
    var btnScan = toolbarActions.add("button", undefined, "Scan");
    btnScan.preferredSize = [-1, 26];

    var matchRow = pal.add("group");
    matchRow.orientation = "row";
    matchRow.spacing = 14;
    var cbIgnoreCaps = matchRow.add("checkbox", undefined, "Ignore ALL-CAPS");
    cbIgnoreCaps.value = true;
    var cbSkipNumbers = matchRow.add("checkbox", undefined, "Skip words with numbers");
    cbSkipNumbers.value = true;
    var cbSmartMatch = matchRow.add("checkbox", undefined, "Smart word matching");
    cbSmartMatch.value = true;

    // ---------------- Settings state (set via the Settings dialog) ----------------
    var settings = {
        ignoreHidden: false, ignoreLocked: false, selectedOnly: false,
        forceHighlightVisibility: false, disableGlobalHighlights: false
    };

    // ---------------- Status line ----------------
    var statusLine = pal.add("group");
    statusLine.orientation = "row";
    statusLine.alignChildren = ["left", "center"];
    var statusText = statusLine.add("statictext", undefined, "Ready — choose a scope and click Scan.");
    statusText.alignment = ["fill", "center"];
    var statsText = statusLine.add("statictext", undefined, "Comps 0  Words 0  Errors 0");
    try { statsText.graphics.font = ScriptUI.newFont("dialog", "regular", 10); } catch (e) {}

    function setStatus(msg) { statusText.text = msg; try { pal.update(); } catch (e) {} }

    // ---------------- Results ----------------
    var results = pal.add("group");
    results.orientation = "row";
    results.alignment = ["fill", "fill"];
    results.alignChildren = ["fill", "fill"];
    results.spacing = 8;

    var leftPane = results.add("group");
    leftPane.orientation = "column";
    leftPane.alignChildren = ["fill", "top"];
    leftPane.alignment = ["fill", "fill"];
    leftPane.preferredSize = [-1, -1];
    var wordsLabel = leftPane.add("statictext", undefined, "Misspelled words");
    wordsLabel.justify = "left";
    try { wordsLabel.graphics.font = ScriptUI.newFont("dialog", "bold", 10); } catch (e) {}
    var lstWords = leftPane.add("listbox", undefined, []);
    lstWords.alignment = ["fill", "fill"];

    var rightPane = results.add("group");
    rightPane.orientation = "column";
    rightPane.alignChildren = ["fill", "top"];
    rightPane.alignment = ["fill", "fill"];
    rightPane.preferredSize = [-1, -1];

    var locLabel = rightPane.add("statictext", undefined, "Locations");
    locLabel.justify = "left";
    try { locLabel.graphics.font = ScriptUI.newFont("dialog", "bold", 10); } catch (e) {}
    var lstLocations = rightPane.add("listbox", undefined, []);
    lstLocations.alignment = ["fill", "top"];
    lstLocations.preferredSize = [-1, 110];

    var btnReveal = rightPane.add("button", undefined, "Reveal in Timeline");
    btnReveal.alignment = ["fill", "top"];

    var suggLabel = rightPane.add("statictext", undefined, "Suggestions");
    suggLabel.justify = "left";
    try { suggLabel.graphics.font = ScriptUI.newFont("dialog", "bold", 10); } catch (e) {}
    var lstSuggestions = rightPane.add("listbox", undefined, []);
    lstSuggestions.alignment = ["fill", "top"];
    lstSuggestions.preferredSize = [-1, 90];

    var replaceRow = rightPane.add("group");
    replaceRow.orientation = "row";
    replaceRow.alignChildren = ["fill", "center"];
    replaceRow.alignment = ["fill", "top"];
    var txtReplacement = replaceRow.add("edittext", undefined, "");
    txtReplacement.alignment = ["fill", "center"];
    txtReplacement.helpTip = "Pick a suggestion above, or type your own replacement.";

    var actionRow1 = rightPane.add("group");
    actionRow1.orientation = "row";
    actionRow1.alignment = ["fill", "top"];
    actionRow1.spacing = 4;
    var btnReplace = actionRow1.add("button", undefined, "Replace");
    btnReplace.alignment = ["fill", "top"];
    var btnUndo = actionRow1.add("button", undefined, "Undo");
    btnUndo.preferredSize = [50, -1];

    var actionRow2 = rightPane.add("group");
    actionRow2.orientation = "row";
    actionRow2.alignment = ["fill", "top"];
    actionRow2.spacing = 4;
    var btnIgnore = actionRow2.add("button", undefined, "Ignore");
    btnIgnore.alignment = ["fill", "top"];
    var btnAddDict = actionRow2.add("button", undefined, "+ Dictionary");
    btnAddDict.alignment = ["fill", "top"];

    // ---------------- State ----------------
    var state = { scanned: false, words: [], selectedLower: null };

    function currentFilterKey() { return FILTER_VALUES[ddlFilter.selection ? ddlFilter.selection.index : 0]; }

    function wordMatchesFilter(w) {
        var f = currentFilterKey();
        if (f === "all") return true;
        for (var i = 0; i < w.locations.length; i++) {
            var st = w.locations[i].sourceType;
            if (f === "name" && (st === "layerName" || st === "compName")) return true;
            if (st === f) return true;
        }
        return false;
    }

    function findWord(lower) {
        for (var i = 0; i < state.words.length; i++) { if (state.words[i].lower === lower) return state.words[i]; }
        return null;
    }

    function renderWordsList() {
        lstWords.removeAll();
        var visible = [];
        for (var i = 0; i < state.words.length; i++) { if (wordMatchesFilter(state.words[i])) visible.push(state.words[i]); }
        wordsLabel.text = visible.length > 0 ? "Misspelled words (" + visible.length + ")" : "Misspelled words";

        if (!state.scanned) {
            lstWords.add("item", "No scan yet — choose a scope and click Scan.");
            lstWords.enabled = false;
            return;
        }
        lstWords.enabled = true;
        if (visible.length === 0) {
            lstWords.add("item", "No spelling issues found.");
            lstWords.enabled = false;
            return;
        }
        for (var v = 0; v < visible.length; v++) {
            var w = visible[v];
            lstWords.add("item", (v + 1) + ".  " + w.word + "   (" + w.count + ")");
        }
        if (!state.selectedLower || !findWord(state.selectedLower) || !wordMatchesFilter(findWord(state.selectedLower))) {
            state.selectedLower = visible[0].lower;
        }
        for (var s = 0; s < visible.length; s++) {
            if (visible[s].lower === state.selectedLower) { lstWords.selection = s; break; }
        }
        renderDetail();
    }

    function clearDetail() {
        lstLocations.removeAll();
        lstSuggestions.removeAll();
        txtReplacement.text = "";
    }

    function sourceLabel(t) {
        if (t === "text") return "Text";
        if (t === "expression") return "Expression";
        if (t === "effect") return "Effect";
        if (t === "marker") return "Marker";
        if (t === "layerName") return "Layer name";
        if (t === "compName") return "Comp name";
        return t || "";
    }

    function renderDetail() {
        clearDetail();
        var w = findWord(state.selectedLower);
        if (!w) return;

        locLabel.text = "Locations (" + w.locations.length + ")";
        for (var i = 0; i < w.locations.length; i++) {
            lstLocations.add("item", "[" + sourceLabel(w.locations[i].sourceType) + "]  " + w.locations[i].label);
        }
        if (w.locations.length > 0) lstLocations.selection = 0;

        suggLabel.text = w.suggestions.length > 0 ? "Suggestions (" + w.suggestions.length + ")" : "Suggestions";
        for (var s = 0; s < w.suggestions.length; s++) { lstSuggestions.add("item", w.suggestions[s]); }
        if (w.suggestions.length > 0) { lstSuggestions.selection = 0; txtReplacement.text = w.suggestions[0]; }
        else { txtReplacement.text = ""; }
    }

    function removeWordFromState(lower) {
        var next = [];
        for (var i = 0; i < state.words.length; i++) { if (state.words[i].lower !== lower) next.push(state.words[i]); }
        state.words = next;
        if (state.selectedLower === lower) state.selectedLower = null;
        renderWordsList();
    }

    lstWords.onChange = function () {
        var visible = [];
        for (var i = 0; i < state.words.length; i++) { if (wordMatchesFilter(state.words[i])) visible.push(state.words[i]); }
        var idx = lstWords.selection ? lstWords.selection.index : -1;
        if (idx >= 0 && visible[idx]) { state.selectedLower = visible[idx].lower; renderDetail(); }
    };

    lstSuggestions.onChange = function () {
        if (lstSuggestions.selection) txtReplacement.text = lstSuggestions.selection.text;
    };

    ddlFilter.onChange = function () { renderWordsList(); };

    // ---------------- Scan ----------------
    function gatherScanParams() {
        return {
            scope: SCOPE_VALUES[ddlScope.selection ? ddlScope.selection.index : 0],
            filter: currentFilterKey(),
            ignoreHidden: settings.ignoreHidden,
            ignoreLocked: settings.ignoreLocked,
            selectedOnly: settings.selectedOnly,
            ignoreAllCaps: cbIgnoreCaps.value,
            skipNumbers: cbSkipNumbers.value,
            smartMatching: cbSmartMatch.value,
            forceHighlightVisibility: settings.forceHighlightVisibility,
            disableGlobalHighlights: settings.disableGlobalHighlights
        };
    }

    function runScanUI() {
        if (!app.project) { setStatus("Open an After Effects project first."); return; }
        setStatus("Scanning…");
        try { pal.update(); } catch (e) {}

        var res = runScan(gatherScanParams());
        if (!res.ok) { setStatus(res.error || "Scan failed."); return; }

        state.scanned = true;
        state.words = res.words || [];
        state.selectedLower = null;
        statsText.text = "Comps " + res.stats.comps + "  Words " + res.stats.words + "  Errors " + res.stats.errors;
        renderWordsList();

        var scopeLabel = res.scope === "project" ? "project" :
            (res.scope === "selected" ? "selected layers" :
            (res.scope === "selectedComps" ? "selected comps" : "active comp"));

        if (res.compsScanned === 0) {
            var noneMsg = res.scope === "selected" ? "select some layers first" :
                (res.scope === "selectedComps" ? "select comp(s) in the Project panel first" : "no compositions found");
            setStatus("Nothing to scan — " + noneMsg);
        } else if (state.words.length === 0) {
            setStatus("Clean — " + res.stats.words + " words across " + res.compsScanned + " comp(s), no issues.");
        } else {
            var hlNote = res.highlightCount ? (" · " + res.highlightCount + " layer(s) highlighted") : "";
            setStatus("Found " + state.words.length + " issue(s) in " + scopeLabel + hlNote + ".");
        }
        if (res.usingFallbackOnly) {
            setStatus("Using built-in fallback dictionary only (" + res.fallbackWordCount + " words). Add category .txt files to /Dictionary/.");
        }
    }

    btnScan.onClick = function () { runScanUI(); };

    btnClear.onClick = function () {
        state.scanned = false;
        state.words = [];
        state.selectedLower = null;
        statsText.text = "Comps 0  Words 0  Errors 0";
        renderWordsList();
        clearDetail();
        setStatus("Cleared — ready to scan.");
        doClearHighlights();
    };

    btnReveal.onClick = function () {
        if (!state.selectedLower) { setStatus("Select a misspelled word first."); return; }
        var idx = lstLocations.selection ? lstLocations.selection.index : 0;
        var res = doReveal(state.selectedLower, idx);
        if (!res.ok) setStatus(res.error || "Could not reveal location.");
    };

    btnReplace.onClick = function () {
        if (!state.selectedLower) { setStatus("Select a misspelled word first."); return; }
        var newWord = trimString(txtReplacement.text);
        if (!newWord) { setStatus("Type or pick a replacement first."); return; }
        var w = findWord(state.selectedLower);
        var res = doReplace(state.selectedLower, newWord);
        if (res.ok) {
            setStatus("Replaced \"" + res.word + "\" with \"" + res.newWord + "\" (" + res.replaced + " instance(s)).");
            removeWordFromState(w.lower);
        } else {
            setStatus(res.error || ("Could not replace \"" + (w ? w.word : state.selectedLower) + "\"."));
        }
    };

    btnUndo.onClick = function () {
        var res = doUndo();
        setStatus(res.ok ? "Undid last change." : (res.error || "Nothing to undo."));
    };

    btnIgnore.onClick = function () {
        if (!state.selectedLower) { setStatus("Select a misspelled word first."); return; }
        var lower = state.selectedLower;
        doIgnore(lower);
        setStatus("Ignored \"" + lower + "\" (saved to ignoredWords.txt).");
        removeWordFromState(lower);
    };

    btnAddDict.onClick = function () {
        if (!state.selectedLower) { setStatus("Select a misspelled word first."); return; }
        var lower = state.selectedLower;
        doAddToDictionary(lower);
        setStatus("Added \"" + lower + "\" to custom dictionary.");
        removeWordFromState(lower);
    };

    // ---------------- Settings dialog ----------------
    btnSettings.onClick = function () {
        var dlg = new Window("dialog", "Scan Settings");
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.margins = 14;
        dlg.spacing = 10;
        dlg.preferredSize = [320, -1];

        var filtersPanel = dlg.add("panel", undefined, "Layer filters");
        filtersPanel.orientation = "column";
        filtersPanel.alignChildren = ["left", "top"];
        filtersPanel.margins = 10;
        var cbIgnoreHidden = filtersPanel.add("checkbox", undefined, "Ignore hidden layers");
        cbIgnoreHidden.value = settings.ignoreHidden;
        var cbIgnoreLocked = filtersPanel.add("checkbox", undefined, "Ignore locked layers");
        cbIgnoreLocked.value = settings.ignoreLocked;
        var cbSelectedOnly = filtersPanel.add("checkbox", undefined, "Selected layers only");
        cbSelectedOnly.value = settings.selectedOnly;

        var hlPanel = dlg.add("panel", undefined, "Highlight in viewer");
        hlPanel.orientation = "column";
        hlPanel.alignChildren = ["left", "top"];
        hlPanel.margins = 10;
        var cbForceHighlight = hlPanel.add("checkbox", undefined, "Force highlight visibility");
        cbForceHighlight.value = settings.forceHighlightVisibility;
        var cbDisableHighlights = hlPanel.add("checkbox", undefined, "Disable global highlights (faster)");
        cbDisableHighlights.value = settings.disableGlobalHighlights;
        var hlNote = hlPanel.add("statictext", undefined,
            "Draws a red outline around every layer with a misspelling, on a\nnon-rendering guide layer. Never touches your actual layers.",
            { multiline: true });
        try { hlNote.graphics.font = ScriptUI.newFont("dialog", "italic", 9); } catch (e) {}

        var btnToggleHl = dlg.add("button", undefined, "Toggle Highlight Visibility");

        var scanRow = dlg.add("group");
        scanRow.orientation = "column";
        scanRow.alignChildren = ["fill", "top"];
        scanRow.spacing = 6;
        var btnScanActive = scanRow.add("button", undefined, "Scan Active Comp");
        var btnScanSelectedComps = scanRow.add("button", undefined, "Scan Selected Comps");

        var closeRow = dlg.add("group");
        closeRow.orientation = "row";
        closeRow.alignment = ["center", "top"];
        var btnClose = closeRow.add("button", undefined, "Close", { name: "ok" });

        function saveSettings() {
            settings.ignoreHidden = cbIgnoreHidden.value;
            settings.ignoreLocked = cbIgnoreLocked.value;
            settings.selectedOnly = cbSelectedOnly.value;
            settings.forceHighlightVisibility = cbForceHighlight.value;
            settings.disableGlobalHighlights = cbDisableHighlights.value;
        }

        btnToggleHl.onClick = function () {
            var visible = toggleHighlightVisibility();
            setStatus(visible ? "Highlights shown in the comp." : "Highlights hidden.");
        };

        btnScanActive.onClick = function () {
            saveSettings();
            ddlScope.selection = 0;
            dlg.close();
            runScanUI();
        };

        btnScanSelectedComps.onClick = function () {
            saveSettings();
            ddlScope.selection = 3;
            dlg.close();
            runScanUI();
        };

        btnClose.onClick = function () { saveSettings(); dlg.close(); };

        dlg.center();
        dlg.show();
    };

    // ---------------- Verify Dictionary dialog ----------------
    btnVerifyDict.onClick = function () {
        setStatus("Checking dictionaries…");
        var r = verifyDictionaries();

        var dlg = new Window("dialog", "Dictionary Status");
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.margins = 14;
        dlg.spacing = 8;
        dlg.preferredSize = [560, 520];

        var summary = dlg.add("statictext", undefined,
            "Loaded: " + r.loaded + "   Missing: " + r.missing + "   Empty: " + r.empty + "   Errors: " + r.error);
        summary.justify = "left";
        try { summary.graphics.font = ScriptUI.newFont("dialog", "bold", 11); } catch (e) {}

        var pathText = dlg.add("statictext", undefined, "Folder: " + r.dictionaryPath, { multiline: true });
        pathText.justify = "left";
        var totalsText = dlg.add("statictext", undefined,
            "Fallback list: " + r.fallbackWords + " words · Custom dictionary: " + r.customWords +
            " words · Category files: " + r.fileWords + " words / " + r.fileCorrections + " corrections",
            { multiline: true });
        totalsText.justify = "left";

        var lines = [];
        for (var i = 0; i < r.categories.length; i++) {
            var c = r.categories[i];
            var icon = c.status === "loaded" ? "✓" : (c.status === "missing" ? "⚠" : (c.status === "empty" ? "○" : "✖"));
            var detail = c.status === "loaded" ? (c.words + "w / " + c.corrections + "c") : c.status;
            lines.push(icon + "  " + c.name.replace(/_/g, " ") + "  —  " + detail + (c.note ? " (" + c.note + ")" : ""));
        }

        var report = dlg.add("edittext", undefined, lines.join("\n"), { multiline: true, scrolling: true, readonly: true });
        report.alignment = ["fill", "fill"];
        report.preferredSize = [-1, 380];

        var btnClose = dlg.add("button", undefined, "Close", { name: "ok" });
        btnClose.alignment = ["center", "top"];

        dlg.center();
        dlg.show();
        setStatus("Ready.");
    };

    // ---------------- Help dialog ----------------
    btnHelp.onClick = function () {
        var dlg = new Window("dialog", APP_NAME + " — Help");
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.margins = 16;
        dlg.spacing = 10;
        dlg.preferredSize = [520, 560];

        var helpContent =
            "SCANNING\n" +
            "Pick a scope (Active Comp, Entire Project, Selected Layers, or Selected\n" +
            "Comps) and click Scan — or open Settings for one-click \"Scan Active\n" +
            "Comp\" / \"Scan Selected Comps\" buttons. Reads layer names, text layers,\n" +
            "marker comments, string effect parameters, and quoted string literals\n" +
            "inside expressions.\n\n" +
            "WORD MATCHING\n" +
            "Ignore ALL-CAPS, Skip words with numbers, and Smart word matching\n" +
            "(also accepts plurals/tenses of a known word) are always visible above.\n\n" +
            "SETTINGS\n" +
            "Restrict which layers are scanned (hidden, locked, selected-only), and\n" +
            "control on-canvas highlighting: \"Force highlight visibility\" temporarily\n" +
            "shows hidden layers that contain errors, \"Disable global highlights\n" +
            "(faster)\" skips drawing highlights entirely for large projects.\n\n" +
            "HIGHLIGHTING IN THE COMP\n" +
            "After a scan, every layer with a spelling error gets a red outline drawn\n" +
            "directly in the Composition viewer, on a non-rendering guide layer\n" +
            "named \"MSC Highlights\" — it never modifies your actual layers. Toggle\n" +
            "it from Settings, or clear it with Clear.\n\n" +
            "FIXING A WORD\n" +
            "Select a misspelled word on the left, review where it appears, then\n" +
            "either pick a suggestion and click Replace (fixes every occurrence),\n" +
            "click Ignore (skips it this session, saves to ignoredWords.txt), or\n" +
            "click + Dictionary to whitelist it permanently.\n\n" +
            "DICTIONARY FILES\n" +
            "Drop category word lists (one word per line, or \"wrong -> right\"\n" +
            "correction lines) into a \"Dictionary\" folder next to this script for\n" +
            "coverage beyond the built-in fallback list. Use Verify Dictionary to\n" +
            "see what's currently loaded.\n\n" +
            "INSTALLING\n" +
            "Copy this .jsx file into Scripts/ScriptUI Panels/ for a dockable panel\n" +
            "under Window > " + APP_NAME + ", or run it once via File > Scripts >\n" +
            "Run Script File… for a floating window. No signing, no debug mode.";

        var helpText = dlg.add("edittext", undefined, helpContent, { multiline: true, scrolling: true, readonly: true });
        helpText.alignment = ["fill", "fill"];
        helpText.preferredSize = [-1, 460];

        var btnOK = dlg.add("button", undefined, "OK", { name: "ok" });
        btnOK.alignment = ["center", "top"];

        dlg.center();
        dlg.show();
    };

    // ---------------- Layout / show ----------------
    function layoutUI() {
        try { pal.layout.layout(true); pal.layout.resize(); } catch (e) {}
    }
    layoutUI();

    if (pal instanceof Window) {
        pal.onResizing = pal.onResize = function () { try { this.layout.resize(); } catch (e) {} };
        pal.center();
        pal.show();
    } else {
        pal.onResize = function () { try { this.layout.resize(); } catch (e) {} };
    }

    renderWordsList();
    var info = doGetInfo();
    if (!info.hasProject) setStatus("Open an After Effects project to get started.");

    return pal;
}

// ==================== INITIALIZE ====================
try {
    logMessage("=== " + APP_NAME + " v" + VERSION + " initializing (standalone .jsx) ===");
    buildUI(thisObj);
    logMessage("=== UI loaded ===");
} catch (e) {
    try { alert("Motion Spell Checker — Fatal Error:\n" + e.toString()); } catch (e2) {}
    logMessage("FATAL ERROR: " + e.toString());
}

})(this);
