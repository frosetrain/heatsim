"use strict";

let xCols;
let yRows;
let blocks = [];
let startX;
let startY;
let selected = 0;
let selectedCategory = 0; // materials, heat sources, tools
let selectedBlock;
let materialButtons = [];
let heatSourceButtons = [];
let toolButtons = [];
let togglesToggled = [];
let mouseFollowDiv;
let tempSlider;
let blockMenu;
let tempLabel;
let simulating = false;
let placedHeatSources = [];
let occupied = [];
let drawing = false;
let cursorX;
let cursorY;

const playSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
  <path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd" />
</svg>`;
const pauseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
  <path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clip-rule="evenodd" />
</svg>`;
const colormap = [
    "#000004",
    "#1f0c48",
    "#550f6d",
    "#88226a",
    "#ba3655",
    "#e35933",
    "#f98c0a",
    "#f9c932",
    "#fcffa4",
]; // Inferno colormap from matplotlib

class Material {
    constructor(name, color, shc, tc) {
        this.name = name;
        this.color = color;
        this.shc = shc;
        this.tc = tc;
    }
}

class Block {
    constructor(x1, y1, x2, y2, material) {
        this.x1 = min(x1, x2);
        this.y1 = min(y1, y2);
        this.x2 = max(x1, x2);
        this.y2 = max(y1, y2);
        this.width = abs(x2 - x1);
        this.height = abs(y2 - y1);
        this.material = material;
        this.initialTemp = random(200, 400);
        // this.initialTemp = 298.15;
        this.temps = [];
        this.energyChange = [];
        for (let x = 0; x < this.width; ++x) {
            let row = [];
            let changeRow = [];
            for (let y = 0; y < this.height; ++y) {
                row.push(this.initialTemp);
                changeRow.push(0);
            }
            this.temps.push(row);
            this.energyChange.push(changeRow);
        }
    }

    display() {
        rectMode(CORNERS);
        strokeWeight(0);
        if (togglesToggled[1]) {
            for (let y = 0; y < this.height; ++y) {
                for (let x = 0; x < this.width; ++x) {
                    fill(tempToColor(this.temps[x][y]));
                    rect(
                        (this.x1 + x) * 24,
                        (this.y1 + y) * 24,
                        (this.x1 + x + 1) * 24,
                        (this.y1 + y + 1) * 24,
                    );
                }
            }
        } else {
            fill(this.material.color);
            rect(this.x1 * 24, this.y1 * 24, this.x2 * 24, this.y2 * 24);
        }
    }

    resetTemp() {
        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                this.temps[x][y] = this.initialTemp;
            }
        }
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
    new Material("Air", "#bae6fd", 1003.5, 2.624),
    new Material("Water", "#3b82f6", 4181.6, 5.9803),
    new Material("SUS304 Steel", "#64748b", 1000, 12.2),
    new Material("60Sn-40Pb Solder", "#78716c", 865, 20.8),
    new Material("Balsa Wood", "#a16207", 1360, 1.48),
    new Material("ABS Plastic", "#22c55e", 1940, 1.75),
];

