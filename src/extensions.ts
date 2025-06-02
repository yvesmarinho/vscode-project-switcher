import * as vscode from 'vscode';
import { DatabaseManager } from './lib/databaseManager';
import { ProjectQuickPickProvider } from './lib/quickPickProvider';

/**
 * Extensão principal do VS Code para gerenciamento de projetos por categorias.
 * 
 * :param context: Contexto da extensão do VS Code.
 * :returns: None
 * 
 * :raises: Error se o contexto for inválido
 * 
 * .. doctest::
 * 
 *     >>> typeof activate
 *     'function'
 */
export function activate(context: vscode.ExtensionContext): void {
    try {
        if (!context || typeof context !== 'object') {
            throw new Error("Contexto inválido passado para a ativação da extensão.");
        }

        const dbManager = new DatabaseManager(context);
        const quickPickProvider = new ProjectQuickPickProvider(dbManager);

        context.subscriptions.push(
            vscode.commands.registerCommand('projectSwitcher.openProjectMenu', async () => {
                await quickPickProvider.showProjectMenu();
            }),

            vscode.commands.registerCommand('projectSwitcher.addCategory', async () => {
                await quickPickProvider.addCategory();
            }),

            vscode.commands.registerCommand('projectSwitcher.addProject', async () => {
                await quickPickProvider.addProject();
            }),

            vscode.commands.registerCommand('projectSwitcher.editProject', async () => {
                await quickPickProvider.editProject();
            }),

            vscode.commands.registerCommand('projectSwitcher.deleteProject', async () => {
                await quickPickProvider.deleteProject();
            }),

            vscode.commands.registerCommand('projectSwitcher.deleteCategory', async () => {
                await quickPickProvider.deleteCategory();
            }),
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Erro ao ativar extensão: ${(error as Error).message}`);
        return;
    }
}

/**
 * Função de desativação da extensão.
 */
export function deactivate(): void {
    // Não é necessário ação especial para desativação, mas função mantida por padrão.
}