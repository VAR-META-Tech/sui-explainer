// Custom error classes for the backend

export class TransactionError extends Error {
    code: string;
    statusCode: number;

    constructor(
        message: string,
        code: string = 'UNKNOWN',
        statusCode: number = 500
    ) {
        super(message);
        this.name = 'TransactionError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

export class ValidationError extends TransactionError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}

export class NotFoundError extends TransactionError {
    constructor(message: string = 'Transaction not found') {
        super(message, 'NOT_FOUND', 404);
    }
}

export class RpcError extends TransactionError {
    constructor(message: string) {
        super(message, 'RPC_ERROR', 500);
    }
}

export class ExternalApiError extends TransactionError {
    constructor(service: string, message: string) {
        super(`${service}: ${message}`, 'EXTERNAL_API_ERROR', 502);
    }
}
