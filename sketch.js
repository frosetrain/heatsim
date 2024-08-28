"use strict";

let logo;
let blocks = [];
let startX;
let startY;
let selected = 0;
let selectedCategory = 0; // materials, heat sources, controls
let materialButtons = [];
let heatSourceButtons = [];
let controlButtons = [];
let mouseFollowDiv;
let placedHeatSources = [];
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

class HeatSource {
    constructor(x, y, type, elt) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.elt = elt;
    }

    display() {
        this.elt.show();
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
            for (let otherBtn of [...materialButtons, ...heatSourceButtons, ...controlButtons]) {
                otherBtn.removeClass("ring");
            }
            btn.addClass("ring");
        };
        btn.mouseClicked(callback);
        materialButtons.push(btn);
    }

    mouseFollowDiv = createDiv();
    // Add heat source buttons
    let heatSourceButtonsDiv = Array.from(document.getElementById("heatSourceButtons").children);
    for (let [i, button] of heatSourceButtonsDiv.entries()) {
        let btn = new p5.Element(button);
        let clone = Array.from(button.children)[0].cloneNode(true);
        clone.setAttribute("width", 40);
        clone.setAttribute("height", 40);
        let clonedIcon = new p5.Element(clone);
        clonedIcon.parent(mouseFollowDiv);
        let tooltipP = createP("Click to place");
        tooltipP.class("text-xs");
        tooltipP.parent(mouseFollowDiv);

        let callback = () => {
            selectedCategory = 1;
            selected = i;
            for (let otherBtn of [...materialButtons, ...heatSourceButtons, ...controlButtons]) {
                otherBtn.removeClass("ring");
            }
            btn.addClass("ring");
        };
        btn.mouseClicked(callback);
        heatSourceButtons.push(btn);
    }

    // Add control buttons
    let controlButtonsDiv = Array.from(document.getElementById("controlButtons").children);
    for (let [i, button] of controlButtonsDiv.entries()) {
        let btn = new p5.Element(button);
        let callback = () => {
            selectedCategory = 2;
            selected = i;
            for (let otherBtn of [...materialButtons, ...heatSourceButtons, ...controlButtons]) {
                otherBtn.removeClass("ring");
            }
            btn.addClass("ring");
        };
        btn.mouseClicked(callback);
        controlButtons.push(btn);
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
    let fx = floor(event.x / 24);
    let fy = floor(event.y / 24);
    let rx = round(event.x / 24);
    let ry = round(event.y / 24);
    if (fx >= xCols || fy >= yRows) {
        return;
    }
    if (selectedCategory === 0) {
        if (occupied[fy * xCols + fx]) {
            cursor("not-allowed");
        } else {
            cursor(CROSS);
        }
    } else {
        cursor(ARROW);
    }

    if (selectedCategory === 1) {
        mouseFollowDiv.position(rx * 24 - 20, ry * 24 - 20);
    }
}

function mousePressed(event) {
    let fx = floor(event.x / 24);
    let fy = floor(event.y / 24);
    let rx = round(event.x / 24);
    let ry = round(event.y / 24);
    if (fx >= xCols || fy >= yRows) {
        return;
    }
    if (selectedCategory === 0) {
        if (!occupied[ry * xCols + rx]) {
            drawing = true;
            startX = rx;
            startY = ry;
        }
    } else if (selectedCategory === 1) {
        let button = document.getElementById(`heatSource${selected}`).cloneNode(true);
        button.setAttribute("width", 40);
        button.setAttribute("height", 40);
        let clone = new p5.Element(button);
        let container = createDiv();
        container.position(rx * 24 - 20, ry * 24 - 20);
        container.child(clone);
        placedHeatSources.push(new HeatSource(rx, ry, selected, clone));
        console.log(placedHeatSources);
    } else {
    }
}

function mouseDragged(event) {
    if (selectedCategory !== 0 || !drawing) return;
    draw();
    let fx = floor(event.x / 24);
    let fy = floor(event.y / 24);
    let rx = round(event.x / 24);
    let ry = round(event.y / 24);
    if (fx >= xCols || fy >= yRows) {
        return;
    }
    let good = true;
    for (let uy = min(startY, ry); uy < max(startY, ry); ++uy) {
        for (let ux = min(startX, rx); ux < max(startX, rx); ++ux) {
            if (occupied[uy * xCols + ux]) {
                good = false;
                break;
            }
        }
        if (!good) break;
    }
    if (good) {
        cursorX = rx;
        cursorY = ry;
    }
    rectMode(CORNERS);
    noFill();
    strokeWeight(2);
    stroke(0);
    rect(startX * 24, startY * 24, cursorX * 24, cursorY * 24);
}

function mouseReleased(event) {
    if (selectedCategory !== 0) return;
    let fx = floor(event.x / 24);
    let fy = floor(event.y / 24);
    let rx = round(event.x / 24);
    let ry = round(event.y / 24);
    if (fx >= xCols || fy >= yRows) {
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
