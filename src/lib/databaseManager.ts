import * as fs from 'fs';
import * as path from 'path';

/**
 * Classe de gerenciamento de banco de dados baseado em arquivo JSON para projetos e categorias.
 *
 * :class:`DatabaseManager`
 *
 * Exemplo de uso:
 *
 * .. code-block:: typescript
 *
 *    >>> const db = new DatabaseManager('meuarquivo.json');
 *    >>> db.addCategory('Backend');
 *    >>> db.addProject({name: 'MeuProjeto', language: 'TypeScript', path: '/meu/caminho', category_id: 1});
 *    >>> db.getProjects();
 *    [ { ... } ]
 */
export class DatabaseManager {
    private dbPath: string;
    private data: DatabaseJson;

    /**
     * Inicializa o gerenciador de banco de dados com o caminho para o arquivo JSON.
     *
     * :param dbPath: Caminho para o arquivo do banco de dados JSON.
     * :type dbPath: string
     * :raises Error: Se dbPath for inválido ou não for possível abrir o arquivo.
     * :returns: None em sucesso, False em erro.
     * :rtype: None | False
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> !!db
     *   true
     */
    constructor(dbPath: string) {
        this.dbPath = dbPath;
        // Garante que o diretório existe antes de tentar ler/gravar
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.data = this._load();
        // Garante que a categoria 'Unamed' exista
        if (!this.data.categories.some(c => c.name === 'Unamed')) {
            this.data.lastCategoryId++;
            this.data.categories.push({ id: this.data.lastCategoryId, name: 'Unamed' });
            this._save();
        }
    }

    private _load(): DatabaseJson {
        if (fs.existsSync(this.dbPath)) {
            try {
                const raw = fs.readFileSync(this.dbPath, 'utf-8');
                return JSON.parse(raw);
            } catch (e) {
                // Se corrompido, reinicia
                return { categories: [], projects: [], lastCategoryId: 0, lastProjectId: 0 };
            }
        } else {
            return { categories: [], projects: [], lastCategoryId: 0, lastProjectId: 0 };
        }
    }

    private _save() {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    }

    /**
     * Adiciona uma nova categoria.
     *
     * :param name: Nome da categoria.
     * :type name: string
     * :returns: True em sucesso, False em erro.
     * :rtype: boolean | False
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> db.addCategory('Frontend');
     *   true
     */
    public addCategory(name: string): boolean {
        if (!name || typeof name !== 'string') return false;
        if (this.data.categories.some(c => c.name === name.trim())) return false;
        this.data.lastCategoryId++;
        this.data.categories.push({ id: this.data.lastCategoryId, name: name.trim() });
        this._save();
        return true;
    }

    /**
     * Retorna todas as categorias.
     *
     * :returns: Array de categorias ou False em erro.
     * :rtype: any[] | False
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> db.getCategories();
     *   [ { id: 1, name: "Frontend" } ]
     */
    public getCategories(): Category[] {
        return this.data.categories;
    }

    /**
     * Remove uma categoria pelo id.
     *
     * :param id: ID da categoria.
     * :type id: number
     * :returns: True em sucesso, False em erro.
     * :rtype: boolean | False
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> db.deleteCategory(1);
     *   true
     */
    public deleteCategory(id: number): boolean {
        const before = this.data.categories.length;
        this.data.categories = this.data.categories.filter(c => c.id !== id);
        this.data.projects = this.data.projects.filter(p => p.category_id !== id);
        const after = this.data.categories.length;
        this._save();
        return before !== after;
    }

    /**
     * Adiciona um novo projeto.
     *
     * :param project: Objeto contendo os dados do projeto.
     * :type project: { name: string, language?: string, path: string, uses_virtual_env?: boolean, virtual_env_manager?: string, category_id?: number }
     * :returns: True em sucesso, False em erro.
     * :rtype: boolean | False
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> db.addProject({ name: 'MeuProjeto', path: '/caminho', category_id: 1 });
     *   true
     */
    public addProject(project: Omit<Project, 'id'>): boolean {
        // Se não houver categoria definida, usa 'Unamed'
        let categoryId = project.category_id;
        if (!categoryId) {
            const unamed = this.data.categories.find(c => c.name === 'Unamed');
            if (unamed) categoryId = unamed.id;
        }
        if (!project.name || !project.path) return false;
        this.data.lastProjectId++;
        this.data.projects.push({ ...project, id: this.data.lastProjectId, category_id: categoryId });
        this._save();
        return true;
    }

