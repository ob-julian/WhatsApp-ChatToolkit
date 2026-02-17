const { LMStudioClient } = require("@lmstudio/sdk");

const client = new LMStudioClient();
let model = null;

module.exports = {
    event: 'message',
    handler: async (message, client, config)  => {
        if (!model) {
            console.error("LM Studio model is not initialized. Cannot process the message.");
            return;
        }
        const attachments = await downloadMedia(message);
        const contactName = await getContactName(message);
        const messageText = message.body || "";
        const response = generateResponse(contactName, messageText, attachments);
        response.then(reply => {
            if (reply !== "IGNORE") {
                client.sendMessage(message.from, reply);
            }
        }).catch(error => {
            console.error("Error generating response:", error);
        });
    }
};

async function setupLMStudio(modelName) {
    try {
        const client = new LMStudioClient();
        model = await getModel(client, modelName);
        console.log("LM Studio client initialized successfully.");
    } catch (error) {
        console.error("LM Studio client initialization failed.", error);
        return;
    }
}

async function getLoadedModel(client) {
    try {
        const model = await client.llm.model();
        return model
    } catch (error) {
        return false;
    }
}

async function getModel(client, modelName) {
    const modelLoaded = await getLoadedModel(client);
    console.log("Currently loaded model:", modelLoaded.path);
    if (modelLoaded && modelLoaded.path === modelName) {
        console.log("Requested model is already loaded. Reusing the existing model.");
        return modelLoaded;
    } else {
        console.log("A different model is currently loaded. Unloading the existing model before loading the new one.");
        await unloadModel(client);
    }
    console.log("Loading model:", modelName);
    const model = loadModel(client, modelName);
    return model;

}

async function unloadModel(client) {
    try {
        const model = await client.llm.model();
        model.unload();
    } catch (error) {
        // no model loaded, nothing to unload
    }
}

async function loadModel(client, modelName) {
    try {
        const model = await client.llm.model(modelName);
        return model;
    } catch (error) {
        console.error(`Failed to load model ${modelName}.`, error);
        return null;
    }
}

async function downloadMedia(message) {
    if (message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            const preparedMedia = await client.files.prepareImageBase64(media.mimetype, media.data);
            return [preparedMedia];
        } catch (error) {
            console.error("Failed to download media:", error);
            return [];
        }
    }
    return [];
}

async function getContactName(message) {
    try {
        const contact = await message.getContact();
        return contact.name || contact.shortName || contact.pushname || "Unbekannt";
    }
    catch (error) {
        console.error("Failed to get contact name:", error);
        return "Unbekannt";
    }
}

async function generateResponse(contactName, messageText, images) {
    const prompt = `
Du antwortest auf eingehende Nachrichten, die Text und optional ein Bild enthalten können.
Analysiere das Bild (falls vorhanden) und den Text, um zu bestimmen, ob es sich um eine Geburtstagsnachricht handelt.

WICHTIG:
- Antworte NUR, wenn die eingehende Nachricht eindeutig eine Geburtstagsnachricht ist. (z.B. Glückwünsche zum Geburtstag oder ein Bild mit Geburtstagsbezug)
- Antworte so, dass du selbst das Geburtstagskind bist.
- Wenn es KEINE Geburtstagsnachricht ist, gib exakt dieses Codewort zurück:
IGNORE

Stil der Antwort:
- Kurz
- Locker
- Nicht überfreundlich
- Kein Smalltalk
- Maximal 2 Sätze

Regeln:
- Nutze das Bild, falls vorhanden, um die Nachricht als Geburtstagsnachricht zu identifizieren.
- Genau eine Antwort.
- Kein Meta-Text.
- Kein Hinweis auf KI.
- Keine Erklärungen.
- Keine Anführungszeichen.

Eingabe:
Kontaktname: ${contactName}
Bild vorhanden: ${images.length > 0 ? "Ja" : "Nein"}
Nachricht: ${messageText}

Antwort:
`;  
    let result
    if (images.length > 0) {
        console.log("Sending prompt with image to LM Studio.");
        result = await model.respond([
            { role: "user", content: prompt, images}
        ]);
    } else {
        console.log("Sending prompt without image to LM Studio.");
        result = await model.respond(prompt);
    }
    const awnser = result.nonReasoningContent || result.content || "";
    console.log("LM Studio response:", result.content);
    return awnser.trim();
}

setupLMStudio("mistralai/magistral-small-2509")/*.then(() => {
    async function testing() {
        const image = await client.files.prepareImageBase64("image/jpeg", img);
        //image.type = "image/jpeg";
        console.log("Prepared image for testing.");
        prompt = "describe the image"
        const response = await model.respond([
            { role: "user", content: "Describe this image please", images: [image] }
        ]);

        let aws = response
        console.log(aws);
    }
    testing();
});*/