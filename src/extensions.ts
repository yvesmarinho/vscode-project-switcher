import * as vscode from 'vscode';
import { DatabaseManager } from './lib/databaseManager';
import { ProjectQuickPickProvider } from './lib/quickPickProvider';

/**
 * Função chamada quando a extensão é ativada.
 *
 * :param context: Contexto da extensão do VS Code.
 * :type context: vscode.ExtensionContext
 * :returns: None em sucesso, False em erro.
 * :rtype: None | False
 * :raises: Error se o contexto for inválido.
 * :doctest:
 *   >>> // Não aplicável em ambiente de testes interativo.
 */
export function activate(context: vscode.ExtensionContext): void | false {
    try {
        if (!context || typeof context !== 'object') {
            throw new Error('Contexto inválido para ativação da extensão.');
        }

        // Caminho para o arquivo do banco de dados no diretório global de armazenamento da extensão
        const dbPath = vscode.Uri.joinPath(context.globalStorageUri, 'project-switcher.db').fsPath;

        // Inicialização do Gerenciador de Banco de Dados
        let dbManager: DatabaseManager;
        try {
            dbManager = new DatabaseManager(dbPath);
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao inicializar banco de dados: ${(error as Error).message}`);
            return false;
        }

        // Inicialização do provedor de QuickPick
        let quickPickProvider: ProjectQuickPickProvider;
        try {
            quickPickProvider = new ProjectQuickPickProvider(dbManager);
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao inicializar o provedor de QuickPick: ${(error as Error).message}`);
            return false;
        }

        // Registro dos comandos
        try {
            context.subscriptions.push(
                vscode.commands.registerCommand('projectSwitcher.openProjectMenu', async () => {
                    try {
                        await quickPickProvider.showProjectMenu();
                    } catch (error) {
                        vscode.window.showErrorMessage(`Erro ao abrir menu de projetos: ${(error as Error).message}`);
                        return false;
                    }
                })
            );

            context.subscriptions.push(
                vscode.commands.registerCommand('projectSwitcher.addCategory', async () => {
                    try {
                        await quickPickProvider.addCategory();
                    } catch (error) {
                        vscode.window.showErrorMessage(`Erro ao adicionar categoria: ${(error as Error).message}`);
                        return false;
                    }
                })
            );

            context.subscriptions.push(
                vscode.commands.registerCommand('projectSwitcher.addProject', async () => {
                    try {
                        await quickPickProvider.addProject();
                    } catch (error) {
                        vscode.window.showErrorMessage(`Erro ao adicionar projeto: ${(error as Error).message}`);
                        return false;
                    }
                })
            );

            context.subscriptions.push(
                vscode.commands.registerCommand('projectSwitcher.editProject', async () => {
                    try {
                        await quickPickProvider.editProject();
                    } catch (error) {
                        vscode.window.showErrorMessage(`Erro ao editar projeto: ${(error as Error).message}`);
                        return false;
                    }
                })
            );

            context.subscriptions.push(
                vscode.commands.registerCommand('projectSwitcher.deleteProject', async () => {
                    try {
                        await quickPickProvider.deleteProject();
                    } catch (error) {
                        vscode.window.showErrorMessage(`Erro ao remover projeto: ${(error as Error).message}`);
                        return false;
                    }
                })
            );

            context.subscriptions.push(
                vscode.commands.registerCommand('projectSwitcher.deleteCategory', async () => {
                    try {
                        await quickPickProvider.deleteCategory();
                    } catch (error) {
                        vscode.window.showErrorMessage(`Erro ao remover categoria: ${(error as Error).message}`);
                        return false;
                    }
                })
            );

            context.subscriptions.push(
                vscode.commands.registerCommand('projectSwitcher.editCategory', async () => {
                    try {
                        await quickPickProvider.editCategory();
                    } catch (error) {
                        vscode.window.showErrorMessage(`Erro ao editar categoria: ${(error as Error).message}`);
                        return false;
                    }
                })
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao registrar comandos: ${(error as Error).message}`);
            return false;
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Falha na ativação da extensão: ${(error as Error).message}`);
        return false;
    }
}

/**
 * Função chamada quando a extensão é desativada.
 *
 * :returns: None
 * :rtype: None
 * :doctest:
 *   >>> // Não aplicável em ambiente de testes interativo.
 */
export function deactivate(): void {
    // Não é necessário desfazer inicializações para este caso.
}