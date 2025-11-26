// 404 - Route not found middleware
const notFound = (req, res, next) => {
  const error = new Error(`ไม่พบเส้นทาง ${req.originalUrl}`);
  error.status = 404;
  
  res.status(404).json({
    success: false,
    message: error.message,
    path: req.originalUrl,
    method: req.method
  });
};

module.exports = {
  notFound
};
