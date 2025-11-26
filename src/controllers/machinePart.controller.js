const machinePartService = require('../services/machinePart.service');

const getAllMachineParts = async (req, res) => {
  try {
    const parts = await machinePartService.getAllMachineParts();
    res.json(parts);
  } catch (error) {
    console.error('Error getting all machine parts:', error);
    res.status(500).json({ error: 'Failed to fetch all machine parts' });
  }
};

const getMachinePartsByMachineId = async (req, res) => {
  try {
    const { machineId } = req.params;
    const parts = await machinePartService.getMachinePartsByMachineId(machineId);
    res.json(parts);
  } catch (error) {
    console.error('Error getting machine parts:', error);
    res.status(500).json({ error: 'Failed to fetch machine parts' });
  }
};

const getMachinePartById = async (req, res) => {
  try {
    const { id } = req.params;
    const part = await machinePartService.getMachinePartById(id);
    
    if (!part) {
      return res.status(404).json({ error: 'Machine part not found' });
    }
    
    res.json(part);
  } catch (error) {
    console.error('Error getting machine part:', error);
    res.status(500).json({ error: 'Failed to fetch machine part' });
  }
};

const createMachinePart = async (req, res) => {
  try {
    const partData = req.body;
    const newPart = await machinePartService.createMachinePart(partData);
    res.status(201).json(newPart);
  } catch (error) {
    console.error('Error creating machine part:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Part code already exists for this machine' });
    }
    res.status(500).json({ error: 'Failed to create machine part' });
  }
};

const updateMachinePart = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedPart = await machinePartService.updateMachinePart(id, updateData);
    res.json(updatedPart);
  } catch (error) {
    console.error('Error updating machine part:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Machine part not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Part code already exists for this machine' });
    }
    res.status(500).json({ error: 'Failed to update machine part' });
  }
};

const deleteMachinePart = async (req, res) => {
  try {
    const { id } = req.params;
    await machinePartService.deleteMachinePart(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting machine part:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Machine part not found' });
    }
    res.status(500).json({ error: 'Failed to delete machine part' });
  }
};

const getLowStockParts = async (req, res) => {
  try {
    const { machineId } = req.params;
    const lowStockParts = await machinePartService.getLowStockParts(machineId);
    res.json(lowStockParts);
  } catch (error) {
    console.error('Error getting low stock parts:', error);
    res.status(500).json({ error: 'Failed to fetch low stock parts' });
  }
};

const updatePartStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
    const userId = req.user.id; // Get user ID from auth middleware
    
    const updatedPart = await machinePartService.updatePartStock(id, quantity, operation, userId);
    res.json(updatedPart);
  } catch (error) {
    console.error('Error updating part stock:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Machine part not found' });
    }
    if (error.message === 'Insufficient stock') {
      return res.status(400).json({ error: 'Insufficient stock quantity' });
    }
    res.status(500).json({ error: 'Failed to update part stock' });
  }
};

const searchParts = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { search, category, lowStock } = req.query;
    
    const parts = await machinePartService.searchParts(machineId, {
      search,
      category,
      lowStock: lowStock === 'true'
    });
    
    res.json(parts);
  } catch (error) {
    console.error('Error searching parts:', error);
    res.status(500).json({ error: 'Failed to search parts' });
  }
};

module.exports = {
  getAllMachineParts,
  getMachinePartsByMachineId,
  getMachinePartById,
  createMachinePart,
  updateMachinePart,
  deleteMachinePart,
  getLowStockParts,
  updatePartStock,
  searchParts
};
