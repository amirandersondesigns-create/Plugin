/*
 * Line icon set (16×16 grid, 1.5px stroke, currentColor). Paths only —
 * AT.icon(name) wraps them in an <svg>.
 */
(function (AT) {
    "use strict";

    var P = {
        home: "M2.5 7.5 8 3l5.5 4.5M4 6.5V13h3v-3h2v3h3V6.5",
        animate: "M2 12c2.5 0 3-8 6-8s3.5 8 6 8M2 12h12",
        easing: "M2.5 13.5C7 13.5 9 2.5 13.5 2.5M2.5 2.5v11h11",
        text: "M3 4V3h10v1M8 3v10M6 13h4",
        camera: "M2 5.5h8.5v6H2zM10.5 7.5l3.5-2v6l-3.5-2",
        capture: "M2 5h2.5L6 3.5h4L11.5 5H14v8H2zM8 11a2.2 2.2 0 1 0 0-4.4A2.2 2.2 0 0 0 8 11z",
        star: "M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4l-3.6 1.9.7-4L2.2 6.5l4-.6z",
        learn: "M2 4.5 8 2l6 2.5L8 7zM4.5 5.8v3.4c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5V5.8M14 4.5v4",
        search: "M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM10.6 10.6 14 14",
        info: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM8 7.2v4M8 4.8v.4",
        check: "M3 8.5 6.5 12 13 4.5",
        close: "M4 4l8 8M12 4l-8 8",
        plus: "M8 3v10M3 8h10",
        chevron: "M4 6l4 4 4-4",
        linkedin: "M2.5 2.5h11v11h-11zM5 7v4.5M5 4.8v.4M7.5 11.5V7M7.5 9c0-1.2.8-2 1.8-2s1.7.7 1.7 2v2.5",
        play: "M5 3.5v9l7-4.5z",
        anchor: "M8 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 5.5V14M5 8h6M3 10c0 2.2 2.2 4 5 4s5-1.8 5-4",
        key: "M8 2.5 13.5 8 8 13.5 2.5 8z",
        trash: "M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 9h5.6l.7-9",
        reverse: "M3 5.5h8.5l-2-2M13 10.5H4.5l2 2",
        stagger: "M2 3.5h6M4 7.5h6M6 11.5h6",
        linear: "M2.5 13.5 13.5 2.5",
        ease: "M2.5 13.5C8 13.5 8 2.5 13.5 2.5",
        "ease-in": "M2.5 13.5 9 5c1.5-2 3-2.5 4.5-2.5",
        "ease-out": "M2.5 13.5C4 13.5 5.5 13 7 11l6.5-8.5",
        hold: "M2.5 13.5H8V2.5h5.5",
        "align-left": "M2.5 2v12M5 4.5h8v3H5zM5 9.5h5v3H5z",
        "align-hcenter": "M8 2v12M4 4.5h8v3H4zM5.5 9.5h5v3h-5z",
        "align-right": "M13.5 2v12M3 4.5h8v3H3zM6 9.5h5v3H6z",
        "align-top": "M2 2.5h12M4.5 5v8h3V5zM9.5 5v5h3V5z",
        "align-vcenter": "M2 8h12M4.5 4v8h3V4zM9.5 5.5v5h3v-5z",
        "align-bottom": "M2 13.5h12M4.5 3v8h3V3zM9.5 6v5h3V6z",
        "align-center": "M2.5 2.5h11v11h-11zM8 5.5v5M5.5 8h5",
        "dist-h": "M2 2v12M14 2v12M6 5h4v6H6z",
        "dist-v": "M2 2h12M2 14h12M5 6h6v4H5z",
        "null": "M3 3h10v10H3zM3 3l10 10M13 3 3 13",
        precomp: "M2.5 4.5h8v8h-8zM5.5 2h8v8",
        marker: "M4 2.5h8v7L8 13 4 9.5z",
        blur: "M2 6h7M2 10h9M9 4.5h5M11 11.5h3",
        motion: "M3 12a5 5 0 0 1 5-5h5M10 4l3 3-3 3",
        "cam-push": "M2 8h9M8 5l3 3-3 3M13.5 3v10",
        "cam-pull": "M14 8H5M8 5 5 8l3 3M2.5 3v10",
        "cam-truck-left": "M13 8H3M6 5 3 8l3 3",
        "cam-truck-right": "M3 8h10M10 5l3 3-3 3",
        "cam-pedestal-up": "M8 13V3M5 6l3-3 3 3",
        "cam-pedestal-down": "M8 3v10M5 10l3 3 3-3",
        folder: "M2 4h4.5l1.5 1.5h6V13H2z",
        edit: "M10.5 3 13 5.5 6 12.5H3.5V10z",
        grid: "M2.5 2.5h4v4h-4zM9.5 2.5h4v4h-4zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z",
        list: "M5 4h9M5 8h9M5 12h9M2 4h.5M2 8h.5M2 12h.5",
        clock: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM8 4.5V8l2.5 1.5",
        sparkle: "M8 2v4M8 10v4M2 8h4M10 8h4",
        up: "M8 13V3M4 7l4-4 4 4",
        down: "M8 3v10M4 9l4 4 4-4",
        bolt: "M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z",
        layers: "M8 2 14 5 8 8 2 5zM2 8l6 3 6-3M2 11l6 3 6-3",
        sun: "M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M3.4 12.6l1.3-1.3M11.3 4.7l1.3-1.3",
        mask: "M2.5 3.5h11v9h-11zM8 3.5v9M5 6.5a1.6 1.6 0 1 0 0 3",
        cube: "M8 1.8 13.5 5v6L8 14.2 2.5 11V5zM2.5 5 8 8.2 13.5 5M8 8.2v6",
        gauge: "M2.5 11.5a5.5 5.5 0 1 1 11 0M8 11.5l3-4M2.5 11.5h11",
        audio: "M2.5 6.5h2.5L8.5 3.5v9L5 9.5H2.5zM11 5.5c1 .7 1.5 1.5 1.5 2.5s-.5 1.8-1.5 2.5M12.5 3.5c1.5 1.1 2 2.6 2 4.5s-.5 3.4-2 4.5"
    };

    AT.icon = function (name, cls) {
        var ns = "http://www.w3.org/2000/svg";
        var svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.setAttribute("class", "ico" + (cls ? " " + cls : ""));
        svg.setAttribute("aria-hidden", "true");
        var path = document.createElementNS(ns, "path");
        path.setAttribute("d", P[name] || P.sparkle);
        svg.appendChild(path);
        return svg;
    };
    AT.iconNames = Object.keys(P);
})(window.AT = window.AT || {});
