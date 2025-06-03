import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseManager } from './databaseManager';

/**
 * Classe responsável por prover o menu de seleção de projetos e categorias.
 * 
 * :class:`ProjectQuickPickProvider`
 */
export class ProjectQuickPickProvider {
    private dbManager: DatabaseManager;

    /**
     * Construtor do QuickPickProvider.
     * 
     * :param dbManager: Instância de DatabaseManager.
     */
    constructor(dbManager: DatabaseManager) {
        this.dbManager = dbManager;
    }

    /**
     * Exibe o menu principal para seleção de projetos por categoria.
     */
    public async showProjectMenu(): Promise<void | false> {
        try {
            const projects = this.dbManager.getProjects();
            if (!projects || !Array.isArray(projects)) {
                vscode.window.showErrorMessage('Nenhum projeto encontrado.');
                return false;
            }

            const categoriesMap = new Map<string, Array<any>>();
            for (const proj of projects) {
                const categoryKey = proj.category_name ?? "Sem Categoria";
                if (!categoriesMap.has(categoryKey)) {
                    categoriesMap.set(categoryKey, []);
                }
                categoriesMap.get(categoryKey)!.push(proj);
            }

            const categoryItems = Array.from(categoriesMap.keys()).map(c => ({
                label: c,
                type: 'category'
            }));

            const categoryPick = await vscode.window.showQuickPick(categoryItems, {
                placeHolder: 'Selecione uma categoria'
            });

            if (!categoryPick) {
                return false;
            }

            const projectsInCategory = categoriesMap.get(categoryPick.label) || [];
            const projectItems = projectsInCategory.map(p => ({
                label: p.name,
                description: p.language,
                detail: p.path,
                project: p
            }));

            const projectPick = await vscode.window.showQuickPick(projectItems, {
                placeHolder: 'Selecione um projeto'
            });

            if (projectPick) {
                await this.openProject(projectPick.project.path);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao exibir menu: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Abre o projeto no VS Code.
     * 
     * :param projectPath: Caminho do projeto.
     */
    public async openProject(projectPath: string): Promise<void | false> {
        try {
            if (!projectPath || typeof projectPath !== 'string') {
                throw new Error('Caminho do projeto inválido.');
            }
            await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), false);
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao abrir projeto: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Adiciona uma nova categoria via input do usuário.
     */
    public async addCategory(): Promise<void | false> {
        try {
            const name = await vscode.window.showInputBox({
                prompt: 'Nome da categoria',
                validateInput: (text) => (!text || text.trim().length === 0) ? 'Nome obrigatório' : null
            });
            if (!name) {
                return false;
            }
            const result = this.dbManager.addCategory(name.trim());
            if (result === false) {
                return false;
            }
            vscode.window.showInformationMessage('Categoria adicionada com sucesso!');
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao adicionar categoria: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Adiciona um novo projeto via input do usuário.
     */
    public async addProject(): Promise<void | false> {
        try {
            const categories = this.dbManager.getCategories();
            if (!categories || !Array.isArray(categories) || categories.length === 0) {
                vscode.window.showErrorMessage('Nenhuma categoria cadastrada.');
                return false;
            }
            const categoryPick = await vscode.window.showQuickPick(
                categories.map(c => ({ label: c.name, id: c.id })),
                { placeHolder: 'Selecione a categoria do projeto' }
            );
            if (!categoryPick) {
                return false;
            }
            const name = await vscode.window.showInputBox({ prompt: 'Nome do projeto' });
            if (!name) {
                return false;
            }
            const language = await vscode.window.showInputBox({ prompt: 'Linguagem do projeto' });
            if (!language) {
                return false;
            }
            const projectPath = await vscode.window.showInputBox({ prompt: 'Caminho do projeto' });
            if (!projectPath) {
                return false;
            }
            const usesVirtualEnv = await vscode.window.showQuickPick(
                ['Sim', 'Não'],
                { placeHolder: 'Utiliza virtual env?' }
            );
            let envManager = undefined;
            if (usesVirtualEnv === 'Sim') {
                envManager = await vscode.window.showInputBox({ prompt: 'Gerenciador do virtual env (ex: venv, pipenv, poetry, conda)' });
                if (!envManager) {
                    return false;
                }
            }

            const result = this.dbManager.addProject({
                name: name.trim(),
                language: language.trim(),
                path: projectPath.trim(),
                uses_virtual_env: usesVirtualEnv === 'Sim',
                virtual_env_manager: envManager ? envManager.trim() : undefined,
                category_id: categoryPick.id
            });
            if (result === false) {
                return false;
            }

            // Criação automática do arquivo .code-workspace
            const workspaceFile = path.join(projectPath.trim(), `${name.trim()}.code-workspace`);
            if (!fs.existsSync(workspaceFile)) {
                const defaultData = {
                    folders: [{ path: '.' }],
                    settings: {}
                };
                fs.writeFileSync(workspaceFile, JSON.stringify(defaultData, null, 2), 'utf-8');
            }

            vscode.window.showInformationMessage('Projeto e workspace criados com sucesso!');
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao adicionar projeto: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Edita um projeto existente.
     */
    public async editProject(): Promise<void | false> {
        try {
            const projects = this.dbManager.getProjects();
            if (!projects || !Array.isArray(projects) || projects.length === 0) {
                vscode.window.showErrorMessage('Nenhum projeto cadastrado.');
                return false;
            }
            const projectPick = await vscode.window.showQuickPick(
                projects.map(p => ({
                    label: p.name,
                    description: p.language,
                    detail: p.path,
                    id: p.id,
                    project: p
                })),
                { placeHolder: 'Selecione o projeto para editar' }
            );
            if (!projectPick) {
                return false;
            }
            const project = projectPick.project;
            const name = await vscode.window.showInputBox({ prompt: 'Nome do projeto', value: project.name });
            if (!name) {
                return false;
            }
            const language = await vscode.window.showInputBox({ prompt: 'Linguagem do projeto', value: project.language });
            if (!language) {
                return false;
            }
            const projectPath = await vscode.window.showInputBox({ prompt: 'Caminho do projeto', value: project.path });
            if (!projectPath) {
                return false;
            }
            const usesVirtualEnv = await vscode.window.showQuickPick(
                ['Sim', 'Não'],
                { placeHolder: 'Utiliza virtual env?'}
            );
            let envManager = project.virtual_env_manager;
            if (usesVirtualEnv === 'Sim') {
                envManager = await vscode.window.showInputBox({ prompt: 'Gerenciador do virtual env', value: project.virtual_env_manager });
                if (!envManager) {
                    return false;
                }
            }
            const categories = this.dbManager.getCategories();
            if (!categories) {
                return false;
            }
            const categoryPick = await vscode.window.showQuickPick(
                categories.map(c => ({ label: c.name, id: c.id })),
                { placeHolder: 'Selecione a categoria' }
            );
            if (!categoryPick) {
                return false;
            }
            const update = this.dbManager.updateProject(project.id, {
                name: name.trim(),
                language: language.trim(),
                path: projectPath.trim(),
                uses_virtual_env: usesVirtualEnv === 'Sim',
                virtual_env_manager: envManager ? envManager.trim() : undefined,
                category_id: categoryPick.id
            });
            if (update === false) {
                return false;
            }
            vscode.window.showInformationMessage('Projeto atualizado com sucesso!');
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao editar projeto: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Remove um projeto.
     */
    public async deleteProject(): Promise<void | false> {
        try {
            const projects = this.dbManager.getProjects();
            if (!projects || !Array.isArray(projects) || projects.length === 0) {
                vscode.window.showErrorMessage('Nenhum projeto cadastrado.');
                return false;
            }
            const projectPick = await vscode.window.showQuickPick(
                projects.map(p => ({
                    label: p.name,
                    description: p.language,
                    detail: p.path,
                    id: p.id
                })),
                { placeHolder: 'Selecione o projeto para remover' }
            );
            if (!projectPick) {
                return false;
            }
            const confirm = await vscode.window.showQuickPick(
                ['Sim', 'Não'],
                { placeHolder: `Deseja remover o projeto "${projectPick.label}"?` }
            );
            // ERRO ERA AQUI: confirm.label não existe porque confirm é string
            if (confirm !== 'Sim') {
                return false;
            }
            const result = this.dbManager.deleteProject(projectPick.id);
            if (result === false) {
                return false;
            }
            vscode.window.showInformationMessage('Projeto removido com sucesso!');
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao remover projeto: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Remove uma categoria.
     */
    public async deleteCategory(): Promise<void | false> {
        try {
            const categories = this.dbManager.getCategories();
            if (!categories || !Array.isArray(categories) || categories.length === 0) {
                vscode.window.showErrorMessage('Nenhuma categoria cadastrada.');
                return false;
            }
            const categoryPick = await vscode.window.showQuickPick(
                categories.map(c => ({ label: c.name, id: c.id })),
                { placeHolder: 'Selecione a categoria para remover' }
            );
            if (!categoryPick) {
                return false;
            }
            const confirm = await vscode.window.showQuickPick(
                ['Sim', 'Não'],
                { placeHolder: `Deseja remover a categoria "${categoryPick.label}"? (irá remover todos os projetos associados)` }
            );
            // ERRO ERA AQUI: confirm.label não existe porque confirm é string
            if (confirm !== 'Sim') {
                return false;
            }
            const result = this.dbManager.deleteCategory(categoryPick.id);
            if (result === false) {
                return false;
            }
            vscode.window.showInformationMessage('Categoria removida com sucesso!');
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao remover categoria: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Edita uma categoria existente.
     */
    public async editCategory(): Promise<void | false> {
        try {
            const categories = this.dbManager.getCategories();
            if (!categories || !Array.isArray(categories) || categories.length === 0) {
                vscode.window.showErrorMessage('Nenhuma categoria cadastrada.');
                return false;
            }
            const categoryPick = await vscode.window.showQuickPick(
                categories.map(c => ({ label: c.name, id: c.id })),
                { placeHolder: 'Selecione a categoria para editar' }
            );
            if (!categoryPick) {
                return false;
            }
            const newName = await vscode.window.showInputBox({
                prompt: 'Novo nome da categoria',
                value: categoryPick.label,
                validateInput: (text) => (!text || text.trim().length === 0) ? 'Nome obrigatório' : null
            });
            if (!newName) {
                return false;
            }
            const result = this.dbManager.editCategory(categoryPick.id, newName.trim());
            if (result === false) {
                vscode.window.showErrorMessage('Não foi possível renomear a categoria. Nome já existe ou inválido.');
                return false;
            }
            vscode.window.showInformationMessage('Categoria editada com sucesso!');
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao editar categoria: ${(error as Error).message}`);
            return false;
        }
    }
}