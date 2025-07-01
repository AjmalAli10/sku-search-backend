const searchHandler = async (req, res, next) => {
  try {
    // Placeholder response
    res.json({
      message: "Search endpoint is working!",
      received: req.body,
    });
  } catch (error) {
    console.error("Search handler error:", error);
    next(error); // Pass error to global error handler
  }
};

export { searchHandler };
