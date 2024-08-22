let logo;
let blocks = [];
let startX = 0;
let startY = 0;
let selectedMaterial = 0;
let materialButtons = [];
let selecting = false;
let occupied = [];
let drawing = false;
let cursorX = 0;
let cursorY = 0;

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

    let cursorButton = new p5.Element(document.getElementById("cursorButton"));
    const callback = () => {
        selecting = true;
        materialButtons[selectedMaterial].removeClass("ring");
        cursorButton.addClass("ring");
    };
    cursorButton.mouseClicked(callback);
    let materialButtonsDiv = new p5.Element(document.getElementById("materialButtons"));
    for (const [index, material] of materials.entries()) {
        btn = createButton(material.name);
        btn.class("ring-red-600 rounded");
        btn.style("background-color", material.color);
        btn.parent(materialButtonsDiv);
        if (index == selectedMaterial) {
            btn.addClass("ring");
        }
        const callback = () => {
            selecting = false;
            materialButtons[selectedMaterial].removeClass("ring");
            cursorButton.removeClass("ring");
            selectedMaterial = index;
            materialButtons[selectedMaterial].addClass("ring");
        };
        btn.mouseClicked(callback);
        materialButtons.push(btn);
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
    x = floor(event.x / 24);
    y = floor(event.y / 24);
    if (x >= xCols || y >= yRows) {
        return;
    }
    if (!selecting) {
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
    if (selecting) {
        x = floor(event.x / 24);
        y = floor(event.y / 24);
        if (x >= xCols || y >= yRows) {
            return;
        }
        console.log(x, y);
    } else {
        x = round(event.x / 24);
        y = round(event.y / 24);
        if (x >= xCols || y >= yRows) {
            return;
        }
        if (!occupied[y * xCols + x]) {
            drawing = true;
            startX = x;
            startY = y;
        }
    }
}

function mouseDragged(event) {
    if (!drawing || selecting) return;
    draw();
    x = round(event.x / 24);
    y = round(event.y / 24);
    if (x >= xCols || y >= yRows) {
        return;
    }
    good = true;
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
    if (selecting) return;
    x = round(event.x / 24);
    y = round(event.y / 24);
    if (x >= xCols || y >= yRows) {
        return;
    }
    drawing = false;
    blocks.push(new Block(startX, startY, cursorX, cursorY, materials[selectedMaterial])); // cursorX and cursorY will become grid coordinates soon
    for (let uy = min(startY, cursorY); uy < max(startY, cursorY); ++uy) {
        for (let ux = min(startX, cursorX); ux < max(startX, cursorX); ++ux) {
            occupied[uy * xCols + ux] = true;
        }
    }
    draw();
}
