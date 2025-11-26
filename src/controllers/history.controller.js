const historyService = require('../services/history.service');

class HistoryController {
  /**
   * GET /api/history - Get completed PM schedule history
   * Query params: machineId, status, priority, dueDateFrom, dueDateTo, 
   *               assignedTo, search, page, limit, sortBy, sortOrder
   */
  async getHistory(req, res) {
    try {
      const { 
        machineId, 
        status, 
        priority, 
        dueDateFrom, 
        dueDateTo, 
        assignedTo, 
        search,
        page = 1,
        limit = 10,
        sortBy,
        sortOrder
      } = req.query;

      const result = await historyService.getCompletedHistory({
        machineId, 
        status, 
        priority, 
        dueDateFrom, 
        dueDateTo, 
        assignedTo, 
        search,
        page,
        limit,
        sortBy,
        sortOrder,
        requestingUser: req.user // Pass user info for role-based filtering
      });

      res.status(200).json({
        success: true,
        data: result.schedules,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch history'
      });
    }
  }

  /**
   * GET /api/history/stats - Get history statistics
   * Query params: machineId, priority, dueDateFrom, dueDateTo, assignedTo
   */
  async getHistoryStats(req, res) {
    try {
      const { 
        machineId, 
        priority, 
        dueDateFrom, 
        dueDateTo, 
        assignedTo
      } = req.query;

      const stats = await historyService.getHistoryStats({
        machineId, 
        priority, 
        dueDateFrom, 
        dueDateTo, 
        assignedTo,
        requestingUser: req.user
      });

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching history stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch history stats'
      });
    }
  }

  /**
   * GET /api/history/machines - Get unique machines with completed history
   */
  async getUniqueMachines(req, res) {
    try {
      const machines = await historyService.getUniqueMachines({
        requestingUser: req.user
      });

      res.status(200).json({
        success: true,
        data: machines
      });
    } catch (error) {
      console.error('Error fetching unique machines:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch unique machines'
      });
    }
  }

  /**
   * GET /api/history/technicians - Get unique technicians with completed history
   */
  async getUniqueTechnicians(req, res) {
    try {
      const technicians = await historyService.getUniqueTechnicians({
        requestingUser: req.user
      });

      res.status(200).json({
        success: true,
        data: technicians
      });
    } catch (error) {
      console.error('Error fetching unique technicians:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch unique technicians'
      });
    }
  }
}

module.exports = new HistoryController();
