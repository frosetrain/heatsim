/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["index.html", "sketch.js"],
    theme: {
        fontFamily: {
            sans: [
                "ui-sans-serif",
                "system-ui",
                "sans-serif",
                "Apple Color Emoji",
                "Segoe UI Emoji",
                "Segoe UI Symbol",
                "Noto Color Emoji",
            ],
            mono: ["CommitMono", "monospace"],
        },
        extend: {},
    },
    plugins: [],
};
