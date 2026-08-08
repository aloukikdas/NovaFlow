import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    // Determine the status code
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract the error message
    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();
      message = typeof responseBody === 'string' 
        ? responseBody 
        : (responseBody as any).message || responseBody;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Always return this exact structure
    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}