function tempToColor(temperature) {
    // 200 K to 400 K
    if (temperature < 200) {
        return "#00ff00";
    } else if (temperature > 400) {
        return "#0000ff";
    } else {
        let decScale = (temperature - 200) / 25;
        let from = color(colormap[floor(decScale)]);
        let to = color(colormap[ceil(decScale)]);
        return lerpColor(from, to, decScale % 1);
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight - 192);
    noLoop();
    xCols = floor(width / 24);
    yRows = floor(height / 24);

    for (let x = 0; x < xCols; ++x) {
        let row = [];
        for (let y = 0; y < yRows; ++y) {
            row.push(false);
        }
        occupied.push(row);
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
            mouseFollowDiv.hide();
            blockMenu.hide();
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
    mouseFollowDiv = createDiv();
    mouseFollowDiv.hide();
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
            blockMenu.hide();
            mouseFollowDiv.show();
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
            mouseFollowDiv.hide();
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

    // Add select menu
    blockMenu = new p5.Element(document.getElementById("blockMenu"));
    blockMenu.hide();
    tempSlider = new p5.Element(document.getElementById("tempSlider"));
    tempSlider.mouseMoved(changeInitialTemp);
    tempLabel = new p5.Element(document.getElementById("tempLabel"));

    // Add toggles
    let togglesDiv = Array.from(document.getElementById("toggles").children);
    for (let [i, button] of togglesDiv.entries()) {
        togglesToggled.push(false);
        let btn = new p5.Element(button);
        let callback = () => {
            if (togglesToggled[i]) {
                btn.removeClass("bg-blue-400");
                btn.addClass("bg-gray-400");
                togglesToggled[i] = false;
            } else {
                btn.removeClass("bg-gray-400");
                btn.addClass("bg-blue-400");
                togglesToggled[i] = true;
            }
            draw();
        };
        btn.mouseClicked(callback);
    }

    // Add play/pause button
    let playPauseButton = new p5.Element(document.getElementById("playPauseButton"));
    playPauseButton.html(playSvg);
    let callback = () => {
        blockMenu.hide();
        mouseFollowDiv.hide();
        if (simulating) {
            simulating = false;
            noLoop();
            playPauseButton.html(playSvg);
            for (let block of blocks) {
                block.resetTemp();
            }
        } else {
            simulating = true;
            loop();
            playPauseButton.html(pauseSvg);
            cursor(ARROW);
        }
    };
    playPauseButton.mouseClicked(callback);

    let clearButton = new p5.Element(document.getElementById("clearButton"));
    callback = () => {
        blocks = [];
        simulating = false;
        drawing = false;
        playPauseButton.html(playSvg);
        for (let heatSource of placedHeatSources) {
            heatSource.elt.hide();
        }
        placedHeatSources = [];
        occupied = [];
        for (let x = 0; x < xCols; ++x) {
            let row = [];
            for (let y = 0; y < yRows; ++y) {
                row.push(false);
            }
            occupied.push(row);
        }
        noLoop();
        draw();
    };
    clearButton.mouseClicked(callback);
}

function heatTransfer() {
    for (let y = 0; y < yRows; ++y) {
        for (let x = 0; x < xCols; ++x) {
            let targets = [
                [x, y - 1],
                [x + 1, y],
                [x, y + 1],
                [x - 1, y],
            ];
            for (let t of targets) {
                let targetX = t[0];
                let targetY = t[1];
                if (targetX < 0 || targetY < 0 || targetX >= xCols || targetY >= yRows) {
                    continue;
                }
                if (occupied[x][y] && occupied[targetX][targetY]) {
                    let currentBlock = blocks[occupied[x][y] - 1];
                    let targetBlock = blocks[occupied[targetX][targetY] - 1];
                    let currentRelX = x - currentBlock.x1;
                    let currentRelY = y - currentBlock.y1;
                    let targetRelX = targetX - targetBlock.x1;
                    let targetRelY = targetY - targetBlock.y1;
                    if (
                        currentBlock.temps[currentRelX][currentRelY] >
                        targetBlock.temps[targetRelX][targetRelY]
                    ) {
                        let multiplier = 1;
                        if (
                            ["Water", "Air"].includes(currentBlock.material.name) &&
                            ["Water", "Air"].includes(targetBlock.material.name)
                        ) {
                            // Simulate convection
                            if (currentRelY - targetRelY === 1) {
                                multiplier = 10;
                            } else if (
                                abs(currentRelX - targetRelX) === 1 &&
                                currentRelY <= ceil(currentBlock.height * 0.2)
                            ) {
                                multiplier = 10;
                            }
                        }
                        // q = -k Delta t
                        let diff =
                            currentBlock.temps[currentRelX][currentRelY] -
                            targetBlock.temps[targetRelX][targetRelY];
                        let heatFlux =
                            ((currentBlock.material.tc + targetBlock.material.tc) / 2) *
                            (diff / 0.24); // 0.24 is the distance between tiles in m
                        heatFlux *= multiplier;
                        targetBlock.energyChange[targetRelX][targetRelY] += heatFlux;
                        currentBlock.energyChange[currentRelX][currentRelY] -= heatFlux;
                    }
                }
            }
        }
    }

    // Apply heat sources
    for (let heatSource of placedHeatSources) {
        let heatedBlock = blocks[occupied[heatSource.x][heatSource.y] - 1];
        let relX = heatSource.x - heatedBlock.x1;
        let relY = heatSource.y - heatedBlock.y1;
        heatedBlock.energyChange[relX][relY] += 100000;
    }

    for (let block of blocks) {
        for (let y = 0; y < block.height; ++y) {
            for (let x = 0; x < block.width; ++x) {
                let tempChange = (block.energyChange[x][y] / block.material.shc) * 2;
                block.temps[x][y] += tempChange;
                if (block.temps[x][y] > 400) {
                    block.temps[x][y] = 400;
                } else if (block.temps[x][y] < 200) {
                    block.temps[x][y] = 200;
                }
                block.energyChange[x][y] = 0;
            }
        }
    }
}

function draw() {
    rectMode(CORNER);
    background("#f3f4f6");
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
    if (simulating) {
        heatTransfer();
        if (togglesToggled[0]) {
            let fx = floor(mouseX / 24);
            let fy = floor(mouseY / 24);
            if (fx >= xCols || fy >= yRows) {
                return;
            }
            rectMode(CORNER);
            fill("#d1d5dbaa");
            rect(mouseX, mouseY - 24, 67, 24);
            fill(0);
            textAlign(LEFT, BOTTOM);
            textSize(16);
            textFont("CommitMono");
            let currentBlock = blocks[occupied[fx][fy] - 1];
            if (!currentBlock) {
                text("null", mouseX + 4, mouseY - 4);
                return;
            }
            let currentX = fx - currentBlock.x1;
            let currentY = fy - currentBlock.y1;
            let temp = currentBlock.temps[currentX][currentY];
            text((Math.round(temp * 100) / 100).toFixed(2), mouseX + 4, mouseY - 4);
        }
    }
}

function changeInitialTemp() {
    selectedBlock.initialTemp = tempSlider.value();
    selectedBlock.resetTemp();
    tempLabel.html(`${(Math.round(tempSlider.value() * 100) / 100).toFixed(2)} K`);
    draw();
}

function mouseMoved(event) {
    let fx = floor(event.x / 24);
    let fy = floor(event.y / 24);
    let rx = round(event.x / 24);
    let ry = round(event.y / 24);
    if (fx >= xCols || fy >= yRows) {
        return;
    }
    if (!simulating && selectedCategory === 0) {
        if (occupied[fx][fy]) {
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
    if (simulating) return;
    let fx = floor(event.x / 24);
    let fy = floor(event.y / 24);
    let rx = round(event.x / 24);
    let ry = round(event.y / 24);
    if (fx >= xCols || fy >= yRows) {
        return;
    }
    if (selectedCategory === 0) {
        if (!occupied[rx][ry]) {
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
    } else if (selectedCategory === 2) {
        selectedBlock = blocks[occupied[fx][fy] - 1];
        if (selectedBlock) {
            blockMenu.show();
            tempSlider.value(selectedBlock.initialTemp);
            changeInitialTemp();
        } else {
            blockMenu.hide();
        }
    }
}

function mouseDragged(event) {
    if (simulating || selectedCategory !== 0 || !drawing) return;
    draw();
    let fx = floor(event.x / 24);
    let fy = floor(event.y / 24);
    let rx = round(event.x / 24);
    let ry = round(event.y / 24);
    let good = true;
    if (fx >= xCols || fy >= yRows) {
        good = false;
    }
    if (good) {
        for (let uy = min(startY, ry); uy < max(startY, ry); ++uy) {
            for (let ux = min(startX, rx); ux < max(startX, rx); ++ux) {
                if (occupied[ux][uy]) {
                    good = false;
                    break;
                }
            }
            if (!good) break;
        }
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
    if (simulating || selectedCategory !== 0) return;
    let fx = floor(event.x / 24);
    let fy = floor(event.y / 24);
    let rx = round(event.x / 24);
    let ry = round(event.y / 24);
    if (fx >= xCols || fy >= yRows) {
        return;
    }
    drawing = false;
    blocks.push(new Block(startX, startY, cursorX, cursorY, materials[selected])); // cursorX and cursorY will become grid coordinates soon
    let blockId = blocks.length; // it's 1-indexed for some reason
    for (let uy = min(startY, cursorY); uy < max(startY, cursorY); ++uy) {
        for (let ux = min(startX, cursorX); ux < max(startX, cursorX); ++ux) {
            occupied[ux][uy] = blockId;
        }
    }
    draw();
}
