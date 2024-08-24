"use strict";

let logo;
let blocks = [];
let startX;
let startY;
let selected = 0;
let selectedCategory = 0; // materials, heat sources, tools
let materialButtons = [];
let heatSourceButtons = [];
let toolButtons = [];
let occupied = [];
let drawing = false;
let cursorX;
let cursorY;
let xCols;
let yRows;

class Material {
    constructor(name, color) {
        this.name = name;
        this.color = color;
    }
}

class Block {
    constructor(x1, y1, x2, y2, material) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.material = material;
    }

    display() {
        rectMode(CORNERS);
        fill(this.material.color);
        rect(this.x1 * 24, this.y1 * 24, this.x2 * 24, this.y2 * 24);
    }
}

const materials = [
    new Material("Air", "cyan"),
    new Material("Water", "blue"),
    new Material("SUS304 Steel", "gray"),
    new Material("60Sn-40Pb Solder", "darkgray"),
    new Material("Balsa Wood", "brown"),
    new Material("ABS Plastic", "yellow"),
];

function setup() {
    createCanvas(windowWidth, windowHeight - 192);
    xCols = floor(width / 24);
    yRows = floor(height / 24);
    for (let i = 0; i < xCols * yRows; ++i) {
        occupied.push(false);
    }

    // Add material buttons
    let materialButtonsDiv = new p5.Element(document.getElementById("materialButtons"));
    for (let [i, material] of materials.entries()) {
        let btn = createButton(material.name);
        btn.class("ring-red-500 rounded shadow-lg");
        btn.style("background-color", material.color);
        btn.parent(materialButtonsDiv);
        if (i === selected) {
            btn.addClass("ring");
        }
        let callback = () => {
            selectedCategory = 0;
            selected = i;
            for (let otherBtn of [...materialButtons, ...heatSourceButtons, ...toolButtons]) {
                otherBtn.removeClass("ring");
            }
            btn.addClass("ring");
        };
        btn.mouseClicked(callback);
        materialButtons.push(btn);
    }

    // Add heat source buttons
    let heatSourceButtonsDiv = Array.from(document.getElementById("heatSourceButtons").children);
    for (let [i, button] of heatSourceButtonsDiv.entries()) {
        let btn = new p5.Element(button);
        let callback = () => {
            selectedCategory = 1;
            selected = i;
            for (let otherBtn of [...materialButtons, ...heatSourceButtons, ...toolButtons]) {
                otherBtn.removeClass("ring");
            }
            btn.addClass("ring");
        };
        btn.mouseClicked(callback);
        heatSourceButtons.push(btn);
    }

    // Add tool buttons
    let toolButtonsDiv = Array.from(document.getElementById("toolButtons").children);
    for (let [i, button] of toolButtonsDiv.entries()) {
        let btn = new p5.Element(button);
        let callback = () => {
            selectedCategory = 2;
            selected = i;
            for (let otherBtn of [...materialButtons, ...heatSourceButtons, ...toolButtons]) {
                otherBtn.removeClass("ring");
            }
            btn.addClass("ring");
        };
        btn.mouseClicked(callback);
        toolButtons.push(btn);
    }
}

function draw() {
    noLoop();
    rectMode(CORNER);
    background(240);
    strokeWeight(0);

    // Draw the dot grid
    for (let y = 0; y < height; y += 24) {
        for (let x = 0; x < width; x += 24) {
            set(x, y, 0);
        }
    }
    updatePixels();

    for (let block of blocks) {
        block.display();
    }
}

function mouseMoved(event) {
    let x = floor(event.x / 24);
    let y = floor(event.y / 24);
    if (x >= xCols || y >= yRows) {
        return;
    }
    if (selectedCategory === 0) {
        if (occupied[y * xCols + x]) {
            cursor("not-allowed");
        } else {
            cursor(CROSS);
        }
    } else {
        cursor(ARROW);
    }
}

function mousePressed(event) {
    if (selectedCategory === 0) {
        let x = round(event.x / 24);
        let y = round(event.y / 24);
        if (x >= xCols || y >= yRows) {
            return;
        }
        if (!occupied[y * xCols + x]) {
            drawing = true;
            startX = x;
            startY = y;
        }
    } else {
        let x = floor(event.x / 24);
        let y = floor(event.y / 24);
        if (x >= xCols || y >= yRows) {
            return;
        }
        console.log(x, y);
    }
}

function mouseDragged(event) {
    if (selectedCategory !== 0 || !drawing) return;
    draw();
    let x = round(event.x / 24);
    let y = round(event.y / 24);
    if (x >= xCols || y >= yRows) {
        return;
    }
    let good = true;
    for (let uy = min(startY, y); uy < max(startY, y); ++uy) {
        for (let ux = min(startX, x); ux < max(startX, x); ++ux) {
            if (occupied[uy * xCols + ux]) {
                good = false;
                break;
            }
        }
        if (!good) break;
    }
    if (good) {
        cursorX = x;
        cursorY = y;
    }
    rectMode(CORNERS);
    noFill();
    strokeWeight(2);
    stroke(0);
    rect(startX * 24, startY * 24, cursorX * 24, cursorY * 24);
}

function mouseReleased(event) {
    if (selectedCategory !== 0) return;
    let x = round(event.x / 24);
    let y = round(event.y / 24);
    if (x >= xCols || y >= yRows) {
        return;
    }
    drawing = false;
    blocks.push(new Block(startX, startY, cursorX, cursorY, materials[selected])); // cursorX and cursorY will become grid coordinates soon
    for (let uy = min(startY, cursorY); uy < max(startY, cursorY); ++uy) {
        for (let ux = min(startX, cursorX); ux < max(startX, cursorX); ++ux) {
            occupied[uy * xCols + ux] = true;
        }
    }
    draw();
}
