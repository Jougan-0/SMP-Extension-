const vscode = require('vscode');
const axios = require('axios');

// URLs of the different JSON schemas
const SCHEMA_URLS = {
    "components.json": "https://raw.githubusercontent.com/meshery/schemas/master/schemas/constructs/v1beta1/component.json",
    "model.json": "https://raw.githubusercontent.com/meshery/schemas/master/schemas/constructs/v1beta1/model.json",
    "relationship.json": "https://raw.githubusercontent.com/meshery/schemas/master/schemas/constructs/v1alpha2/relationship.json"
};

// Function to fetch the schema
async function fetchSchema(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to fetch schema: ${error}`);
        throw error;
    }
}

// Function to generate the boilerplate JSON
function generateBoilerplate(schema) {
    const boilerplate = {};

    for (const key in schema.properties) {
        if (schema.properties.hasOwnProperty(key)) {
            boilerplate[key] = generatePlaceholder(schema.properties[key]);
        }
    }

    return boilerplate;
}

function generatePlaceholder(property) {
    if (property.type === 'object') {
        const result = {};
        for (const key in property.properties) {
            if (property.properties.hasOwnProperty(key)) {
                result[key] = generatePlaceholder(property.properties[key]);
            }
        }
        return result;
    } else if (property.type === 'array') {
        return [generatePlaceholder(property.items)];
    } else {
        switch (property.type) {
            case 'boolean':
                return true;
            case 'string':
            case 'undefined':
                return "";
            default:
                return ""; // Placeholder for other types
        }
    }
}

async function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.generateBoilerplate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No active text editor
        }

        const document = editor.document;
        const languageId = document.languageId;

        if (languageId !== 'json') {
            vscode.window.showErrorMessage('This command can only be used in JSON files.');
            return;
        }

        const selectedSchema = await vscode.window.showQuickPick(Object.keys(SCHEMA_URLS), {
            placeHolder: 'Select a schema to generate boilerplate for'
        });

        if (!selectedSchema) {
            vscode.window.showInformationMessage('No schema selected');
            return;
        }

        const url = SCHEMA_URLS[selectedSchema];
        try {
            const schema = await fetchSchema(url);
            const boilerplate = generateBoilerplate(schema);

            const edit = new vscode.WorkspaceEdit();
            const position = editor.selection.active;
            const jsonString = JSON.stringify(boilerplate, null, 2);

            edit.insert(document.uri, position, jsonString);
            await vscode.workspace.applyEdit(edit);
        } catch (error) {
            console.error(error);
        }
    });

    context.subscriptions.push(disposable);

    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'json' },
        {
            async provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (linePrefix.endsWith('!')) {
                    console.log("Entered");
                    const completionItems = await Promise.all(Object.keys(SCHEMA_URLS).map(async key => {
                        const schema = await fetchSchema(SCHEMA_URLS[key]);
                        const boilerplate = generateBoilerplate(schema);
                        const jsonString = JSON.stringify(boilerplate, null, 2);

                        const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Snippet);
                        const range = new vscode.Range(position.translate(0, -1), position);
                        item.additionalTextEdits = [vscode.TextEdit.replace(range, '')];
                        item.insertText = new vscode.SnippetString(`${jsonString}\n$0`);
                        item.documentation = `Insert boilerplate for ${key}`;
                        return item;
                    }));
                    return completionItems;
                }
                return undefined;
            }
        },
        '!'
    ));
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
