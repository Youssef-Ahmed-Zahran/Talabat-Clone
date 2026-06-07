const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHanlder = (err, req, res, next) => {
    let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    let message = err.message;

    // Handle Prisma Client Errors (e.g., validation, constraints)
    if (err.name === "PrismaClientValidationError" || err.message?.includes("Invalid `prisma")) {
        statusCode = 400;
        message = "Invalid data provided. Please check your inputs.";
    }

    if (err.code === "P2002") {
        statusCode = 400;
        message = "A record with this value already exists.";
    }

    if (err.code === "P2025") {
        statusCode = 404;
        message = "The requested record was not found.";
    }

    res.status(statusCode).json({ 
        success: false, 
        message,
        errors: err.errors || [],
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

export { notFound, errorHanlder };
