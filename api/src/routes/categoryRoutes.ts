/**
 * Category routes for the PDV API
 */
import express from 'express';
import prisma from '../utils/prisma';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the category
 *         name:
 *           type: string
 *           description: The name of the category
 *         description:
 *           type: string
 *           description: The description of the category
 *         color:
 *           type: string
 *           description: The color hex code for the category
 *         active:
 *           type: boolean
 *           description: Whether the category is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the category was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the category was last updated
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Returns a list of all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: The list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
// @ts-ignore - Type checking error with Express Router
router.get('/', async (req, res) => {
  try {
    // Verificar se estamos em modo de simulação
    if (process.env.MOCK_DATABASE === 'true') {
      // Dados mockados para teste
      console.log('Usando modo de simulação para listar categorias');
      const mockCategories = [
        {
          id: 'mock-cafeteria',
          name: 'Cafeteria',
          description: 'Cafés, cappuccinos e outras bebidas quentes',
          color: '#795548',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'mock-lanches',
          name: 'Lanches',
          description: 'Todos os tipos de sanduíches',
          color: '#FF5733',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'mock-bebidas',
          name: 'Bebidas',
          description: 'Refrigerantes, sucos e outras bebidas',
          color: '#3498DB',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      return res.json(mockCategories);
    }

    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       200:
 *         description: The category data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */
// @ts-ignore - Type checking error with Express Router
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Transform data to include product count
    const formattedCategory = {
      ...category,
      productsCount: category._count.products,
      _count: undefined,
    };

    res.json(formattedCategory);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: The created category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid request data
 */
// @ts-ignore - Type checking error with Express Router
router.post('/', async (req, res) => {
  try {
    const { name, description, color, active } = req.body;
    console.log('Criando categoria com:', { name, description, color, active });

    // Validação básica
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ 
        error: 'Nome é obrigatório e deve ser uma string' 
      });
    }

    // Verificar se estamos em modo de simulação
    if (process.env.MOCK_DATABASE === 'true') {
      // Simular a criação retornando dados mockados
      console.log('Usando modo de simulação para criar categoria');
      const mockCategory = {
        id: 'mock-' + Math.random().toString(36).substring(2, 9),
        name,
        description: description || null,
        color: color || null,
        active: active === undefined ? true : Boolean(active),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      console.log('Categoria simulada criada:', mockCategory);
      return res.status(201).json(mockCategory);
    }

    // Usando try/catch separado para isolar erros do Prisma
    try {
      // Banco de dados real
      const newCategory = await prisma.category.create({
        data: {
          name,
          description: description || null,
          color: color || null, 
          active: active === undefined ? true : Boolean(active)
        }
      });
      
      console.log('Categoria criada com sucesso:', newCategory);
      return res.status(201).json(newCategory);
    } catch (dbError) {
      console.error('Erro específico do banco de dados:', dbError);
      throw new Error('Falha ao persistir no banco de dados');
    }
  } catch (error) {
    console.error('Erro detalhado ao criar categoria:', error);
    return res.status(500).json({ 
      error: 'Failed to create category',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: The updated category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */
// @ts-ignore - Type checking error with Express Router
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, active } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingCategory.name,
        description,
        color,
        active: active !== undefined ? active : existingCategory.active,
      },
    });

    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Force delete even if category has products (products will be moved to 'Uncategorized')
 *       - in: query
 *         name: deleteProducts
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Delete all products associated with this category
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       400:
 *         description: Cannot delete category with products
 */
// @ts-ignore - Type checking error with Express Router
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true';
    const deleteProducts = req.query.deleteProducts === 'true';

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Verificar se existem produtos associados
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });
    
    // Se tem produtos e não está forçando a exclusão nem deletando produtos
    if (productsCount > 0 && !force && !deleteProducts) {
      return res.status(400).json({
        error: 'Cannot delete category that has associated products.',
        productsCount,
        solutions: [
          'Delete products first',
          'Use ?force=true to move products to Uncategorized category',
          'Use ?deleteProducts=true to delete all associated products'
        ]
      });
    }

    // Se tiver produtos e deleteProducts for true, excluir produtos primeiro
    if (productsCount > 0 && deleteProducts) {
      await prisma.product.deleteMany({
        where: { categoryId: id }
      });
      console.log(`Deleted ${productsCount} products from category ${id}`);
    }
    
    // Se tiver produtos e force for true, mover produtos para "Sem categoria"
    if (productsCount > 0 && force) {
      // Verificar se já existe ou criar categoria "Sem categoria"
      let uncategorizedCategory = await prisma.category.findFirst({
        where: { 
          OR: [
            { name: 'Sem categoria' },
            { name: 'Uncategorized' }
          ]
        }
      });
      
      if (!uncategorizedCategory) {
        uncategorizedCategory = await prisma.category.create({
          data: {
            name: 'Sem categoria',
            description: 'Produtos sem categoria definida',
            color: '#CCCCCC',
            active: true
          }
        });
        console.log('Created Uncategorized category:', uncategorizedCategory);
      }
      
      // Mover produtos para a categoria "Sem categoria"
      await prisma.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: uncategorizedCategory.id }
      });
      
      console.log(`Moved ${productsCount} products to Uncategorized category`);
    }

    // Agora podemos excluir a categoria com segurança
    await prisma.category.delete({
      where: { id },
    });

    res.json({ 
      success: true, 
      message: 'Category deleted successfully',
      details: productsCount > 0 ? (
        deleteProducts 
          ? `Deleted ${productsCount} associated products` 
          : `Moved ${productsCount} products to Uncategorized category`
      ) : undefined
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router; 