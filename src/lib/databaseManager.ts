import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import Database from 'better-sqlite3';

/**
 * Classe responsável por gerenciar o banco de dados SQLite para categorias e projetos.
 * 
 * :class:`DatabaseManager`
 * 
 * Exemplos:
 * 
 * .. code-block:: typescript
 * 
 *      const dbManager = new DatabaseManager(context);
 *      const projects = dbManager.getProjects();
 * 
 */
export class DatabaseManager {
    private dbPath: string;
    private db!: Database.Database;

    /**
     * Cria uma instância do DatabaseManager.
     * 
     * :param context: Contexto da extensão VS Code.
     */
    constructor(context: vscode.ExtensionContext) {
        try {
            if (!context || typeof context !== 'object') {
                throw new Error('Contexto inválido para DatabaseManager');
            }
            this.dbPath = path.join(context.globalStorageUri.fsPath, 'project_switcher.db');
            this.ensureDb();
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao inicializar o banco de dados: ${(error as Error).message}`);
            return;
        }
    }

    /**
     * Garante a existência do banco de dados e de suas tabelas.
     */
    private ensureDb(): void {
        try {
            if (!fs.existsSync(path.dirname(this.dbPath))) {
                fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
            }
            this.db = new Database(this.dbPath);
            this.db.pragma('journal_mode = WAL');

            this.db.exec(`
                CREATE TABLE IF NOT EXISTS category (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE
                );
                CREATE TABLE IF NOT EXISTS project (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    language TEXT NOT NULL,
                    path TEXT NOT NULL,
                    uses_virtual_env BOOLEAN NOT NULL DEFAULT 0,
                    virtual_env_manager TEXT,
                    category_id INTEGER NOT NULL,
                    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
                );
            `);
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao criar banco de dados: ${(error as Error).message}`);
            return;
        }
    }

    /**
     * Adiciona uma categoria.
     * 
     * :param name: Nome da categoria.
     * :returns: ID da categoria inserida ou False em caso de erro.
     */
    public addCategory(name: string): number | false {
        try {
            if (!name || typeof name !== 'string') {
                throw new Error('Nome da categoria inválido.');
            }
            const stmt = this.db.prepare('INSERT INTO category (name) VALUES (?)');
            const info = stmt.run(name);
            return info.lastInsertRowid as number;
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao adicionar categoria: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Retorna todas as categorias.
     * 
     * :returns: Array de categorias {id, name} ou False em caso de erro.
     */
    public getCategories(): Array<{ id: number, name: string }> | false {
        try {
            const stmt = this.db.prepare('SELECT id, name FROM category ORDER BY name');
            return stmt.all();
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao buscar categorias: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Remove uma categoria.
     * 
     * :param id: ID da categoria.
     * :returns: True se removido, False caso contrário.
     */
    public deleteCategory(id: number): boolean {
        try {
            if (typeof id !== 'number' || isNaN(id)) {
                throw new Error('ID da categoria inválido.');
            }
            const stmt = this.db.prepare('DELETE FROM category WHERE id = ?');
            stmt.run(id);
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao remover categoria: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Adiciona um projeto.
     * 
     * :param project: Dados do projeto.
     * :returns: ID do projeto inserido ou False.
     */
    public addProject(project: {
        name: string,
        language: string,
        path: string,
        uses_virtual_env: boolean,
        virtual_env_manager?: string,
        category_id: number,
    }): number | false {
        try {
            if (
                !project ||
                typeof project !== 'object' ||
                !project.name ||
                !project.language ||
                !project.path ||
                typeof project.uses_virtual_env !== 'boolean' ||
                typeof project.category_id !== 'number'
            ) {
                throw new Error('Dados do projeto inválidos.');
            }
            const stmt = this.db.prepare(
                `INSERT INTO project 
                    (name, language, path, uses_virtual_env, virtual_env_manager, category_id)
                 VALUES (?, ?, ?, ?, ?, ?)`
            );
            const info = stmt.run(
                project.name,
                project.language,
                project.path,
                project.uses_virtual_env ? 1 : 0,
                project.virtual_env_manager || null,
                project.category_id
            );
            return info.lastInsertRowid as number;
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao adicionar projeto: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Retorna todos projetos, agrupados por categoria.
     * 
     * :returns: Array de projetos com categoria ou False.
     */
    public getProjects(): Array<any> | false {
        try {
            const stmt = this.db.prepare(`
                SELECT p.*, c.name as category_name FROM project p
                JOIN category c ON p.category_id = c.id
                ORDER BY c.name, p.name
            `);
            return stmt.all();
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao buscar projetos: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Edita um projeto existente.
     * 
     * :param id: ID do projeto.
     * :param data: Dados a atualizar.
     * :returns: True se atualizado, False caso contrário.
     */
    public updateProject(id: number, data: Partial<{
        name: string,
        language: string,
        path: string,
        uses_virtual_env: boolean,
        virtual_env_manager?: string,
        category_id: number,
    }>): boolean {
        try {
            if (typeof id !== 'number' || isNaN(id)) {
                throw new Error('ID inválido.');
            }
            const fields = [];
            const values = [];
            for (const [key, value] of Object.entries(data)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
            if (fields.length === 0) {
                throw new Error('Nenhum dado para atualizar.');
            }
            values.push(id);
            const stmt = this.db.prepare(`UPDATE project SET ${fields.join(', ')} WHERE id = ?`);
            stmt.run(...values);
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao atualizar projeto: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Remove um projeto.
     * 
     * :param id: ID do projeto.
     * :returns: True se removido, False caso contrário.
     */
    public deleteProject(id: number): boolean {
        try {
            if (typeof id !== 'number' || isNaN(id)) {
                throw new Error('ID do projeto inválido.');
            }
            const stmt = this.db.prepare('DELETE FROM project WHERE id = ?');
            stmt.run(id);
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao remover projeto: ${(error as Error).message}`);
            return false;
        }
    }
}