const vscode = require('vscode');

function activate(context) {
    const provider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'smp' },
        {
            provideCompletionItems(document, position, token, context) {
                const completionItems = [];

                // Define SMP keywords and values
                const keywords = [
                    "apiVersion",
                    "kind",
                    "metadata",
                    "spec",
                    "components",
                    "settings",
                    "name",
                    "version",
                    "enabled",
                    "threshold",
                    "parameters",
                    "key",
                    "value",
                    "labels",
                    "environment"
                ];

                const values = [
                    "true",
                    "false",
                    "\"v1\"",
                    "\"ServiceMeshPerformance\"",
                    "\"development\""
                ];

                // Add keywords to completion items
                for (const keyword of keywords) {
                    const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
                    item.detail = 'SMP Keyword';
                    item.documentation = `Keyword: ${keyword}`;
                    completionItems.push(item);
                }

                // Add values to completion items
                for (const value of values) {
                    const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Value);
                    item.detail = 'SMP Value';
                    item.documentation = `Value: ${value}`;
                    completionItems.push(item);
                }

                return completionItems;
            }
        },
        '.' // Trigger completion when the user types "."
    );

    context.subscriptions.push(provider);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
