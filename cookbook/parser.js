function parseIngredient(line) {
    const knownUnits = ["cup","cups","tablespoon","tablespoons","tbsp","teaspoon","teaspoons","tsp","clove","cloves","can","cans","ounce","ounces","pound","pounds","lb","lbs","gram","grams","kg"];
    const original = line.trim();
    const match = original.match(/^([\d.]+)\s+(.*)$/);
    if (!match) return { raw: original, scalable: false, name: original };

    const qty = parseFloat(match[1]);
    const rest = match[2];
    const parts = rest.split(" ");
    const possibleUnit = parts[0].toLowerCase();

    if (knownUnits.includes(possibleUnit)) {
        return { qty, unit: parts[0], name: parts.slice(1).join(" "), scalable: true };
    }
    return { qty, unit: "", name: rest, scalable: true };
}

function parseOrg(text) {
    const lines = text.split("\n");
    let currentSection = "", currentRecipe = null, currentMode = null;
    const recipes = [];

    for (let line of lines) {
        const trimmed = line.trim();
        if (line.startsWith("* ") && !line.startsWith("**")) {
            currentSection = line.replace("* ", "").replace(/:.*:/, "").trim();
            continue;
        }
        if (line.startsWith("** ")) {
            if (currentRecipe) recipes.push(currentRecipe);
            const tagMatch = line.match(/\s+:([a-zA-Z0-9_:]+):$/);
            const fullTitle = line.replace("** ", "");
            const title = tagMatch ? fullTitle.replace(tagMatch[0], "").trim() : fullTitle.trim();
            const tags = tagMatch ? tagMatch[1].split(":").filter(t => t) : [];

            currentRecipe = { id: null, section: currentSection, title, tags, ingredients: [], directions: [], properties: {} };
            continue;
        }
        if (trimmed.startsWith(":PROPERTIES:")) { currentMode = "props"; continue; }
        if (trimmed.startsWith(":END:")) { currentMode = null; continue; }
        if (currentMode === "props") {
            const m = trimmed.match(/^:([^:]+):\s*(.*)$/);
            if (m) {
                const k = m[1].toLowerCase();
                currentRecipe.properties[k] = m[2];
                if (k === "id") currentRecipe.id = m[2];
            }
            continue;
        }
        if (trimmed.startsWith("*** Ingredients")) { currentMode = "ingredients"; continue; }
        if (trimmed.startsWith("*** Directions")) { currentMode = "directions"; continue; }
        if (currentMode === "ingredients" && trimmed.startsWith("- ")) currentRecipe.ingredients.push(parseIngredient(trimmed.substring(2)));
        if (currentMode === "directions" && /^\d+\./.test(trimmed)) currentRecipe.directions.push(trimmed.replace(/^\d+\.\s*/, ""));
    }
    if (currentRecipe) recipes.push(currentRecipe);
    return recipes;
}

module.exports = { parseOrg };
