const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { parseOrg } = require("./parser");
const app = express();

const ORG_PATH = path.join(__dirname, "cookbook.org");
app.use(express.json());
app.use(express.static("public"));

function ensureIdsInFile(orgText) {
    const lines = orgText.split("\n");
    const newLines = [];
    let updated = false;
    for (let i = 0; i < lines.length; i++) {
        newLines.push(lines[i]);
        if (lines[i].startsWith("** ") && !lines[i].startsWith("***")) {
            let hasId = false, j = i + 1;
            while (j < lines.length && !lines[j].startsWith("*")) {
                if (lines[j].includes(":ID:")) hasId = true;
                j++;
            }
            if (!hasId) {
                updated = true;
                newLines.push("  :PROPERTIES:", `  :ID: ${crypto.randomBytes(4).toString("hex")}`, "  :END:");
            }
        }
    }
    return { content: newLines.join("\n"), updated };
}

if (fs.existsSync(ORG_PATH)) {
    const res = ensureIdsInFile(fs.readFileSync(ORG_PATH, "utf8"));
    if (res.updated) fs.writeFileSync(ORG_PATH, res.content);
}

app.get("/api/recipes", (req, res) => {
    res.json(parseOrg(fs.readFileSync(ORG_PATH, "utf8")));
});

app.post("/api/recipes/save", (req, res) => {
    const updated = req.body;
    let lines = fs.readFileSync(ORG_PATH, "utf8").split("\n");
    let output = [], inside = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("** ")) {
            let match = false;
            for (let j = i+1; j < i+10 && j < lines.length; j++) {
                if (lines[j].includes(":ID:") && lines[j].includes(updated.id)) { match = true; break; }
                if (lines[j].startsWith("*")) break;
            }
            if (match) {
                inside = true;
                const tagStr = updated.tags.length ? ` :${updated.tags.join(":")}:` : "";
                output.push(`** ${updated.title}${tagStr}`, "  :PROPERTIES:", `  :ID: ${updated.id}`);
                Object.entries(updated.properties).forEach(([k,v]) => k !== "id" && output.push(`  :${k}: ${v}`));
                output.push("  :END:", "*** Ingredients");
                updated.ingredients.forEach(ing => {
                    const q = ing.scalable ? `${ing.qty} ` : "";
                    output.push(`- ${q}${ing.unit||""}${ing.unit?" ":""}${ing.name}`);
                });
                output.push("*** Directions");
                updated.directions.forEach((d, idx) => output.push(`${idx + 1}. ${d}`));
                continue;
            }
        }
        if (inside) { if (line.startsWith("** ") || (line.startsWith("* ") && !line.startsWith("**"))) inside = false; else continue; }
        output.push(line);
    }
    fs.writeFileSync(ORG_PATH, output.join("\n"));
    res.json({ success: true });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