    /**
     * Retorna todos os projetos, incluindo nome da categoria.
     *
     * :returns: Array de projetos ou False em erro.
     * :rtype: any[] | False
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> db.getProjects();
     *   [ { id: 1, name: "MeuProjeto", category_name: "Frontend", ... } ]
     */
    public getProjects(): (Project & { category_name?: string })[] {
        return this.data.projects.map(p => ({
            ...p,
            category_name: this.data.categories.find(c => c.id === p.category_id)?.name
        }));
    }

    /**
     * Retorna um projeto por ID.
     *
     * :param id: ID do projeto.
     * :type id: number
     * :returns: Projeto encontrado ou False em erro.
     * :rtype: any | False
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> db.getProject(1);
     *   { id: 1, name: "MeuProjeto", ... }
     */
    public getProject(id: number): Project | undefined {
        return this.data.projects.find(p => p.id === id);
    }

    /**
     * Atualiza um projeto pelo ID.
     *
     * :param id: ID do projeto.
     * :type id: number
     * :param project: Objeto com campos a atualizar.
     * :type project: { name?: string, language?: string, path?: string, uses_virtual_env?: boolean, virtual_env_manager?: string, category_id?: number }
     * :returns: True em sucesso, False em erro.
     * :rtype: boolean | False
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> db.updateProject(1, { name: 'NovoNome' });
     *   true
     */
    public updateProject(id: number, project: Partial<Omit<Project, 'id'>>): boolean {
        const idx = this.data.projects.findIndex(p => p.id === id);
        if (idx === -1) return false;
        this.data.projects[idx] = { ...this.data.projects[idx], ...project };
        this._save();
        return true;
    }

    /**
     * Remove um projeto pelo id.
     *
     * :param id: ID do projeto.
     * :type id: number
     * :returns: True em sucesso, False em erro.
     * :rtype: boolean | False
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> db.deleteProject(1);
     *   true
     */
    public deleteProject(id: number): boolean {
        const before = this.data.projects.length;
        this.data.projects = this.data.projects.filter(p => p.id !== id);
        const after = this.data.projects.length;
        this._save();
        return before !== after;
    }

    /**
     * Retorna todos os projetos de uma categoria.
     *
     * :param category_id: ID da categoria.
     * :type category_id: number
     * :returns: Array de projetos ou False em erro.
     * :rtype: any[] | False
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> db.getProjectsByCategory(1);
     *   [ { id: 1, ... } ]
     */
    public getProjectsByCategory(category_id: number): Project[] {
        return this.data.projects.filter(p => p.category_id === category_id);
    }

    /**
     * Fecha a conexão com o banco de dados.
     *
     * :returns: True em caso de sucesso, False em caso de erro.
     * :rtype: boolean
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> db.close();
     *   true
     */
    public close(): boolean {
        // Não é necessário para JSON
        return true;
    }

    /**
     * Edita o nome de uma categoria existente.
     *
     * :param id: ID da categoria a ser editada.
     * :type id: number
     * :param newName: Novo nome para a categoria.
     * :type newName: string
     * :returns: True em sucesso, False em erro.
     * :rtype: boolean | False
     * :doctest:
     *   >>> const db = new DatabaseManager('test.json');
     *   >>> db.editCategory(1, 'NovoNome');
     *   true
     */
    public editCategory(id: number, newName: string): boolean {
        if (!newName || typeof newName !== 'string') return false;
        const idx = this.data.categories.findIndex(c => c.id === id);
        if (idx === -1) return false;
        // Não permite nome duplicado
        if (this.data.categories.some(c => c.name === newName.trim() && c.id !== id)) return false;
        this.data.categories[idx].name = newName.trim();
        this._save();
        return true;
    }
}

export interface Category {
    id: number;
    name: string;
}

export interface Project {
    id: number;
    name: string;
    language?: string;
    path: string;
    uses_virtual_env?: boolean;
    virtual_env_manager?: string;
    category_id?: number;
}

interface DatabaseJson {
    categories: Category[];
    projects: Project[];
    lastCategoryId: number;
    lastProjectId: number;
}