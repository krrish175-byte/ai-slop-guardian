import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
	console.log('AI Slop Guardian is now active!');

	let disposable = vscode.commands.registerCommand('ai-slop-guardian.analyzeCurrentFile', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}

		const document = editor.document;
		const content = document.getText();
		const config = vscode.workspace.getConfiguration('aiSlopGuardian');
		const apiUrl = config.get<string>('apiUrl') || 'http://localhost:8000';

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Guardian: Analyzing code health...",
			cancellable: false
		}, async (progress) => {
			try {
				const response = await axios.post(`${apiUrl}/analyze/`, {
					content: content,
					content_type: "file",
					repo_id: "local-dev",
					contributor_login: "local-user",
					contributor_id: 0
				});

				const { overall_score, label } = response.data;
				const scorePercent = Math.round(overall_score * 100);

				if (overall_score > 0.7) {
					vscode.window.showWarningMessage(`⚠️ Slop Detected (${scorePercent}%). This code shows high AI signals. Review before committing.`);
				} else if (overall_score > 0.4) {
					vscode.window.showInformationMessage(`ℹ️ Moderate AI signals (${scorePercent}%).`);
				} else {
					vscode.window.showInformationMessage(`✅ Code looks human-originated.`);
				}
			} catch (err: any) {
				vscode.window.showErrorMessage(`Guardian Error: ${err.message}`);
			}
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
