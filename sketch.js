let logo;
let blocks = [];

class Material {
    constructor(name, color) {
        this.name = name;
        this.color = color;
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
selectedMaterial = 0
materialButtons = []

function setup() {
    createCanvas(windowWidth, windowHeight - 192 - 48);

    let materialButtonsDiv = new p5.Element(document.getElementById("materialButtons"))
    for (const [index, material] of materials.entries()) {
        btn = createButton(material.name)
        btn.class("ring-red-600 rounded")
        btn.style("background-color", material.color)
        btn.parent(materialButtonsDiv)
        if (index == selectedMaterial) {
            btn.addClass("ring")
        }
        const callback = () => {
            materialButtons[selectedMaterial].removeClass("ring")
            selectedMaterial = index
            materialButtons[selectedMaterial].addClass("ring")
        }
        btn.mouseClicked(callback)
        materialButtons.push(btn)
    }

    for (let i = 0; i < 6; ++i) {
        blocks.push(
            new Block(
                random() * width,
                random() * height,
                random() * width,
                random() * height,
                materials[i],
            ),
        );
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
        rect(this.x1, this.y1, this.x2, this.y2);
    }
}

function draw() {
    rectMode(CORNER);
    background(240);
    strokeWeight(0);

    // Draw the dot grid
    for (let y = 0; y < height; y += 24) {
        for (let x = 0; x < width; x += 24) {
            set(x, y, 0)
        }
    }
    updatePixels()

    for (let block of blocks) {
        block.display();
    }
}
